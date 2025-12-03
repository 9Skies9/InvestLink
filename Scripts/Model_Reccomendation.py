#!/usr/bin/env python3
"""
Model_Reccomendation.py

Recommendation algorithm:
1. For a user/company, compute industry/stage/place/check_fit against all candidates
   (excluding those already interacted with)
2. Filter candidates passing a threshold on these cheap features
3. Compute text similarity on remaining candidates
4. Run LightGBM model for final probability scores
5. Probabilistically sample from results
6. Return top 5 recommendations
"""

import random
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from pathlib import Path

import pandas as pd
import numpy as np
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
import lightgbm as lgb

# -----------------------------
# Paths / Config
# -----------------------------

ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = ROOT / "Data"
DATA_INIT = DATA_ROOT / "Initialization"
MODELS_DIR = ROOT / "Models"
DB_PATH = DATA_ROOT / "invest.sqlite"

USER_CSV = DATA_INIT / "user_info.csv"
COMPANY_CSV = DATA_INIT / "company_info.csv"
USER_TO_COMPANY_INTERACT = DATA_INIT / "user_to_company_interact.csv"
COMPANY_TO_USER_INTERACT = DATA_INIT / "company_to_user_interact.csv"

USER_MODEL_PATH = MODELS_DIR / "lgbm_user_model.txt"
COMPANY_MODEL_PATH = MODELS_DIR / "lgbm_company_model.txt"

# Thresholds
PREFILTER_TOP_N = 30  # Take top N candidates after pre-filtering (for speed)
NUM_RECOMMENDATIONS = 5
RANDOM_SEED = 42

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# -----------------------------
# Data classes
# -----------------------------

@dataclass
class CompanyProfile:
    id: int
    name: str
    desc: str
    industries: List[str]
    stage: str
    place: str
    fund_size: Optional[float]


@dataclass
class InvestorProfile:
    id: int
    name: str
    desc: str
    industries: List[str]
    stages: List[str]
    places: List[str]
    check_min: Optional[float]
    check_max: Optional[float]


# -----------------------------
# TEXT ENCODER (Sentence-BERT)
# -----------------------------

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_tokenizer = None
_model = None


def _get_encoder():
    """Lazy load the encoder model."""
    global _tokenizer, _model
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME)
        _model = AutoModel.from_pretrained(_MODEL_NAME)
    return _tokenizer, _model


def _mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return (token_embeddings * input_mask_expanded).sum(1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)


