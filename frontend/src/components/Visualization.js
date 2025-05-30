"use client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import "./Visualization.css"

const COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe"]
const COMPARISON_COLORS = {
  current: "#e74c3c",
  recommended: "#27ae60",
  savings: "#f39c12",
}

const Visualization = ({ project }) => {
  const { project: projectData, roles, aiSuggestion } = project

  console.log("Project data in visualization:", projectData)
  console.log("AI Suggestion:", aiSuggestion)

  const roleData = roles.map((role, index) => ({
    name: role.role_name,
    cost: role.cost,
    personCount: role.person_count,
    hours: role.hours_per_week * role.weeks * role.person_count,
    hourlyRate: role.hourly_rate,
    totalHours: role.hours_per_week * role.weeks,
    color: COLORS[index % COLORS.length],
  }))

  const totalPeople = roles.reduce((sum, role) => sum + role.person_count, 0)

  // Cost breakdown data for additional chart
  const costBreakdownData = [
    { name: "Team Costs", value: projectData.base_cost, color: "#667eea" },
    { name: "Additional Costs", value: projectData.additional_costs || 0, color: "#27ae60" },
    { name: "Risk Buffer", value: projectData.risk_buffer_amount || 0, color: "#f39c12" },
  ].filter((item) => item.value > 0)

  // Check if technology stack exists and has data
  const hasTechnologyStack =
    projectData.technology_stack &&
    typeof projectData.technology_stack === "object" &&
    Object.values(projectData.technology_stack).some((arr) => Array.isArray(arr) && arr.length > 0)

  // Parse AI recommendations for comparison
  const parseTeamStructure = (structureString) => {
    try {
      const structure = JSON.parse(structureString)
      return structure.recommendations || []
    } catch (e) {
      console.error("Error parsing team structure:", e)
      return []
    }
  }

  // Prepare comparative data
  const getComparativeData = () => {
    if (!aiSuggestion) return null

    const aiRecommendations = parseTeamStructure(aiSuggestion.updated_team_structure)
    const currentTotal = projectData.total_cost
    const recommendedTotal = currentTotal - (aiSuggestion.cost_reduction || 0)
    const recommendedTeamSize = aiRecommendations.reduce((sum, role) => sum + (role.person_count || 0), 0)

    return {
      costComparison: [
        {
          category: "Current Project",
          totalCost: currentTotal,
          teamCost: projectData.base_cost,
          additionalCosts: projectData.additional_costs || 0,
          riskBuffer: projectData.risk_buffer_amount || 0,
          teamSize: totalPeople,
        },
        {
          category: "AI Recommended",
          totalCost: recommendedTotal,
          teamCost: projectData.base_cost - (aiSuggestion.cost_reduction || 0),
          additionalCosts: projectData.additional_costs || 0,
          riskBuffer: projectData.risk_buffer_amount || 0,
          teamSize: recommendedTeamSize,
        },
      ],
      roleComparison: roles.map((currentRole) => {
        const aiRole = aiRecommendations.find((r) => r.role.toLowerCase().includes(currentRole.role_name.toLowerCase()))
        return {
          role: currentRole.role_name,
          currentPeople: currentRole.person_count,
          currentCost: currentRole.cost,
          currentHours: currentRole.hours_per_week * currentRole.weeks,
          recommendedPeople: aiRole?.person_count || currentRole.person_count,
          recommendedCost: aiRole
            ? aiRole.person_count *
              currentRole.hourly_rate *
              (aiRole.hours || currentRole.hours_per_week) *
              (aiRole.weeks || currentRole.weeks)
            : currentRole.cost,
          recommendedHours: aiRole
            ? (aiRole.hours || currentRole.hours_per_week) * (aiRole.weeks || currentRole.weeks)
            : currentRole.hours_per_week * currentRole.weeks,
        }
      }),
      savingsBreakdown: [
        {
          category: "Team Optimization",
          amount: (aiSuggestion.cost_reduction || 0) * 0.7,
          percentage: 70,
        },
        {
          category: "Process Improvement",
          amount: (aiSuggestion.cost_reduction || 0) * 0.2,
          percentage: 20,
        },
        {
          category: "Technology Stack",
          amount: (aiSuggestion.cost_reduction || 0) * 0.1,
          percentage: 10,
        },
      ],
    }
  }

  const comparativeData = getComparativeData()

  const exportToPDF = async () => {
    try {
      // Show loading state
      const originalButton = document.querySelector(".export-btn")
      if (originalButton) {
        originalButton.textContent = "Generating PDF..."
        originalButton.disabled = true
      }

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement("div")
      pdfContainer.style.position = "absolute"
      pdfContainer.style.left = "-9999px"
      pdfContainer.style.top = "0"
      pdfContainer.style.width = "210mm" // A4 width
      pdfContainer.style.backgroundColor = "white"
      pdfContainer.style.padding = "20px"
      pdfContainer.style.fontFamily = "Arial, sans-serif"

      // Generate PDF content
      pdfContainer.innerHTML = generatePDFContent()
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
      pdf.save(`${projectData.name}_Cost_Analysis_Report.pdf`)

      // Reset button
      if (originalButton) {
        originalButton.textContent = "📄 Export PDF"
        originalButton.disabled = false
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")

      // Reset button on error
      const originalButton = document.querySelector(".export-btn")
      if (originalButton) {
        originalButton.textContent = "📄 Export PDF"
        originalButton.disabled = false
      }
    }
  }

  const generatePDFContent = () => {
    const currentDate = new Date().toLocaleString()
    const aiRecommendations = aiSuggestion ? parseTeamStructure(aiSuggestion.updated_team_structure) : []

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
          <h1 style="color: #667eea; margin: 0; font-size: 28px;">🤖 AI Project Cost Analysis Report</h1>
          <p style="margin: 10px 0; font-size: 18px; color: #666;">Project: ${projectData.name}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #999;">Generated on: ${currentDate}</p>
        </div>

        <!-- Executive Summary -->
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📊 Executive Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
            <div>
              <h3 style="margin: 0 0 10px 0; color: #667eea;">Project Overview</h3>
              <p><strong>Duration:</strong> ${projectData.duration} months</p>
              <p><strong>Complexity:</strong> ${projectData.complexity.toUpperCase()}</p>
              <p><strong>Current Total Cost:</strong> $${projectData.total_cost.toLocaleString()}</p>
              <p><strong>Team Size:</strong> ${totalPeople} people (${roles.length} roles)</p>
            </div>
            ${
              aiSuggestion
                ? `
            <div>
              <h3 style="margin: 0 0 10px 0; color: #27ae60;">AI Analysis Results</h3>
              <p><strong>Potential Savings:</strong> $${aiSuggestion.cost_reduction.toLocaleString()}</p>
              <p><strong>Percentage Reduction:</strong> ${((aiSuggestion.cost_reduction / projectData.total_cost) * 100).toFixed(1)}%</p>
              <p><strong>Optimized Cost:</strong> $${(projectData.total_cost - aiSuggestion.cost_reduction).toLocaleString()}</p>
              <p><strong>Confidence Score:</strong> ${(aiSuggestion.confidence_score * 100).toFixed(0)}%</p>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Current Team Structure -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">👥 Current Team Structure</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Role</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">People</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Hourly Rate</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Hours/Week</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Duration</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${roles
                .map(
                  (role) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 12px;">${role.role_name}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${role.person_count}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${role.hourly_rate}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${role.hours_per_week}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${role.weeks} weeks</td>
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
                <td style="border: 1px solid #ddd; padding: 12px;" colspan="3"></td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #27ae60;">$${projectData.total_cost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Cost Breakdown -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💰 Cost Breakdown</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <p><strong>Base Team Cost:</strong> $${projectData.base_cost.toLocaleString()}</p>
                <p><strong>Additional Costs:</strong> $${(projectData.additional_costs || 0).toLocaleString()}</p>
              </div>
              <div>
                <p><strong>Risk Buffer (${projectData.risk_buffer_percentage || 0}%):</strong> $${(projectData.risk_buffer_amount || 0).toLocaleString()}</p>
                <p style="font-size: 18px; color: #27ae60;"><strong>Total Project Cost: $${projectData.total_cost.toLocaleString()}</strong></p>
              </div>
            </div>
          </div>
        </div>

        ${
          hasTechnologyStack
            ? `
        <!-- Technology Stack -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🛠️ Technology Stack</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            ${Object.entries(projectData.technology_stack)
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
              Object.values(projectData.technology_stack)
                .filter((arr) => Array.isArray(arr))
                .flat().length
            }</p>
            <p><strong>Stack Complexity:</strong> ${
              Object.values(projectData.technology_stack)
                .filter((arr) => Array.isArray(arr))
                .flat().length > 8
                ? "High"
                : Object.values(projectData.technology_stack)
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
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🤖 AI Recommendations</h2>
          <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #667eea;">Key Optimization Suggestions</h3>
            <div style="white-space: pre-line; line-height: 1.8;">${aiSuggestion.suggestions}</div>
          </div>

          ${
            comparativeData
              ? `
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
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${projectData.total_cost.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${comparativeData.costComparison[1].totalCost.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #27ae60; font-weight: bold;">-$${aiSuggestion.cost_reduction.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #27ae60;">${((aiSuggestion.cost_reduction / projectData.total_cost) * 100).toFixed(1)}% savings</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 12px;"><strong>Team Size</strong></td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${totalPeople} people</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${comparativeData.costComparison[1].teamSize} people</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${comparativeData.costComparison[1].teamSize - totalPeople >= 0 ? "+" : ""}${comparativeData.costComparison[1].teamSize - totalPeople} people</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${comparativeData.costComparison[1].teamSize < totalPeople ? "More efficient" : comparativeData.costComparison[1].teamSize > totalPeople ? "Enhanced capacity" : "Optimized"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          `
              : ""
          }

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
          </div>
        </div>
        `
            : ""
        }

        <!-- Next Steps -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🎯 Next Steps & Recommendations</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #667eea;">Immediate Actions</h3>
            <ol style="line-height: 1.8;">
              <li><strong>Review AI Suggestions:</strong> Analyze the provided recommendations with your project team</li>
              <li><strong>Validate Assumptions:</strong> Ensure AI recommendations align with project requirements</li>
              <li><strong>Pilot Implementation:</strong> Start with low-risk, high-impact suggestions</li>
            </ol>
            
            <h3 style="color: #667eea;">Medium-term Planning</h3>
            <ol style="line-height: 1.8;">
              <li><strong>Team Restructuring:</strong> Implement recommended team size and role optimizations</li>
              <li><strong>Technology Evaluation:</strong> Assess suggested technology alternatives</li>
              <li><strong>Process Improvements:</strong> Adopt recommended workflow optimizations</li>
            </ol>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666;">
          <p style="margin: 5px 0;"><strong>Report Generated By:</strong> AI Project Cost Estimator</p>
          <p style="margin: 5px 0;"><strong>AI Provider:</strong> Google AI Studio (Gemini)</p>
          <p style="margin: 5px 0;"><strong>Export Date:</strong> ${currentDate}</p>
          <p style="margin: 15px 0 5px 0; font-style: italic; font-size: 12px;">
            This report was generated using AI analysis and should be reviewed by project stakeholders before implementation.
          </p>
        </div>
      </div>
    `
  }

  const exportToExcel = () => {
    let csvContent = [
      ["Cost Breakdown"],
      ["Base Cost (Team)", projectData.base_cost],
      ["Additional Costs", projectData.additional_costs || 0],
      ["Risk Buffer (" + (projectData.risk_buffer_percentage || 0) + "%)", projectData.risk_buffer_amount || 0],
      ["Total Cost", projectData.total_cost],
      [""],
      ["Role Details"],
      ["Role", "People Count", "Hourly Rate", "Hours/Week", "Weeks", "Total Hours", "Total Cost"],
      ...roles.map((role) => [
        role.role_name,
        role.person_count,
        role.hourly_rate,
        role.hours_per_week,
        role.weeks,
        role.hours_per_week * role.weeks * role.person_count,
        role.cost,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Add technology stack information
    if (hasTechnologyStack) {
      csvContent += [
        "",
        ["Technology Stack"],
        ["Category", "Technologies", "Count"],
        ...Object.entries(projectData.technology_stack)
          .filter(([_, technologies]) => Array.isArray(technologies) && technologies.length > 0)
          .map(([category, technologies]) => [
            category.charAt(0).toUpperCase() + category.slice(1),
            technologies.join("; "),
            technologies.length,
          ]),
      ]
        .map((row) => (Array.isArray(row) ? row.join(",") : row))
        .join("\n")
    }

    // Add AI comparison data
    if (comparativeData) {
      csvContent += [
        "",
        ["AI Comparison Analysis"],
        ["Metric", "Current", "AI Recommended", "Difference"],
        [
          "Total Cost",
          projectData.total_cost,
          comparativeData.costComparison[1].totalCost,
          aiSuggestion.cost_reduction,
        ],
        [
          "Team Size",
          totalPeople,
          comparativeData.costComparison[1].teamSize,
          comparativeData.costComparison[1].teamSize - totalPeople,
        ],
        [""],
        ["Role Comparison"],
        ["Role", "Current People", "Recommended People", "Current Cost", "Recommended Cost"],
        ...comparativeData.roleComparison.map((role) => [
          role.role,
          role.currentPeople,
          role.recommendedPeople,
          role.currentCost,
          role.recommendedCost,
        ]),
      ]
        .map((row) => (Array.isArray(row) ? row.join(",") : row))
        .join("\n")
    }

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectData.name}_comprehensive_analysis.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateAIReport = () => {
    // This will now generate PDF instead of markdown
    exportToPDF()
  }

  return (
    <div className="visualization">
      <div className="visualization-header">
        <h2>{projectData.name} - Comprehensive Cost Analysis</h2>
        <div className="export-buttons">
          <button onClick={generateAIReport} className="export-btn ai-report-btn">
            📄 Generate PDF Report
          </button>
          <button onClick={exportToPDF} className="export-btn">
            📄 Export PDF
          </button>
          <button onClick={exportToExcel} className="export-btn">
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* Comparative Analysis Section */}
      {comparativeData && (
        <div className="comparative-analysis">
          <div className="comparison-header">
            <h2>🔍 AI vs Current: Comparative Analysis</h2>
            <p>Compare your current project setup with AI-optimized recommendations</p>
          </div>

          {/* Cost Comparison Chart */}
          <div className="chart-section">
            <h3>💰 Cost Comparison: Current vs AI Recommended</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={comparativeData.costComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                  labelFormatter={(label) => `${label} Configuration`}
                />
                <Legend />
                <Bar dataKey="teamCost" stackId="a" fill={COMPARISON_COLORS.current} name="Team Cost" />
                <Bar dataKey="additionalCosts" stackId="a" fill="#95a5a6" name="Additional Costs" />
                <Bar dataKey="riskBuffer" stackId="a" fill="#f39c12" name="Risk Buffer" />
                <Line type="monotone" dataKey="teamSize" stroke="#8884d8" strokeWidth={3} name="Team Size" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Role-by-Role Comparison */}
          <div className="chart-section">
            <h3>👥 Role-by-Role Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparativeData.roleComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name.includes("Cost")) return [`$${value.toLocaleString()}`, name]
                    if (name.includes("People")) return [`${value} people`, name]
                    return [`${value} hours`, name]
                  }}
                />
                <Legend />
                <Bar dataKey="currentPeople" fill={COMPARISON_COLORS.current} name="Current People" />
                <Bar dataKey="recommendedPeople" fill={COMPARISON_COLORS.recommended} name="AI Recommended People" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Savings Breakdown */}
          <div className="chart-section">
            <h3>💡 Potential Savings Breakdown</h3>
            <div className="savings-overview">
              <div className="savings-total">
                <h4>Total Potential Savings</h4>
                <div className="savings-amount">${aiSuggestion.cost_reduction.toLocaleString()}</div>
                <div className="savings-percentage">
                  {((aiSuggestion.cost_reduction / projectData.total_cost) * 100).toFixed(1)}% reduction
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={comparativeData.savingsBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {comparativeData.savingsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Savings"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="comparison-table">
            <h3>📊 Detailed Comparison Table</h3>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current</th>
                  <th>AI Recommended</th>
                  <th>Difference</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Total Cost</strong>
                  </td>
                  <td>${projectData.total_cost.toLocaleString()}</td>
                  <td>${comparativeData.costComparison[1].totalCost.toLocaleString()}</td>
                  <td className="savings">-${aiSuggestion.cost_reduction.toLocaleString()}</td>
                  <td className="positive">
                    {((aiSuggestion.cost_reduction / projectData.total_cost) * 100).toFixed(1)}% savings
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Team Size</strong>
                  </td>
                  <td>{totalPeople} people</td>
                  <td>{comparativeData.costComparison[1].teamSize} people</td>
                  <td
                    className={comparativeData.costComparison[1].teamSize - totalPeople >= 0 ? "increase" : "decrease"}
                  >
                    {comparativeData.costComparison[1].teamSize - totalPeople >= 0 ? "+" : ""}
                    {comparativeData.costComparison[1].teamSize - totalPeople} people
                  </td>
                  <td>
                    {comparativeData.costComparison[1].teamSize < totalPeople
                      ? "More efficient"
                      : comparativeData.costComparison[1].teamSize > totalPeople
                        ? "Enhanced capacity"
                        : "Optimized"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Cost per Person</strong>
                  </td>
                  <td>${(projectData.total_cost / totalPeople).toLocaleString()}</td>
                  <td>
                    $
                    {(
                      comparativeData.costComparison[1].totalCost / comparativeData.costComparison[1].teamSize
                    ).toLocaleString()}
                  </td>
                  <td className="neutral">
                    $
                    {(
                      comparativeData.costComparison[1].totalCost / comparativeData.costComparison[1].teamSize -
                      projectData.total_cost / totalPeople
                    ).toLocaleString()}
                  </td>
                  <td>Efficiency metric</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Confidence Indicator */}
          <div className="confidence-indicator">
            <h3>🎯 AI Analysis Confidence</h3>
            <div className="confidence-visual">
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: `${aiSuggestion.confidence_score * 100}%` }}></div>
              </div>
              <div className="confidence-text">
                {(aiSuggestion.confidence_score * 100).toFixed(0)}% confidence in recommendations
              </div>
            </div>
            <div className="confidence-explanation">
              <p>
                <strong>High confidence</strong> indicates the AI has strong data patterns to base recommendations on.
                This analysis considered your team structure, technology stack, project complexity, and industry best
                practices.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="project-summary">
        <div className="summary-card">
          <h3>Project Overview</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Duration:</label>
              <span>{projectData.duration} months</span>
            </div>
            <div className="summary-item">
              <label>Complexity:</label>
              <span className={`complexity ${projectData.complexity}`}>{projectData.complexity.toUpperCase()}</span>
            </div>
            <div className="summary-item">
              <label>Total Cost:</label>
              <span className="total-cost">${projectData.total_cost.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <label>Team Size:</label>
              <span>
                {totalPeople} people ({roles.length} roles)
              </span>
            </div>
          </div>

          <div className="cost-breakdown-overview">
            <h4>Cost Breakdown</h4>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <label>Base Cost (Team):</label>
                <span>${projectData.base_cost.toLocaleString()}</span>
              </div>
              <div className="breakdown-item">
                <label>Additional Costs:</label>
                <span>${(projectData.additional_costs || 0).toLocaleString()}</span>
              </div>
              <div className="breakdown-item">
                <label>Risk Buffer ({projectData.risk_buffer_percentage || 0}%):</label>
                <span>${(projectData.risk_buffer_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {projectData.description && (
            <div className="description">
              <label>Description:</label>
              <p>{projectData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Technology Stack Section */}
      {hasTechnologyStack && (
        <div className="technology-section">
          <div className="tech-overview-card">
            <h3>Technology Stack Overview</h3>

            {/* Technology Table */}
            <div className="tech-table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Technologies</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(projectData.technology_stack).map(
                    ([category, technologies]) =>
                      Array.isArray(technologies) &&
                      technologies.length > 0 && (
                        <tr key={category}>
                          <td className="tech-category-cell">
                            <span className={`category-badge ${category}`}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                          </td>
                          <td className="tech-list-cell">
                            <div className="tech-tags-inline">
                              {technologies.map((tech, index) => (
                                <span key={index} className="tech-tag-small">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="tech-count-cell">{technologies.length}</td>
                        </tr>
                      ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Technology Distribution Chart */}
            <div className="tech-chart-section">
              <h4>Technology Distribution by Category</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Object.entries(projectData.technology_stack)
                    .filter(([_, technologies]) => Array.isArray(technologies) && technologies.length > 0)
                    .map(([category, technologies]) => ({
                      category: category.charAt(0).toUpperCase() + category.slice(1),
                      count: technologies.length,
                      technologies: technologies.join(", "),
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name, props) => [`${value} technologies`, "Count"]}
                    labelFormatter={(category) => {
                      const data = Object.entries(projectData.technology_stack).find(
                        ([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1) === category,
                      )
                      return data ? `${category}: ${data[1].join(", ")}` : category
                    }}
                  />
                  <Bar dataKey="count" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Technology Stack Summary */}
            <div className="tech-summary">
              <div className="tech-stats">
                <div className="tech-stat">
                  <label>Total Technologies:</label>
                  <span>
                    {
                      Object.values(projectData.technology_stack)
                        .filter((arr) => Array.isArray(arr))
                        .flat().length
                    }
                  </span>
                </div>
                <div className="tech-stat">
                  <label>Categories Used:</label>
                  <span>
                    {
                      Object.values(projectData.technology_stack).filter((arr) => Array.isArray(arr) && arr.length > 0)
                        .length
                    }
                  </span>
                </div>
                <div className="tech-stat">
                  <label>Stack Complexity:</label>
                  <span
                    className={`complexity ${
                      Object.values(projectData.technology_stack)
                        .filter((arr) => Array.isArray(arr))
                        .flat().length > 8
                        ? "high"
                        : Object.values(projectData.technology_stack)
                              .filter((arr) => Array.isArray(arr))
                              .flat().length > 4
                          ? "medium"
                          : "low"
                    }`}
                  >
                    {Object.values(projectData.technology_stack)
                      .filter((arr) => Array.isArray(arr))
                      .flat().length > 8
                      ? "High"
                      : Object.values(projectData.technology_stack)
                            .filter((arr) => Array.isArray(arr))
                            .flat().length > 4
                        ? "Medium"
                        : "Low"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="charts-container">
        <div className="chart-section">
          <h3>Team Cost Distribution by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "cost") return [`$${value.toLocaleString()}`, "Total Cost"]
                  return [value, name]
                }}
                labelFormatter={(label) => {
                  const role = roleData.find((r) => r.name === label)
                  return `${label} (${role?.personCount} ${role?.personCount === 1 ? "person" : "people"})`
                }}
              />
              <Legend />
              <Bar dataKey="cost" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>Overall Project Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {costBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Cost"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section full-width">
          <h3>Team Role Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, personCount }) => `${name} (${personCount}p) ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cost"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `$${value.toLocaleString()}`,
                  `Cost (${props.payload.personCount} ${props.payload.personCount === 1 ? "person" : "people"})`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="roles-table">
        <h3>Detailed Role Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>People</th>
              <th>Hourly Rate</th>
              <th>Hours/Week (per person)</th>
              <th>Duration (weeks)</th>
              <th>Total Hours</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role, index) => (
              <tr key={index}>
                <td>{role.role_name}</td>
                <td className="people-count">{role.person_count}</td>
                <td>${role.hourly_rate}</td>
                <td>{role.hours_per_week}</td>
                <td>{role.weeks}</td>
                <td>{(role.hours_per_week * role.weeks * role.person_count).toLocaleString()}</td>
                <td>${role.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="subtotal-row">
              <td>
                <strong>Team Subtotal:</strong>
              </td>
              <td>
                <strong>{totalPeople}</strong>
              </td>
              <td colSpan="4"></td>
              <td>
                <strong>${projectData.base_cost.toLocaleString()}</strong>
              </td>
            </tr>
            <tr>
              <td colSpan="6">
                <strong>Additional Costs:</strong>
              </td>
              <td>
                <strong>${(projectData.additional_costs || 0).toLocaleString()}</strong>
              </td>
            </tr>
            <tr>
              <td colSpan="6">
                <strong>Risk Buffer ({projectData.risk_buffer_percentage || 0}%):</strong>
              </td>
              <td>
                <strong>${(projectData.risk_buffer_amount || 0).toLocaleString()}</strong>
              </td>
            </tr>
            <tr className="total-row">
              <td colSpan="6">
                <strong>Total Project Cost:</strong>
              </td>
              <td>
                <strong>${projectData.total_cost.toLocaleString()}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default Visualization
