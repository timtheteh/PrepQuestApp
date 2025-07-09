// import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_CLOUD_VISION_API_KEY = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Parse multipart form data
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response("Content-Type must be multipart/form-data", { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("No file uploaded", { status: 400 });
  }

  // Read file as base64
  const arrayBuffer = await file.arrayBuffer();
  const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  // Prepare request to Google Cloud Vision API
  const visionUrl = `https://vision.googleapis.com/v1/files:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;
  const body = {
    requests: [
      {
        inputConfig: {
          content: base64Pdf,
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  };

  const visionRes = await fetch(visionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!visionRes.ok) {
    const error = await visionRes.text();
    return new Response(`Vision API error: ${error}`, { status: 500 });
  }

  const visionData = await visionRes.json();

  // Return the OCR result
  return new Response(JSON.stringify(visionData), {
    headers: { "Content-Type": "application/json" },
  });
}); 