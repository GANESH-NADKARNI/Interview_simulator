import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/common/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ForgotUsername from './pages/ForgotUsername'
import Dashboard from './pages/Dashboard'
import AptitudePage from './pages/AptitudePage'
import CodingPage from './pages/CodingPage'
import HRPage from './pages/HRPage'
import History from './pages/History'
import ResumePage from './pages/ResumePage'
import ExpertisePage from './pages/ExpertisePage'
import WakeUp from './pages/WakeUp'


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                element={<WakeUp />} />
      <Route path="/home"            element={<Landing />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/forgot-username" element={<ForgotUsername />} />
      <Route path="/dashboard"  element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/aptitude"   element={<ProtectedRoute><Layout><AptitudePage /></Layout></ProtectedRoute>} />
      <Route path="/coding"     element={<ProtectedRoute><Layout><CodingPage /></Layout></ProtectedRoute>} />
      <Route path="/hr"         element={<ProtectedRoute><Layout><HRPage /></Layout></ProtectedRoute>} />
      <Route path="/history"    element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
      <Route path="/resume"     element={<ProtectedRoute><Layout><ResumePage /></Layout></ProtectedRoute>} />
      <Route path="/expertise"  element={<ProtectedRoute><Layout><ExpertisePage /></Layout></ProtectedRoute>} />
      <Route path="*"           element={<Navigate to="/" />} />
    </Routes>
  )
}