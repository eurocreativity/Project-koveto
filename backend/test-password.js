const bcrypt = require('bcrypt');

const password = 'password123';

// Get hash from database
const dbHash = '$2b$10$6gJBYwcIILrJUat0iG2wzOBaumkzQXd/rv8B8U9prh3m4VBAlZi2i';

bcrypt.compare(password, dbHash, (err, result) => {
  console.log('Password matches hash:', result);

  if (!result) {
    // Generate new hash
    bcrypt.hash(password, 10, (err, newHash) => {
      console.log('New hash:', newHash);
      console.log('\nRun this SQL to fix:');
      console.log(`UPDATE users SET password_hash = '${newHash}' WHERE email IN ('admin@example.com', 'janos@example.com', 'anna@example.com');`);
    });
  }
});
