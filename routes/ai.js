const express = require("express")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const { getConnection } = require("../database/connection")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

// Available Gemini models in order of preference
const AVAILABLE_MODELS = [
  "gemini-1.5-flash", // Latest and fastest
  "gemini-1.5-pro", // Most capable
  "gemini-pro", // Standard model
]

// Get AI suggestions for project
router.post("/suggestions/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params
    const db = getConnection()

    // Get project and roles data
    const [projects] = await db.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", [
      projectId,
      req.user.userId,
    ])

    if (projects.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    const [roles] = await db.execute("SELECT * FROM roles WHERE project_id = ?", [projectId])

    const project = projects[0]

    // Parse technology stack
    let technologyStack = {}
    if (project.technology_stack) {
      try {
        if (typeof project.technology_stack === "object" && project.technology_stack !== null) {
          technologyStack = project.technology_stack
        } else {
          technologyStack = JSON.parse(project.technology_stack)
        }
      } catch (e) {
        console.error("Error parsing technology stack:", e)
        technologyStack = {}
      }
    }

    console.log("Sending data to Google AI:", {
      project: project.name,
      complexity: project.complexity,
      duration: project.duration,
      totalCost: project.total_cost,
      rolesCount: roles.length,
      technologyStack,
    })

    // Call Google AI with real project data
    const aiResponse = await getGeminiSuggestions(project, roles, technologyStack)

    console.log("Received AI response:", aiResponse)

    // Save AI suggestion to database
    await db.execute(
      "INSERT INTO ai_suggestions (project_id, suggestions, technology_recommendations, cost_reduction, updated_team_structure, confidence_score) VALUES (?, ?, ?, ?, ?, ?)",
      [
        projectId,
        aiResponse.suggestions,
        JSON.stringify(aiResponse.technology_recommendations),
        aiResponse.cost_reduction,
        aiResponse.updated_team_structure,
        aiResponse.confidence_score,
      ],
    )

    res.json(aiResponse)
  } catch (error) {
    console.error("AI suggestions error:", error)

    // Handle specific Google AI errors
    if (error.message.includes("API key")) {
      res.status(500).json({ error: "Google AI API configuration error. Please check your API key." })
    } else if (error.message.includes("quota")) {
      res.status(500).json({ error: "Google AI API quota exceeded. Please try again later." })
    } else if (error.message.includes("PERMISSION_DENIED")) {
      res.status(500).json({ error: "Google AI API access denied. Please check your API key permissions." })
    } else if (error.message.includes("RESOURCE_EXHAUSTED")) {
      res.status(500).json({ error: "Google AI API rate limit exceeded. Please wait a moment and try again." })
    } else {
      res.status(500).json({ error: "Failed to generate AI suggestions. Please try again." })
    }
  }
})

// Function to get suggestions from Google AI with model fallback
async function getGeminiSuggestions(project, roles, technologyStack) {
  let lastError = null

  // Try each model until one works
  for (const modelName of AVAILABLE_MODELS) {
    try {
      console.log(`Attempting to use Google AI model: ${modelName}`)
      return await callGeminiWithModel(modelName, project, roles, technologyStack)
    } catch (error) {
      console.log(`Model ${modelName} failed:`, error.message)
      lastError = error

      // If it's a model not found error, try the next model
      if (error.message.includes("not found") || error.message.includes("INVALID_ARGUMENT")) {
        continue
      }

      // For other errors (quota, rate limit, etc.), don't try other models
      throw error
    }
  }

  // If all models failed, throw the last error
  throw new Error(`All Google AI models failed. Last error: ${lastError.message}`)
}

