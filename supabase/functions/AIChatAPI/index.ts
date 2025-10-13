import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-audio-type, x-platform, x-language, x-question-context',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Map language names to Google Speech-to-Text language codes (BCP-47)
function mapLanguageToCode(language: string): string {
  const languageMap: { [key: string]: string } = {
    'English': 'en-US',
    'Chinese': 'zh-CN',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Italian': 'it-IT',
    'Portuguese': 'pt-BR',
    'Russian': 'ru-RU',
    'Japanese': 'ja-JP',
    'Korean': 'ko-KR',
    'Arabic': 'ar-SA',
    'Hindi': 'hi-IN',
    'Bengali': 'bn-BD',
    'Dutch': 'nl-NL',
    'Polish': 'pl-PL',
    'Turkish': 'tr-TR',
    'Vietnamese': 'vi-VN',
    'Thai': 'th-TH',
    'Swedish': 'sv-SE',
    'Danish': 'da-DK',
    'Norwegian': 'nb-NO',
    'Finnish': 'fi-FI',
    'Czech': 'cs-CZ',
    'Hungarian': 'hu-HU',
    'Romanian': 'ro-RO',
    'Ukrainian': 'uk-UA',
    'Greek': 'el-GR',
    'Hebrew': 'he-IL',
    'Indonesian': 'id-ID',
    'Malay': 'ms-MY',
    'Filipino': 'fil-PH'
  };
  
  return languageMap[language] || 'en-US'; // Default to English if language not found
}

// Get Google Cloud access token using service account credentials
async function getAccessToken(credentials: any): Promise<string> {
  try {
    // Ensure the private key has proper newlines
    let privateKey = credentials.private_key;
    
    // Handle both escaped and unescaped newlines
    if (typeof privateKey === 'string') {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Validate private key format
    if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Invalid private key format');
    }
    
    console.log('Creating JWT with credentials:', {
      client_email: credentials.client_email,
      token_uri: credentials.token_uri,
      private_key_length: privateKey.length,
      private_key_starts_with: privateKey.substring(0, 50)
    });
    
    // Create JWT manually using crypto.subtle
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: "RS256",
      typ: "JWT"
    };
    
    const payload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: credentials.token_uri,
      exp: now + 3600,
      iat: now
    };
    
    // Create JWT
    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const signatureInput = `${headerB64}.${payloadB64}`;
    
    // Import the private key
    const keyData = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');
    
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(signatureInput)
    );
    
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${signatureInput}.${signatureB64}`;
    
    console.log('JWT created successfully');
    
    const tokenResponse = await fetch(credentials.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error: any) {
    console.error('JWT creation error:', error);
    throw new Error(`JWT creation failed: ${error.message}`);
  }
}

// Upload audio to Google Cloud Storage
async function uploadAudioToGCS(accessToken: string, audioBlob: Blob, fileName: string, contentType: string = 'audio/wav'): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBytes = new Uint8Array(arrayBuffer);
  
  const bucketName = 'prepquest_long_audio';
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${fileName}`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': contentType
    },
    body: audioBytes
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload audio to GCS: ${response.status} ${text}`);
  }
  
  return `gs://${bucketName}/${fileName}`;
}