def encode_text(text: str) -> torch.Tensor:
    """Encode a single text to embedding."""
    tokenizer, model = _get_encoder()
    enc = tokenizer([text], padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        out = model(**enc)
    emb = _mean_pooling(out, enc["attention_mask"])
    emb = F.normalize(emb, p=2, dim=1)
    return emb[0]  # [D]


def encode_texts(texts: List[str]) -> torch.Tensor:
    """Encode multiple texts to embeddings."""
    if not texts:
        return torch.tensor([])
    tokenizer, model = _get_encoder()
    enc = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        out = model(**enc)
    emb = _mean_pooling(out, enc["attention_mask"])
    emb = F.normalize(emb, p=2, dim=1)
    return emb  # [N, D]


# -----------------------------
# Helpers: money parsing
# -----------------------------

def parse_money(x) -> Optional[float]:
    """Parse strings like '$150k', '$3m', '200000' -> float (dollars)."""
    if x is None or pd.isna(x):
        return None
    s = str(x).strip()
    if not s:
        return None
    s = s.replace("$", "").replace(",", "").lower()
    try:
        if s.endswith("k"):
            return float(s[:-1]) * 1e3
        if s.endswith("m"):
            return float(s[:-1]) * 1e6
        return float(s)
    except Exception:
        return None


# -----------------------------
# Feature helpers
# -----------------------------

def jaccard(a: List[str], b: List[str]) -> float:
    """Jaccard similarity between two lists."""
    A, B = set(a), set(b)
    if not A and not B:
        return 0.0
    return len(A & B) / float(len(A | B))


def stage_fit(inv_stages: List[str], c_stage: str) -> float:
    """1.0 if company stage matches any investor stage, else 0.0."""
    return 1.0 if c_stage in inv_stages else 0.0


def place_fit(inv_places: List[str], c_place: str) -> float:
    """1.0 if company place matches any investor place, else 0.0."""
    return 1.0 if c_place in inv_places else 0.0


def check_fit(u_min: Optional[float], u_max: Optional[float], company_amount: Optional[float]) -> float:
    """
    Check size fit between investor range and company fund size.
    Returns 0.0 to 1.0.
    """
    if u_min is None or u_max is None or company_amount is None:
        return 0.3  # neutral
    if u_min <= 0 or u_max <= 0 or company_amount <= 0:
        return 0.3
    
    u_min, u_max = sorted([u_min, u_max])
    u_mid = 0.5 * (u_min + u_max)
    
    # Company too small for this investor?
    if company_amount < u_min:
        rel = company_amount / u_min
        return max(0.0, min(0.3, rel * 0.3))
    
    coverage_ratio = company_amount / u_mid
    base = 1.0 / (1.0 + coverage_ratio)
    fit = min(1.0, base * 2.0)
    return fit


def compute_prefilter_score(
    inv: InvestorProfile,
    comp: CompanyProfile,
) -> float:
    """
    Compute a cheap pre-filter score using industry/stage/place/check_fit.
    No text similarity here (expensive).
    """
    ind_ov = jaccard(inv.industries, comp.industries)
    s_fit = stage_fit(inv.stages, comp.stage)
    p_fit = place_fit(inv.places, comp.place)
    c_fit = check_fit(inv.check_min, inv.check_max, comp.fund_size)
    
    # Weighted combination
    score = (
        0.35 * ind_ov +
        0.25 * s_fit +
        0.20 * p_fit +
        0.20 * c_fit
    )
    return score


def compute_full_features(
    inv: InvestorProfile,
    comp: CompanyProfile,
    inv_emb: torch.Tensor,
    comp_emb: torch.Tensor,
) -> Dict[str, float]:
    """Compute all features including text similarity."""
    text_sim = float(F.cosine_similarity(inv_emb.unsqueeze(0), comp_emb.unsqueeze(0), dim=1).item())
    ind_ov = jaccard(inv.industries, comp.industries)
    s_fit = stage_fit(inv.stages, comp.stage)
    p_fit = place_fit(inv.places, comp.place)
    c_fit = check_fit(inv.check_min, inv.check_max, comp.fund_size)
    
    return {
        "text_similarity": text_sim,
        "industry_overlap": ind_ov,
        "stage_fit": s_fit,
        "place_fit": p_fit,
        "check_fit": c_fit,
    }


# -----------------------------
# Load data from CSV
# -----------------------------

def load_investors_from_csv(path: Path) -> Dict[int, InvestorProfile]:
    """Load investors from user_info.csv."""
    df = pd.read_csv(path)
    investors: Dict[int, InvestorProfile] = {}
    for _, row in df.iterrows():
        uid = int(row["U_id"])
        industries = [s.strip() for s in str(row.get("U_industry", "")).split(",") if s.strip()]
        stages = [s.strip() for s in str(row.get("U_fund_stage", "")).split(",") if s.strip()]
        places = [s.strip() for s in str(row.get("U_places", "")).split(",") if s.strip()]
        
        check_min = parse_money(row.get("U_check size min"))
        check_max = parse_money(row.get("U_check size max"))
        
        investors[uid] = InvestorProfile(
            id=uid,
            name=str(row.get("U_name", uid)),
            desc=str(row.get("U_invest_requirements", "")),
            industries=industries,
            stages=stages,
            places=places,
            check_min=check_min,
            check_max=check_max,
        )
    return investors


def load_companies_from_csv(path: Path) -> Dict[int, CompanyProfile]:
    """Load companies from company_info.csv."""
    df = pd.read_csv(path)
    companies: Dict[int, CompanyProfile] = {}
    for _, row in df.iterrows():
        cid = int(row["C_id"])
        industries = [s.strip() for s in str(row.get("C_industry", "")).split(",") if s.strip()]
        fund = parse_money(row.get("C_fund_size"))
        
        companies[cid] = CompanyProfile(
            id=cid,
            name=str(row.get("C_name", cid)),
            desc=str(row.get("C_desc", "")),
            industries=industries,
            stage=str(row.get("C_funding_stage", "")),
            place=str(row.get("C_place", "")),
            fund_size=fund,
        )
    return companies


def load_interactions(user_to_company_path: Path, company_to_user_path: Path):
    """
    Load interaction data.
    
    IMPORTANT: Only tracks ACTUAL interactions (like_or_not = 0 or 1).
    Pairs with like_or_not = -1 are treated as "never interacted" and will
    be candidates for recommendation.
    
    Returns:
        user_interactions: Dict[user_id, Set[company_id]] - companies user has actually interacted with (0 or 1)
        company_interactions: Dict[company_id, Set[user_id]] - users company has actually interacted with (0 or 1)
    """
    user_interactions: Dict[int, set] = {}
    company_interactions: Dict[int, set] = {}
    
    # Load user -> company interactions
    # Only include actual interactions (0 = disliked, 1 = liked)
    # Exclude -1 (never interacted) so those can be recommended
    if user_to_company_path.exists():
        df = pd.read_csv(user_to_company_path)
        for _, row in df.iterrows():
            uid = int(row["u_id"])
            cid = int(row["c_id"])
            # Only add if actually interacted (0 or 1), not -1
            if row["like_or_not"] != -1:
                if uid not in user_interactions:
                    user_interactions[uid] = set()
                user_interactions[uid].add(cid)
    
    # Load company -> user interactions (same logic)
    if company_to_user_path.exists():
        df = pd.read_csv(company_to_user_path)
        for _, row in df.iterrows():
            cid = int(row["c_id"])
            uid = int(row["u_id"])
            if row["like_or_not"] != -1:
                if cid not in company_interactions:
                    company_interactions[cid] = set()
                company_interactions[cid].add(uid)
    
    return user_interactions, company_interactions


# -----------------------------
# Load LightGBM models
# -----------------------------

def load_models():
    """Load trained LightGBM models."""
    user_model = None
    company_model = None
    
    if USER_MODEL_PATH.exists():
        user_model = lgb.Booster(model_file=str(USER_MODEL_PATH))
    if COMPANY_MODEL_PATH.exists():
        company_model = lgb.Booster(model_file=str(COMPANY_MODEL_PATH))
    
    return user_model, company_model


# -----------------------------
# Recommendation functions
# -----------------------------

FEATURE_COLS = ["text_similarity", "industry_overlap", "stage_fit", "place_fit", "check_fit"]

# Demo account IDs to exclude from recommendations (but they can still receive recommendations)
DEMO_INVESTOR_ID = 1
DEMO_COMPANY_ID = 1


def recommend_companies_for_user(
    user_id: int,
    investors: Dict[int, InvestorProfile],
    companies: Dict[int, CompanyProfile],
    user_interactions: Dict[int, set],
    user_model: lgb.Booster,
    num_recommendations: int = NUM_RECOMMENDATIONS,
    top_n: int = PREFILTER_TOP_N,
) -> List[Tuple[int, str, float]]:
    """
    Recommend companies for a given investor.
    
    Returns:
        List of (company_id, company_name, probability) tuples
    """
    if user_id not in investors:
        return []
    
    investor = investors[user_id]
    interacted = user_interactions.get(user_id, set())
    
    # Step 1: Get candidates (companies not yet interacted with, excluding demo company)
    candidates = [c for cid, c in companies.items() if cid not in interacted and cid != DEMO_COMPANY_ID]
    
    if not candidates:
        return []
    
    # Step 2: Pre-filter using cheap features - take top N only
    prefilter_scores = []
    for comp in candidates:
        score = compute_prefilter_score(investor, comp)
        prefilter_scores.append((comp, score))
    
    # Sort by score and take top N
    prefilter_scores.sort(key=lambda x: x[1], reverse=True)
    filtered = prefilter_scores[:top_n]
    
    # Step 3: Compute text similarity for filtered candidates
    inv_emb = encode_text(investor.desc)
    comp_descs = [c.desc for c, _ in filtered]
    comp_embs = encode_texts(comp_descs)
    
    # Step 4: Compute full features and run LightGBM
    feature_rows = []
    for i, (comp, _) in enumerate(filtered):
        feats = compute_full_features(investor, comp, inv_emb, comp_embs[i])
        feature_rows.append({
            "company": comp,
            **feats
        })
    
    if not feature_rows:
        return []
    
    # Create feature matrix for LightGBM
    X = pd.DataFrame(feature_rows)[FEATURE_COLS]
    
    # Get probabilities from model
    if user_model is not None:
        probs = user_model.predict(X)
    else:
        # Fallback: use weighted feature score
        probs = (
            0.35 * X["text_similarity"] +
            0.25 * X["industry_overlap"] +
            0.15 * X["stage_fit"] +
            0.10 * X["place_fit"] +
            0.15 * X["check_fit"]
        ).values
    
    # Step 5: Probabilistic sampling
    # Normalize probabilities for sampling
    probs = np.array(probs)
    probs = np.clip(probs, 0.01, 0.99)  # Avoid zero probabilities
    probs_normalized = probs / probs.sum()
    
    # Sample without replacement
    n_samples = min(num_recommendations, len(feature_rows))
    indices = np.random.choice(
        len(feature_rows),
        size=n_samples,
        replace=False,
        p=probs_normalized
    )
    
    # Step 6: Return recommendations
    recommendations = []
    for idx in indices:
        comp = feature_rows[idx]["company"]
        prob = probs[idx]
        recommendations.append((comp.id, comp.name, float(prob)))
    
    # Sort by probability descending
    recommendations.sort(key=lambda x: x[2], reverse=True)
    
    return recommendations


def recommend_users_for_company(
    company_id: int,
    investors: Dict[int, InvestorProfile],
    companies: Dict[int, CompanyProfile],
    company_interactions: Dict[int, set],
    company_model: lgb.Booster,
    num_recommendations: int = NUM_RECOMMENDATIONS,
    top_n: int = PREFILTER_TOP_N,
) -> List[Tuple[int, str, float]]:
    """
    Recommend investors for a given company.
    
    Returns:
        List of (user_id, user_name, probability) tuples
    """
    if company_id not in companies:
        return []
    
    company = companies[company_id]
    interacted = company_interactions.get(company_id, set())
    
    # Step 1: Get candidates (investors not yet interacted with, excluding demo investor)
    candidates = [inv for uid, inv in investors.items() if uid not in interacted and uid != DEMO_INVESTOR_ID]
    
    if not candidates:
        return []
    
    # Step 2: Pre-filter using cheap features - take top N only
    prefilter_scores = []
    for inv in candidates:
        score = compute_prefilter_score(inv, company)
        prefilter_scores.append((inv, score))
    
    # Sort by score and take top N
    prefilter_scores.sort(key=lambda x: x[1], reverse=True)
    filtered = prefilter_scores[:top_n]
    
    # Step 3: Compute text similarity for filtered candidates
    comp_emb = encode_text(company.desc)
    inv_descs = [inv.desc for inv, _ in filtered]
    inv_embs = encode_texts(inv_descs)
    
    # Step 4: Compute full features and run LightGBM
    feature_rows = []
    for i, (inv, _) in enumerate(filtered):
        feats = compute_full_features(inv, company, inv_embs[i], comp_emb)
        feature_rows.append({
            "investor": inv,
            **feats
        })
    
    if not feature_rows:
        return []
    
    # Create feature matrix for LightGBM
    X = pd.DataFrame(feature_rows)[FEATURE_COLS]
    
    # Get probabilities from model
    if company_model is not None:
        probs = company_model.predict(X)
    else:
        # Fallback: use weighted feature score
        probs = (
            0.30 * X["text_similarity"] +
            0.25 * X["industry_overlap"] +
            0.15 * X["stage_fit"] +
            0.10 * X["place_fit"] +
            0.20 * X["check_fit"]
        ).values
    
    # Step 5: Probabilistic sampling
    probs = np.array(probs)
    probs = np.clip(probs, 0.01, 0.99)
    probs_normalized = probs / probs.sum()
    
    n_samples = min(num_recommendations, len(feature_rows))
    indices = np.random.choice(
        len(feature_rows),
        size=n_samples,
        replace=False,
        p=probs_normalized
    )
    
    # Step 6: Return recommendations
    recommendations = []
    for idx in indices:
        inv = feature_rows[idx]["investor"]
        prob = probs[idx]
        recommendations.append((inv.id, inv.name, float(prob)))
    
    recommendations.sort(key=lambda x: x[2], reverse=True)
    
    return recommendations


# -----------------------------
# Main API class
# -----------------------------

class RecommendationEngine:
    """Main recommendation engine class."""
    
    def __init__(self):
        self.investors = None
        self.companies = None
        self.user_interactions = None
        self.company_interactions = None
        self.user_model = None
        self.company_model = None
        self._loaded = False
    
    def load(self):
        """Load all data and models."""
        if self._loaded:
            return
        
        print("Loading investors...")
        self.investors = load_investors_from_csv(USER_CSV)
        print(f"  Loaded {len(self.investors)} investors")
        
        print("Loading companies...")
        self.companies = load_companies_from_csv(COMPANY_CSV)
        print(f"  Loaded {len(self.companies)} companies")
        
        print("Loading interactions...")
        self.user_interactions, self.company_interactions = load_interactions(
            USER_TO_COMPANY_INTERACT, COMPANY_TO_USER_INTERACT
        )
        print(f"  User interactions: {sum(len(v) for v in self.user_interactions.values())} total")
        print(f"  Company interactions: {sum(len(v) for v in self.company_interactions.values())} total")
        
        print("Loading models...")
        self.user_model, self.company_model = load_models()
        print(f"  User model: {'loaded' if self.user_model else 'not found'}")
        print(f"  Company model: {'loaded' if self.company_model else 'not found'}")
        
        self._loaded = True
        print("Recommendation engine ready!")
    
    def recommend_for_investor(
        self,
        user_id: int,
        num_recommendations: int = NUM_RECOMMENDATIONS,
    ) -> List[Tuple[int, str, float]]:
        """
        Get company recommendations for an investor.
        
        Args:
            user_id: The investor's ID
            num_recommendations: Number of recommendations to return
            
        Returns:
            List of (company_id, company_name, match_probability) tuples
        """
        if not self._loaded:
            self.load()
        
        return recommend_companies_for_user(
            user_id=user_id,
            investors=self.investors,
            companies=self.companies,
            user_interactions=self.user_interactions,
            user_model=self.user_model,
            num_recommendations=num_recommendations,
        )
    
    def recommend_for_company(
        self,
        company_id: int,
        num_recommendations: int = NUM_RECOMMENDATIONS,
    ) -> List[Tuple[int, str, float]]:
        """
        Get investor recommendations for a company.
        
        Args:
            company_id: The company's ID
            num_recommendations: Number of recommendations to return
            
        Returns:
            List of (user_id, user_name, match_probability) tuples
        """
        if not self._loaded:
            self.load()
        
        return recommend_users_for_company(
            company_id=company_id,
            investors=self.investors,
            companies=self.companies,
            company_interactions=self.company_interactions,
            company_model=self.company_model,
            num_recommendations=num_recommendations,
        )


# -----------------------------
# CLI for testing
# -----------------------------

def main():
    """Test the recommendation engine."""
    engine = RecommendationEngine()
    engine.load()
    
    print("\n" + "="*50)
    print("Testing recommendations for Demo Investor (ID=1)")
    print("="*50)
    recs = engine.recommend_for_investor(1)
    for cid, name, prob in recs:
        print(f"  Company {cid}: {name} (prob: {prob:.3f})")
    
    print("\n" + "="*50)
    print("Testing recommendations for Demo Startup (ID=1)")
    print("="*50)
    recs = engine.recommend_for_company(1)
    for uid, name, prob in recs:
        print(f"  Investor {uid}: {name} (prob: {prob:.3f})")


if __name__ == "__main__":
    main()
