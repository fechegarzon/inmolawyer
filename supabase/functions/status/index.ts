// Edge Function: /status — consulta job_queue y retorna resultado cuando esté listo
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "jobId requerido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: job, error: jobError } = await supabase
    .from("job_queue")
    .select("job_id, status, contrato_id, created_at")
    .eq("job_id", jobId)
    .single();

  if (jobError || !job) {
    // Job no encontrado — puede ser que aún no se haya insertado (race condition)
    return new Response(
      JSON.stringify({ status: "processing", jobId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (job.status === "completed" && job.contrato_id) {
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos")
      .select("*")
      .eq("id", job.contrato_id)
      .single();

    if (!contratoError && contrato) {
      return new Response(
        JSON.stringify({
          status: "completed",
          jobId,
          result: {
            ...contrato,
            success: true,
            contratoId: contrato.id,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  if (job.status === "error") {
    return new Response(
      JSON.stringify({ status: "error", jobId, motivo: "Error al procesar el contrato" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ status: "processing", jobId }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