// Delete audio from Google Cloud Storage
async function deleteAudioFromGCS(accessToken: string, fileName: string): Promise<void> {
  const bucketName = 'prepquest_long_audio';
  const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`;
  
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok && response.status !== 404) {
    console.warn(`Failed to delete audio file from GCS: ${response.status} ${response.statusText}`);
  }
}

// Transcribe short audio (synchronous) - platform-aware
async function transcribeShortAudio(accessToken: string, audioBase64: string, platform: string = 'ios', languageCode: string = 'en-US'): Promise<string> {
  // Platform-specific audio configuration
  const config: any = {
    sampleRateHertz: 44100,
    languageCode: languageCode,
    enableAutomaticPunctuation: true,
    model: 'default'
  };
  
  // Set encoding based on platform
  if (platform === 'android') {
    // Android uses AMR-WB format (Adaptive Multi-Rate Wideband - optimized for speech)
    config.encoding = 'AMR_WB';
    config.sampleRateHertz = 16000; // AMR-WB uses 16kHz sample rate
    console.log(`Using AMR_WB encoding for Android audio (short) with language: ${languageCode}`);
  } else {
    // iOS uses LINEAR16 PCM WAV format
    config.encoding = 'LINEAR16';
    console.log(`Using LINEAR16 encoding for iOS WAV audio with language: ${languageCode}`);
  }
  
  const request = {
    config,
    audio: { content: audioBase64 }
  };
  
  let response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  // If the first attempt fails, try with automatic encoding detection (mainly for iOS fallback)
  if (!response.ok && platform !== 'android') {
    console.log(`First attempt failed for ${platform}, retrying with ENCODING_UNSPECIFIED`);
    config.encoding = 'ENCODING_UNSPECIFIED';
    response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Speech-to-text API error:', errorText);
    throw new Error(`Speech-to-text API error: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  
  if (result.results && result.results.length > 0) {
    return result.results.map((r: any) => r.alternatives[0].transcript).join(' ');
  }
  
  return 'No speech detected';
}

// Transcribe long audio (asynchronous) - platform-aware
async function transcribeLongAudio(accessToken: string, audioUri: string, platform: string = 'ios', languageCode: string = 'en-US', outputGcsUri?: string): Promise<string> {
  // Platform-specific audio configuration
  const config: any = {
    sampleRateHertz: 44100,
    languageCode: languageCode,
    enableAutomaticPunctuation: true,
    model: 'default'
  };
  
  // Set encoding based on platform
  if (platform === 'android') {
    // Android uses AMR-WB format (Adaptive Multi-Rate Wideband - optimized for speech)
    config.encoding = 'AMR_WB';
    config.sampleRateHertz = 16000; // AMR-WB uses 16kHz sample rate
    console.log(`Using AMR_WB encoding for Android audio (long) with language: ${languageCode}`);
  } else {
    // iOS uses LINEAR16 PCM WAV format
    config.encoding = 'LINEAR16';
    console.log(`Using LINEAR16 encoding for iOS WAV audio (long) with language: ${languageCode}`);
  }
  
  const request: any = {
    config,
    audio: { uri: audioUri }
  };
  
  if (outputGcsUri) {
    request.outputConfig = { gcsUri: outputGcsUri };
  }
  
  // Start long-running recognition
  let response = await fetch('https://speech.googleapis.com/v1/speech:longrunningrecognize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  // If the first attempt fails, try with automatic encoding detection (mainly for iOS fallback)
  if (!response.ok && platform !== 'android') {
    console.log(`First attempt failed for ${platform}, retrying with ENCODING_UNSPECIFIED (long audio)`);
    config.encoding = 'ENCODING_UNSPECIFIED';
    response = await fetch('https://speech.googleapis.com/v1/speech:longrunningrecognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech-to-text API error: ${response.status} ${errorText}`);
  }
  
  const operation = await response.json();
  
  if (!operation || !operation.name) {
    throw new Error(`Invalid operation response: ${JSON.stringify(operation)}`);
  }
  
  const operationName = operation.name;
  
  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max wait time
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(`https://speech.googleapis.com/v1/operations/${operationName}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to check operation status: ${statusResponse.status}`);
    }
    
    const status = await statusResponse.json();
    
    if (status.done) {
      if (status.response && status.response.results) {
        return status.response.results.map((r: any) => r.alternatives[0].transcript).join(' ');
      }
      return 'No speech detected';
    }
    
    attempts++;
  }
  
  throw new Error('Transcription timeout - operation took too long to complete');
}

