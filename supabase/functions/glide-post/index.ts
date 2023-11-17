// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { multiParser, Form, FormFile } from 'https://deno.land/x/multiparser@0.114.0/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabase = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { formCode, formUUID, submissionId, queryString } = await req.json();
    console.log('glide', formCode, formUUID, submissionId, queryString);

    if (!formCode || !formUUID || !submissionId || !queryString ) {
      throw Error('Invalid request body');
    }

    const glideId = Deno.env.get('glideId');
    const glideKey = Deno.env.get('glideKey');

    if (!glideId || !glideKey) {
      throw Error('Invalid glide credentials');
    }

    // Add row to glide
    const glideUrl = "https://api.glideapp.io/api/function/mutateTables";
    let glideHeader = new Headers();
    glideHeader.append("Content-Type", "application/json");
    glideHeader.append("Authorization", `Bearer ${glideKey}`);

    let devGlide = {
      "appID": glideId,
      "mutations": [{
        "kind": "add-row-to-table",
        "tableName": "native-table-gssewMxQ8N3KzZKD8zkA", // jotforms
        // "tableName": "native-table-B975cKELAX3Pgdb1heB4", // dev-jotforms
        "columnValues": {
          "9uvvj": formCode,
          "27wrg": submissionId,
          "Uvkws": formUUID,
          "Vkw2R": queryString,
          // "wvimK": formId, // dev-jotforms
        }
      }]
    }

    const requestOptions = {
      method: 'POST',
      headers: glideHeader,
      body: JSON.stringify(devGlide),
      redirect: 'follow'
    };

    const glideRes = await fetch(glideUrl, requestOptions);
    console.log('glide res', glideRes);

    if (glideRes.status !== 200 && glideRes.status !== 201) {
      const error = { status: glideRes.status, statusText: glideRes.statusText }
      throw error;
    }

    return new Response(JSON.stringify({ message: 'successfully added object', data: { formCode: formCode, formUUID: formUUID } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
  catch (error) {
    console.log('error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To deploy 
// supabase functions deploy glide-post --no-verify-jwt