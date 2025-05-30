"use client"

import { useState } from "react"
import { projectAPI } from "../utils/api"
import "./ProjectForm.css"

const TECHNOLOGY_OPTIONS = {
  frontend: [
    "React",
    "Vue.js",
    "Angular",
    "Next.js",
    "Nuxt.js",
    "Svelte",
    "HTML/CSS/JavaScript",
    "TypeScript",
    "Tailwind CSS",
    "Bootstrap",
  ],
  backend: [
    "Node.js",
    "Python (Django/Flask)",
    "Java (Spring)",
    "C# (.NET)",
    "PHP (Laravel)",
    "Ruby on Rails",
    "Go",
    "Rust",
    "Express.js",
    "FastAPI",
  ],
  database: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Firebase", "Supabase", "DynamoDB"],
  cloud: ["AWS", "Google Cloud", "Azure", "Vercel", "Netlify", "Heroku", "DigitalOcean"],
  mobile: ["React Native", "Flutter", "Swift (iOS)", "Kotlin (Android)", "Ionic", "Xamarin"],
  other: ["Docker", "Kubernetes", "GraphQL", "REST API", "WebSocket", "Microservices", "Serverless"],
}

const ProjectForm = ({ onProjectCreated }) => {
  const [project, setProject] = useState({
    name: "",
    description: "",
    duration: "",
    complexity: "medium",
    additional_costs: "",
    risk_buffer_percentage: 15,
  })

  const [technologyStack, setTechnologyStack] = useState({
    frontend: [],
    backend: [],
    database: [],
    cloud: [],
    mobile: [],
    other: [],
  })

  const [roles, setRoles] = useState([
    {
      role_name: "",
      person_count: 1,
      hourly_rate: "",
      hours_per_week: "",
      weeks: "",
    },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showRiskBufferInfo, setShowRiskBufferInfo] = useState(false)

  const addRole = () => {
    setRoles([
      ...roles,
      {
        role_name: "",
        person_count: 1,
        hourly_rate: "",
        hours_per_week: "",
        weeks: "",
      },
    ])
  }

  const removeRole = (index) => {
    setRoles(roles.filter((_, i) => i !== index))
  }

  const updateRole = (index, field, value) => {
    const updatedRoles = [...roles]
    updatedRoles[index][field] = value
    setRoles(updatedRoles)
  }

  const handleTechnologyChange = (category, technology) => {
    setTechnologyStack((prev) => ({
      ...prev,
      [category]: prev[category].includes(technology)
        ? prev[category].filter((tech) => tech !== technology)
        : [...prev[category], technology],
    }))
  }

  const calculateBaseCost = () => {
    return roles.reduce((total, role) => {
      const cost = (role.hourly_rate || 0) * (role.hours_per_week || 0) * (role.weeks || 0) * (role.person_count || 1)
      return total + cost
    }, 0)
  }

  const calculateSubtotal = () => {
    const baseCost = calculateBaseCost()
    const additionalCosts = Number.parseFloat(project.additional_costs) || 0
    return baseCost + additionalCosts
  }

  const calculateRiskBuffer = () => {
    const subtotal = calculateSubtotal()
    const riskPercentage = Number.parseFloat(project.risk_buffer_percentage) || 0
    return (subtotal * riskPercentage) / 100
  }

  const calculateTotalCost = () => {
    return calculateSubtotal() + calculateRiskBuffer()
  }

  const calculateTotalPeople = () => {
    return roles.reduce((total, role) => {
      return total + (Number.parseInt(role.person_count) || 0)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const validRoles = roles.filter(
        (role) => role.role_name && role.person_count && role.hourly_rate && role.hours_per_week && role.weeks,
      )

      if (validRoles.length === 0) {
        throw new Error("Please add at least one complete role")
      }

      const projectData = {
        ...project,
        duration: Number.parseInt(project.duration),
        additional_costs: Number.parseFloat(project.additional_costs) || 0,
        risk_buffer_percentage: Number.parseFloat(project.risk_buffer_percentage) || 15,
        technology_stack: technologyStack,
        roles: validRoles.map((role) => ({
          ...role,
          person_count: Number.parseInt(role.person_count),
          hourly_rate: Number.parseFloat(role.hourly_rate),
          hours_per_week: Number.parseInt(role.hours_per_week),
          weeks: Number.parseInt(role.weeks),
        })),
      }

      const response = await projectAPI.create(projectData)
      onProjectCreated(response.data.id)

      // Reset form
      setProject({
        name: "",
        description: "",
        duration: "",
        complexity: "medium",
        additional_costs: "",
        risk_buffer_percentage: 15,
      })
      setTechnologyStack({
        frontend: [],
        backend: [],
        database: [],
        cloud: [],
        mobile: [],
        other: [],
      })
      setRoles([{ role_name: "", person_count: 1, hourly_rate: "", hours_per_week: "", weeks: "" }])
    } catch (error) {
      setError(error.response?.data?.error || error.message || "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="project-form">
      <h2>Create New Project</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Project Details</h3>

          <div className="form-group">
            <label>Project Name:</label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (months):</label>
              <input
                type="number"
                value={project.duration}
                onChange={(e) => setProject({ ...project, duration: e.target.value })}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Complexity:</label>
              <select
                value={project.complexity}
                onChange={(e) => setProject({ ...project, complexity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Technology Stack</h3>
          <p className="section-description">
            Select the technologies you plan to use. This helps AI provide better team structure and cost optimization
            recommendations.
          </p>

          {Object.entries(TECHNOLOGY_OPTIONS).map(([category, technologies]) => (
            <div key={category} className="tech-category">
              <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <div className="tech-options">
                {technologies.map((tech) => (
                  <label key={tech} className="tech-option">
                    <input
                      type="checkbox"
                      checked={technologyStack[category].includes(tech)}
                      onChange={() => handleTechnologyChange(category, tech)}
                    />
                    <span className="tech-label">{tech}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="selected-technologies">
            <h4>Selected Technologies:</h4>
            <div className="tech-tags">
              {Object.entries(technologyStack).map(([category, techs]) =>
                techs.map((tech) => (
                  <span key={`${category}-${tech}`} className="tech-tag">
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleTechnologyChange(category, tech)}
                      className="remove-tech"
                    >
                      ×
                    </button>
                  </span>
                )),
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Team Roles</h3>

          {roles.map((role, index) => (
            <div key={index} className="role-card">
              <div className="role-header">
                <h4>Role {index + 1}</h4>
                {roles.length > 1 && (
                  <button type="button" onClick={() => removeRole(index)} className="remove-btn">
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Role Name:</label>
                <input
                  type="text"
                  value={role.role_name}
                  onChange={(e) => updateRole(index, "role_name", e.target.value)}
                  placeholder="e.g., Frontend Developer"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Number of People:</label>
                  <input
                    type="number"
                    value={role.person_count}
                    onChange={(e) => updateRole(index, "person_count", e.target.value)}
                    min="1"
                    max="20"
                  />
                </div>

                <div className="form-group">
                  <label>Hourly Rate ($):</label>
                  <input
                    type="number"
                    value={role.hourly_rate}
                    onChange={(e) => updateRole(index, "hourly_rate", e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Hours/Week (per person):</label>
                  <input
                    type="number"
                    value={role.hours_per_week}
                    onChange={(e) => updateRole(index, "hours_per_week", e.target.value)}
                    min="1"
                    max="168"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (weeks):</label>
                  <input
                    type="number"
                    value={role.weeks}
                    onChange={(e) => updateRole(index, "weeks", e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              {role.hourly_rate && role.hours_per_week && role.weeks && role.person_count && (
                <div className="role-cost">
                  <div className="cost-breakdown">
                    <span>
                      Cost per person: ${(role.hourly_rate * role.hours_per_week * role.weeks).toLocaleString()}
                    </span>
                    <span>
                      Total for {role.person_count} {role.person_count === 1 ? "person" : "people"}: $
                      {(role.hourly_rate * role.hours_per_week * role.weeks * role.person_count).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={addRole} className="add-role-btn">
            Add Another Role
          </button>
        </div>

        <div className="form-section">
          <h3>Additional Costs & Risk Management</h3>

          <div className="form-group">
            <label>Additional Costs ($):</label>
            <input
              type="number"
              value={project.additional_costs}
              onChange={(e) => setProject({ ...project, additional_costs: e.target.value })}
              min="0"
              step="0.01"
              placeholder="e.g., Software licenses, hardware, infrastructure"
            />
            <small className="form-help">
              Include costs for software licenses, hardware, infrastructure, training, etc.
            </small>
          </div>

          <div className="form-group">
            <label>
              Risk Buffer (%):
              <button
                type="button"
                className="info-btn"
                onClick={() => setShowRiskBufferInfo(!showRiskBufferInfo)}
                title="Click for more information"
              >
                ℹ️
              </button>
            </label>
            <input
              type="number"
              value={project.risk_buffer_percentage}
              onChange={(e) => setProject({ ...project, risk_buffer_percentage: e.target.value })}
              min="0"
              max="100"
              step="0.1"
            />
            <small className="form-help">Recommended: 15% for typical projects</small>

            {showRiskBufferInfo && (
              <div className="info-box">
                <h4>Why Risk Buffer?</h4>
                <ul>
                  <li>
                    <strong>Scope Creep:</strong> Requirements often expand during development
                  </li>
                  <li>
                    <strong>Technical Challenges:</strong> Unexpected technical difficulties may arise
                  </li>
                  <li>
                    <strong>Resource Availability:</strong> Team members may become unavailable
                  </li>
                  <li>
                    <strong>Integration Issues:</strong> Third-party services or APIs may cause delays
                  </li>
                  <li>
                    <strong>Quality Assurance:</strong> Additional testing and bug fixes
                  </li>
                </ul>
                <p>
                  <strong>Recommended percentages:</strong>
                </p>
                <ul>
                  <li>Low complexity: 10-15%</li>
                  <li>Medium complexity: 15-25%</li>
                  <li>High complexity: 25-40%</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="form-summary">
          <div className="cost-breakdown-summary">
            <h3>Cost Breakdown</h3>
            <div className="cost-line">
              <span>Base Cost (Team):</span>
              <span>${calculateBaseCost().toLocaleString()}</span>
            </div>
            <div className="cost-line">
              <span>Additional Costs:</span>
              <span>${(Number.parseFloat(project.additional_costs) || 0).toLocaleString()}</span>
            </div>
            <div className="cost-line subtotal">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="cost-line">
              <span>Risk Buffer ({project.risk_buffer_percentage}%):</span>
              <span>${calculateRiskBuffer().toLocaleString()}</span>
            </div>
            <div className="cost-line total">
              <span>Total Project Cost:</span>
              <span>${calculateTotalCost().toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-stats">
            <div className="stat-item">
              <label>Total Team Size:</label>
              <span>{calculateTotalPeople()} people</span>
            </div>
            <div className="stat-item">
              <label>Cost per Month:</label>
              <span>
                ${project.duration ? (calculateTotalCost() / Number.parseInt(project.duration)).toLocaleString() : "0"}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Creating Project..." : "Create Project"}
        </button>
      </form>
    </div>
  )
}

export default ProjectForm
