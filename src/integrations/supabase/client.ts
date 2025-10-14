import { createClient } from '@supabase/supabase-js';

// Prefer environment variables but fall back to the provided project URL + anon key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bqijevhxrnekfsmvljrd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaWpldmh4cm5la2ZzbXZsanJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTkxMjksImV4cCI6MjA3NTgzNTEyOX0.kKjSc-mWSvQM-qJyQktYi9N4znniscSViLZLcxOf5S4';

export const SUPABASE_AVAILABLE = Boolean(supabaseUrl && supabaseAnonKey);

if (!SUPABASE_AVAILABLE) {
  console.info('Supabase environment variables are missing. Falling back to defaults may be insecure for production.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
