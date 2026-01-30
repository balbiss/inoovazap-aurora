import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: apts, error } = await supabase
        .from('appointments')
        .select('id, start_time, rescheduled_from, patient:contacts!appointments_patient_id_fkey(name)')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Recent Appointments:");
    apts.forEach(a => {
        console.log(`ID: ${a.id} | Start: ${a.start_time} | Rescheduled From: ${a.rescheduled_from} | Patient: ${a.patient?.name}`);
    });
}

check();
