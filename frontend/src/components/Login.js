"use client"

import { useState } from "react"
import { authAPI } from "../utils/api"
import "./Login.css"

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await authAPI.login(credentials)
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      onLogin(response.data.user)
    } catch (error) {
      setError(error.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>AI Project Cost Estimator</h1>
          <h2>Welcome Back</h2>
          <p>Sign in to continue optimizing your project costs</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              placeholder="Enter your email address"
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
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <button onClick={onSwitchToRegister} className="switch-btn">
              Create Account
            </button>
          </p>
          <p style={{ marginTop: "10px" }}>
            <button
              onClick={() => (window.location.href = "/admin")}
              className="admin-link"
              style={{
                background: "none",
                border: "none",
                color: "#1e3c72",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline",
                fontWeight: "500",
              }}
            >
              🔐 Admin Access
            </button>
          </p>
        </div>

        <div className="demo-credentials">
          <h3>Demo Account</h3>
          <p>
            <strong>Email:</strong> admin@example.com
          </p>
          <p>
            <strong>Password:</strong> admin123
          </p>
          <p className="demo-note">
            Use these credentials to explore the application, or create your own account above.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
