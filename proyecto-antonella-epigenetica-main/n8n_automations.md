# Arquitectura de Automatización (n8n)

Este documento describe la estructura lógica de los nodos para los flujos clave en n8n de Antonella Epigenética.

## Flujo 1: Onboarding automático
**Objetivo:** Crear el usuario en el sistema una vez confirmado su pago y enviar credenciales.

1. **Trigger Node (Webhook):** Escucha eventos POST desde la pasarela de pago (ej. Stripe o PayPal). Valida que el estado del pago sea "completado".
2. **If Node (Validación):** Confirma que los datos requeridos (Email, Nombre) vienen en el payload.
3. **HTTP Request Node (Supabase Auth):** Hace una llamada a la API de Supabase Auth para crear el usuario (Create User). Genera una contraseña temporal si es necesario o un Magic Link.
4. **Postgres Node (Supabase DB):** Inserta un registro en la tabla `patients` con el `id` devuelto por Supabase Auth, Nombre y Teléfono.
5. **Postgres Node 2 (Supabase DB):** Inserta un registro inicial en la tabla `protocols` para marcar el inicio del tratamiento (start_date).
6. **Email/SMTP Node (o SendGrid/Resend):** Envía un correo electrónico de bienvenida al paciente usando una plantilla, incluyendo sus credenciales de acceso para el portal y el link hacia la vista "login" (`fronted escritorio - login` / `fronted movil - login`).

---

## Flujo 2: Motor de Retención (3 meses)
**Objetivo:** Alertar a los pacientes que su protocolo de 90 días está a punto de concluir.

1. **Cron Trigger Node:** Ejecución diaria a las 09:00 AM (hora local).
2. **Postgres Node (Supabase DB):** Consulta (SELECT) a la tabla `protocols` donde la diferencia entre `CURRENT_DATE` y `start_date` es exactamente de 80 días, y el `status` es 'active'. Haz JOIN con `patients` para obtener el email y nombre.
3. **Split in Batches Node:** (Opcional, para manejar listas largas de pacientes). Divide los resultados para procesar uno a uno.
4. **Email/SMTP Node (o SendGrid/Resend):** Envía el correo electrónico de alerta de renovación (upselling), invitando al paciente a adquirir un nuevo plan, redirigiendo a la landing page o dashboard (`fronted escritorio - dashboard`).

---

## Flujo 3: Procesamiento Inteligente de Resultados
**Objetivo:** Extraer información clave de los PDFs de laboratorio automáticamente usando IA.

1. **Supabase / Webhook Trigger Node:** Se activa cuando hay un `INSERT` en la tabla `results` (o cuando el Admin sube un PDF a Supabase Storage y activa un evento de webhook/Edge Function).
2. **HTTP Request Node (Descargar Archivo):** Utiliza la `pdf_url` provista para descargar el documento desde Supabase Storage.
3. **Read PDF Node / Extracción de texto (OCR):** Procesa el binario descargado y extrae todo el texto plano del informe de laboratorio.
4. **OpenAI Node (o similar LLM):** Envia un prompt al modelo (ej. GPT-4o) junto con el texto extraído.
   * *Prompt sugerido:* "Actúa como un médico experto. Analiza el siguiente informe de laboratorio y extrae exclusivamente en formato JSON estricto: deficiencia_vitaminas (array de strings), nivel_toxinas (string), alimentos_a_evitar (array de strings). No incluyas texto adicional."
5. **JSON Parse Node:** Transforma la respuesta de texto del LLM a un objeto JSON real.
6. **Postgres Node (Supabase DB):** Realiza un UPDATE en la tabla `results` usando el `id` original, y guarda el JSON resultante en la columna `extracted_data`.
7. **Email/SMTP Node:** Envía correo al paciente notificando que su nuevo informe de laboratorio está disponible y que puede verlo en su dashboard interactivo.
