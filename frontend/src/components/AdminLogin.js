"use client"

import { useState } from "react"
import { authAPI } from "../utils/api"
import "./AdminLogin.css"

const AdminLogin = ({ onAdminLogin }) => {
  const [credentials, setCredentials] = useState({
    email: "chetan.talele@mitaoe.ac.in",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await authAPI.login(credentials)

      // Check if logged in user is admin
      if (response.data.user.email === "chetan.talele@mitaoe.ac.in") {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        onAdminLogin(response.data.user)
      } else {
        setError("Access denied. Admin credentials required.")
      }
    } catch (error) {
      setError(error.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-icon">🔐</div>
          <h1>Admin Portal</h1>
          <h2>AI Cost Estimator</h2>
          <p>Secure administrative access</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email:</label>
            <input
              type="email"
              id="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              placeholder="Enter admin email"
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="admin-login-btn">
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Authenticating...
              </>
            ) : (
              <>
                <span className="login-icon">🚀</span>
                Access Admin Dashboard
              </>
            )}
          </button>
        </form>

        <div className="admin-info">
          <div className="security-notice">
            <h3>🛡️ Security Notice</h3>
            <ul>
              <li>This is a secure admin portal</li>
              <li>All activities are logged and monitored</li>
              <li>Unauthorized access is prohibited</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
