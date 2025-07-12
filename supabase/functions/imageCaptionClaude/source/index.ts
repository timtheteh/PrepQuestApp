// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response("Content-Type must be multipart/form-data", { status: 400 });
  }
  const formData = await req.formData();
  // Accept images as images[] (array)
  const imageEntries = formData.getAll("images[]");
  if (!imageEntries.length) {
    return new Response("No images uploaded", { status: 400 });
  }

  // Convert each image to base64 and build content blocks
  async function fileToBase64(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  // Build Claude message content array (per Anthropic vision API docs)
  const content = [];
  for (const entry of imageEntries) {
    if (!(entry instanceof File)) continue;
    const base64 = await fileToBase64(entry);
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: entry.type || "image/png",
        data: base64,
      },
    });
  }
  // Add the text prompt as a separate content block
  content.push({
    type: "text",
    text: "Give a detailed caption for these images."
  });

  // Prepare Claude API request (use latest vision model)
  const CLAUDE_API_KEY = Deno.env.get("PDF_CAPTION_CLAUDE");
  const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
  const claudePayload = {
    model: "claude-3-opus-20240229", // Use latest vision-capable model
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  };

  // Logging for debugging
  console.log("Sending payload to Claude:", JSON.stringify(claudePayload));

  const claudeRes = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(claudePayload),
  });

  if (!claudeRes.ok) {
    const errorText = await claudeRes.text();
    console.error("Claude API error:", errorText);
    return new Response(`Claude API error: ${errorText}`, { status: claudeRes.status });
  }
  const result = await claudeRes.json();
  const caption = result.content?.[0]?.text || result.completion || JSON.stringify(result);
  return new Response(JSON.stringify({ caption }), {
    headers: { "Content-Type": "application/json" },
  });
}); 