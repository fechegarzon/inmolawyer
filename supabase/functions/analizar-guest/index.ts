// Proxy: analizar-guest → N8N (HTTPS con fallback a HTTP por IP)
const N8N_HTTPS_URL = "https://n8n.feche.xyz/webhook/analizar-guest";
const N8N_HTTP_URL = "http://157.245.126.107:5678/webhook/analizar-guest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    const body = await req.arrayBuffer();
    console.log("Received guest analysis, content-type:", contentType, "size:", body.byteLength);

    let n8nRes: Response;
    try {
      n8nRes = await fetch(N8N_HTTPS_URL, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
    } catch (_httpsErr) {
      n8nRes = await fetch(N8N_HTTP_URL, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
    }

    const responseText = await n8nRes.text();
    console.log("N8N guest analysis status:", n8nRes.status, "body:", responseText.substring(0, 200));

    return new Response(responseText, {
      status: n8nRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": n8nRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
