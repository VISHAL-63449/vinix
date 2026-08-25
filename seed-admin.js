import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function main() {
    console.log("Starting Seeding for Admin...");
    const email = 'vishal@vinix.com';
    const password = 'vis@2007';
    const fullName = 'Vishal Admin';

    const { data: getUsers, error: listUserErr } = await client.auth.admin.listUsers();
    if (listUserErr) {
        console.error('Failed to list users:', listUserErr);
        return;
    }

    let user = getUsers.users.find(u => u.email === email);
    let userId;

    if (!user) {
        console.log('Creating new admin user for vishal@vinix.com...');
        const { data: newUser, error: createErr } = await client.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                name: fullName,
                role: 'admin'
            }
        });
        if (createErr) {
            console.error('Failed to create user:', createErr);
            return;
        }
        userId = newUser.user.id;
    } else {
        userId = user.id;
        console.log('Updating password and metadata for existing user vishal@vinix.com...', userId);
        const { error: updateErr } = await client.auth.admin.updateUserById(userId, {
            password: password,
            user_metadata: {
                full_name: fullName,
                name: fullName,
                role: 'admin'
            }
        });
        if (updateErr) {
            console.error('Failed to update user:', updateErr);
            return;
        }
    }
    console.log('✅ Admin User ID:', userId);

    // Update user Profile to be ADMIN
    console.log('\nSetting profile role to admin...');
    const { error: pErr } = await client
        .from('profiles')
        .upsert({
            id: userId,
            email,
            full_name: fullName,
            name: fullName,
            role: 'admin',
            college: 'VINIX Technologies'
        });
    if (pErr) {
        console.error('Failed to update profiles:', pErr);
        return;
    }
    console.log('✅ Admin Profile updated successfully.');
}

main();
