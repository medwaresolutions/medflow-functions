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
    const formCode = 'pb093';

    const parsed = await multiParser(req);
    console.log('parsed', parsed);

    if (!parsed?.fields?.rawRequest || !parsed?.fields?.pretty) {
      throw Error('invalid request body');
    }

    const rawRequest = parsed?.fields?.rawRequest;
    const jsonRaw = rawRequest ? JSON.parse(rawRequest) : 'No raw request';

    const arrPretty = parsed?.fields?.pretty.split(', ');
    let jsonPretty = {}
    if (arrPretty) {
      arrPretty.forEach(function (property) {
        var tup = property.split(':');
        jsonPretty[tup[0]] = tup[1];
      });
    }
    const formId = parsed?.fields?.formID;
    const uuid = jsonPretty?.formuuid ? jsonPretty.formuuid : 'no uuid';
    const submissionId = parsed?.fields?.submissionID;
    let queryString = `?formCode=${formCode}`;

    const filterList = [
      "prescribersSignature",
      "DateBirth",
      "from",
      "to",
      "13thePatient",
      "andorThe",
      "date",
      "eachParameter52",
      "dateOf300",
      "discharge1328",
      "pain2",
      "degreeOf339",
      "fistulaeSymptom",
      "dateOf144",
      "dateOf146",
      "dateOf160",
      "19The",
      "date",
      "formname",
    ]

    for (const [key, value] of Object.entries(jsonRaw)) {
      if (value !== null && value !== '') {
        if (key.indexOf('q') === 0) {
          const index = key.indexOf('_');
          if (index !== -1) {
            const keySliced = key.slice(index + 1);
            let match = false;
            for (let i = 0; i < filterList.length; i++) {
              if (keySliced === filterList[i]) {
                match = true;
              }
            }
            if (!match) {
              if (keySliced === 'medicare' || keySliced === 'busNo' || keySliced === 'altNo') {
                queryString += `&${keySliced}=${value.replace(/\s/g, "")}`;
              }
              else {
                queryString += `&${keySliced}=${value}`;
              }
            }
          }
        }
      }
    }
    const jotformData = {
      formCode: formCode,
      formId: formId,
      submissionId: submissionId,
      formUUID: uuid,
      formQueryString: queryString,
      formJSON: JSON.stringify(jsonRaw),
      formContent: JSON.stringify(jsonPretty)
    }
    console.log('jotform', jotformData);

    const { data, error } = await supabase
      .from('jotforms')
      .select()
      .eq('submissionId', submissionId)

    console.log('supabase update', data, error);

    if (error) {
      throw error;
    }
    if (data && data.length > 0) {
      console.log('submissionId found', data);

      const { error } = await supabase
        .from('jotforms')
        .select()
        .update({ ...jotformData })
        .eq('submissionId', submissionId)
      // .select()
      if (error) {
        throw error;
      }
    }
    else {
      console.log('submissionId not found');
      const { error } = await supabase
        .from('jotforms')
        .insert({ ...jotformData })

      if (error) {
        console.log('supabase insert', error);
        throw error;
      }
    }

    const url = Deno.env.get('SUPABASE_URL');
    const jwtToken = Deno.env.get('SUPABASE_ANON_KEY');
    const response = await fetch(`${url}/functions/v1/glide-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        formCode: jotformData.formCode,
        formUUID: jotformData.formUUID,
        submissionId: jotformData.submissionId,
        queryString: jotformData.formQueryString,
      })
    })

    const glideRes = await response.json()
    if (!glideRes) {
      throw Error(glideRes);
    }
    return new Response(JSON.stringify({ message: 'success' }), {
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
// supabase functions deploy jotform-pb093 --no-verify-jwt