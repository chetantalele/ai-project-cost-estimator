"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import "./AdminDashboard.css"

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE"]
const STATUS_COLORS = {
  healthy: "#27ae60",
  error: "#e74c3c",
  warning: "#f39c12",
  unknown: "#95a5a6",
  not_configured: "#e67e22",
}

const AdminDashboard = ({ user, onLogout }) => {
  const [healthData, setHealthData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchHealthData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/health", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch health data")
      }

      const data = await response.json()
      setHealthData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Health check error:", error)
      setError("Failed to fetch health data")
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Stats error:", error)
      setError("Failed to fetch statistics")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchHealthData(), fetchStats()])
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      case "not_configured":
        return "⚙️"
      default:
        return "❓"
    }
  }

  const getOverallHealth = () => {
    if (!healthData) return "unknown"

    const statuses = [healthData.database.status, healthData.googleAI.status, healthData.server.status]

    if (statuses.includes("error")) return "error"
    if (statuses.includes("warning") || statuses.includes("not_configured")) return "warning"
    if (statuses.every((s) => s === "healthy")) return "healthy"
    return "unknown"
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatMemory = (bytes) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🔐 Admin Dashboard</h1>
          <p>AI Cost Estimator - System Health Monitor</p>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span>👨‍💼 {user.email}</span>
            <button onClick={onLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* Overall System Status */}
      <div className="status-overview">
        <div className={`overall-status ${getOverallHealth()}`}>
          <div className="status-icon">{getStatusIcon(getOverallHealth())}</div>
          <div className="status-info">
            <h2>System Status</h2>
            <p className="status-text">
              {getOverallHealth() === "healthy"
                ? "All Systems Operational"
                : getOverallHealth() === "warning"
                  ? "Some Issues Detected"
                  : getOverallHealth() === "error"
                    ? "Critical Issues Found"
                    : "Status Unknown"}
            </p>
            <small>Last updated: {lastUpdate.toLocaleTimeString()}</small>
          </div>
          <button onClick={fetchHealthData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Health Metrics Grid */}
      {healthData && (
        <div className="health-grid">
          {/* Database Health */}
          <div className={`health-card ${healthData.database.status}`}>
            <div className="health-header">
              <h3>🗄️ Database</h3>
              <span className="status-badge">{getStatusIcon(healthData.database.status)}</span>
            </div>
            <div className="health-metrics">
              <div className="metric">
                <label>Status:</label>
                <span className={`status-text ${healthData.database.status}`}>
                  {healthData.database.status.toUpperCase()}
                </span>
              </div>
              <div className="metric">
                <label>Response Time:</label>
                <span>{healthData.database.responseTime}ms</span>
              </div>
              {healthData.database.error && (
                <div className="metric error">
                  <label>Error:</label>
                  <span>{healthData.database.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Google AI Health */}
          <div className={`health-card ${healthData.googleAI.status}`}>
            <div className="health-header">
              <h3>🤖 Google AI</h3>
              <span className="status-badge">{getStatusIcon(healthData.googleAI.status)}</span>
            </div>
            <div className="health-metrics">
              <div className="metric">
                <label>Status:</label>
                <span className={`status-text ${healthData.googleAI.status}`}>
                  {healthData.googleAI.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="metric">
                <label>Response Time:</label>
                <span>{healthData.googleAI.responseTime}ms</span>
              </div>
              {healthData.googleAI.error && (
                <div className="metric error">
                  <label>Error:</label>
                  <span>{healthData.googleAI.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Server Health */}
          <div className="health-card healthy">
            <div className="health-header">
              <h3>🖥️ Server</h3>
              <span className="status-badge">✅</span>
            </div>
            <div className="health-metrics">
              <div className="metric">
                <label>Status:</label>
                <span className="status-text healthy">HEALTHY</span>
              </div>
              <div className="metric">
                <label>Uptime:</label>
                <span>{formatUptime(healthData.server.uptime)}</span>
              </div>
              <div className="metric">
                <label>Memory Usage:</label>
                <span>
                  {formatMemory(healthData.memory.heapUsed)} / {formatMemory(healthData.memory.heapTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Time Chart */}
      {healthData && (
        <div className="chart-section">
          <h3>📊 API Response Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: "Database",
                  responseTime: healthData.database.responseTime,
                  status: healthData.database.status,
                },
                {
                  name: "Google AI",
                  responseTime: healthData.googleAI.responseTime,
                  status: healthData.googleAI.status,
                },
                { name: "Server", responseTime: 10, status: "healthy" },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [`${value}ms`, "Response Time"]}
                labelFormatter={(label) => `${label} Service`}
              />
              <Bar dataKey="responseTime" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* System Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.users}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.projects}</h3>
              <p>Total Projects</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-info">
              <h3>{stats.aiSuggestions}</h3>
              <p>AI Suggestions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <h3>{formatUptime(stats.serverUptime)}</h3>
              <p>Server Uptime</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Chart */}
      {stats && stats.recentActivity.length > 0 && (
        <div className="chart-section">
          <h3>📈 Recent Project Activity (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#27ae60" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Memory Usage Pie Chart */}
      {healthData && (
        <div className="chart-section">
          <h3>💾 Memory Usage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Used Heap", value: healthData.memory.heapUsed },
                  { name: "Free Heap", value: healthData.memory.heapTotal - healthData.memory.heapUsed },
                  { name: "External", value: healthData.memory.external },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "Used Heap", value: healthData.memory.heapUsed },
                  { name: "Free Heap", value: healthData.memory.heapTotal - healthData.memory.heapUsed },
                  { name: "External", value: healthData.memory.external },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${formatMemory(value)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <footer className="admin-footer">
        <p>🔐 Admin Dashboard - AI Cost Estimator | Last Updated: {lastUpdate.toLocaleString()}</p>
      </footer>
    </div>
  )
}

export default AdminDashboard
