# InmoLawyer - Asignacion de Credenciales por Nodo

## Credenciales necesarias

| Credencial | Tipo | Configuracion |
|------------|------|---------------|
| `PostgreSQL InmoLawyer` | Postgres | Host, DB: inmolawyer, User, Pass, Port: 5432 |
| `Anthropic API` | Anthropic | API Key de Anthropic |

---

## Nodos PostgreSQL (8 nodos)

Todos estos nodos necesitan la credencial **PostgreSQL InmoLawyer**:

| # | Nombre del Nodo | Funcion |
|---|-----------------|---------|
| 1 | Guardar Contrato en BD | INSERT contrato inicial |
| 2 | Guardar Alertas en BD | INSERT alertas detectadas |
| 3 | Actualizar Estado Contrato | UPDATE estado y score |
| 4 | Guardar Incrementos en BD | INSERT incrementos IPC |
| 5 | Guardar Fechas en BD | INSERT fechas importantes |
| 6 | Obtener Resultado Final | SELECT resumen contrato |
| 7 | Obtener Contrato | SELECT contrato para chat |
| 8 | Guardar Consulta Chat | INSERT pregunta/respuesta |

---

## Nodos Anthropic (2 nodos)

Estos nodos necesitan la credencial **Anthropic API**:

| # | Nombre del Nodo | Funcion | Modelo |
|---|-----------------|---------|--------|
| 1 | Analisis IA del Contrato | Detectar clausulas abusivas | claude-sonnet-4-20250514 |
| 2 | Respuesta IA Chat | Responder preguntas legales | claude-sonnet-4-20250514 |

---

## Pasos para asignar credenciales en n8n

1. Abre el workflow importado
2. Haz clic en cada nodo de la lista
3. En el panel derecho, busca "Credential"
4. Selecciona la credencial correspondiente
5. Repite para todos los nodos
6. Guarda el workflow (Ctrl+S / Cmd+S)

---

## Verificacion rapida

Despues de asignar credenciales, verifica que:

- [ ] Los 8 nodos PostgreSQL tienen `PostgreSQL InmoLawyer`
- [ ] Los 2 nodos Anthropic tienen `Anthropic API`
- [ ] No hay nodos con icono de advertencia (triangulo amarillo)
- [ ] El workflow se puede guardar sin errores
