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
    // 1. Extract and verify authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create client with user's token for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { reportId, description } = await req.json();
    
    if (!reportId || !description) {
      console.error('Missing required fields:', { reportId, description });
      return new Response(
        JSON.stringify({ error: 'Missing reportId or description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verify report ownership or admin status
    const { data: report, error: reportError } = await supabaseAuth
      .from('galamsey_reports')
      .select('user_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Report not found or access denied:', reportError?.message);
      return new Response(
        JSON.stringify({ error: 'Report not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check ownership or admin status
    const { data: isAdmin } = await supabaseAuth.rpc('is_admin', { _user_id: user.id });
    if (report.user_id !== user.id && !isAdmin) {
      console.error('Access denied: user does not own report and is not admin');
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing report:', reportId);

    // Call Lovable AI Gateway
    const prompt = `You are analyzing an illegal mining (galamsey) report. Based on the following description, provide:
1. A one-sentence summary of the report
2. A category classification from these options ONLY: "Water Pollution", "Forest Destruction", "Mining Pits", or "Other"

Report description: "${description}"

Respond in this exact JSON format only:
{"summary": "your one sentence summary here", "category": "one of the four categories"}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes environmental reports and responds with JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted, please add funds' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to process with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    const responseText = aiData.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
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
      console.error('Error parsing AI response:', parseError);
    }

    console.log('AI results:', { aiSummary, aiCategory });

    // 5. Use service role for UPDATE operation (bypasses RLS)
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabaseService
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
