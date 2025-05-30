const { connectDB, getConnection } = require("../database/connection")

const fixTechnologyStack = async () => {
  try {
    await connectDB()
    const db = getConnection()

    console.log("Fetching projects with invalid technology stack...")
    const [projects] = await db.execute("SELECT id, technology_stack FROM projects")

    let fixedCount = 0

    for (const project of projects) {
      try {
        if (project.technology_stack === null) continue

        // Try to parse it to see if it's valid JSON
        JSON.parse(project.technology_stack)
      } catch (e) {
        // Not valid JSON, fix it
        console.log(`Fixing project ${project.id} with invalid technology stack: ${project.technology_stack}`)

        // Set to empty object
        await db.execute("UPDATE projects SET technology_stack = ? WHERE id = ?", [JSON.stringify({}), project.id])

        fixedCount++
      }
    }

    console.log(`Fixed ${fixedCount} projects with invalid technology stack`)

    // Fix AI suggestions
    console.log("Fetching AI suggestions with invalid technology recommendations...")
    const [suggestions] = await db.execute("SELECT id, technology_recommendations FROM ai_suggestions")

    let fixedSuggestionsCount = 0

    for (const suggestion of suggestions) {
      try {
        if (suggestion.technology_recommendations === null) continue

        // Try to parse it to see if it's valid JSON
        JSON.parse(suggestion.technology_recommendations)
      } catch (e) {
        // Not valid JSON, fix it
        console.log(
          `Fixing suggestion ${suggestion.id} with invalid technology recommendations: ${suggestion.technology_recommendations}`,
        )

        // Set to empty object
        await db.execute("UPDATE ai_suggestions SET technology_recommendations = ? WHERE id = ?", [
          JSON.stringify({}),
          suggestion.id,
        ])

        fixedSuggestionsCount++
      }
    }

    console.log(`Fixed ${fixedSuggestionsCount} AI suggestions with invalid technology recommendations`)

    console.log("✅ Database fix completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Database fix failed:", error)
    process.exit(1)
  }
}

fixTechnologyStack()
