// Proxy: guest-result → N8N (HTTPS con fallback a HTTP por IP)
const N8N_HTTPS_BASE = "https://n8n.feche.xyz/webhook/guest-result";
const N8N_HTTP_BASE = "http://157.245.126.107:5678/webhook/guest-result";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    console.log("Polling guest-result for token:", token?.substring(0, 8));

    let n8nRes: Response;
    try {
      n8nRes = await fetch(`${N8N_HTTPS_BASE}?token=${encodeURIComponent(token)}`, { method: "GET" });
    } catch (_httpsErr) {
      n8nRes = await fetch(`${N8N_HTTP_BASE}?token=${encodeURIComponent(token)}`, { method: "GET" });
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
