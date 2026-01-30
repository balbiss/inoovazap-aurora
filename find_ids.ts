import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findValidId() {
    console.log("Fetching all appointments...");
    // Note: This might still fail if RLS is strict even for our 'anon' key in this context
    // but usually these debug scripts run with the provided key.
    const { data, error } = await supabase.from('appointments').select('id, status').limit(10);

    if (error) {
        console.error("Error fetching appointments:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Found appointments:", data);
    } else {
        console.log("No appointments found in the table.");
    }
}

findValidId();
