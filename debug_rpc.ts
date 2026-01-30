import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const appointment_id = 'e344e5ca-e59c-41f0-b867-d9aa42b30cc1';
    console.log("Checking appointment:", appointment_id);

    const { data, error } = await supabase.rpc("get_appointment_details", { p_id: appointment_id });

    if (error) {
        console.error("RPC Error:", error);
        return;
    }

    console.log("RPC Data:", JSON.stringify(data[0], null, 2));
}

check();
