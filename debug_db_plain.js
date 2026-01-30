import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxNm0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM"; // Slightly changed key to trigger something or just retry

// Actually I'll use the same key but make sure it's valid
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
    try {
        const appointment_id = 'e344e5ca-e59c-41f0-b867-d9aa42b30cc1';
        console.log("Starting ESM JS check for appointment:", appointment_id);

        const { data: apts, error: aptError } = await supabase.from('appointments').select('*').eq('id', appointment_id);
        if (aptError) {
            console.error("Apt Error:", aptError.message);
            return;
        }

        if (apts && apts[0]) {
            const apt = apts[0];
            console.log("Apt Doctor ID:", apt.doctor_id);

            const { data: docs, error: docError } = await supabase.from('doctors').select('*').eq('id', apt.doctor_id);
            if (docError) {
                console.error("Doc Error:", docError.message);
                return;
            }

            if (docs && docs[0]) {
                const doc = docs[0];
                console.log("Doc Name:", doc.name);
                console.log("Doc Duration:", doc.default_duration);
                console.log("Doc Work Days:", JSON.stringify(doc.schedule_config?.work_days));
                console.log("Doc Hours:", JSON.stringify(doc.schedule_config?.hours));
            } else {
                console.log("Doc not found");
            }
        } else {
            console.log("Apt not found");
        }
    } catch (err) {
        console.error("Catch:", err.message);
    }
}

check();
