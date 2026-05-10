import { SupabaseClient } from './supabase'

// To swap databases: replace SupabaseClient with another DatabaseClient subclass.
export const db = new SupabaseClient()
