from pathlib import Path

# Resolve project root: .../InvestLink
ROOT = Path(__file__).resolve().parent.parent

# Data folders
DATA_ROOT = ROOT / "Data"
DATA_INIT = DATA_ROOT / "Initialization"

# Models folder
MODELS_DIR = ROOT / "Models"

# SQLite DB
DB_PATH = DATA_ROOT / "invest.sqlite"

user_csv = DATA_INIT / "user_info.csv"
company_csv = DATA_INIT / "company_info.csv"

user_model_path = MODELS_DIR / "lgbm_user_model.txt"
company_model_path = MODELS_DIR / "lgbm_company_model.txt"

db_path = DB_PATH  # for sqlite3.connect(str(DB_PATH))