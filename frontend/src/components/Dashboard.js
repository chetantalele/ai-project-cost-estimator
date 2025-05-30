"use client"

import { useState, useEffect } from "react"
import { projectAPI } from "../utils/api"
import ProjectForm from "./ProjectForm"
import Visualization from "./Visualization"
import AIReport from "./AIReport"
import "./Dashboard.css"

const Dashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [activeTab, setActiveTab] = useState("form")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error("Failed to load projects:", error)
    }
  }

  const handleProjectCreated = (projectId) => {
    loadProjects()
    loadProject(projectId)
    setActiveTab("visualization")
  }

  const loadProject = async (projectId) => {
    setLoading(true)
    try {
      const response = await projectAPI.getById(projectId)
      setCurrentProject(response.data)
    } catch (error) {
      console.error("Failed to load project:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Project Cost Estimator</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <button className={activeTab === "form" ? "active" : ""} onClick={() => setActiveTab("form")}>
            New Project
          </button>
          <button
            className={activeTab === "visualization" ? "active" : ""}
            onClick={() => setActiveTab("visualization")}
            disabled={!currentProject}
          >
            Visualization
          </button>
          <button
            className={activeTab === "ai" ? "active" : ""}
            onClick={() => setActiveTab("ai")}
            disabled={!currentProject}
          >
            AI Report
          </button>
        </nav>

        <div className="dashboard-main">
          {activeTab === "form" && <ProjectForm onProjectCreated={handleProjectCreated} />}

          {activeTab === "visualization" && currentProject && <Visualization project={currentProject} />}

          {activeTab === "ai" && currentProject && <AIReport project={currentProject} />}
        </div>

        <aside className="dashboard-sidebar">
          <h3>Recent Projects</h3>
          <div className="project-list">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${currentProject?.project.id === project.id ? "active" : ""}`}
                onClick={() => loadProject(project.id)}
              >
                <h4>{project.name}</h4>
                <p>${project.total_cost.toLocaleString()}</p>
                <small>{new Date(project.created_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard
