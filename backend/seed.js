/**
 * Database seed script
 * Populates database with demo data
 */

const bcrypt = require('bcrypt');
const { pool } = require('./src/config/database');

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('📦 Clearing existing data...');
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM projects');
    await pool.query("DELETE FROM users WHERE email IN ('admin@example.com', 'janos@example.com', 'anna@example.com')");

    // Reset auto increment
    await pool.query('ALTER TABLE tasks AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE projects AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');

    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('🔐 Password hashed:', passwordHash);

    // Insert demo users
    console.log('👥 Inserting demo users...');
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
        ('Admin User', 'admin@example.com', ?, 'admin'),
        ('Kovács János', 'janos@example.com', ?, 'user'),
        ('Nagy Anna', 'anna@example.com', ?, 'user')
    `, [passwordHash, passwordHash, passwordHash]);

    // Insert demo projects
    console.log('📁 Inserting demo projects...');
    await pool.query(`
      INSERT INTO projects (name, description, start_date, end_date, owner_id, status, color) VALUES
        ('E-commerce platform fejlesztés', 'Online webshop rendszer React + Node.js-sel', '2025-01-15', '2025-04-30', 2, 'in_progress', '#667eea'),
        ('Mobilalkalmazás UI design', 'iOS és Android app design Figma-ban', '2025-02-01', '2025-03-15', 3, 'in_progress', '#764ba2'),
        ('CRM rendszer migráció', 'Legacy rendszer átállítása új platformra', '2024-11-01', '2025-12-31', 2, 'in_progress', '#f093fb')
    `);

    // Insert demo tasks
    console.log('✅ Inserting demo tasks...');
    await pool.query(`
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
        (3, 'Training anyagok', 'Oktatóvideók készítése', '2025-10-12', '2025-11-10', 3, 'open', 'medium')
    `);

    // Verify data
    console.log('\n📊 Verification:');
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users: ${users[0].count}`);

    const [projects] = await pool.query('SELECT COUNT(*) as count FROM projects');
    console.log(`   Projects: ${projects[0].count}`);

    const [tasks] = await pool.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`   Tasks: ${tasks[0].count}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Demo credentials:');
    console.log('   Email: admin@example.com / janos@example.com / anna@example.com');
    console.log('   Password: password123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
