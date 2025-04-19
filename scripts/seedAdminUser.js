import sql from '../db.js';
import bcrypt from 'bcrypt';

async function seedAdminUser() {
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'Admin1234!'; // You may want to change this to a secure password

  try {
    // Check if admin user already exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${adminEmail}`;
    if (existingUser.length > 0) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Insert admin user
    const insertedUsers = await sql`
      INSERT INTO users (email, password, full_name, role, created_at)
      VALUES (${adminEmail}, ${hashedPassword}, 'Admin User', 'admin', NOW())
      RETURNING *;
    `;

    if (insertedUsers.length === 0) {
      console.error('Failed to create admin user');
      return;
    }

    console.log('Admin user created successfully:', adminEmail);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedAdminUser();