// Function to call Google AI with a specific model
async function callGeminiWithModel(modelName, project, roles, technologyStack) {
  try {
    // Calculate project metrics
    const totalPeople = roles.reduce((sum, role) => sum + role.person_count, 0)
    const totalCost = project.total_cost
    const baseCost = project.base_cost
    const additionalCosts = project.additional_costs || 0
    const riskBuffer = project.risk_buffer_amount || 0

    // Prepare technology stack summary
    const techStackSummary = Object.entries(technologyStack)
      .filter(([_, technologies]) => Array.isArray(technologies) && technologies.length > 0)
      .map(([category, technologies]) => `${category}: ${technologies.join(", ")}`)
      .join("; ")

    // Prepare roles summary
    const rolesSummary = roles
      .map(
        (role) =>
          `${role.role_name}: ${role.person_count} people, $${role.hourly_rate}/hour, ${role.hours_per_week} hours/week for ${role.weeks} weeks (Total: $${role.cost})`,
      )
      .join("; ")

    // Create the prompt for Google AI
    const prompt = `You are an expert project management and software development consultant. Analyze the following project and provide detailed optimization suggestions.

PROJECT DETAILS:
- Name: ${project.name}
- Description: ${project.description || "Not provided"}
- Duration: ${project.duration} months
- Complexity: ${project.complexity}
- Total Cost: $${totalCost.toLocaleString()}
- Base Team Cost: $${baseCost.toLocaleString()}
- Additional Costs: $${additionalCosts.toLocaleString()}
- Risk Buffer: $${riskBuffer.toLocaleString()} (${project.risk_buffer_percentage || 0}%)

CURRENT TEAM STRUCTURE (${totalPeople} people total):
${rolesSummary}

TECHNOLOGY STACK:
${techStackSummary || "Not specified"}

Please provide a comprehensive analysis and suggestions in the following JSON format. Make sure to return ONLY valid JSON without any markdown formatting:

{
  "suggestions": "Detailed text analysis with specific recommendations for team optimization, cost reduction, and project efficiency improvements. Include numbered points and specific percentages where possible.",
  "technology_recommendations": {
    "suggested_additions": [
      {
        "technology": "Technology Name",
        "reason": "Why this technology would help",
        "impact": "High/Medium/Low"
      }
    ],
    "alternatives": [
      {
        "from": "Current Technology",
        "to": "Recommended Alternative",
        "reason": "Why this change would be beneficial",
        "cost_impact": "Percentage impact on cost (e.g., '-15%')"
      }
    ]
  },
  "cost_reduction": 0,
  "updated_team_structure": {
    "recommendations": [
      {
        "role": "Role Name",
        "person_count": 0,
        "hours": 0,
        "weeks": 0,
        "reasoning": "Why this role configuration is recommended",
        "technologies": ["Tech1", "Tech2"]
      }
    ],
    "alternative_combinations": [
      {
        "name": "Option Name",
        "total_people": 0,
        "cost_reduction": "Percentage",
        "timeline_impact": "Impact on timeline",
        "description": "Description of this option"
      }
    ]
  },
  "confidence_score": 0.85
}

Focus on:
1. Team size optimization based on project complexity and duration
2. Technology stack improvements for efficiency
3. Cost reduction strategies without compromising quality
4. Timeline optimization
5. Risk mitigation
6. Specific, actionable recommendations with quantified benefits

Provide the cost_reduction as a dollar amount that could realistically be saved based on your recommendations.

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`

    console.log(`Sending prompt to Google AI using model: ${modelName}`)

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: modelName })

    // Configure generation settings
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    }

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    })

    const response = await result.response
    const aiResponseText = response.text()

    console.log(`Raw Google AI response from ${modelName}:`, aiResponseText)

    // Parse the JSON response
    let parsedResponse
    try {
      // Clean the response text
      let cleanedResponse = aiResponseText.trim()

      // Remove any markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "")

      // Remove any leading/trailing whitespace
      cleanedResponse = cleanedResponse.trim()

      parsedResponse = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("Error parsing Google AI response:", parseError)
      console.log("Attempting to fix JSON...")

      // Try to extract JSON from the response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0])
        } catch (secondParseError) {
          console.error("Failed to parse extracted JSON:", secondParseError)
          // Return a fallback response
          parsedResponse = createFallbackResponse(aiResponseText, totalCost)
        }
      } else {
        // Return a fallback response
        parsedResponse = createFallbackResponse(aiResponseText, totalCost)
      }
    }

    // Validate and ensure required fields exist
    parsedResponse = validateAndFixResponse(parsedResponse, totalCost)

    console.log(`Final processed response from ${modelName}:`, parsedResponse)

    return parsedResponse
  } catch (error) {
    console.error(`Google AI API error with model ${modelName}:`, error)

    if (error.message.includes("API_KEY_INVALID")) {
      throw new Error("Invalid Google AI API key. Please check your configuration.")
    } else if (error.message.includes("PERMISSION_DENIED")) {
      throw new Error("Google AI API access denied. Please check your API key permissions.")
    } else if (error.message.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.")
    } else if (error.message.includes("QUOTA_EXCEEDED")) {
      throw new Error("Google AI API quota exceeded. Please check your billing.")
    } else if (error.message.includes("not found") || error.message.includes("INVALID_ARGUMENT")) {
      throw new Error(`Model ${modelName} not found or not accessible.`)
    } else {
      throw new Error(`Google AI API error: ${error.message}`)
    }
  }
}

// Helper function to create fallback response
function createFallbackResponse(aiResponseText, totalCost) {
  return {
    suggestions: aiResponseText || "AI analysis completed. Please review the recommendations below.",
    technology_recommendations: {
      suggested_additions: [],
      alternatives: [],
    },
    cost_reduction: totalCost * 0.15, // 15% default reduction
    updated_team_structure: JSON.stringify({
      recommendations: [],
      alternative_combinations: [],
    }),
    confidence_score: 0.75,
  }
}

// Helper function to validate and fix response
function validateAndFixResponse(parsedResponse, totalCost) {
  if (!parsedResponse.suggestions) {
    parsedResponse.suggestions = "AI analysis completed. Please review the recommendations below."
  }

  if (!parsedResponse.technology_recommendations) {
    parsedResponse.technology_recommendations = {
      suggested_additions: [],
      alternatives: [],
    }
  }

  if (typeof parsedResponse.cost_reduction !== "number") {
    parsedResponse.cost_reduction = totalCost * 0.1 // Default 10% reduction
  }

  if (!parsedResponse.updated_team_structure) {
    parsedResponse.updated_team_structure = JSON.stringify({
      recommendations: [],
      alternative_combinations: [],
    })
  } else if (typeof parsedResponse.updated_team_structure === "object") {
    parsedResponse.updated_team_structure = JSON.stringify(parsedResponse.updated_team_structure)
  }

  if (typeof parsedResponse.confidence_score !== "number") {
    parsedResponse.confidence_score = 0.8
  }

  // Ensure confidence score is between 0 and 1
  if (parsedResponse.confidence_score > 1) {
    parsedResponse.confidence_score = parsedResponse.confidence_score / 100
  }

  return parsedResponse
}

module.exports = router
