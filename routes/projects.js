const express = require("express")
const { getConnection } = require("../database/connection")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get all projects for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const db = getConnection()
    const [projects] = await db.execute("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC", [
      req.user.userId,
    ])

    // Parse technology_stack JSON for each project
    projects.forEach((project) => {
      if (project.technology_stack) {
        try {
          project.technology_stack = JSON.parse(project.technology_stack)
        } catch (e) {
          project.technology_stack = {}
        }
      }
    })

    res.json(projects)
  } catch (error) {
    console.error("Get projects error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Create new project
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      complexity,
      roles,
      additional_costs,
      risk_buffer_percentage,
      technology_stack,
    } = req.body

    console.log("Received technology stack:", technology_stack) // Debug log

    const db = getConnection()

    // Calculate base cost from roles
    const baseCost = roles.reduce((sum, role) => {
      return sum + role.hourly_rate * role.hours_per_week * role.weeks * role.person_count
    }, 0)

    // Calculate additional costs (default to 0 if not provided)
    const additionalCosts = additional_costs || 0

    // Calculate risk buffer (default to 15% if not provided)
    const riskBufferPercentage = risk_buffer_percentage !== undefined ? risk_buffer_percentage : 15.0
    const subtotal = baseCost + additionalCosts
    const riskBufferAmount = (subtotal * riskBufferPercentage) / 100

    // Calculate total cost
    const totalCost = subtotal + riskBufferAmount

    // Stringify technology_stack for database storage
    let technologyStackJson = null
    if (technology_stack) {
      try {
        // Check if it's already a string
        if (typeof technology_stack === "string") {
          // Validate it's proper JSON
          JSON.parse(technology_stack)
          technologyStackJson = technology_stack
        } else {
          // It's an object, stringify it
          technologyStackJson = JSON.stringify(technology_stack)
        }
        console.log("Storing technology stack as:", technologyStackJson)
      } catch (e) {
        console.error("Error stringifying technology stack:", e)
        technologyStackJson = JSON.stringify({})
      }
    }

    console.log("Storing technology stack:", technologyStackJson) // Debug log

    // Insert project with technology stack
    const [projectResult] = await db.execute(
      "INSERT INTO projects (user_id, name, description, duration, complexity, technology_stack, base_cost, additional_costs, risk_buffer_percentage, risk_buffer_amount, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.user.userId,
        name,
        description,
        duration,
        complexity,
        technologyStackJson,
        baseCost,
        additionalCosts,
        riskBufferPercentage,
        riskBufferAmount,
        totalCost,
      ],
    )

    const projectId = projectResult.insertId

    // Insert roles
    for (const role of roles) {
      const roleCost = role.hourly_rate * role.hours_per_week * role.weeks * role.person_count
      await db.execute(
        "INSERT INTO roles (project_id, role_name, person_count, hourly_rate, hours_per_week, weeks, cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [projectId, role.role_name, role.person_count, role.hourly_rate, role.hours_per_week, role.weeks, roleCost],
      )
    }

    res.json({ id: projectId, message: "Project created successfully" })
  } catch (error) {
    console.error("Create project error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get project with roles
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const db = getConnection()
    const [projects] = await db.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.userId,
    ])

    if (projects.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    const project = projects[0]

    // Parse technology_stack JSON
    if (project.technology_stack) {
      try {
        // Check if it's already an object
        if (typeof project.technology_stack === "object" && project.technology_stack !== null) {
          console.log("Technology stack is already an object:", project.technology_stack)
        } else {
          // It's a string, parse it
          project.technology_stack = JSON.parse(project.technology_stack)
          console.log("Retrieved technology stack:", project.technology_stack)
        }
      } catch (e) {
        console.error("Error parsing technology stack:", e)
        project.technology_stack = {}
      }
    } else {
      project.technology_stack = {}
    }

    const [roles] = await db.execute("SELECT * FROM roles WHERE project_id = ?", [req.params.id])

    const [suggestions] = await db.execute(
      "SELECT * FROM ai_suggestions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.params.id],
    )

    // Parse technology_recommendations JSON if exists
    if (suggestions.length > 0 && suggestions[0].technology_recommendations) {
      try {
        suggestions[0].technology_recommendations = JSON.parse(suggestions[0].technology_recommendations)
      } catch (e) {
        suggestions[0].technology_recommendations = {}
      }
    }

    res.json({
      project,
      roles,
      aiSuggestion: suggestions[0] || null,
    })
  } catch (error) {
    console.error("Get project error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
