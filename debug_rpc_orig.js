import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
    const appointment_id = '1890cf43-d712-40c5-b757-6b8746438433';
    console.log("Checking ORIGINAL RPC get_appointment_details...");

    const { data, error } = await supabase.rpc("get_appointment_details", { p_id: appointment_id });

    if (error) {
        console.log("Error:", error.message, error.code, error.details);
    } else {
        console.log("Success! Data keys:", data && data[0] ? Object.keys(data[0]) : "empty");
    }
}

check();
