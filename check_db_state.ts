import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabase() {
    console.log("Checking database tables...");

    const { data: instances } = await supabase.from('instances').select('id, company_name');
    console.log("Instances:", instances);

    const { data: doctors } = await supabase.from('doctors').select('id, name');
    console.log("Doctors:", doctors);

    const { data: contacts } = await supabase.from('contacts').select('id, name').limit(5);
    console.log("Contacts (first 5):", contacts);

    const { data: appointments } = await supabase.from('appointments').select('id').limit(5);
    console.log("Appointments:", appointments);
}

checkDatabase();
