import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const ids = ["0fbce12a-39d3-4fe9-aed0-14941faebb9c", "a15e2dcc-ff5f-42c6-bd15-8d30099775f1"];

    for (const id of ids) {
        const { data, error } = await supabase.from('appointments').select('id').eq('id', id).maybeSingle();
        console.log(`ID:${id}|RESULT:${data ? 'EXISTS' : 'NOT_FOUND'}`);
        if (error) console.log(`ID:${id}|ERROR:${error.message}`);
    }
}

check();
