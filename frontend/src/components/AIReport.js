"use client"

import { useState } from "react"
import { aiAPI } from "../utils/api"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import "./AIReport.css"

const AIReport = ({ project }) => {
  const [aiSuggestion, setAiSuggestion] = useState(project.aiSuggestion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const totalPeople = project.roles.reduce((sum, role) => sum + role.person_count, 0)

  // Check if technology stack exists and has data
  const hasTechnologyStack =
    project.project.technology_stack &&
    typeof project.project.technology_stack === "object" &&
    Object.values(project.project.technology_stack).some((arr) => Array.isArray(arr) && arr.length > 0)

  const generateAISuggestions = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("Requesting AI suggestions for project:", project.project.id)
      const response = await aiAPI.getSuggestions(project.project.id)
      console.log("Received AI suggestions:", response.data)
      setAiSuggestion(response.data)
    } catch (error) {
      console.error("AI API error:", error)

      let errorMessage = "Failed to generate AI suggestions"

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      // Handle specific error types
      if (errorMessage.includes("API key")) {
        errorMessage = "🔑 Google AI API is not properly configured. Please contact the administrator."
      } else if (errorMessage.includes("quota")) {
        errorMessage = "💳 Google AI API quota exceeded. Please try again later."
      } else if (errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "🚫 Google AI API access denied. Please check API key permissions."
      } else if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "⏱️ Too many requests. Please wait a moment and try again."
      } else if (errorMessage.includes("model")) {
        errorMessage = "🤖 AI model is not available. The system will try alternative models automatically."
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const generateDetailedPDFReport = async () => {
    try {
      // Show loading state
      const reportButton = document.querySelector(".report-btn")
      if (reportButton) {
        reportButton.textContent = "Generating PDF Report..."
        reportButton.disabled = true
      }

      const parseTeamStructure = (structureString) => {
        try {
          const structure = JSON.parse(structureString)
          return structure.recommendations || []
        } catch (e) {
          return []
        }
      }

      const aiRecommendations = aiSuggestion ? parseTeamStructure(aiSuggestion.updated_team_structure) : []
      const currentDate = new Date().toLocaleString()

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement("div")
      pdfContainer.style.position = "absolute"
      pdfContainer.style.left = "-9999px"
      pdfContainer.style.top = "0"
      pdfContainer.style.width = "210mm" // A4 width
      pdfContainer.style.backgroundColor = "white"
      pdfContainer.style.padding = "20px"
      pdfContainer.style.fontFamily = "Arial, sans-serif"

      // Generate comprehensive PDF content
      pdfContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
            <h1 style="color: #667eea; margin: 0; font-size: 28px;">🤖 Comprehensive AI Project Analysis Report</h1>
            <p style="margin: 10px 0; font-size: 18px; color: #666;">Project: ${project.project.name}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #999;">Generated on: ${currentDate}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #999;">Powered by Google AI Studio (Gemini)</p>
          </div>

          <!-- Executive Summary -->
          <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📊 Executive Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
              <div>
                <h3 style="margin: 0 0 10px 0; color: #667eea;">Project Overview</h3>
                <p><strong>Duration:</strong> ${project.project.duration} months</p>
                <p><strong>Complexity:</strong> ${project.project.complexity.toUpperCase()}</p>
                <p><strong>Current Total Cost:</strong> $${project.project.total_cost.toLocaleString()}</p>
                <p><strong>Team Size:</strong> ${totalPeople} people (${project.roles.length} roles)</p>
                <p><strong>Description:</strong> ${project.project.description || "No description provided"}</p>
              </div>
              ${
                aiSuggestion
                  ? `
              <div>
                <h3 style="margin: 0 0 10px 0; color: #27ae60;">AI Analysis Results</h3>
                <p><strong>Potential Savings:</strong> $${aiSuggestion.cost_reduction.toLocaleString()}</p>
                <p><strong>Percentage Reduction:</strong> ${((aiSuggestion.cost_reduction / project.project.total_cost) * 100).toFixed(1)}%</p>
                <p><strong>Optimized Cost:</strong> $${(project.project.total_cost - aiSuggestion.cost_reduction).toLocaleString()}</p>
                <p><strong>Confidence Score:</strong> ${(aiSuggestion.confidence_score * 100).toFixed(0)}%</p>
                <p><strong>Analysis Date:</strong> ${new Date(aiSuggestion.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
              `
                  : `
              <div>
                <h3 style="margin: 0 0 10px 0; color: #f39c12;">AI Analysis Status</h3>
                <p style="color: #e74c3c;"><strong>Status:</strong> Not yet generated</p>
                <p>Click "Get AI Suggestions" to generate comprehensive AI analysis including:</p>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                  <li>Cost optimization recommendations</li>
                  <li>Team structure improvements</li>
                  <li>Technology stack suggestions</li>
                  <li>Risk assessment and confidence scoring</li>
                </ul>
              </div>
              `
              }
            </div>
          </div>

          <!-- Current Team Structure -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">👥 Current Team Structure Analysis</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Role</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">People</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Hourly Rate</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Hours/Week</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Duration</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total Hours</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${project.roles
                  .map(
                    (role) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;">${role.role_name}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${role.person_count}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${role.hourly_rate}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${role.hours_per_week}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${role.weeks} weeks</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${(role.hours_per_week * role.weeks * role.person_count).toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; color: #27ae60;">$${role.cost.toLocaleString()}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr style="background: #e8f5e8; font-weight: bold;">
                  <td style="border: 1px solid #ddd; padding: 12px;">TOTAL</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${totalPeople}</td>
                  <td style="border: 1px solid #ddd; padding: 12px;" colspan="4"></td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #27ae60;">$${project.project.total_cost.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Cost Breakdown -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💰 Detailed Cost Breakdown</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div>
                  <p><strong>Base Team Cost:</strong> $${project.project.base_cost.toLocaleString()}</p>
                  <p><strong>Additional Costs:</strong> $${(project.project.additional_costs || 0).toLocaleString()}</p>
                  <p><strong>Risk Buffer (${project.project.risk_buffer_percentage || 0}%):</strong> $${(project.project.risk_buffer_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p style="font-size: 18px; color: #27ae60;"><strong>Total Project Cost: $${project.project.total_cost.toLocaleString()}</strong></p>
                  <p><strong>Cost per Person:</strong> $${Math.round(project.project.total_cost / totalPeople).toLocaleString()}</p>
                  <p><strong>Cost per Month:</strong> $${Math.round(project.project.total_cost / project.project.duration).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          ${
            hasTechnologyStack
              ? `
          <!-- Technology Stack -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🛠️ Technology Stack Analysis</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${Object.entries(project.project.technology_stack)
                .filter(([_, technologies]) => Array.isArray(technologies) && technologies.length > 0)
                .map(
                  ([category, technologies]) => `
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <h3 style="margin: 0 0 10px 0; color: #667eea; text-transform: capitalize;">${category}</h3>
                    <p style="margin: 0; line-height: 1.8;">${technologies.join(", ")}</p>
                    <small style="color: #666;">${technologies.length} technologies</small>
                  </div>
                `,
                )
                .join("")}
            </div>
            <div style="margin-top: 20px; text-align: center; background: #f0f4ff; padding: 15px; border-radius: 8px;">
              <p><strong>Total Technologies:</strong> ${
                Object.values(project.project.technology_stack)
                  .filter((arr) => Array.isArray(arr))
                  .flat().length
              }</p>
              <p><strong>Categories Used:</strong> ${Object.values(project.project.technology_stack).filter((arr) => Array.isArray(arr) && arr.length > 0).length}</p>
              <p><strong>Stack Complexity:</strong> ${
                Object.values(project.project.technology_stack)
                  .filter((arr) => Array.isArray(arr))
                  .flat().length > 8
                  ? "High"
                  : Object.values(project.project.technology_stack)
                        .filter((arr) => Array.isArray(arr))
                        .flat().length > 4
                    ? "Medium"
                    : "Low"
              }</p>
            </div>
          </div>
          `
              : ""
          }

          ${
            aiSuggestion
              ? `
          <!-- AI Recommendations -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🤖 AI Recommendations & Analysis</h2>
            <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #667eea;">Key Optimization Suggestions</h3>
              <div style="white-space: pre-line; line-height: 1.8;">${aiSuggestion.suggestions}</div>
            </div>

            <!-- Technology Recommendations -->
            ${
              aiSuggestion.technology_recommendations?.suggested_additions?.length > 0 ||
              aiSuggestion.technology_recommendations?.alternatives?.length > 0
                ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333;">🚀 Technology Recommendations</h3>
              ${
                aiSuggestion.technology_recommendations.suggested_additions?.length > 0
                  ? `
              <div style="margin-bottom: 15px;">
                <h4 style="color: #27ae60;">Suggested Technology Additions:</h4>
                ${aiSuggestion.technology_recommendations.suggested_additions
                  .map(
                    (suggestion) => `
                  <div style="background: #f0fff4; padding: 10px; margin: 5px 0; border-left: 4px solid #27ae60; border-radius: 4px;">
                    <strong>${suggestion.technology}</strong> (${suggestion.impact} Impact)
                    <p style="margin: 5px 0 0 0; font-size: 14px;">${suggestion.reason}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              `
                  : ""
              }
              ${
                aiSuggestion.technology_recommendations.alternatives?.length > 0
                  ? `
              <div style="margin-bottom: 15px;">
                <h4 style="color: #f39c12;">Alternative Technology Suggestions:</h4>
                ${aiSuggestion.technology_recommendations.alternatives
                  .map(
                    (alternative) => `
                  <div style="background: #fffbf0; padding: 10px; margin: 5px 0; border-left: 4px solid #f39c12; border-radius: 4px;">
                    <strong>Replace ${alternative.from} with ${alternative.to}</strong> (${alternative.cost_impact} cost impact)
                    <p style="margin: 5px 0 0 0; font-size: 14px;">${alternative.reason}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              `
                  : ""
              }
            </div>
            `
                : ""
            }

            <!-- Comparative Analysis -->
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333;">📊 Comparative Analysis</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Metric</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Current</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">AI Recommended</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Difference</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;"><strong>Total Cost</strong></td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${project.project.total_cost.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${(project.project.total_cost - aiSuggestion.cost_reduction).toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #27ae60; font-weight: bold;">-$${aiSuggestion.cost_reduction.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #27ae60;">${((aiSuggestion.cost_reduction / project.project.total_cost) * 100).toFixed(1)}% savings</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;"><strong>Team Size</strong></td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${totalPeople} people</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${aiRecommendations.reduce((sum, role) => sum + (role.person_count || 0), 0)} people</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${aiRecommendations.reduce((sum, role) => sum + (role.person_count || 0), 0) - totalPeople >= 0 ? "+" : ""}${aiRecommendations.reduce((sum, role) => sum + (role.person_count || 0), 0) - totalPeople} people</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${aiRecommendations.reduce((sum, role) => sum + (role.person_count || 0), 0) < totalPeople ? "More efficient" : aiRecommendations.reduce((sum, role) => sum + (role.person_count || 0), 0) > totalPeople ? "Enhanced capacity" : "Optimized"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${
              aiRecommendations.length > 0
                ? `
            <!-- Recommended Team Structure -->
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333;">👥 AI Recommended Team Structure</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #e8f5e8;">
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Role</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">People</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Hours/Week</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Duration</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  ${aiRecommendations
                    .map(
                      (role) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 12px;">${role.role}</td>
                      <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${role.person_count}</td>
                      <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${role.hours || "N/A"}</td>
                      <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${role.weeks || "N/A"} weeks</td>
                      <td style="border: 1px solid #ddd; padding: 12px; font-size: 12px;">${role.reasoning || "Standard optimization"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            <!-- Confidence Score -->
            <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin-top: 0; color: #667eea;">🎯 AI Confidence Score</h3>
              <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin: 15px 0; position: relative;">
                <div style="background: linear-gradient(90deg, #27ae60, #2ecc71); height: 100%; width: ${aiSuggestion.confidence_score * 100}%; border-radius: 10px;"></div>
              </div>
              <p style="font-size: 18px; font-weight: bold; margin: 0;">${(aiSuggestion.confidence_score * 100).toFixed(0)}% confidence in recommendations</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                ${
                  aiSuggestion.confidence_score > 0.8
                    ? "High confidence - Proceed with implementation"
                    : aiSuggestion.confidence_score > 0.6
                      ? "Medium confidence - Review with team before implementation"
                      : "Lower confidence - Consider as preliminary suggestions"
                }
              </p>
            </div>
          </div>
          `
              : ""
          }

          <!-- Implementation Roadmap -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🎯 Implementation Roadmap</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #667eea;">Immediate Actions (Week 1-2)</h3>
              <ol style="line-height: 1.8;">
                <li><strong>Review AI Suggestions:</strong> Analyze the provided recommendations with your project team</li>
                <li><strong>Validate Assumptions:</strong> Ensure AI recommendations align with project requirements and constraints</li>
                <li><strong>Stakeholder Alignment:</strong> Present findings to key stakeholders and decision makers</li>
                <li><strong>Risk Assessment:</strong> Evaluate potential risks of implementing suggested changes</li>
              </ol>
              
              <h3 style="color: #667eea;">Short-term Planning (Week 3-8)</h3>
              <ol style="line-height: 1.8;">
                <li><strong>Pilot Implementation:</strong> Start with low-risk, high-impact suggestions</li>
                <li><strong>Team Restructuring:</strong> Begin implementing recommended team size and role optimizations</li>
                <li><strong>Technology Evaluation:</strong> Assess and test suggested technology alternatives</li>
                <li><strong>Process Improvements:</strong> Adopt recommended workflow optimizations</li>
              </ol>

              <h3 style="color: #667eea;">Long-term Strategy (Month 3+)</h3>
              <ol style="line-height: 1.8;">
                <li><strong>Full Implementation:</strong> Roll out all approved recommendations</li>
                <li><strong>Continuous Monitoring:</strong> Track actual vs. predicted cost savings and performance</li>
                <li><strong>Iterative Optimization:</strong> Regularly reassess and optimize based on project progress</li>
                <li><strong>Knowledge Transfer:</strong> Document lessons learned for future projects</li>
              </ol>
            </div>
          </div>

          <!-- Risk Assessment -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">⚠️ Risk Assessment & Mitigation</h2>
            <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
              <h3 style="margin-top: 0; color: #e74c3c;">Potential Risks</h3>
              <ul style="line-height: 1.8;">
                <li><strong>Team Transition:</strong> Changing team structure may temporarily reduce productivity</li>
                <li><strong>Technology Migration:</strong> Switching technologies may introduce learning curves</li>
                <li><strong>Scope Creep:</strong> Cost savings may be offset by expanding requirements</li>
                <li><strong>Timeline Impact:</strong> Implementation changes may affect project deadlines</li>
              </ul>
              
              <h3 style="color: #e74c3c;">Mitigation Strategies</h3>
              <ul style="line-height: 1.8;">
                <li><strong>Gradual Implementation:</strong> Phase changes over time to minimize disruption</li>
                <li><strong>Training Programs:</strong> Invest in team training for new technologies and processes</li>
                <li><strong>Buffer Planning:</strong> Maintain contingency time and budget for transitions</li>
                <li><strong>Regular Reviews:</strong> Conduct weekly progress reviews during implementation</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666;">
            <p style="margin: 5px 0;"><strong>Report Generated By:</strong> AI Project Cost Estimator</p>
            <p style="margin: 5px 0;"><strong>AI Provider:</strong> Google AI Studio (Gemini)</p>
            <p style="margin: 5px 0;"><strong>Report Type:</strong> Comprehensive Analysis Report</p>
            <p style="margin: 5px 0;"><strong>Export Date:</strong> ${currentDate}</p>
            <p style="margin: 15px 0 5px 0; font-style: italic; font-size: 12px;">
              This report was generated using AI analysis and should be reviewed by project stakeholders before implementation.
              All recommendations are suggestions based on data patterns and industry best practices.
            </p>
          </div>
        </div>
      `

      document.body.appendChild(pdfContainer)

      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Capture the content as canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: pdfContainer.scrollWidth,
        height: pdfContainer.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = pageWidth - 20 // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10 // 10mm top margin

      // Add first page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20 // Account for margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - 20
      }

      // Clean up
      document.body.removeChild(pdfContainer)

      // Save the PDF
      pdf.save(`${project.project.name}_Comprehensive_AI_Analysis_Report.pdf`)

      // Reset button
      if (reportButton) {
        reportButton.textContent = "📄 Generate Detailed Report"
        reportButton.disabled = false
      }
    } catch (error) {
      console.error("Error generating PDF report:", error)
      alert("Error generating PDF report. Please try again.")

      // Reset button on error
      const reportButton = document.querySelector(".report-btn")
      if (reportButton) {
        reportButton.textContent = "📄 Generate Detailed Report"
        reportButton.disabled = false
      }
    }
  }

  const formatSuggestions = (suggestions) => {
    return suggestions.split("\n").map((line, index) => {
      if (line.trim().startsWith("**") && line.trim().endsWith("**")) {
        return <h4 key={index}>{line.replace(/\*\*/g, "")}</h4>
      }
      if (
        line.trim().startsWith("1.") ||
        line.trim().startsWith("2.") ||
        line.trim().startsWith("3.") ||
        line.trim().startsWith("4.") ||
        line.trim().startsWith("5.") ||
        line.trim().startsWith("6.")
      ) {
        return (
          <div key={index} className="suggestion-item">
            {line}
          </div>
        )
      }
      if (line.trim()) {
        return <p key={index}>{line}</p>
      }
      return <br key={index} />
    })
  }

  const parseTeamStructure = (structureString) => {
    try {
      const structure = JSON.parse(structureString)
      return structure.recommendations || []
    } catch (e) {
      console.error("Error parsing team structure:", e)
      return []
    }
  }

  const calculateRecommendedTeamSize = () => {
    if (!aiSuggestion?.updated_team_structure) return 0
    const recommendations = parseTeamStructure(aiSuggestion.updated_team_structure)
    return recommendations.reduce((sum, role) => sum + (role.person_count || 0), 0)
  }

  return (
    <div className="ai-report">
      <div className="ai-report-header">
        <h2>AI-Powered Project Analysis</h2>
        <div className="ai-report-actions">
          <button onClick={generateAISuggestions} disabled={loading} className="generate-btn">
            {loading ? "Analyzing with AI..." : "Get AI Suggestions"}
          </button>
          {aiSuggestion && (
            <button onClick={generateDetailedPDFReport} className="report-btn">
              📄 Generate Detailed PDF Report
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🤖 AI is analyzing your project data...</p>
          <p>Using Google AI Studio with Gemini models (FREE!)</p>
          <p>This may take 10-30 seconds as we process your team structure, technology stack, and costs.</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <h3>❌ AI Analysis Failed</h3>
          <p>{error}</p>
          <div className="error-help">
            <h4>💡 Troubleshooting Tips:</h4>
            <ul>
              <li>
                Get your free Google AI Studio API key at:{" "}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  makersuite.google.com
                </a>
              </li>
              <li>Make sure your Google AI API key is valid and active</li>
              <li>Check if you have access to Gemini models (free tier available)</li>
              <li>Wait a moment if you're hitting rate limits</li>
              <li>Try again - the system will automatically try different AI models</li>
            </ul>
          </div>
          <button onClick={generateAISuggestions} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {aiSuggestion && !loading && (
        <div className="ai-content">
          <div className="ai-powered-badge">
            <span>🤖 Powered by Google AI Studio</span>
            <span>Real-time analysis using Gemini 1.5 Flash, Gemini 1.5 Pro, or Gemini Pro (FREE!)</span>
          </div>

          <div className="current-project">
            <h3>Current Project Analysis</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <label>Project Name:</label>
                <span>{project.project.name}</span>
              </div>
              <div className="analysis-item">
                <label>Current Total Cost:</label>
                <span className="current-cost">${project.project.total_cost.toLocaleString()}</span>
              </div>
              <div className="analysis-item">
                <label>Team Size:</label>
                <span>{totalPeople} people</span>
              </div>
              <div className="analysis-item">
                <label>Complexity Level:</label>
                <span className={`complexity ${project.project.complexity}`}>
                  {project.project.complexity.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="current-team-breakdown">
              <h4>Current Team Structure:</h4>
              <div className="team-roles">
                {project.roles.map((role, index) => (
                  <div key={index} className="current-role">
                    <span className="role-name">{role.role_name}</span>
                    <span className="role-count">
                      {role.person_count} {role.person_count === 1 ? "person" : "people"}
                    </span>
                    <span className="role-cost">${role.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technology Stack Analysis */}
          {hasTechnologyStack && (
            <div className="technology-analysis">
              <h3>Current Technology Stack Analysis</h3>

              <div className="current-tech-overview">
                <div className="tech-categories-grid">
                  {Object.entries(project.project.technology_stack).map(
                    ([category, technologies]) =>
                      Array.isArray(technologies) &&
                      technologies.length > 0 && (
                        <div key={category} className="tech-category-card">
                          <h5 className={`tech-category-title ${category}`}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h5>
                          <div className="tech-items">
                            {technologies.map((tech, index) => (
                              <span key={index} className="current-tech-tag">
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="tech-count">{technologies.length} technologies</div>
                        </div>
                      ),
                  )}
                </div>

                <div className="tech-complexity-analysis">
                  <div className="complexity-indicator">
                    <label>Stack Complexity:</label>
                    <span
                      className={`complexity-level ${
                        Object.values(project.project.technology_stack)
                          .filter((arr) => Array.isArray(arr))
                          .flat().length > 8
                          ? "high"
                          : Object.values(project.project.technology_stack)
                                .filter((arr) => Array.isArray(arr))
                                .flat().length > 4
                            ? "medium"
                            : "low"
                      }`}
                    >
                      {Object.values(project.project.technology_stack)
                        .filter((arr) => Array.isArray(arr))
                        .flat().length > 8
                        ? "High"
                        : Object.values(project.project.technology_stack)
                              .filter((arr) => Array.isArray(arr))
                              .flat().length > 4
                          ? "Medium"
                          : "Low"}
                    </span>
                  </div>
                  <div className="total-tech-count">
                    <label>Total Technologies:</label>
                    <span>
                      {
                        Object.values(project.project.technology_stack)
                          .filter((arr) => Array.isArray(arr))
                          .flat().length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="ai-suggestions">
            <h3>🤖 AI Optimization Suggestions</h3>
            <div className="suggestions-content">{formatSuggestions(aiSuggestion.suggestions)}</div>
          </div>

          {/* Technology Recommendations */}
          {aiSuggestion?.technology_recommendations && (
            <div className="technology-recommendations">
              <h3>🚀 AI Technology Recommendations</h3>

              {/* Suggested Additions */}
              {aiSuggestion.technology_recommendations.suggested_additions?.length > 0 && (
                <div className="tech-recommendation-section">
                  <h4>🚀 Suggested Technology Additions</h4>
                  <div className="tech-suggestions-grid">
                    {aiSuggestion.technology_recommendations.suggested_additions.map((suggestion, index) => (
                      <div key={index} className="tech-suggestion-card addition">
                        <div className="tech-suggestion-header">
                          <span className="tech-name">{suggestion.technology}</span>
                          <span className={`impact-badge ${suggestion.impact.toLowerCase()}`}>
                            {suggestion.impact} Impact
                          </span>
                        </div>
                        <p className="tech-reason">{suggestion.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Technologies */}
              {aiSuggestion.technology_recommendations.alternatives?.length > 0 && (
                <div className="tech-recommendation-section">
                  <h4>🔄 Alternative Technology Suggestions</h4>
                  <div className="tech-alternatives-grid">
                    {aiSuggestion.technology_recommendations.alternatives.map((alternative, index) => (
                      <div key={index} className="tech-alternative-card">
                        <div className="alternative-flow">
                          <span className="from-tech">{alternative.from}</span>
                          <span className="arrow">→</span>
                          <span className="to-tech">{alternative.to}</span>
                          <span
                            className={`cost-impact ${alternative.cost_impact.startsWith("-") ? "positive" : "negative"}`}
                          >
                            {alternative.cost_impact}
                          </span>
                        </div>
                        <p className="alternative-reason">{alternative.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technology-Team Mapping */}
              {aiSuggestion.updated_team_structure && (
                <div className="tech-recommendation-section">
                  <h4>👥 Technology-Team Mapping</h4>
                  <div className="tech-team-mapping">
                    {parseTeamStructure(aiSuggestion.updated_team_structure).map(
                      (role, index) =>
                        role.technologies &&
                        role.technologies.length > 0 && (
                          <div key={index} className="tech-team-card">
                            <div className="team-role-header">
                              <h5>{role.role}</h5>
                              <span className="person-count-badge">
                                {role.person_count} {role.person_count === 1 ? "person" : "people"}
                              </span>
                            </div>
                            <div className="role-technologies">
                              <label>Required Technologies:</label>
                              <div className="role-tech-tags">
                                {role.technologies.map((tech, techIndex) => (
                                  <span key={techIndex} className="role-tech-tag">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="cost-analysis">
            <h3>💰 Cost & Team Impact Analysis</h3>
            <div className="comparison-grid">
              <div className="comparison-section">
                <h4>Cost Comparison</h4>
                <div className="cost-comparison">
                  <div className="cost-item current">
                    <h5>Current Cost</h5>
                    <div className="cost-value">${project.project.total_cost.toLocaleString()}</div>
                  </div>
                  <div className="cost-arrow">→</div>
                  <div className="cost-item optimized">
                    <h5>AI Optimized Cost</h5>
                    <div className="cost-value">
                      ${(project.project.total_cost - aiSuggestion.cost_reduction).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="cost-savings">
                  <h5>Potential Savings</h5>
                  <div className="savings-value">
                    ${aiSuggestion.cost_reduction.toLocaleString()}
                    <span className="savings-percent">
                      ({((aiSuggestion.cost_reduction / project.project.total_cost) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="comparison-section">
                <h4>Team Size Comparison</h4>
                <div className="team-comparison">
                  <div className="team-item current">
                    <h5>Current Team</h5>
                    <div className="team-value">{totalPeople} people</div>
                  </div>
                  <div className="team-arrow">→</div>
                  <div className="team-item optimized">
                    <h5>AI Recommended Team</h5>
                    <div className="team-value">{calculateRecommendedTeamSize()} people</div>
                  </div>
                </div>
                <div className="team-savings">
                  <h5>Team Size Change</h5>
                  <div className="change-value">
                    {calculateRecommendedTeamSize() - totalPeople > 0 ? "+" : ""}
                    {calculateRecommendedTeamSize() - totalPeople} people
                  </div>
                </div>
              </div>
            </div>
          </div>

          {aiSuggestion.updated_team_structure && (
            <div className="team-recommendations">
              <h3>👥 AI Recommended Team Structure</h3>
              <div className="team-structure">
                {parseTeamStructure(aiSuggestion.updated_team_structure).map((role, index) => (
                  <div key={index} className="recommended-role">
                    <div className="role-header">
                      <h4>{role.role}</h4>
                      <span className="person-count">
                        {role.person_count} {role.person_count === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <div className="role-details">
                      <span>Hours: {role.hours}/week per person</span>
                      <span>Duration: {role.weeks} weeks</span>
                    </div>
                    {role.reasoning && (
                      <div className="role-reasoning">
                        <em>{role.reasoning}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="confidence-score">
            <h3>🎯 AI Confidence Score</h3>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${aiSuggestion.confidence_score * 100}%` }}></div>
            </div>
            <p>{(aiSuggestion.confidence_score * 100).toFixed(0)}% confidence in recommendations</p>
          </div>

          <div className="report-footer">
            <p className="disclaimer">
              <strong>🤖 AI-Generated Analysis:</strong> These suggestions are generated by Google AI Studio's Gemini
              models based on your actual project data including team structure, technology stack, costs, and
              complexity. Please review and validate recommendations with your team before implementation.
            </p>
            <p className="generated-time">
              Report generated on: {new Date(aiSuggestion.created_at || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {!aiSuggestion && !loading && !error && (
        <div className="no-suggestions">
          <h3>🤖 AI Analysis Available</h3>
          <p>Click "Get AI Suggestions" to get real-time AI-powered optimization recommendations for this project.</p>
          <p>
            Our AI will analyze your team structure, technology stack, costs, and complexity to provide personalized
            suggestions.
          </p>
          <div className="model-info">
            <h4>🆓 Free Google AI Studio Models:</h4>
            <ul>
              <li>
                <strong>Gemini 1.5 Flash:</strong> Latest and fastest model (FREE!)
              </li>
              <li>
                <strong>Gemini 1.5 Pro:</strong> Most capable model (FREE!)
              </li>
              <li>
                <strong>Gemini Pro:</strong> Standard model (FREE!)
              </li>
            </ul>
            <p>
              <em>Get your free API key at: </em>
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                makersuite.google.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIReport
