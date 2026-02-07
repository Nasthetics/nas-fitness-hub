import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface GenerateImageRequest {
  exerciseId: string;
  exerciseName: string;
  equipment: string;
  primaryMuscle?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { exerciseId, exerciseName, equipment, primaryMuscle } = await req.json() as GenerateImageRequest;

    if (!exerciseId || !exerciseName) {
      throw new Error('exerciseId and exerciseName are required');
    }

    // Check if image already exists in database
    const { data: existingExercise } = await supabase
      .from('exercise_library')
      .select('image_url')
      .eq('id', exerciseId)
      .single();

    if (existingExercise?.image_url) {
      return new Response(
        JSON.stringify({ imageUrl: existingExercise.image_url, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate image prompt for exercise demonstration
    const prompt = `Create a clean, professional fitness illustration showing the "${exerciseName}" exercise. 
The image should show a fit athletic person demonstrating proper form for this ${equipment} exercise${primaryMuscle ? ` targeting the ${primaryMuscle}` : ''}.
Style: Modern fitness app illustration, clean lines, muted professional colors, anatomically correct form.
View: Side or 3/4 angle to show proper body positioning.
Background: Simple gradient, non-distracting.
No text or labels in the image.`;

    console.log('Generating image for:', exerciseName);

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract base64 image from response
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response:', JSON.stringify(aiData));
      throw new Error('No image generated from AI');
    }

    // Parse base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format');
    }

    const imageFormat = base64Match[1];
    const base64Content = base64Match[2];
    const imageBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${exerciseId}.${imageFormat}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exercise-images')
      .upload(fileName, imageBytes, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update exercise_library with the image URL
    const { error: updateError } = await supabase
      .from('exercise_library')
      .update({ image_url: publicUrl })
      .eq('id', exerciseId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Don't throw - image is still accessible
    }

    console.log('Image generated and stored:', publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating exercise image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
