import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdminUser() {
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'Admin1234!'; // You may want to change this to a secure password

  try {
    // Check if admin user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing admin user:', fetchError);
      return;
    }

    if (existingUser) {
      console.log('Admin user already exists:', existingUser.email);
      return;
    }

    // Create admin user using Supabase auth API
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
      },
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    // Set admin role in users table
    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', data.user.id);

    if (roleError) {
      console.error('Error setting admin role:', roleError);
      return;
    }

    console.log('Admin user created successfully:', adminEmail);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedAdminUser();
