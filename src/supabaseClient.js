import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vdzjxqhufiipkyztiqnx.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemp4cWh1ZmlpcGt5enRpcW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDYyMTQsImV4cCI6MjEwNDI4MjIxNH0.SHl0cvBdMEosoRe9rtfGO_QCPfm9YwBjtU6XXhkSk9Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
