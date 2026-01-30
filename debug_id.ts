import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const aptId = "fe332d9d-5b19-4882-9a9a-cd7dfd2d56eb";

async function check() {
    console.log("Checking for ID:", aptId);
    const { data, error } = await supabase.from('appointments').select('*').eq('id', aptId).maybeSingle();
    if (error) console.error("Error:", error);
    console.log("Data found:", !!data);
    if (data) console.log("Data:", data);

    const { data: all, error: allErr } = await supabase.from('appointments').select('id').limit(5);
    console.log("Sample IDs in DB:", all?.map(a => a.id));
}

check();
