import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRLS() {
    console.log("Attempting to read appointments...");
    const { data, error } = await supabase.from('appointments').select('id').limit(1);

    if (error) {
        console.error("Query Error:", error.message);
    } else {
        console.log("Query Result Data:", data);
        if (data.length === 0) {
            console.log("No data returned. This could be an empty table OR RLS blocking access.");
        }
    }
}

checkRLS();
