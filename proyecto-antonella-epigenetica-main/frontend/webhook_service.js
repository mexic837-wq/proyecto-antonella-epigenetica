/**
 * Servicio Centralizado para Webhooks (Preparación para Backend / Automations)
 * 
 * Este archivo deja la estructura preparada para conectar la interfaz (Zero Backend)
 * con servicios externos reales (n8n, Make, Supabase Edge Functions, etc.) mediante Webhooks.
 */

const CONFIG = {
    // URL temporal vacía. Cuando tengan el webhook real (ej. de n8n), reemplazar aquí.
    N8N_WEBHOOK_URL: 'https://tu-servidor-n8n.com/webhook/endpoint',
    
    // Si se necesita autorización
    API_KEY: '', 
    
    // Activar o desactivar el envío real para pruebas
    ENABLE_REAL_REQUESTS: false 
};

/**
 * Función genérica para enviar datos a un Webhook
 * @param {string} action - El tipo de acción (ej. 'NUEVO_DIAGNOSTICO', 'CHECKIN_MENSUAL')
 * @param {object} payload - Los datos a enviar al webhook
 * @returns {Promise<boolean>}
 */
window.sendToWebhook = async function(action, payload) {
    const requestData = {
        action: action,
        timestamp: new Date().toISOString(),
        data: payload
    };

    console.log(`[Webhook Mock] Intentando enviar la acción: ${action}`, requestData);

    // Si la función está desactivada (modo Zero Backend actual), solo simulamos el éxito
    if (!CONFIG.ENABLE_REAL_REQUESTS) {
        console.log('[Webhook Mock] Modo simulación activo. No se realizó la petición HTTP real.');
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), 500); // Simulamos latencia de red
        });
    }

    // Código real de ejecución para cuando activen el Webhook
    try {
        const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${CONFIG.API_KEY}` // Descomentar si es necesario
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            console.error(`[Webhook Error] El servidor respondió con estado: ${response.status}`);
            return false;
        }

        const result = await response.json();
        console.log('[Webhook Success] Respuesta del servidor:', result);
        return true;

    } catch (error) {
        console.error('[Webhook Exception] Error al intentar conectar con el webhook:', error);
        return false;
    }
};

/**
 * ==========================================
 * EJEMPLOS DE USO FUTURO
 * ==========================================
 * 
 * Cuando quieras conectar un formulario real, simplemente llamas a esta función 
 * desde tus Event Listeners en main.js o admin.js, así:
 * 
 * window.sendToWebhook('NUEVO_CUPON', {
 *     codigo: 'NUEVO2024',
 *     descuento: '25%',
 *     limite: 50
 * }).then(exito => {
 *     if(exito) showToast('Enviado a n8n correctamente');
 * });
 * 
 */
