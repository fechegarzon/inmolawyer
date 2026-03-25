// Proxy: analizar-contrato → N8N
// Usa HTTPS (n8n.feche.xyz) cuando el cert SSL es válido desde Supabase
// El cert expirado sólo se ve desde la red universitaria (Fortinet intercepta),
// desde Supabase (Deno Deploy / us-east-1) la conexión va directo al servidor.
const N8N_HTTPS_URL = "https://n8n.feche.xyz/webhook/analizar-contrato";
const N8N_HTTP_URL = "http://157.245.126.107:5678/webhook/analizar-contrato";

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
    console.log("Received request, content-type:", contentType, "size:", body.byteLength);

    // Intenta primero HTTPS (funciona desde Supabase sin Fortinet)
    let n8nRes: Response;
    let usedUrl = N8N_HTTPS_URL;
    try {
      n8nRes = await fetch(N8N_HTTPS_URL, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
      console.log("HTTPS call succeeded, status:", n8nRes.status);
    } catch (httpsErr) {
      // Fallback a HTTP por IP si HTTPS falla
      console.log("HTTPS failed:", httpsErr, "- falling back to HTTP IP");
      usedUrl = N8N_HTTP_URL;
      n8nRes = await fetch(N8N_HTTP_URL, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
      console.log("HTTP fallback status:", n8nRes.status);
    }

    const responseText = await n8nRes.text();
    console.log("N8N response via", usedUrl, "- status:", n8nRes.status, "body length:", responseText.length);

    // Si el body está vacío, devuelve error explícito para mejor debugging
    if (!responseText || responseText.trim() === "") {
      console.error("N8N returned empty body at", usedUrl);
      return new Response(
        JSON.stringify({ error: "N8N returned empty response", url: usedUrl, status: n8nRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
