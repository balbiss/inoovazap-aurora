import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const aptId = "a15e2dcc-ff5f-42c6-bd15-8d30099775f1"; // The NEW ID provided by user

async function debug() {
    console.log("Checking appointment:", aptId);
    const { data: apt, error: aptErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', aptId)
        .maybeSingle();

    if (aptErr) console.error("Apt error:", aptErr);
    console.log("Appointment found:", !!apt);

    if (apt) {
        console.log("Relations IDs:", {
            patient_id: apt.patient_id,
            doctor_id: apt.doctor_id,
            instance_id: apt.instance_id
        });
    }
}

debug();
