-- Create database
CREATE DATABASE IF NOT EXISTS ai_cost_estimator;
USE ai_cost_estimator;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL,
    complexity ENUM('low', 'medium', 'high') NOT NULL,
    total_cost FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Roles table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    hourly_rate FLOAT NOT NULL,
    hours_per_week INT NOT NULL,
    weeks INT NOT NULL,
    cost FLOAT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- AI suggestions table
CREATE TABLE ai_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    suggestions TEXT,
    cost_reduction FLOAT DEFAULT 0,
    updated_team_structure TEXT,
    confidence_score FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password) VALUES 
('admin@example.com', '$2b$10$rQZ9QmjlhQZ9QmjlhQZ9QOK9QmjlhQZ9QmjlhQZ9QmjlhQZ9Qmjlh');
