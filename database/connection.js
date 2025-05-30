const mysql = require("mysql2/promise")

const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "ai_cost_estimator",
}

let connection

const connectDB = async () => {
  try {
    connection = await mysql.createConnection(dbConfig)
    console.log("✅ Connected to MySQL database")
    return connection
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    process.exit(1)
  }
}

const getConnection = () => {
  if (!connection) {
    throw new Error("Database not connected")
  }
  return connection
}

module.exports = { connectDB, getConnection }
