import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRpc() {
    let log = "RPC test starting...\n";
    const rpcs = ['exec_sql', 'execute_sql', 'sql', 'run_sql'];
    for (const rpcName of rpcs) {
        log += `Testing RPC '${rpcName}'...\n`;
        const { data, error } = await supabase.rpc(rpcName, { query: 'SELECT 1 as val;', sql_query: 'SELECT 1 as val;', sql: 'SELECT 1 as val;' });
        if (error) {
            log += `RPC '${rpcName}': FAILED - ${error.code} - ${error.message}\n`;
        } else {
            log += `RPC '${rpcName}': SUCCESS! ${JSON.stringify(data)}\n`;
        }
    }
    fs.writeFileSync('test-rpc-utf8.log', log, 'utf-8');
}

testRpc();
