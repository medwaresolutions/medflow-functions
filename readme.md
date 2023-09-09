
# Create function 

supabase functions new hello-world


# Deploy specfic function

supabase functions deploy hello-world

supabase functions deploy submitForm


# Deploy all functions 

supabase functions deploy


# Invoking function

curl --request POST 'https://<project_ref>.functions.supabase.co/hello-world' \
  --header 'Authorization: Bearer ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{ "name":"Functions" }'

# OR 

// https://supabase.com/docs/reference/javascript/installing
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')

const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Functions' },
})