// Call DeepSeek API to evaluate user's answer
async function evaluateAnswer(questionContext: string, userAnswer: string, language: string): Promise<{ concise: string; detailed: string }> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not set');
  }

  const systemPrompt = `You are a helpful educational assistant that evaluates student answers. 
Your task is to compare the user's spoken answer with the expected question context and provide constructive feedback.
Always respond in the same language as the question context (${language}).
Be encouraging and specific in your feedback.

You must respond with a JSON object containing two fields:
- "concise": A brief evaluation in 2-3 sentences
- "detailed": A comprehensive evaluation in 5-10 sentences with specific feedback and guidance

Format: {"concise": "...", "detailed": "..."}`;

  const userPrompt = `Question context: ${questionContext}

User's answer: ${userAnswer}

Evaluate the user's answer based on the question context. Provide feedback in ${language}. 
Respond with a JSON object containing:
1. "concise": Brief feedback (2-3 sentences) - be encouraging and highlight the main points
2. "detailed": Detailed feedback (5-10 sentences) - be specific about what was correct or incorrect, explain why, and provide constructive guidance for improvement

Be specific about what was correct or incorrect, and provide guidance if needed.`;

  console.log('🤖 Calling DeepSeek API for answer evaluation...');

  const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      stream: false,
      response_format: {
        type: 'json_object'
      }
    })
  });

  if (!deepseekResponse.ok) {
    const errorText = await deepseekResponse.text();
    console.error('DeepSeek API error:', errorText);
    throw new Error(`DeepSeek API error: ${deepseekResponse.status} ${errorText}`);
  }

  const deepseekData = await deepseekResponse.json();
  const rawContent = deepseekData.choices[0].message.content;
  
  console.log('✅ DeepSeek evaluation received');
  console.log('Raw content:', rawContent);
  
  try {
    const evaluation = JSON.parse(rawContent);
    
    // Validate that we have both fields
    if (!evaluation.concise || !evaluation.detailed) {
      console.warn('Missing concise or detailed field, using raw content as fallback');
      return {
        concise: evaluation.concise || rawContent,
        detailed: evaluation.detailed || rawContent
      };
    }
    
    return {
      concise: evaluation.concise,
      detailed: evaluation.detailed
    };
  } catch (parseError) {
    console.error('Failed to parse evaluation JSON:', parseError);
    // Fallback: return raw content in both fields if parsing fails
    return {
      concise: rawContent,
      detailed: rawContent
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request data
    const audioType = req.headers.get('x-audio-type') || 'short';
    const platform = req.headers.get('x-platform') || 'ios'; // Get platform info
    const language = req.headers.get('x-language') || 'English'; // Get language selection
    const contentType = req.headers.get('content-type') || '';
    
    // Get question context from header (iOS) or will be extracted from FormData (Android)
    let questionContext = req.headers.get('x-question-context');
    if (questionContext) {
      questionContext = decodeURIComponent(questionContext);
      console.log(`📝 Question context received from header (iOS): ${questionContext.substring(0, 50)}...`);
    }
    
    console.log(`Processing audio from platform: ${platform}, type: ${audioType}, language: ${language}, content-type: ${contentType}`);
    
    // Map language name to language code
    const languageCode = mapLanguageToCode(language);
    console.log(`Mapped language "${language}" to code: ${languageCode}`);

    let audioBlob: Blob;

    // Handle different content types based on platform
    if (contentType.includes('multipart/form-data')) {
      // Android sends FormData (both short and long audio)
      console.log('Parsing multipart/form-data from Android...');
      const formData = await req.formData();
      
      const audioFile = formData.get('audio');
      if (!audioFile || !(audioFile instanceof File)) {
        return new Response(JSON.stringify({ error: 'No audio file in form data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Extract question context from FormData (Android)
      const androidQuestionContext = formData.get('questionContext');
      if (androidQuestionContext && typeof androidQuestionContext === 'string') {
        questionContext = androidQuestionContext;
        console.log(`📝 Question context received from FormData (Android): ${questionContext.substring(0, 50)}...`);
      }
      
      audioBlob = audioFile;
      console.log(`Audio file received from Android (${audioType}): ${audioFile.name}, size: ${audioBlob.size}`);
    } else {
      // iOS sends raw blob data (all audio lengths)
      console.log('Parsing raw blob from iOS...');
      const arrayBuffer = await req.arrayBuffer();
      audioBlob = new Blob([arrayBuffer]);
      console.log(`Audio blob created from iOS (${audioType}): ${audioBlob.size} bytes`);
    }

    if (!audioBlob || audioBlob.size === 0) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Audio blob size: ${audioBlob.size} bytes`);

    // Validate audio type
    if (!['short', 'long'].includes(audioType)) {
      return new Response(JSON.stringify({ error: 'Invalid audio type. Must be "short" or "long"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Google Cloud credentials from environment
    const credentialsJson = Deno.env.get('GOOGLE_SPEECH_TO_TEXT_SERVICE_ACCOUNT_API_KEY_JSON');
    if (!credentialsJson) {
      throw new Error('Google Cloud credentials not found in environment variables');
    }

    const credentials = JSON.parse(credentialsJson);
    console.log('Parsed credentials:', {
      has_private_key: !!credentials.private_key,
      has_client_email: !!credentials.client_email,
      has_token_uri: !!credentials.token_uri,
      client_email: credentials.client_email,
      token_uri: credentials.token_uri,
      private_key_preview: credentials.private_key ? credentials.private_key.substring(0, 50) + '...' : 'MISSING'
    });

    // Validate credentials structure
    if (!credentials.private_key || !credentials.client_email || !credentials.token_uri) {
      throw new Error('Invalid credentials format: missing required fields');
    }

    // Get access token
    const accessToken = await getAccessToken(credentials);

    let transcript: string;

    if (audioType === 'short') {
      // Convert blob to base64 for short audio
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = encodeBase64(new Uint8Array(arrayBuffer));
      transcript = await transcribeShortAudio(accessToken, base64, platform, languageCode);
    } else {
      // For long audio, upload to Google Cloud Storage bucket
      // Use appropriate file extension and content type based on platform
      const fileExt = platform === 'android' ? 'amr' : 'wav';
      const contentType = platform === 'android' ? 'audio/amr-wb' : 'audio/wav';
      const fileName = `speech_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      try {
        // Upload audio to Google Cloud Storage
        const gcsUri = await uploadAudioToGCS(accessToken, audioBlob, fileName, contentType);

        // Transcribe using Google Cloud Storage URI
        transcript = await transcribeLongAudio(accessToken, gcsUri, platform, languageCode);
      } finally {
        // Clean up: delete audio from Google Cloud Storage
        await new Promise(resolve => setTimeout(resolve, 2000));
        await deleteAudioFromGCS(accessToken, fileName);
      }
    }

    // Call DeepSeek API to evaluate the answer if question context is provided
    let evaluationConcise: string | null = null;
    let evaluationDetailed: string | null = null;
    
    if (questionContext && transcript && transcript !== 'No speech detected') {
      try {
        console.log('📝 Question context available, calling DeepSeek for evaluation...');
        const evaluation = await evaluateAnswer(questionContext, transcript, language);
        evaluationConcise = evaluation.concise;
        evaluationDetailed = evaluation.detailed;
        console.log('✅ Received both concise and detailed evaluations');
      } catch (evalError: any) {
        console.error('Failed to get evaluation from DeepSeek:', evalError);
        // Don't fail the entire request if evaluation fails, just log and continue
        evaluationConcise = null;
        evaluationDetailed = null;
      }
    } else {
      console.log('⚠️ Skipping evaluation - missing question context or no speech detected');
    }

    return new Response(JSON.stringify({ 
      transcript, 
      evaluation: {
        concise: evaluationConcise,
        detailed: evaluationDetailed
      },
      audioType, 
      platform, 
      language, 
      languageCode,
      questionContext, // Include question context in response
      success: true 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

