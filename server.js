const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const { connectDB } = require("./database/connection")
const authRoutes = require("./routes/auth")
const projectRoutes = require("./routes/projects")
const aiRoutes = require("./routes/ai")

const app = express()
const PORT = process.env.PORT || 5000

// Check for required environment variables
if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn("⚠️  Warning: GOOGLE_AI_API_KEY environment variable is not set")
  console.warn("   AI suggestions will not work without a valid Google AI Studio API key")
  console.warn("   Get your free API key at: https://makersuite.google.com/app/apikey")
} else {
  console.log("✅ Google AI API key is configured")
  console.log("🤖 Available AI models: Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini Pro")
}

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/ai", aiRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    google_ai_configured: !!process.env.GOOGLE_AI_API_KEY,
    available_models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"],
    ai_provider: "Google AI Studio (Gemini)",
  })
})

// Start server
const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🤖 Google AI: ${process.env.GOOGLE_AI_API_KEY ? "Configured" : "Not configured"}`)
      console.log(`🆓 Using Google AI Studio - Free tier available!`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
