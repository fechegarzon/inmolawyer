const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "InmoLawyer <noreply@inmo.tools>";
const SUPABASE_URL = "https://oqipslfzbeioakfllohm.supabase.co";
const APP_URL = "https://inmo.tools/inmolawyer/app";

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
}

interface Payload {
  user: { id: string; email: string };
  email_data: EmailData;
}

function buildConfirmUrl(tokenHash: string, type: string, redirectTo: string): string {
  const params = new URLSearchParams({
    token: tokenHash,
    type,
    redirect_to: redirectTo || APP_URL,
  });
  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
}

const btn = `display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;margin:20px 0;`;
const footer = `font-size:12px;color:#9ca3af;margin-top:24px;`;
const header = `<div style="background:#16a34a;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:22px;">🏠 InmoLawyer</h1></div>`;
const wrap = (content: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">${header}<div style="padding:32px;">${content}</div></div>`;

function getEmail(payload: Payload): { subject: string; html: string } | null {
  const { email_data: d } = payload;
  const { email_action_type: type, token_hash, token_hash_new, redirect_to } = d;

  if (type === "recovery") {
    const link = buildConfirmUrl(token_hash, "recovery", redirect_to);
    return {
      subject: "Restablece tu contraseña — InmoLawyer",
      html: wrap(`
        <h2 style="color:#111827;margin-top:0;">Restablecer contraseña</h2>
        <p style="color:#374151;">Recibimos una solicitud para restablecer tu contraseña. Haz clic para continuar:</p>
        <a href="${link}" style="${btn}">Restablecer contraseña</a>
        <p style="color:#6b7280;font-size:13px;">Si no solicitaste esto, ignora este correo. El enlace expira en 1 hora.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="${footer}">Si el botón no funciona: <a href="${link}" style="color:#16a34a;word-break:break-all;">${link}</a></p>
      `),
    };
  }

  if (type === "signup") {
    const link = buildConfirmUrl(token_hash, "signup", redirect_to);
    return {
      subject: "Confirma tu cuenta — InmoLawyer",
      html: wrap(`
        <h2 style="color:#111827;margin-top:0;">¡Bienvenido a InmoLawyer!</h2>
        <p style="color:#374151;">Confirma tu correo para activar tu cuenta:</p>
        <a href="${link}" style="${btn}">Confirmar mi cuenta</a>
        <p style="color:#6b7280;font-size:13px;">El enlace expira en 24 horas.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="${footer}">Si el botón no funciona: <a href="${link}" style="color:#16a34a;word-break:break-all;">${link}</a></p>
      `),
    };
  }

  if (type === "magic_link") {
    const link = buildConfirmUrl(token_hash, "magiclink", redirect_to);
    return {
      subject: "Tu enlace de acceso — InmoLawyer",
      html: wrap(`
        <h2 style="color:#111827;margin-top:0;">Enlace de acceso rápido</h2>
        <p style="color:#374151;">Haz clic para ingresar sin contraseña (expira en 1 hora):</p>
        <a href="${link}" style="${btn}">Ingresar a InmoLawyer</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="${footer}">Si el botón no funciona: <a href="${link}" style="color:#16a34a;word-break:break-all;">${link}</a></p>
      `),
    };
  }

  if (type === "email_change_current" || type === "email_change_new") {
    const isNew = type === "email_change_new";
    const link = buildConfirmUrl(isNew ? token_hash_new : token_hash, "email_change", redirect_to);
    return {
      subject: "Confirma el cambio de email — InmoLawyer",
      html: wrap(`
        <h2 style="color:#111827;margin-top:0;">Confirmar cambio de email</h2>
        <p style="color:#374151;">Confirma tu ${isNew ? "nuevo" : "anterior"} correo:</p>
        <a href="${link}" style="${btn}">Confirmar cambio</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="${footer}">Si el botón no funciona: <a href="${link}" style="color:#16a34a;word-break:break-all;">${link}</a></p>
      `),
    };
  }

  if (type === "invite") {
    const link = buildConfirmUrl(token_hash, "invite", redirect_to);
    return {
      subject: "Te invitaron a InmoLawyer",
      html: wrap(`
        <h2 style="color:#111827;margin-top:0;">Tienes una invitación</h2>
        <p style="color:#374151;">Fuiste invitado a InmoLawyer:</p>
        <a href="${link}" style="${btn}">Aceptar invitación</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="${footer}">Si el botón no funciona: <a href="${link}" style="color:#16a34a;word-break:break-all;">${link}</a></p>
      `),
    };
  }

  console.error("Unknown email_action_type:", type);
  return null;
}

Deno.serve(async (req: Request) => {
  try {
    const payload: Payload = await req.json();
    console.log("Hook:", payload.email_data?.email_action_type, "->", payload.user?.email);

    const emailContent = getEmail(payload);
    if (!emailContent) {
      return new Response(JSON.stringify({ error: "Unknown email type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.user.email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "Resend failed", detail: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Email sent:", data.id);
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
