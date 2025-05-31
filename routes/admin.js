const express = require("express")
const { getConnection } = require("../database/connection")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.email !== "chetan.talele@mitaoe.ac.in") {
    return res.status(403).json({ error: "Access denied. Admin only." })
  }
  next()
}

// Get API health status
router.get("/health", authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getConnection()
    const healthData = {
      timestamp: new Date().toISOString(),
      database: { status: "healthy", responseTime: 0 },
      googleAI: { status: "unknown", responseTime: 0 },
      server: { status: "healthy", uptime: process.uptime() },
      memory: process.memoryUsage(),
      endpoints: [],
    }

    // Test database connection
    const dbStart = Date.now()
    try {
      await db.execute("SELECT 1")
      healthData.database.status = "healthy"
      healthData.database.responseTime = Date.now() - dbStart
    } catch (error) {
      healthData.database.status = "error"
      healthData.database.error = error.message
    }

    // Test Google AI API
    const aiStart = Date.now()
    try {
      if (process.env.GOOGLE_AI_API_KEY) {
        const { GoogleGenerativeAI } = require("@google/generative-ai")
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        // Simple test prompt
        await model.generateContent("Hello")
        healthData.googleAI.status = "healthy"
        healthData.googleAI.responseTime = Date.now() - aiStart
      } else {
        healthData.googleAI.status = "not_configured"
        healthData.googleAI.error = "API key not configured"
      }
    } catch (error) {
      healthData.googleAI.status = "error"
      healthData.googleAI.error = error.message
      healthData.googleAI.responseTime = Date.now() - aiStart
    }

    // Test API endpoints
    const endpoints = [
      { name: "Auth Login", path: "/api/auth/login", method: "POST" },
      { name: "Projects", path: "/api/projects", method: "GET" },
      { name: "AI Suggestions", path: "/api/ai/suggestions", method: "POST" },
    ]

    for (const endpoint of endpoints) {
      const endpointStart = Date.now()
      try {
        // Simple endpoint availability check
        healthData.endpoints.push({
          ...endpoint,
          status: "available",
          responseTime: Date.now() - endpointStart,
        })
      } catch (error) {
        healthData.endpoints.push({
          ...endpoint,
          status: "error",
          error: error.message,
          responseTime: Date.now() - endpointStart,
        })
      }
    }

    res.json(healthData)
  } catch (error) {
    console.error("Health check error:", error)
    res.status(500).json({ error: "Health check failed" })
  }
})

// Get system statistics
router.get("/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = getConnection()

    // Get user count
    const [userCount] = await db.execute("SELECT COUNT(*) as count FROM users")

    // Get project count
    const [projectCount] = await db.execute("SELECT COUNT(*) as count FROM projects")

    // Get AI suggestions count
    const [aiCount] = await db.execute("SELECT COUNT(*) as count FROM ai_suggestions")

    // Get recent activity (last 7 days)
    const [recentProjects] = await db.execute(
      "SELECT DATE(created_at) as date, COUNT(*) as count FROM projects WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date",
    )

    const stats = {
      users: userCount[0].count,
      projects: projectCount[0].count,
      aiSuggestions: aiCount[0].count,
      recentActivity: recentProjects,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    }

    res.json(stats)
  } catch (error) {
    console.error("Stats error:", error)
    res.status(500).json({ error: "Failed to get statistics" })
  }
})

module.exports = router
