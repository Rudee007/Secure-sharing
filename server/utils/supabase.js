require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_API_KEY) {
  throw new Error("Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_KEY.");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

module.exports = supabase;
