import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ategkrjxchnhdldhfvtk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0ZWdrcmp4Y2huaGRsZGhmdnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODA1MDIsImV4cCI6MjA4NzE1NjUwMn0.lR80IUkauPgY6oe3k1bWx5Y2bS4g8djN-n0--sMDPyE';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});
