// Proxy: wompi-integrity → N8N (HTTPS con fallback a HTTP por IP)
const N8N_HTTPS_URL = "https://n8n.feche.xyz/webhook/wompi-integrity";
const N8N_HTTP_URL = "http://157.245.126.107:5678/webhook/wompi-integrity";

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
    const body = await req.json();
    console.log("Proxying integrity for reference:", body?.reference);

    let n8nRes: Response;
    try {
      n8nRes = await fetch(N8N_HTTPS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (_httpsErr) {
      n8nRes = await fetch(N8N_HTTP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const responseText = await n8nRes.text();
    return new Response(responseText, {
      status: n8nRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": n8nRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
