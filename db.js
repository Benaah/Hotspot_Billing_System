import postgres from 'postgres'
import { supabase } from "src/lib/supabase.ts";

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vsgkofrpybvndnqzkfuh.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default sql