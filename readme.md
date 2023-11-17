
# Create function 

supabase functions new hello-world
supabase functions new jotform-pb088

supabase functions new jotform-pb074
supabase functions new jotform-pb093
supabase functions new jotform-pb106
supabase functions new jotform-pb111


supabase functions new jotform-pb073
supabase functions new jotform-pb105
supabase functions new jotform-pb109

supabase functions new jotform-pb087
supabase functions new jotform-pb092
supabase functions new jotform-pb127

supabase functions new glide-post


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


