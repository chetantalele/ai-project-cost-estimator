const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { getConnection } = require("../database/connection")
const { JWT_SECRET } = require("../middleware/auth")

const router = express.Router()

// Register route
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body

    // Validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" })
    }

    const db = getConnection()

    // Check if user already exists
    const [existingUsers] = await db.execute("SELECT * FROM users WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "User with this email already exists" })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insert new user
    const [result] = await db.execute("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword])

    // Generate JWT token
    const token = jwt.sign({ userId: result.insertId, email: email }, JWT_SECRET, { expiresIn: "24h" })

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: result.insertId, email: email },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const db = getConnection()

    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = users[0]
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      token,
      user: { id: user.id, email: user.email },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
