import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    // List of tables we know about
    const tables = [
        'appointments', 'contacts', 'doctors', 'instances', 'profiles',
        'n8n_historico_transferencias', 'patients', 'doctor_availability'
    ];
    let results = "--- Table Summary ---\n";
    for (const table of tables) {
        try {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                results += `${table}: ERROR - ${error.message}\n`;
            } else {
                results += `${table}: ${count} rows\n`;
            }
        } catch (e) {
            results += `${table}: EXCEPTION\n`;
        }
    }
    fs.writeFileSync('table_summary.txt', results);
}

check();
