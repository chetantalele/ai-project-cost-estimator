"use client"

import { useState } from "react"
import { authAPI } from "../utils/api"
import "./Register.css"

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear errors when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await authAPI.register(formData)

      setSuccess("Registration successful! You are now logged in.")

      // Store token and user data
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      // Call onRegister callback after a short delay to show success message
      setTimeout(() => {
        onRegister(response.data.user)
      }, 1500)
    } catch (error) {
      console.error("Registration error:", error)
      setError(error.response?.data?.error || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" }
    if (password.length < 6) return { strength: 1, text: "Too short", color: "#e74c3c" }
    if (password.length < 8) return { strength: 2, text: "Weak", color: "#f39c12" }
    if (password.length < 12) return { strength: 3, text: "Good", color: "#f1c40f" }
    return { strength: 4, text: "Strong", color: "#27ae60" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>AI Project Cost Estimator</h1>
          <h2>Create Account</h2>
          <p>Join us to start optimizing your project costs with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
              className={error && error.includes("email") ? "error-input" : ""}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password (min. 6 characters)"
              className={error && error.includes("Password") ? "error-input" : ""}
            />
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.strength / 4) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
              className={error && error.includes("match") ? "error-input" : ""}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="password-mismatch">
                <span>❌ Passwords do not match</span>
              </div>
            )}
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword &&
              formData.password.length >= 6 && (
                <div className="password-match">
                  <span>✅ Passwords match</span>
                </div>
              )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 6}
            className="register-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="switch-btn">
              Sign In
            </button>
          </p>
        </div>

        <div className="features-preview">
          <h3>What you'll get:</h3>
          <ul>
            <li>🤖 AI-powered cost optimization</li>
            <li>📊 Detailed project analysis</li>
            <li>👥 Team structure recommendations</li>
            <li>📄 Professional PDF reports</li>
            <li>🛠️ Technology stack suggestions</li>
            <li>💰 Cost reduction insights</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Register
