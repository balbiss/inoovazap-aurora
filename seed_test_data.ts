import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqpogexkfafsgwmaattc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcG9nZXhrZmFmc2d3bWFhdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTMwMTIsImV4cCI6MjA4NTIyOTAxMn0.W_79z1JfABhO9C7YjLgjkgYppNUYIZDI3gk3ZXifhuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
    console.log("Seeding test data...");

    // 1. Create Instance
    const { data: inst, error: instErr } = await supabase.from('instances').insert({
        company_name: "Clínica Teste",
        slug: "clinica-teste",
        user_id: "77777777-7777-7777-7777-777777777777", // dummy user_id
        pastorini_id: "test-pastorini",
        active: true
    }).select().single();
    if (instErr) { console.error("Inst error:", instErr); return; }
    console.log("Instance created:", inst.id);

    // 2. Create Doctor
    const { data: doc, error: docErr } = await supabase.from('doctors').insert({
        instance_id: inst.id,
        name: "Dr. Teste Automático",
        specialty: "Clínica Geral",
        color: "#00ff00",
        active: true
    }).select().single();
    if (docErr) { console.error("Doc error:", docErr); return; }
    console.log("Doctor created:", doc.id);

    // 3. Create Contact
    const { data: cont, error: contErr } = await supabase.from('contacts').insert({
        instance_id: inst.id,
        name: "Paciente de Teste",
        phone: "5511999999999"
    }).select().single();
    if (contErr) { console.error("Contact error:", contErr); return; }
    console.log("Contact created:", cont.id);

    // 4. Create Appointment
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    const { data: apt, error: aptErr } = await supabase.from('appointments').insert({
        instance_id: inst.id,
        doctor_id: doc.id,
        patient_id: cont.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "scheduled"
    }).select().single();
    if (aptErr) { console.error("Apt error:", aptErr); return; }
    console.log("SUCCESS! Test Appointment ID:", apt.id);
    console.log("URL to test:", `http://localhost:8081/confirmation/${apt.id}`);
}

seed();
