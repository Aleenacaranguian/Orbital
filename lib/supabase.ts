import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsugmjldxmtpswlyeemx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdWdtamxkeG10cHN3bHllZW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzU4MDMsImV4cCI6MjA2NDE1MTgwM30.VLset5GYRUQXYkRrkwByayTO9VL2_HloDB5JcdCOG2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


export const STORAGE_URL = 'https://jsugmjldxmtpswlyeemx.supabase.co/storage/v1/object/public/avatars';

