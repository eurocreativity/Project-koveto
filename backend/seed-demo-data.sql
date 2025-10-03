-- Demo data seed script
-- Run this after MySQL is started
-- Password for all users: password123

-- Clear existing data (optional)
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM users WHERE email IN ('admin@example.com', 'janos@example.com', 'anna@example.com');

-- Reset auto increment
ALTER TABLE tasks AUTO_INCREMENT = 1;
ALTER TABLE projects AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Insert demo users
-- Password: "password123" - hashed with bcrypt rounds=10
-- Hash generated with: bcrypt.hashSync('password123', 10)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@example.com', '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y', 'admin'),
  ('Kovács János', 'janos@example.com', '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y', 'user'),
  ('Nagy Anna', 'anna@example.com', '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y', 'user');

-- Insert demo projects
INSERT INTO projects (name, description, start_date, end_date, owner_id, status, color) VALUES
  ('E-commerce platform fejlesztés', 'Online webshop rendszer React + Node.js-sel', '2025-01-15', '2025-04-30', 2, 'in_progress', '#667eea'),
  ('Mobilalkalmazás UI design', 'iOS és Android app design Figma-ban', '2025-02-01', '2025-03-15', 3, 'in_progress', '#764ba2'),
  ('CRM rendszer migráció', 'Legacy rendszer átállítása új platformra', '2024-11-01', '2025-12-31', 2, 'in_progress', '#f093fb');

-- Insert demo tasks with realistic deadlines
INSERT INTO tasks (project_id, name, description, start_date, deadline, owner_id, status, priority) VALUES
  -- Project 1: E-commerce platform
  (1, 'Backend API elkészítése', 'REST API végpontok Node.js + Express-szel', '2025-01-15', '2025-02-15', 2, 'completed', 'high'),
  (1, 'Frontend komponensek', 'React komponensek fejlesztése', '2025-02-16', '2025-03-30', 2, 'in_progress', 'high'),
  (1, 'Payment integráció', 'Stripe fizetési integráció', '2025-03-01', '2025-04-15', 2, 'open', 'medium'),
  (1, 'Termék katalógus', 'Termék listázás és keresés', '2025-10-05', '2025-10-20', 2, 'open', 'high'),
  (1, 'Shopping cart', 'Kosár funkció implementálása', '2025-10-08', '2025-10-25', 2, 'open', 'medium'),

  -- Project 2: Mobile UI design
  (2, 'Wireframe készítés', 'Alapvető UI struktúra tervezése', '2025-02-01', '2025-02-10', 3, 'completed', 'medium'),
  (2, 'UI mockup-ok', 'Részletes vizuális tervek Figma-ban', '2025-02-11', '2025-03-05', 3, 'in_progress', 'high'),
  (2, 'Design system', 'Komponens könyvtár kialakítása', '2025-03-06', '2025-03-15', 3, 'open', 'low'),
  (2, 'Icon készlet', 'Egyedi ikonok tervezése', '2025-10-10', '2025-10-18', 3, 'open', 'low'),

  -- Project 3: CRM migration
  (3, 'Adatmigráció', 'Régi rendszer adatainak átmigrálása', '2024-11-01', '2025-01-31', 2, 'completed', 'high'),
  (3, 'Felhasználói tesztelés', 'Beta tesztelés belső csapattal', '2025-02-01', '2025-10-20', 2, 'in_progress', 'medium'),
  (3, 'Dokumentáció', 'Felhasználói kézikönyv készítése', '2025-10-06', '2025-10-22', 2, 'open', 'low'),
  (3, 'Training anyagok', 'Oktatóvideók készítése', '2025-10-12', '2025-11-10', 3, 'open', 'medium');

-- Verify data
SELECT 'Users:' as 'Table';
SELECT id, name, email, role FROM users;

SELECT 'Projects:' as 'Table';
SELECT id, name, start_date, end_date, status FROM projects;

SELECT 'Tasks:' as 'Table';
SELECT id, project_id, name, deadline, status, priority FROM tasks;
