#!/bin/bash
# =====================================================
# InmoLawyer - Script de Prueba de Webhooks
# Ejecutar después de importar el workflow en n8n
# =====================================================

# Configuración - CAMBIAR ESTAS URLs por las de tu n8n.cloud
N8N_BASE_URL="https://TU-INSTANCIA.app.n8n.cloud"
# O si es local: N8N_BASE_URL="http://localhost:5678"

WEBHOOK_ANALIZAR="${N8N_BASE_URL}/webhook/analizar-contrato"
WEBHOOK_CONSULTA="${N8N_BASE_URL}/webhook/consulta-contrato"

echo "==========================================="
echo "InmoLawyer - Prueba de Webhooks"
echo "==========================================="
echo ""

# Contrato de prueba
CONTRATO_PRUEBA='CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA

Entre los suscritos, de una parte WELCOME DISTRICT SAS, sociedad comercial identificada con NIT 900.893.694-7, 
representada legalmente por CARLOS ANDRÉS MEJÍA LÓPEZ, quien en adelante se denominará EL ARRENDADOR, 
y de otra parte NATALIA NALLINO CAMACHO, mayor de edad, identificada con cédula de ciudadanía No. 1.018.494.433 
de Bogotá, quien en adelante se denominará EL ARRENDATARIO.

PRIMERA - OBJETO: EL ARRENDADOR entrega a título de arrendamiento a EL ARRENDATARIO el inmueble ubicado en 
la CARRERA 7B No. 127A-33 APARTAMENTO 302, de la ciudad de Bogotá D.C.

SEGUNDA - CANON DE ARRENDAMIENTO: El canon mensual de arrendamiento es la suma de UN MILLÓN DOSCIENTOS MIL 
PESOS M/CTE ($1.200.000), pagaderos dentro de los primeros cinco (5) días de cada mes.

TERCERA - DURACIÓN: El término del presente contrato es de DOCE (12) MESES, contados a partir del 
15 de enero de 2024.

CUARTA - DEPÓSITO: EL ARRENDATARIO entregará como depósito de garantía la suma equivalente a dos (2) 
cánones de arrendamiento, es decir $2.400.000, los cuales serán devueltos al finalizar el contrato.

QUINTA - INCREMENTO: El canon de arrendamiento se incrementará anualmente en un 15% a partir de la 
fecha de renovación del contrato.

SEXTA - SERVICIOS PÚBLICOS: EL ARRENDATARIO se obliga al pago de los servicios públicos. En caso de 
mora superior a 30 días, EL ARRENDADOR podrá suspender el suministro de agua.

En constancia se firma en Bogotá D.C., a los 10 días del mes de enero de 2024.'

echo "📋 PRUEBA 1: Analizar Contrato"
echo "URL: $WEBHOOK_ANALIZAR"
echo "-------------------------------------------"

# Crear JSON con el contrato
JSON_ANALIZAR=$(cat <<EOF
{
  "texto": $(echo "$CONTRATO_PRUEBA" | jq -Rs .)
}
EOF
)

echo "Enviando contrato de prueba..."
echo ""

RESPONSE_ANALIZAR=$(curl -s -X POST "$WEBHOOK_ANALIZAR" \
  -H "Content-Type: application/json" \
  -d "$JSON_ANALIZAR")

if [ $? -eq 0 ]; then
  echo "✅ Respuesta recibida:"
  echo "$RESPONSE_ANALIZAR" | jq . 2>/dev/null || echo "$RESPONSE_ANALIZAR"
  
  # Extraer contrato_id para la siguiente prueba
  CONTRATO_ID=$(echo "$RESPONSE_ANALIZAR" | jq -r '.contratoId // .contrato_id // empty' 2>/dev/null)
  
  if [ -n "$CONTRATO_ID" ]; then
    echo ""
    echo "📋 PRUEBA 2: Consulta sobre el contrato"
    echo "URL: $WEBHOOK_CONSULTA"
    echo "Contrato ID: $CONTRATO_ID"
    echo "-------------------------------------------"
    
    JSON_CONSULTA=$(cat <<EOF
{
  "contratoId": "$CONTRATO_ID",
  "pregunta": "¿Pueden subirme el arriendo más del IPC?"
}
EOF
)
    
    echo "Enviando pregunta..."
    echo ""
    
    RESPONSE_CONSULTA=$(curl -s -X POST "$WEBHOOK_CONSULTA" \
      -H "Content-Type: application/json" \
      -d "$JSON_CONSULTA")
    
    if [ $? -eq 0 ]; then
      echo "✅ Respuesta del chat:"
      echo "$RESPONSE_CONSULTA" | jq . 2>/dev/null || echo "$RESPONSE_CONSULTA"
    else
      echo "❌ Error al enviar consulta"
    fi
  fi
else
  echo "❌ Error al conectar con el webhook"
  echo "Verifica que:"
  echo "  1. El workflow esté activo en n8n"
  echo "  2. La URL sea correcta: $WEBHOOK_ANALIZAR"
  echo "  3. Las credenciales estén configuradas"
fi

echo ""
echo "==========================================="
echo "Prueba completada"
echo "==========================================="
