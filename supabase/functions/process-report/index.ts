import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, description } = await req.json();
    
    if (!reportId || !description) {
      console.error('Missing required fields:', { reportId, description });
      return new Response(
        JSON.stringify({ error: 'Missing reportId or description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing report:', reportId);

    // Call Gemini API
    const prompt = `You are analyzing an illegal mining (galamsey) report. Based on the following description, provide:
1. A one-sentence summary of the report
2. A category classification from these options ONLY: "Water Pollution", "Forest Destruction", "Mining Pits", or "Other"

Report description: "${description}"

Respond in this exact JSON format only:
{"summary": "your one sentence summary here", "category": "one of the four categories"}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData));

    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the JSON response from Gemini
    let aiSummary = 'Unable to generate summary';
    let aiCategory = 'Other';
    
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiSummary = parsed.summary || aiSummary;
        aiCategory = parsed.category || aiCategory;
        
        // Validate category
        const validCategories = ['Water Pollution', 'Forest Destruction', 'Mining Pits', 'Other'];
        if (!validCategories.includes(aiCategory)) {
          aiCategory = 'Other';
        }
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
    }

    console.log('AI results:', { aiSummary, aiCategory });

    // Update the report in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('galamsey_reports')
      .update({ ai_summary: aiSummary, ai_category: aiCategory })
      .eq('id', reportId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Report processed successfully');
    return new Response(
      JSON.stringify({ success: true, ai_summary: aiSummary, ai_category: aiCategory }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
