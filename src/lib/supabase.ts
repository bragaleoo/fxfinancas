import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://jvgdphyibkftpsumscpm.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Z2RwaHlpYmtmdHBzdW1zY3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDc3NDIsImV4cCI6MjA4OTY4Mzc0Mn0._L5kUhViygb8OLlEATgjNyza44M4fCq6XYlvMnnJHqc';

export const supabase = createClient(supabaseUrl, supabaseKey);
