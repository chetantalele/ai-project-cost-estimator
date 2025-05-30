# AI Project Cost Estimator Tool

A full-stack web application that helps estimate project costs using AI-powered suggestions and team structure optimization.

## 🚀 Features

- **Authentication**: JWT-based login system
- **Project Management**: Create and manage projects with detailed role breakdowns
- **Cost Visualization**: Interactive charts showing cost distribution and budget allocation
- **AI Integration**: OpenAI-powered suggestions for team optimization and cost reduction
- **Export Functionality**: Export reports as PDF and Excel files
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React.js, Recharts, Axios
- **Backend**: Node.js, Express.js, JWT
- **Database**: MySQL
- **AI**: OpenAI GPT-4 API (simulated)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd ai-cost-estimator
\`\`\`

### 2. Database Setup
\`\`\`bash
# Start MySQL service
sudo service mysql start

# Create database and tables
mysql -u root -p < database/schema.sql
\`\`\`

### 3. Backend Setup
\`\`\`bash
# Install backend dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Start the backend server
npm run dev
\`\`\`

### 4. Frontend Setup
\`\`\`bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the React development server
npm start
\`\`\`

## 🔑 Default Login Credentials

- **Email**: admin@example.com
- **Password**: admin123

## 📊 Usage

1. **Login**: Use the default credentials to access the dashboard
2. **Create Project**: Fill out the project form with details and team roles
3. **View Visualization**: See cost breakdowns and charts
4. **Get AI Suggestions**: Click "Get AI Suggestions" for optimization recommendations
5. **Export Reports**: Download PDF or Excel reports

## 🗄️ Database Schema

### Users Table
- id (Primary Key)
- email (Unique)
- password (Hashed)
- created_at

### Projects Table
- id (Primary Key)
- user_id (Foreign Key)
- name
- description
- duration
- complexity (low/medium/high)
- total_cost
- created_at

### Roles Table
- id (Primary Key)
- project_id (Foreign Key)
- role_name
- hourly_rate
- hours_per_week
- weeks
- cost

### AI Suggestions Table
- id (Primary Key)
- project_id (Foreign Key)
- suggestions
- cost_reduction
- updated_team_structure
- confidence_score
- created_at

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details

### AI Suggestions
- `POST /api/ai/suggestions/:projectId` - Generate AI suggestions

## 🎨 Features Overview

### Dashboard
- Welcome screen with navigation
- Recent projects sidebar
- Tabbed interface for different views

### Project Form
- Dynamic role addition/removal
- Real-time cost calculation
- Form validation

### Visualization
- Bar charts for cost distribution
- Pie charts for budget allocation
- Detailed role breakdown table
- Export functionality

### AI Report
- AI-generated optimization suggestions
- Cost reduction analysis
- Team structure recommendations
- Confidence scoring

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- SQL injection protection
- CORS configuration

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🚀 Deployment

### Backend Deployment
1. Set up production database
2. Configure environment variables
3. Deploy to your preferred hosting service

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the build folder to your web server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.
