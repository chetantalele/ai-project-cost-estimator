const bcrypt = require("bcrypt")
const { connectDB, getConnection } = require("../database/connection")

const setupAdminUser = async () => {
  try {
    await connectDB()
    const db = getConnection()

    // Admin credentials
    const adminEmail = "chetan.talele@mitaoe.ac.in"
    const adminPassword = "Chetanmanoj@06"

    console.log("Setting up admin user...")

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds)

    // Delete existing admin user if exists
    await db.execute("DELETE FROM users WHERE email = ?", [adminEmail])

    // Insert new admin user
    await db.execute("INSERT INTO users (email, password) VALUES (?, ?)", [adminEmail, hashedPassword])

    console.log("✅ Admin user created successfully")
    console.log("📧 Email:", adminEmail)
    console.log("🔑 Password:", adminPassword)
    console.log("🔐 Password hash:", hashedPassword)

    process.exit(0)
  } catch (error) {
    console.error("❌ Admin setup failed:", error)
    process.exit(1)
  }
}

setupAdminUser()
