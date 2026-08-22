/**
 * Servicio Centralizado de Conexiones Externas
 * 
 * Este archivo conecta el frontend directamente con Supabase para guardar leads,
 * y opcionalmente notifica a n8n para disparar automatizaciones (correos de bienvenida, etc.).
 */

const CONFIG = {
    // ===== SUPABASE (Conexión Directa - Principal) =====
    SUPABASE_URL: 'https://api.antonellaepigenetica.online',
    
    // Anon Key (Firmada con la contraseña maestra real del servidor)
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',

    // ===== N8N (Automatizaciones - Secundario) =====
    N8N_WEBHOOK_URL: 'https://n8n.antonellaepigenetica.online/webhook/correo-landing-page',
    ENABLE_N8N_NOTIFICATION: true
};

/**
 * Guarda un lead directamente en Supabase (tabla 'leads')
 */
window.saveLeadToSupabase = async function(email, source = 'programa_bienestar') {
    try {
        console.log('[Supabase] Guardando lead:', email);

        const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ email, source, status: 'processed' })
        });

        if (response.ok) return { success: true };
        if (response.status === 409) return { success: true }; // Ya existía
        
        return { success: false };
    } catch (error) {
        return { success: false };
    }
};

/**
 * Notifica a n8n sobre un nuevo lead
 */
window.notifyN8n = async function(action, payload) {
    if (!CONFIG.ENABLE_N8N_NOTIFICATION) return true;
    try {
        await fetch(CONFIG.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, timestamp: new Date().toISOString(), data: payload })
        });
        return true;
    } catch (error) { return false; }
};

/**
 * Función principal
 */
window.sendToWebhook = async function(action, payload) {
    // 1. Guardar en Supabase directo
    await window.saveLeadToSupabase(payload.email, payload.origen || 'programa_bienestar');
    // 2. Notificar a n8n para el correo
    window.notifyN8n(action, payload);
    return true;
};
