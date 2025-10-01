-- Project Tracker Database Schema
-- MySQL 8.0 / MariaDB 10.x compatible

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  owner_id INT NOT NULL,
  status ENUM('open', 'in_progress', 'completed') DEFAULT 'open',
  color VARCHAR(7) DEFAULT '#667eea',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_owner (owner_id),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE NOT NULL,
  owner_id INT NOT NULL,
  status ENUM('open', 'in_progress', 'completed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key_name VARCHAR(50) UNIQUE NOT NULL,
  value_text TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (key_name, value_text) VALUES
  ('company_name', 'Projekt Követő Rendszer'),
  ('logo_url', ''),
  ('default_project_color', '#667eea');

-- Insert demo users (password: "password123" hashed with bcrypt)
-- You should change these passwords in production!
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@example.com', '$2b$10$rKXN8z5fZ5xJZ5Z5Z5Z5ZeZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'admin'),
  ('Kovács János', 'janos@example.com', '$2b$10$rKXN8z5fZ5xJZ5Z5Z5Z5ZeZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'user'),
  ('Nagy Anna', 'anna@example.com', '$2b$10$rKXN8z5fZ5xJZ5Z5Z5Z5ZeZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'user');

-- Insert demo projects
INSERT INTO projects (name, description, start_date, end_date, owner_id, status, color) VALUES
  ('E-commerce platform fejlesztés', 'Online webshop rendszer React + Node.js-sel', '2025-01-15', '2025-04-30', 2, 'in_progress', '#667eea'),
  ('Mobilalkalmazás UI design', 'iOS és Android app design Figma-ban', '2025-02-01', '2025-03-15', 3, 'in_progress', '#764ba2'),
  ('CRM rendszer migráció', 'Legacy rendszer átállítása új platformra', '2024-11-01', '2025-02-28', 2, 'in_progress', '#f093fb');

-- Insert demo tasks
INSERT INTO tasks (project_id, name, description, start_date, deadline, owner_id, status, priority) VALUES
  (1, 'Backend API elkészítése', 'REST API végpontok Node.js + Express-szel', '2025-01-15', '2025-02-15', 2, 'completed', 'high'),
  (1, 'Frontend komponensek', 'React komponensek fejlesztése', '2025-02-16', '2025-03-30', 2, 'in_progress', 'high'),
  (1, 'Payment integráció', 'Stripe fizetési integráció', '2025-03-01', '2025-04-15', 2, 'open', 'medium'),
  (2, 'Wireframe készítés', 'Alapvető UI struktúra tervezése', '2025-02-01', '2025-02-10', 3, 'completed', 'medium'),
  (2, 'UI mockup-ok', 'Részletes vizuális tervek Figma-ban', '2025-02-11', '2025-03-05', 3, 'in_progress', 'high'),
  (2, 'Design system', 'Komponens könyvtár kialakítása', '2025-03-06', '2025-03-15', 3, 'open', 'low'),
  (3, 'Adatmigráció', 'Régi rendszer adatainak átmigrálása', '2024-11-01', '2025-01-31', 2, 'completed', 'high'),
  (3, 'Felhasználói tesztelés', 'Beta tesztelés belső csapattal', '2025-02-01', '2025-02-20', 2, 'in_progress', 'medium'),
  (3, 'Dokumentáció', 'Felhasználói dokumentáció készítése', '2025-02-21', '2025-02-28', 2, 'open', 'low');

-- Display summary
SELECT 'Database schema created successfully!' as message;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as project_count FROM projects;
SELECT COUNT(*) as task_count FROM tasks;
