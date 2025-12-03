"""
Backend API for InvestLink
Handles user registration, authentication, and recommendations
"""

import sys
import sqlite3
import hashlib
import secrets
from pathlib import Path
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# Paths
ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "Data" / "invest.sqlite"

# Add Scripts folder to path for importing recommendation engine
sys.path.insert(0, str(ROOT / "Scripts"))
from Model_Reccomendation import RecommendationEngine

# Initialize recommendation engine (lazy loaded)
recommendation_engine = RecommendationEngine()

app = FastAPI(title="InvestLink API", version="1.0.0")

# CORS - allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---

class InvestorRegistration(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    investRequirements: str
    countries: list[str]
    fundStages: list[str]
    industries: list[str]
    checkSizeMin: str
    checkSizeMax: str
    website: str = ""
    profilePic: str = ""


class CompanyRegistration(BaseModel):
    email: EmailStr
    password: str
    companyName: str
    description: str
    country: str
    fundingStage: str
    industry: str
    fundingAmount: str
    website: str = ""
    logoUrl: str = ""


class RegistrationResponse(BaseModel):
    success: bool
    message: str
    user_id: int | None = None
    company_id: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: int | None = None
    company_id: int | None = None
    name: str | None = None


class SwipeRequest(BaseModel):
    like: bool  # True = liked (1), False = disliked (0)


class SwipeResponse(BaseModel):
    success: bool
    message: str


class InteractionUpdate(BaseModel):
    new_status: int  # -1 = revert (no interaction), 0 = dislike, 1 = like


class InvestorProfileUpdate(BaseModel):
    fullName: str | None = None
    investRequirements: str | None = None
    countries: list[str] | None = None
    fundStages: list[str] | None = None
    industries: list[str] | None = None
    checkSizeMin: str | None = None
    checkSizeMax: str | None = None
    website: str | None = None
    profilePic: str | None = None


class CompanyProfileUpdate(BaseModel):
    companyName: str | None = None
    description: str | None = None
    country: str | None = None
    fundingStage: str | None = None
    industry: str | None = None
    fundingAmount: str | None = None
    website: str | None = None
    logoUrl: str | None = None


class SearchResult(BaseModel):
    id: int
    name: str
    description: str | None = None
    place: str | None = None
    industry: str | None = None
    img: str | None = None


# --- Database helpers ---

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def hash_password(password: str) -> str:
    """Hash password with salt for secure storage"""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored hash"""
    # Check if this is a hashed password (contains $)
    if '$' in stored_hash:
        salt, hash_value = stored_hash.split('$', 1)
        hashed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return hashed.hex() == hash_value
    else:
        # Plain text password (for existing demo data)
        return password == stored_hash


def get_next_user_id(conn: sqlite3.Connection) -> int:
    """Get the next available user ID"""
    cursor = conn.execute("SELECT MAX(user_id) FROM user_info")
    result = cursor.fetchone()[0]
    return (result or 0) + 1


def get_next_company_id(conn: sqlite3.Connection) -> int:
    """Get the next available company ID"""
    cursor = conn.execute("SELECT MAX(company_id) FROM company_info")
    result = cursor.fetchone()[0]
    return (result or 0) + 1


def email_exists(conn: sqlite3.Connection, email: str) -> bool:
    """Check if email already exists in user_login"""
    cursor = conn.execute(
        "SELECT 1 FROM user_login WHERE user_email = ?",
        (email,)
    )
    return cursor.fetchone() is not None


def company_email_exists(conn: sqlite3.Connection, email: str) -> bool:
    """Check if email already exists in company_login"""
    cursor = conn.execute(
        "SELECT 1 FROM company_login WHERE company_email = ?",
        (email,)
    )
    return cursor.fetchone() is not None


# --- API Routes ---

@app.get("/")
def root():
    return {"message": "InvestLink API", "status": "running"}


@app.get("/health")
def health_check():
    """Check if database is accessible"""
    try:
        with get_db() as conn:
            conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.post("/api/register/investor", response_model=RegistrationResponse)
def register_investor(data: InvestorRegistration):
    """
    Register a new investor:
    1. Generate unique user_id
    2. Insert into user_login (id, email, hashed password)
    3. Insert into user_info (id, profile data)
    """
    
    try:
        with get_db() as conn:
            # Check if email already exists
            if email_exists(conn, data.email):
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists"
                )
            
            # Get next user ID
            user_id = get_next_user_id(conn)
            
            # Hash the password
            hashed_password = hash_password(data.password)
            
            # Format list fields as comma-separated strings (matching CSV format)
            places = ", ".join(data.countries)
            fund_stages = ", ".join(data.fundStages)
            industries = ", ".join(data.industries)
            
            # Insert into user_login
            conn.execute(
                """INSERT INTO user_login (user_id, user_email, user_password)
                   VALUES (?, ?, ?)""",
                (user_id, data.email, hashed_password)
            )
            
            # Insert into user_info
            conn.execute(
                """INSERT INTO user_info 
                   (user_id, U_name, U_invest_requirements, U_places, 
                    U_fund_stage, U_industry, U_check_size_max, 
                    U_check_size_min, U_website, U_pic_link)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    user_id,
                    data.fullName,
                    data.investRequirements,
                    places,
                    fund_stages,
                    industries,
                    data.checkSizeMax,
                    data.checkSizeMin,
                    data.website,
                    data.profilePic
                )
            )
            
            conn.commit()
            
            return RegistrationResponse(
                success=True,
                message="Investor registered successfully!",
                user_id=user_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@app.post("/api/register/company", response_model=RegistrationResponse)
def register_company(data: CompanyRegistration):
    """
    Register a new company/startup:
    1. Generate unique company_id
    2. Insert into company_login (id, email, hashed password)
    3. Insert into company_info (id, profile data)
    """
    
    try:
        with get_db() as conn:
            # Check if email already exists
            if company_email_exists(conn, data.email):
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists"
                )
            
            # Get next company ID
            company_id = get_next_company_id(conn)
            
            # Hash the password
            hashed_password = hash_password(data.password)
            
            # Insert into company_login
            conn.execute(
                """INSERT INTO company_login (company_id, company_email, company_password)
                   VALUES (?, ?, ?)""",
                (company_id, data.email, hashed_password)
            )
            
            # Insert into company_info
            conn.execute(
                """INSERT INTO company_info 
                   (company_id, C_name, C_desc, C_place, C_funding_stage, 
                    C_industry, C_fund_size, C_link, C_img)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    company_id,
                    data.companyName,
                    data.description,
                    data.country,
                    data.fundingStage,
                    data.industry,
                    data.fundingAmount,
                    data.website,
                    data.logoUrl
                )
            )
            
            conn.commit()
            
            return RegistrationResponse(
                success=True,
                message="Company registered successfully!",
                company_id=company_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@app.post("/api/login/investor", response_model=LoginResponse)
def login_investor(data: LoginRequest):
    """
    Login as an investor
    """
    try:
        with get_db() as conn:
            # Get user by email
            cursor = conn.execute(
                """SELECT ul.user_id, ul.user_password, ui.U_name 
                   FROM user_login ul
                   JOIN user_info ui ON ul.user_id = ui.user_id
                   WHERE ul.user_email = ?""",
                (data.email,)
            )
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            
            user_id, stored_password, name = result
            
            # Verify password
            if not verify_password(data.password, stored_password):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            
            return LoginResponse(
                success=True,
                message="Login successful",
                user_id=user_id,
                name=name
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )


@app.post("/api/login/company", response_model=LoginResponse)
def login_company(data: LoginRequest):
    """
    Login as a company/startup
    """
    try:
        with get_db() as conn:
            # Get company by email
            cursor = conn.execute(
                """SELECT cl.company_id, cl.company_password, ci.C_name 
                   FROM company_login cl
                   JOIN company_info ci ON cl.company_id = ci.company_id
                   WHERE cl.company_email = ?""",
                (data.email,)
            )
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            
            company_id, stored_password, name = result
            
            # Verify password
            if not verify_password(data.password, stored_password):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            
            return LoginResponse(
                success=True,
                message="Login successful",
                company_id=company_id,
                name=name
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )


@app.get("/api/investor/{user_id}")
def get_investor_profile(user_id: int):
    """Get investor profile by ID"""
    try:
        with get_db() as conn:
            cursor = conn.execute(
                """SELECT user_id, U_name, U_invest_requirements, U_places,
                          U_fund_stage, U_industry, U_check_size_max, 
                          U_check_size_min, U_website, U_pic_link
                   FROM user_info WHERE user_id = ?""",
                (user_id,)
            )
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Investor not found")
            
            return {
                "user_id": result[0],
                "name": result[1],
                "invest_requirements": result[2],
                "places": result[3],
                "fund_stage": result[4],
                "industry": result[5],
                "check_size_max": result[6],
                "check_size_min": result[7],
                "website": result[8],
                "pic_link": result[9]
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/company/{company_id}")
def get_company_profile(company_id: int):
    """Get company profile by ID"""
    try:
        with get_db() as conn:
            cursor = conn.execute(
                """SELECT company_id, C_name, C_desc, C_place,
                          C_funding_stage, C_industry, C_fund_size, 
                          C_link, C_img
                   FROM company_info WHERE company_id = ?""",
                (company_id,)
            )
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Company not found")
            
            return {
                "company_id": result[0],
                "name": result[1],
                "desc": result[2],
                "place": result[3],
                "funding_stage": result[4],
                "industry": result[5],
                "fund_size": result[6],
                "link": result[7],
                "img": result[8]
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/count")
def get_user_count():
    """Get total number of registered investors"""
    try:
        with get_db() as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM user_info")
            count = cursor.fetchone()[0]
            return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/companies/count")
def get_company_count():
    """Get total number of registered companies"""
    try:
        with get_db() as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM company_info")
            count = cursor.fetchone()[0]
            return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Swipe/Interaction Endpoints ---

@app.post("/api/swipe/investor/{user_id}/company/{company_id}", response_model=SwipeResponse)
def investor_swipe_company(user_id: int, company_id: int, data: SwipeRequest):
    """
    Record an investor's swipe (like/dislike) on a company.
    Updates user_to_company_interact table.
    """
    try:
        with get_db() as conn:
            like_value = 1 if data.like else 0
            
            # Check if interaction already exists
            cursor = conn.execute(
                "SELECT 1 FROM user_to_company_interact WHERE u_id = ? AND c_id = ?",
                (user_id, company_id)
            )
            exists = cursor.fetchone() is not None
            
            if exists:
                # Update existing interaction
                conn.execute(
                    "UPDATE user_to_company_interact SET like_or_not = ? WHERE u_id = ? AND c_id = ?",
                    (like_value, user_id, company_id)
                )
            else:
                # Insert new interaction
                conn.execute(
                    "INSERT INTO user_to_company_interact (u_id, c_id, like_or_not) VALUES (?, ?, ?)",
                    (user_id, company_id, like_value)
                )
            
            conn.commit()
            
            # Reload recommendation engine's interactions
            recommendation_engine.user_interactions.setdefault(user_id, set()).add(company_id)
            
            action = "liked" if data.like else "passed on"
            return SwipeResponse(success=True, message=f"Successfully {action} company")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Swipe failed: {str(e)}")


@app.post("/api/swipe/company/{company_id}/investor/{user_id}", response_model=SwipeResponse)
def company_swipe_investor(company_id: int, user_id: int, data: SwipeRequest):
    """
    Record a company's swipe (like/dislike) on an investor.
    Updates company_to_user_interact table.
    """
    try:
        with get_db() as conn:
            like_value = 1 if data.like else 0
            
            # Check if interaction already exists
            cursor = conn.execute(
                "SELECT 1 FROM company_to_user_interact WHERE c_id = ? AND u_id = ?",
                (company_id, user_id)
            )
            exists = cursor.fetchone() is not None
            
            if exists:
                # Update existing interaction
                conn.execute(
                    "UPDATE company_to_user_interact SET like_or_not = ? WHERE c_id = ? AND u_id = ?",
                    (like_value, company_id, user_id)
                )
            else:
                # Insert new interaction
                conn.execute(
                    "INSERT INTO company_to_user_interact (c_id, u_id, like_or_not) VALUES (?, ?, ?)",
                    (company_id, user_id, like_value)
                )
            
            conn.commit()
            
            # Reload recommendation engine's interactions
            recommendation_engine.company_interactions.setdefault(company_id, set()).add(user_id)
            
            action = "liked" if data.like else "passed on"
            return SwipeResponse(success=True, message=f"Successfully {action} investor")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Swipe failed: {str(e)}")


# --- Interaction History Endpoints ---

@app.get("/api/interactions/investor/{user_id}")
def get_investor_interactions(user_id: int):
    """
    Get an investor's interaction history (liked and disliked companies).
    """
    try:
        with get_db() as conn:
            # Get liked companies (like_or_not = 1)
            cursor = conn.execute(
                """SELECT c.company_id, c.C_name, c.C_desc, c.C_place, c.C_industry, c.C_funding_stage, c.C_fund_size, c.C_img
                   FROM user_to_company_interact i
                   JOIN company_info c ON i.c_id = c.company_id
                   WHERE i.u_id = ? AND i.like_or_not = 1""",
                (user_id,)
            )
            liked = [
                {"company_id": r[0], "name": r[1], "desc": r[2], "place": r[3], 
                 "industry": r[4], "funding_stage": r[5], "fund_size": r[6], "img": r[7]}
                for r in cursor.fetchall()
            ]
            
            # Get disliked companies (like_or_not = 0)
            cursor = conn.execute(
                """SELECT c.company_id, c.C_name, c.C_desc, c.C_place, c.C_industry, c.C_funding_stage, c.C_fund_size, c.C_img
                   FROM user_to_company_interact i
                   JOIN company_info c ON i.c_id = c.company_id
                   WHERE i.u_id = ? AND i.like_or_not = 0""",
                (user_id,)
            )
            disliked = [
                {"company_id": r[0], "name": r[1], "desc": r[2], "place": r[3], 
                 "industry": r[4], "funding_stage": r[5], "fund_size": r[6], "img": r[7]}
                for r in cursor.fetchall()
            ]
            
            return {"liked": liked, "disliked": disliked}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/interactions/company/{company_id}")
def get_company_interactions(company_id: int):
    """
    Get a company's interaction history (liked and disliked investors).
    """
    try:
        with get_db() as conn:
            # Get liked investors (like_or_not = 1)
            cursor = conn.execute(
                """SELECT u.user_id, u.U_name, u.U_invest_requirements, u.U_places, u.U_industry, u.U_fund_stage, u.U_pic_link
                   FROM company_to_user_interact i
                   JOIN user_info u ON i.u_id = u.user_id
                   WHERE i.c_id = ? AND i.like_or_not = 1""",
                (company_id,)
            )
            liked = [
                {"user_id": r[0], "name": r[1], "invest_requirements": r[2], "places": r[3], 
                 "industry": r[4], "fund_stage": r[5], "pic_link": r[6]}
                for r in cursor.fetchall()
            ]
            
            # Get disliked investors (like_or_not = 0)
            cursor = conn.execute(
                """SELECT u.user_id, u.U_name, u.U_invest_requirements, u.U_places, u.U_industry, u.U_fund_stage, u.U_pic_link
                   FROM company_to_user_interact i
                   JOIN user_info u ON i.u_id = u.user_id
                   WHERE i.c_id = ? AND i.like_or_not = 0""",
                (company_id,)
            )
            disliked = [
                {"user_id": r[0], "name": r[1], "invest_requirements": r[2], "places": r[3], 
                 "industry": r[4], "fund_stage": r[5], "pic_link": r[6]}
                for r in cursor.fetchall()
            ]
            
            return {"liked": liked, "disliked": disliked}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/interactions/investor/{user_id}/company/{company_id}")
def update_investor_interaction(user_id: int, company_id: int, data: InteractionUpdate):
    """
    Update an investor's interaction with a company.
    new_status: -1 = revert (no interaction), 0 = dislike, 1 = like
    """
    try:
        with get_db() as conn:
            if data.new_status == -1:
                # Revert to no interaction
                conn.execute(
                    "UPDATE user_to_company_interact SET like_or_not = -1 WHERE u_id = ? AND c_id = ?",
                    (user_id, company_id)
                )
                # Remove from recommendation engine's tracked interactions
                if user_id in recommendation_engine.user_interactions:
                    recommendation_engine.user_interactions[user_id].discard(company_id)
                message = "Interaction reverted"
            else:
                # Update to new status (0 or 1)
                conn.execute(
                    "UPDATE user_to_company_interact SET like_or_not = ? WHERE u_id = ? AND c_id = ?",
                    (data.new_status, user_id, company_id)
                )
                # Ensure it's tracked as interacted
                recommendation_engine.user_interactions.setdefault(user_id, set()).add(company_id)
                message = "Liked" if data.new_status == 1 else "Disliked"
            
            conn.commit()
            return {"success": True, "message": message}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/interactions/company/{company_id}/investor/{user_id}")
def update_company_interaction(company_id: int, user_id: int, data: InteractionUpdate):
    """
    Update a company's interaction with an investor.
    new_status: -1 = revert (no interaction), 0 = dislike, 1 = like
    """
    try:
        with get_db() as conn:
            if data.new_status == -1:
                # Revert to no interaction
                conn.execute(
                    "UPDATE company_to_user_interact SET like_or_not = -1 WHERE c_id = ? AND u_id = ?",
                    (company_id, user_id)
                )
                # Remove from recommendation engine's tracked interactions
                if company_id in recommendation_engine.company_interactions:
                    recommendation_engine.company_interactions[company_id].discard(user_id)
                message = "Interaction reverted"
            else:
                # Update to new status (0 or 1)
                conn.execute(
                    "UPDATE company_to_user_interact SET like_or_not = ? WHERE c_id = ? AND u_id = ?",
                    (data.new_status, company_id, user_id)
                )
                # Ensure it's tracked as interacted
                recommendation_engine.company_interactions.setdefault(company_id, set()).add(user_id)
                message = "Liked" if data.new_status == 1 else "Disliked"
            
            conn.commit()
            return {"success": True, "message": message}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Recommendation Endpoints ---

@app.get("/api/recommendations/investor/{user_id}")
def get_recommendations_for_investor(user_id: int, num: int = 5):
    """
    Get company recommendations for an investor.
    
    Args:
        user_id: The investor's ID
        num: Number of recommendations (default 5)
    
    Returns:
        List of recommended companies with match probabilities
    """
    try:
        # Get recommendations from engine
        recs = recommendation_engine.recommend_for_investor(user_id, num_recommendations=num)
        
        if not recs:
            return {"recommendations": [], "message": "No recommendations available"}
        
        # Format response with company details
        recommendations = []
        with get_db() as conn:
            for company_id, company_name, probability in recs:
                # Get additional company info
                cursor = conn.execute(
                    """SELECT C_desc, C_place, C_funding_stage, C_industry, C_fund_size, C_link, C_img
                       FROM company_info WHERE company_id = ?""",
                    (company_id,)
                )
                result = cursor.fetchone()
                
                if result:
                    recommendations.append({
                        "company_id": company_id,
                        "name": company_name.strip(),
                        "match_probability": round(probability * 100, 1),
                        "description": result[0],
                        "place": result[1],
                        "funding_stage": result[2],
                        "industry": result[3],
                        "fund_size": result[4],
                        "link": result[5],
                        "img": result[6]
                    })
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@app.get("/api/recommendations/company/{company_id}")
def get_recommendations_for_company(company_id: int, num: int = 5):
    """
    Get investor recommendations for a company.
    
    Args:
        company_id: The company's ID
        num: Number of recommendations (default 5)
    
    Returns:
        List of recommended investors with match probabilities
    """
    try:
        # Get recommendations from engine
        recs = recommendation_engine.recommend_for_company(company_id, num_recommendations=num)
        
        if not recs:
            return {"recommendations": [], "message": "No recommendations available"}
        
        # Format response with investor details
        recommendations = []
        with get_db() as conn:
            for user_id, user_name, probability in recs:
                # Get additional investor info
                cursor = conn.execute(
                    """SELECT U_invest_requirements, U_places, U_fund_stage, U_industry, 
                              U_check_size_min, U_check_size_max, U_website, U_pic_link
                       FROM user_info WHERE user_id = ?""",
                    (user_id,)
                )
                result = cursor.fetchone()
                
                if result:
                    recommendations.append({
                        "user_id": user_id,
                        "name": user_name.strip(),
                        "match_probability": round(probability * 100, 1),
                        "invest_requirements": result[0],
                        "places": result[1],
                        "fund_stage": result[2],
                        "industry": result[3],
                        "check_size_min": result[4],
                        "check_size_max": result[5],
                        "website": result[6],
                        "pic_link": result[7]
                    })
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@app.post("/api/recommendations/load")
def load_recommendation_engine():
    """
    Pre-load the recommendation engine.
    Call this to warm up the engine before first use.
    """
    try:
        recommendation_engine.load()
        return {"status": "loaded", "message": "Recommendation engine ready"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load engine: {str(e)}")


# --- Profile Update Endpoints ---

@app.put("/api/investor/{user_id}/profile")
def update_investor_profile(user_id: int, data: InvestorProfileUpdate):
    """Update an investor's profile"""
    try:
        with get_db() as conn:
            # Check if user exists
            cursor = conn.execute("SELECT 1 FROM user_info WHERE user_id = ?", (user_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Investor not found")
            
            # Build update query dynamically
            updates = []
            params = []
            
            if data.fullName is not None:
                updates.append("U_name = ?")
                params.append(data.fullName)
            if data.investRequirements is not None:
                updates.append("U_invest_requirements = ?")
                params.append(data.investRequirements)
            if data.countries is not None:
                updates.append("U_places = ?")
                params.append(", ".join(data.countries))
            if data.fundStages is not None:
                updates.append("U_fund_stage = ?")
                params.append(", ".join(data.fundStages))
            if data.industries is not None:
                updates.append("U_industry = ?")
                params.append(", ".join(data.industries))
            if data.checkSizeMin is not None:
                updates.append("U_check_size_min = ?")
                params.append(data.checkSizeMin)
            if data.checkSizeMax is not None:
                updates.append("U_check_size_max = ?")
                params.append(data.checkSizeMax)
            if data.website is not None:
                updates.append("U_website = ?")
                params.append(data.website)
            if data.profilePic is not None:
                updates.append("U_pic_link = ?")
                params.append(data.profilePic)
            
            if not updates:
                return {"success": True, "message": "No changes to apply"}
            
            params.append(user_id)
            query = f"UPDATE user_info SET {', '.join(updates)} WHERE user_id = ?"
            conn.execute(query, params)
            conn.commit()
            
            return {"success": True, "message": "Profile updated successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/company/{company_id}/profile")
def update_company_profile(company_id: int, data: CompanyProfileUpdate):
    """Update a company's profile"""
    try:
        with get_db() as conn:
            # Check if company exists
            cursor = conn.execute("SELECT 1 FROM company_info WHERE company_id = ?", (company_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Company not found")
            
            # Build update query dynamically
            updates = []
            params = []
            
            if data.companyName is not None:
                updates.append("C_name = ?")
                params.append(data.companyName)
            if data.description is not None:
                updates.append("C_desc = ?")
                params.append(data.description)
            if data.country is not None:
                updates.append("C_place = ?")
                params.append(data.country)
            if data.fundingStage is not None:
                updates.append("C_funding_stage = ?")
                params.append(data.fundingStage)
            if data.industry is not None:
                updates.append("C_industry = ?")
                params.append(data.industry)
            if data.fundingAmount is not None:
                updates.append("C_fund_size = ?")
                params.append(data.fundingAmount)
            if data.website is not None:
                updates.append("C_link = ?")
                params.append(data.website)
            if data.logoUrl is not None:
                updates.append("C_img = ?")
                params.append(data.logoUrl)
            
            if not updates:
                return {"success": True, "message": "No changes to apply"}
            
            params.append(company_id)
            query = f"UPDATE company_info SET {', '.join(updates)} WHERE company_id = ?"
            conn.execute(query, params)
            conn.commit()
            
            return {"success": True, "message": "Profile updated successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Search Endpoints ---

@app.get("/api/search/investors")
def search_investors(q: str = "", limit: int = 20):
    """Search investors by name or description"""
    try:
        with get_db() as conn:
            if q:
                cursor = conn.execute(
                    """SELECT user_id, U_name, U_invest_requirements, U_places, U_industry, U_pic_link
                       FROM user_info 
                       WHERE user_id != 1 AND (
                           U_name LIKE ? OR 
                           U_invest_requirements LIKE ? OR 
                           U_industry LIKE ?
                       )
                       LIMIT ?""",
                    (f"%{q}%", f"%{q}%", f"%{q}%", limit)
                )
            else:
                cursor = conn.execute(
                    """SELECT user_id, U_name, U_invest_requirements, U_places, U_industry, U_pic_link
                       FROM user_info 
                       WHERE user_id != 1
                       LIMIT ?""",
                    (limit,)
                )
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "id": row[0],
                    "name": row[1].strip() if row[1] else "",
                    "description": (row[2][:150] + "..." if row[2] and len(row[2]) > 150 else row[2]) if row[2] else None,
                    "place": row[3],
                    "industry": row[4],
                    "img": row[5]
                })
            
            return {"results": results, "count": len(results)}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search/companies")
def search_companies(q: str = "", limit: int = 20):
    """Search companies by name or description"""
    try:
        with get_db() as conn:
            if q:
                cursor = conn.execute(
                    """SELECT company_id, C_name, C_desc, C_place, C_industry, C_img
                       FROM company_info 
                       WHERE company_id != 1 AND (
                           C_name LIKE ? OR 
                           C_desc LIKE ? OR 
                           C_industry LIKE ?
                       )
                       LIMIT ?""",
                    (f"%{q}%", f"%{q}%", f"%{q}%", limit)
                )
            else:
                cursor = conn.execute(
                    """SELECT company_id, C_name, C_desc, C_place, C_industry, C_img
                       FROM company_info 
                       WHERE company_id != 1
                       LIMIT ?""",
                    (limit,)
                )
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "id": row[0],
                    "name": row[1].strip() if row[1] else "",
                    "description": (row[2][:150] + "..." if row[2] and len(row[2]) > 150 else row[2]) if row[2] else None,
                    "place": row[3],
                    "industry": row[4],
                    "img": row[5]
                })
            
            return {"results": results, "count": len(results)}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

