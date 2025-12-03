import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import InvestorSignUp from './pages/InvestorSignUp.jsx'
import CompanySignUp from './pages/CompanySignUp.jsx'
import SignIn from './pages/SignIn.jsx'
import InvestorDashboard from './pages/InvestorDashboard.jsx'
import CompanyDashboard from './pages/CompanyDashboard.jsx'
import InvestorProfile from './pages/InvestorProfile.jsx'
import CompanyProfile from './pages/CompanyProfile.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register/investor" element={<InvestorSignUp />} />
        <Route path="/register/company" element={<CompanySignUp />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/dashboard/investor" element={<InvestorDashboard />} />
        <Route path="/dashboard/company" element={<CompanyDashboard />} />
        <Route path="/profile/investor/:id" element={<InvestorProfile />} />
        <Route path="/profile/company/:id" element={<CompanyProfile />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
