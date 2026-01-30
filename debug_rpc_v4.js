import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
    try {
        const appointment_id = '1890cf43-d712-40c5-b757-6b8746438433'; // Using ID from user screenshot
        console.log("Checking RPC v4 for ID:", appointment_id);

        const { data, error, status } = await supabase.rpc("get_appointment_details_v4", { p_id: appointment_id });

        if (error) {
            console.log("Error Status:", status);
            console.log("Error Message:", error.message);
            console.log("Error Details:", error.details);
            console.log("Error Hint:", error.hint);
        } else {
            console.log("RPC v4 Success!");
            if (data && data[0]) {
                const row = data[0];
                console.log("Found Data:");
                console.log("  d_duration:", row.d_duration);
                console.log("  d_config keys:", row.d_config ? Object.keys(row.d_config).join(", ") : "null");
                console.log("  d_specialty:", row.d_specialty);
            } else {
                console.log("RPC returned empty array (ID might not exist or no match found)");
            }
        }

    } catch (err) {
        console.error("Catch:", err.message);
    }
}

check();
