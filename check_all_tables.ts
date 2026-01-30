import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    console.log("Listing tables from information_schema...");
    // We can't query information_schema directly with supabase client usually
    // But we can try to query a common table like 'profiles'

    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id').limit(1);
    console.log("Profiles check:", { count: profiles?.length, error: pErr?.message });

    const { data: instances, error: iErr } = await supabase.from('instances').select('id').limit(1);
    console.log("Instances check:", { count: instances?.length, error: iErr?.message });

    const { data: appointments, error: aErr } = await supabase.from('appointments').select('id').limit(1);
    console.log("Appointments check:", { count: appointments?.length, error: aErr?.message });
}

listTables();
