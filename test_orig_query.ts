import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const id = "fe332d9d-5b19-4882-9a9a-cd7dfd2d56eb";

async function testOriginal() {
    console.log("Testing original table query for ID:", id);
    const { data, error } = await supabase
        .from("appointments")
        .select(`
            id,
            start_time,
            end_time,
            status,
            patient:contacts!appointments_patient_id_fkey(name),
            doctor:doctors!appointments_doctor_id_fkey(id, name, specialty, default_duration, schedule_config),
            instance:instances!appointments_instance_id_fkey(company_name, clinic_config)
        `)
        .eq("id", id)
        .single();

    if (error) {
        console.error("ERROR:", error.message, error.code);
    } else {
        console.log("SUCCESS:", data);
    }
}

testOriginal();
