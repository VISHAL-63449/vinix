import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmwqcglpzgehchxlnbte.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtd3FjZ2xwemdlaGNoeGxuYnRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMzQxNTEsImV4cCI6MjEwMTgxMDE1MX0.PuFB4pyxIYyOJibtnx9KTqEfsWNORtii1Vdsb3PbEjw';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.info('Using fallback Supabase credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

