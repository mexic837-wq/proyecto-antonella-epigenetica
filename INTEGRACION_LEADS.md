# Integración: Captura de Leads (Programa de Bienestar)

Este documento está dirigido al **Desarrollador 3 (Admin / Dashboard)** y sirve como guía de integración para la captura de leads provenientes de la Landing Page.

## Contexto
En la Landing Page (`index.html`) se ha implementado una sección llamada **"Programa de Bienestar"** justo debajo del video introductorio. Esta sección funciona como un *Lead Magnet*: solicita el correo electrónico del visitante a cambio de un código de descuento (`BIENVENIDA-15`) para su primera suscripción o análisis.

Actualmente, el formulario tiene la funcionalidad visual en el Frontend (en `main.js`), pero **NO** envía los datos a ninguna base de datos ni dispara automatizaciones.

## Acciones Requeridas (Rama Admin/Backend)

Cuando se realice el merge de las ramas, el equipo de Admin y Backend debe realizar la siguiente implementación:

### 1. Endpoint para Guardar Leads
Se debe crear una API endpoint (ej. `POST /api/leads`) que reciba el correo electrónico capturado en el formulario.

### 2. Actualización de `main.js` (Frontend)
El script de envío actual en `main.js` (`// 12. Discount Hook Form Logic`) debe actualizarse para hacer un `fetch()` a la nueva API antes de mostrar el mensaje de éxito.

Ejemplo de cómo debería quedar:
```javascript
discountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('discount-email').value;
    
    // 1. Enviar a la base de datos (TODO por Backend/Admin)
    try {
        await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'landing_bienestar' })
        });
    } catch(err) {
        console.error("Error guardando lead", err);
    }

    // 2. Transición Visual (Ya implementada)
    // ...código actual de transición...
});
```

### 3. Panel de Administración
En el Dashboard de Admin, se debe crear una sección (ej. "Leads / Prospectos") donde se listen los correos capturados desde este formulario, para que el equipo de marketing de Antonella Epigenética pueda hacer seguimiento.

### 4. Automatización (Webhooks)
Al recibir el correo en el backend, se debe configurar un Webhook (ej. hacia Zapier, Make o ActiveCampaign) para disparar la secuencia de correos automáticos de bienvenida.

---
**Regla de Arquitectura:** El equipo de Landing Page (Rama Index) ha dejado lista la estructura HTML y las clases CSS. La lógica de envío de datos y gestión de base de datos corresponde exclusivamente al área de Backend/Admin.
