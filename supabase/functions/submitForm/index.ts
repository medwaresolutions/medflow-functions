// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    const { submissionId, foo, bar } = await req.json()

    console.log('json', submissionId, foo, bar);

    const glideId = Deno.env.get('glideId');
    const glideKey = Deno.env.get('glideKey');

    console.log('glideId', glideId);
    console.log('glideKey', glideKey);

    // const form = await multiParser(req);

    
    const glideUrl = "https://api.glideapp.io/api/function/mutateTables";
    let glideHeader = new Headers();
    glideHeader.append("Content-Type", "application/json");
    glideHeader.append("Authorization", `Bearer ${glideKey}`);

    const glideJson = {
      foo: foo,
      bar: bar,
    }

    let glideData = JSON.stringify({
      "appID": glideId,
      "mutations": [{
        "kind": "add-row-to-table",
        "tableName": "native-table-XDmMaMkUjGNLGU4Xqfze",
        "columnValues": {
          "5BVCk": submissionId, // "submissionId",
          "0G3wS": JSON.stringify(glideJson), // "formJson",
          "efk7F": new Date() // "dateSubmitted"
        }
      }]
    });

    const requestOptions = {
      method: 'POST',
      headers: glideHeader,
      body: glideData,
      redirect: 'follow'
    };

    const glideRes = await fetch(glideUrl, requestOptions);
    console.log('glide res', glideRes);


    const responseString = {
      message: "Form submitted",
    }


    if (glideRes) {
      return new Response(JSON.stringify(responseString), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      })
    }
  }
  catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})