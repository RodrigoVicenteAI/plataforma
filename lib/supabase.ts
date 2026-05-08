import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    "https://ewwsjnkksrrbqvqtbrrz.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d3Nqbmtrc3JyYnF2cXRicnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzgxOTMsImV4cCI6MjA5MzYxNDE5M30.B7awzfpCcVxqPq85Xs3IQJpRhw7lDlj1PqzU9dBEhdc"
  )
}