import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjwrfbsrhvxeoqymjuid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd3JmYnNyaHZ4ZW9xeW1qdWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTcyNjcsImV4cCI6MjA3Nzk5MzI2N30.kcxp8jw3roj22BipmCHkt6BIy97gWeA2fRWsR5brjx4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
