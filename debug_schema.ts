import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    try {
        const { data, error } = await supabase.from('appointments').select('*').limit(1);
        if (error) {
            console.log("ERROR_FETCHING_APPOINTMENTS");
            console.log(JSON.stringify(error));
            return;
        }
        if (!data || data.length === 0) {
            console.log("NO_APPOINTMENTS_FOUND");
            return;
        }
        console.log("COLUMNS_START");
        console.log(Object.keys(data[0]).join(','));
        console.log("COLUMNS_END");
    } catch (e) {
        console.log("EXCEPTION_OCCURRED");
        console.log(e.message);
    }
}

check();
