const bcrypt = require("bcrypt")
const mysql = require("mysql2/promise")

const setupAdmin = async () => {
  try {
    // Database configuration
    const dbConfig = {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "root",
      database: "ai_cost_estimator",
    }

    // Connect to database
    const connection = await mysql.createConnection(dbConfig)
    console.log("✅ Connected to database")

    // Hash the password
    const password = "admin123"
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    console.log("🔐 Generated password hash:", hashedPassword)

    // Delete existing admin user if exists
    await connection.execute("DELETE FROM users WHERE email = ?", ["admin@example.com"])

    // Insert new admin user with correct hash
    await connection.execute("INSERT INTO users (email, password) VALUES (?, ?)", ["admin@example.com", hashedPassword])

    console.log("✅ Admin user created successfully")
    console.log("📧 Email: admin@example.com")
    console.log("🔑 Password: admin123")

    await connection.end()
  } catch (error) {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  }
}

setupAdmin()
