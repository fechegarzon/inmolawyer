#!/bin/zsh

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/.context/audits"
STAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
REPORT="${OUT_DIR}/smoke-audit-${STAMP}.md"

mkdir -p "${OUT_DIR}"

FAILURES=0

run_check() {
  local name="$1"
  local check_state="$2"
  local detail="$3"

  if [ "${check_state}" != "PASS" ]; then
    FAILURES=$((FAILURES + 1))
  fi

  {
    printf '| %s | %s | %s |\n' "${name}" "${check_state}" "${detail}"
  } >> "${REPORT}"
}

http_status() {
  local url="$1"
  curl -L -sS -o /dev/null -w "%{http_code}" --max-time 20 "${url}" 2>/dev/null || printf '000'
}

contains_text() {
  local body="$1"
  local pattern="$2"
  if printf '%s' "${body}" | grep -q "${pattern}"; then
    return 0
  fi
  return 1
}

{
  printf '# InmoLawyer Smoke Audit\n\n'
  printf '- Fecha UTC: `%s`\n' "${STAMP}"
  printf '- Ejecutado desde: `%s`\n' "${ROOT_DIR}"
  printf '\n'
  printf '| Check | Estado | Detalle |\n'
  printf '| --- | --- | --- |\n'
} > "${REPORT}"

LANDING_STATUS="$(http_status "https://inmo.tools/inmolawyer")"
if [ "${LANDING_STATUS}" = "200" ]; then
  run_check "Landing pública" "PASS" "HTTP 200"
else
  run_check "Landing pública" "FAIL" "HTTP ${LANDING_STATUS}"
fi

APP_STATUS="$(http_status "https://inmo.tools/inmolawyer/app")"
if [ "${APP_STATUS}" = "200" ]; then
  run_check "App pública" "PASS" "HTTP 200"
else
  run_check "App pública" "FAIL" "HTTP ${APP_STATUS}"
fi

CONFIG_BODY="$(curl -sS -L --max-time 20 "https://inmo.tools/inmolawyer/config.js" 2>/dev/null || true)"
if contains_text "${CONFIG_BODY}" "inmolawyer.surge.sh"; then
  run_check "Config pública sin dominio legacy" "FAIL" "config.js todavía referencia inmolawyer.surge.sh"
else
  run_check "Config pública sin dominio legacy" "PASS" "config.js apunta al dominio principal"
fi

GUEST_BODY="$(curl -sS -L --max-time 20 "https://inmo.tools/inmolawyer/guest.js" 2>/dev/null || true)"
if contains_text "${GUEST_BODY}" "inmolawyer.surge.sh"; then
  run_check "Guest pública sin dominio legacy" "FAIL" "guest.js todavía referencia inmolawyer.surge.sh"
else
  run_check "Guest pública sin dominio legacy" "PASS" "guest.js apunta al dominio principal"
fi

ANALYZE_RESPONSE="$(curl -sS -X POST "https://n8n.feche.xyz/webhook/analizar-contrato" \
  -F "file=@${ROOT_DIR}/ejemplo_contrato.txt;type=text/plain" \
  -F "user_id=00000000-0000-0000-0000-000000000001" \
  -F "user_email=smoke-test@inmolawyer.co" \
  --max-time 25 2>/dev/null || true)"

JOB_ID="$(printf '%s' "${ANALYZE_RESPONSE}" | sed -n 's/.*"job_id":"\([^"]*\)".*/\1/p')"
if [ -n "${JOB_ID}" ]; then
  run_check "Webhook análisis directo" "PASS" "job_id=${JOB_ID}"

  STATUS_RESPONSE="$(curl -sS "https://oqipslfzbeioakfllohm.supabase.co/functions/v1/status?jobId=${JOB_ID}" --max-time 20 2>/dev/null || true)"
  STATUS_VALUE="$(printf '%s' "${STATUS_RESPONSE}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
  if [ -n "${STATUS_VALUE}" ]; then
    run_check "Polling status Supabase" "PASS" "status=${STATUS_VALUE}"
  else
    run_check "Polling status Supabase" "FAIL" "Sin status legible para jobId=${JOB_ID}"
  fi
else
  SHORT_RESPONSE="$(printf '%s' "${ANALYZE_RESPONSE}" | tr '\n' ' ' | cut -c1-180)"
  run_check "Webhook análisis directo" "FAIL" "Sin job_id. Respuesta: ${SHORT_RESPONSE}"
fi

{
  printf '\n'
  if [ "${FAILURES}" -eq 0 ]; then
    printf '## Resultado\n\nPASS: todos los checks pasaron.\n'
  else
    printf '## Resultado\n\nFAIL: %s check(s) con incidencia.\n' "${FAILURES}"
  fi
} >> "${REPORT}"

printf '%s\n' "${REPORT}"

if [ "${FAILURES}" -gt 0 ]; then
  exit 1
fi
