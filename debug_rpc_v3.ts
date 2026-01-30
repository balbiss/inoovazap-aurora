import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    try {
        const appointment_id = 'e344e5ca-e59c-41f0-b867-d9aa42b30cc1';
        console.log("Starting check for appointment:", appointment_id);

        // Check appointment table
        const { data: apts, error: aptError } = await supabase.from('appointments').select('*').eq('id', appointment_id);
        if (aptError) {
            console.error("Appointment Select Error:", aptError.message);
        } else if (apts && apts[0]) {
            console.log("APPOINTMENT_KEYS:", Object.keys(apts[0]).sort().join(", "));
            const doctor_id = apts[0].doctor_id;
            console.log("DOCTOR_ID from appointment:", doctor_id);

            // Check doctor table
            const { data: doctors, error: docError } = await supabase.from('doctors').select('*').eq('id', doctor_id);
            if (docError) {
                console.error("Doctor Select Error:", docError.message);
            } else if (doctors && doctors[0]) {
                console.log("DOCTOR_KEYS:", Object.keys(doctors[0]).sort().join(", "));
                console.log("DOCTOR_DURATION:", doctors[0].default_duration);
                console.log("DOCTOR_CONFIG:", JSON.stringify(doctors[0].schedule_config));
            } else {
                console.log("Doctor not found with ID:", doctor_id);
            }
        } else {
            console.log("Appointment not found with ID:", appointment_id);
        }
    } catch (err) {
        console.error("Global Error:", err);
    }
}

check();
