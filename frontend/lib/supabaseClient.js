import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zpekfqaxzogbitavotzt.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZWtmcWF4em9nYml0YXZvdHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTM4OTUsImV4cCI6MjA4MzM2OTg5NX0.k34-ctDserxpHuYPbxDFQPa04F-hVgLrkq3ZugZ2e20"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)  
