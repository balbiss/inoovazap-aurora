import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
    try {
        console.log("Checking for get_appointment_details_v3 existence...");

        // We can't query pg_proc directly via standard Supabase client easily without an RPC or something
        // but we can try to CALL it with a dummy UUID and see what error we get.
        // If it's a 404, it's not even registered in the API.

        const { data, error, status } = await supabase.rpc("get_appointment_details_v3", { p_id: '00000000-0000-0000-0000-000000000000' });

        console.log("Status:", status);
        if (error) {
            console.log("Error Message:", error.message);
            console.log("Error Code:", error.code);
            console.log("Error Hint:", error.hint);
        } else {
            console.log("RPC call 'succeeded' (or at least was found)");
        }

    } catch (err) {
        console.error("Catch:", err.message);
    }
}

check();
