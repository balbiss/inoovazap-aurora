
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClinic(slug) {
    const { data, error } = await supabase.rpc('get_clinic_by_slug', { p_slug: slug });
    if (error) {
        console.error('Error calling RPC:', error);
        return;
    }
    console.log('Clinic Data from RPC:', JSON.stringify(data, null, 2));
}

const slug = process.argv[2];
if (slug) {
    checkClinic(slug);
} else {
    console.log('Please provide a slug: node check_clinic.js <slug>');
}
