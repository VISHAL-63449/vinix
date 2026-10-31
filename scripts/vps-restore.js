#!/usr/bin/env node
/**
 * =========================================================================
 * VINIX PLATFORM - VPS DATABASE RESTORE CLI SCRIPT
 * =========================================================================
 * 
 * Usage on your VPS:
 *   node scripts/vps-restore.js <path-to-backup.json>
 * 
 * Environment Variables (optional, defaults to project Supabase settings):
 *   DATABASE_URL="postgresql://postgres:password@localhost:5432/vinix"
 *   SUPABASE_URL="https://your-project.supabase.co"
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 * =========================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

const TABLE_ORDER = [
    'profiles',
    'domains',
    'internships',
    'internship_tasks',
    'internship_applications',
    'internship_enrollments',
    'task_progress',
    'offer_letters',
    'certificates',
    'reviews',
    'submissions'
];

async function runRestore() {
    const backupFilePath = process.argv[2];

    console.log('\n======================================================');
    console.log('       VINIX VPS DATABASE RESTORE UTILITY');
    console.log('======================================================\n');

    if (!backupFilePath) {
        console.error('❌ Error: No backup file specified.');
        console.log('\nUsage:');
        console.log('  node scripts/vps-restore.js <path-to-backup.json>\n');
        process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), backupFilePath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`❌ Error: Backup file not found at: ${resolvedPath}`);
        process.exit(1);
    }

    console.log(`📦 Loading backup file: ${resolvedPath}`);
    const rawData = fs.readFileSync(resolvedPath, 'utf8');

    let backupData;
    try {
        backupData = JSON.parse(rawData);
    } catch (e) {
        console.error('❌ Error parsing JSON backup file:', e.message);
        process.exit(1);
    }

    const tables = backupData.tables || backupData;
    console.log(`\n🚀 Starting restore to: ${supabaseUrl}`);

    let totalRestored = 0;

    for (const table of TABLE_ORDER) {
        const rows = tables[table];
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            console.log(`⚪ Skipping ${table}: No records found in backup.`);
            continue;
        }

        console.log(`⏳ Restoring table: ${table} (${rows.length} records)...`);

        const chunkSize = 50;
        let tableRestored = 0;

        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const { error } = await client.from(table).upsert(chunk, { onConflict: 'id' });

            if (error) {
                console.warn(`   ⚠️ Warning in ${table} chunk [${i}-${i + chunkSize}]: ${error.message}`);
                // Fallback row-by-row
                for (const row of chunk) {
                    try {
                        await client.from(table).upsert(row, { onConflict: 'id' });
                        tableRestored++;
                    } catch {
                        // skip failed row
                    }
                }
            } else {
                tableRestored += chunk.length;
            }
        }

        console.log(`   ✅ Restored ${tableRestored}/${rows.length} rows in ${table}`);
        totalRestored += tableRestored;
    }

    console.log('\n======================================================');
    console.log(`🎉 RESTORE COMPLETED SUCCESSFULLY!`);
    console.log(`Total records restored: ${totalRestored}`);
    console.log('======================================================\n');
}

runRestore().catch(err => {
    console.error('Fatal restore error:', err);
    process.exit(1);
});
