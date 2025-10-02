-- Fix user passwords (password123)
UPDATE users SET password_hash = '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y' WHERE email = 'admin@example.com';
UPDATE users SET password_hash = '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y' WHERE email = 'janos@example.com';
UPDATE users SET password_hash = '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y' WHERE email = 'anna@example.com';
SELECT 'Passwords updated!' as message;
