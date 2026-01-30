import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const aptId = "fe332d9d-5b19-4882-9a9a-cd7dfd2d56eb";

async function checkRPC() {
    console.log("Checking RPC get_appointment_details for ID:", aptId);
    const { data, error } = await supabase.rpc("get_appointment_details", { p_id: aptId });

    if (error) {
        console.error("RPC Error:", error.message);
    } else {
        console.log("RPC Data:", data);
    }
}

checkRPC();
