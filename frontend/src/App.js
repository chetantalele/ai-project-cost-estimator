"use client"

import { useState, useEffect } from "react"
import Login from "./components/Login"
import Register from "./components/Register"
import Dashboard from "./components/Dashboard"
import "./App.css"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState("login") // "login" or "register"
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
        // Check if user is admin
        setIsAdmin(user.email === "chetan.talele@mitaoe.ac.in")
      } catch (error) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAdmin(userData.email === "chetan.talele@mitaoe.ac.in")
  }

  const handleRegister = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setIsAdmin(false)
    setCurrentView("login")
  }

  const switchToRegister = () => {
    setCurrentView("register")
  }

  const switchToLogin = () => {
    setCurrentView("login")
  }

  const handleAdminLogin = (userData) => {
    setUser(userData)
    setIsAdmin(true)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="App">
      {user ? (
        isAdmin ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )
      ) : currentView === "login" ? (
        <Login onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
      ) : currentView === "admin" ? (
        <AdminLogin onAdminLogin={handleAdminLogin} />
      ) : (
        <Register onRegister={handleRegister} onSwitchToLogin={switchToLogin} />
      )}
    </div>
  )
}

export default App
