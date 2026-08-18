# Especificaciones del Panel de Administrador

Este documento detalla las rutas, controladores (lógica backend) y endpoints de API necesarios para que el equipo de Antonella Epigenética gestione la plataforma. Estos endpoints deben interactuar directamente con Supabase y proveer la data a los frontends (específicamente la vista del dashboard de administrador si existiera o para integrarse con herramientas no-code).

## Seguridad General
Todos los endpoints detallados a continuación deben requerir autenticación JWT (Bearer Token) proveniente de Supabase Auth y deben validar que el rol del usuario (columna `role` en la tabla `patients`) sea `admin`.

---

## 1. Gestión de Pacientes

### `GET /api/admin/patients`
* **Controlador:** Obtiene la lista paginada de todos los pacientes.
* **Filtros soportados:** Búsqueda por email o nombre, filtrado por estado de protocolo activo.
* **Respuesta:** Array de objetos de la tabla `patients` junto con su protocolo actual.

### `POST /api/admin/patients`
* **Controlador:** Crea un paciente manualmente (bypass del flujo de onboarding si el admin necesita crearlo).
* **Acción:** Llama a Supabase Auth Admin API para crear usuario y luego inserta el perfil en `patients` y `protocols`.

### `PUT /api/admin/patients/:id`
* **Controlador:** Edita la información básica del paciente (teléfono, nombre, etc.) usando UPDATE en la tabla `patients`.

---

## 2. Gestión de PDFs y Resultados (Subida de Archivos)

### `POST /api/admin/patients/:id/results`
* **Controlador:**
  1. Recibe un archivo PDF (form-data o base64).
  2. Sube el archivo al bucket `patient_results` en Supabase Storage, en una ruta segura (ej. `[patient_id]/[timestamp]_informe.pdf`).
  3. Obtiene la URL pública o URL firmada del archivo.
  4. Inserta un nuevo registro en la tabla `results` con el `patient_id` y `pdf_url`. (Esto debería desencadenar el webhook para el Flujo 3 de n8n).
* **Respuesta:** Objeto del resultado creado (con la URL del PDF).

---

## 3. Gestión de "Nuevas Innovaciones" y Cross-Selling

### `GET /api/admin/novelties`
* **Controlador:** Devuelve todas las novedades, incluidas las no publicadas. (A diferencia del endpoint público que solo trae `is_published = true`).

### `POST /api/admin/novelties`
* **Controlador:** Inserta un nuevo producto o noticia en la tabla `novelties_and_products`.
* **Payload:** `{ title, description, image_url, product_url, is_published }`

### `PUT /api/admin/novelties/:id`
* **Controlador:** Actualiza los datos de la novedad. Sirve especialmente para alternar (toggle) el valor de `is_published` (Publicar/Ocultar).

### `DELETE /api/admin/novelties/:id`
* **Controlador:** Elimina un registro de la tabla `novelties_and_products`.
