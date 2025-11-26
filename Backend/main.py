"""
Backend API for InvestLink
Handles user registration and authentication
"""

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

