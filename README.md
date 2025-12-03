# InvestLink

**Investors and Companies going out on a date.**

InvestLink is a matchmaking platform that connects investors with startups based on their profiles, preferences, and AI-powered recommendations. Think of it as a "Tinder for investments" – swipe right to connect!

---

## Features

- **Dual Sign-up**: Separate registration flows for investors and startups
- **Smart Recommendations**: AI-powered matching using Sentence-BERT embeddings and LightGBM models
- **Swipe Interface**: Tinder-like UI to like or pass on potential matches
- **Interaction History**: Track and manage your liked/disliked companies or investors
- **Search**: Find specific companies or investors by name
- **Profile Management**: Edit your profile information anytime

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | SQLite |
| ML/AI | Sentence-BERT, LightGBM, PyTorch |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/)
- **pip** (Python package manager, comes with Python)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd InvestLink
```

### 2. Set Up the Backend

```bash
# Navigate to the Backend folder
cd Backend

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Return to root directory
cd ..
```

### 3. Set Up the Frontend

```bash
# Navigate to the Frontend folder
cd Frontend

# Install Node.js dependencies
npm install

# Return to root directory
cd ..
```

### 4. Initialize the Database (if needed)

If you need to rebuild the database from CSV files:

```bash
cd Scripts
python3 Make_Database.py
cd ..
```

---

## Running the Application

You need to run **both** the backend and frontend simultaneously.

### Terminal 1: Start the Backend Server

```bash
cd Backend
python3 main.py
```

The backend API will be available at: **http://localhost:8000**

### Terminal 2: Start the Frontend Development Server

```bash
cd Frontend
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## Quick Start

1. Open your browser and go to **http://localhost:5173**
2. Click **"I'm an Investor"** or **"I'm a Startup"** to sign up
3. Or log in with the demo accounts:

| Account Type | Email | Password |
|--------------|-------|----------|
| Investor | dummyinvestor@gmail.com | dummydummy |
| Startup | dummystartup@gmail.com | dummydummy |

---

## Project Structure

```
InvestLink/
├── Backend/
│   ├── main.py              # FastAPI server & API endpoints
│   ├── Model_Reccomendation.py  # Recommendation engine
│   └── requirements.txt     # Python dependencies
│
├── Frontend/
│   ├── src/
│   │   ├── App.jsx          # Landing page
│   │   ├── main.jsx         # Router setup
│   │   ├── pages/           # Page components
│   │   │   ├── SignIn.jsx
│   │   │   ├── InvestorSignUp.jsx
│   │   │   ├── CompanySignUp.jsx
│   │   │   ├── InvestorDashboard.jsx
│   │   │   ├── CompanyDashboard.jsx
│   │   │   ├── InvestorProfile.jsx
│   │   │   └── CompanyProfile.jsx
│   │   └── components/      # Reusable components
│   │       ├── SwipeRecommendations.jsx
│   │       ├── InteractionHistory.jsx
│   │       ├── SearchBar.jsx
│   │       ├── EditProfileModal.jsx
│   │       └── ExpandableTag.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── Scripts/
│   ├── Make_Database.py     # Database initialization
│   ├── Model_Reccomendation.py  # ML recommendation logic
│   └── Label_Synthesis_Model_Creation.py  # Model training
│
├── Data/
│   ├── invest.sqlite        # SQLite database
│   └── Initialization/      # CSV data files
│       ├── user_info.csv
│       ├── user_login.csv
│       ├── company_info.csv
│       └── company_login.csv
│
└── ML/
    ├── lgbm_user_model.txt      # Trained LightGBM model (investor→company)
    └── lgbm_company_model.txt   # Trained LightGBM model (company→investor)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register/investor` | Register a new investor |
| POST | `/api/register/company` | Register a new company |
| POST | `/api/login/investor` | Investor login |
| POST | `/api/login/company` | Company login |
| GET | `/api/investor/{id}` | Get investor profile |
| GET | `/api/company/{id}` | Get company profile |
| GET | `/api/recommendations/investor/{id}` | Get company recommendations for investor |
| GET | `/api/recommendations/company/{id}` | Get investor recommendations for company |
| POST | `/api/swipe/investor/{uid}/company/{cid}` | Record investor swipe |
| POST | `/api/swipe/company/{cid}/investor/{uid}` | Record company swipe |
| GET | `/api/interactions/investor/{id}` | Get investor's interaction history |
| GET | `/api/interactions/company/{id}` | Get company's interaction history |
| GET | `/api/search/investors` | Search investors by name |
| GET | `/api/search/companies` | Search companies by name |

---

## Troubleshooting

### "Address already in use" (Port 8000)
Kill existing processes:
```bash
lsof -ti:8000 | xargs kill -9
```

### "Module not found" errors
Make sure you've installed all dependencies:
```bash
# Backend
cd Backend && pip install -r requirements.txt

# Frontend
cd Frontend && npm install
```

### Slow first recommendation
The first recommendation request may take ~10-30 seconds as the ML models load into memory. Subsequent requests are fast (~0.5s).

---

## License

This project was created as part of a GDG Collaboration.

---

## Contributors

Built with ❤️ by the InvestLink team.
