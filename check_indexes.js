// Quick script to check if the GIN index exists
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIndexes() {
  console.log('Checking for Every.org categories indexes...')
  
  const { data, error } = await supabase
    .from('pg_indexes')
    .select('indexname, tablename, indexdef')
    .or('indexname.like.*everyorg*categories*,indexname.like.*categories*gin*')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Found indexes:', data)
  }
}

checkIndexes()