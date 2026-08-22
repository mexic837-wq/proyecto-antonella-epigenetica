/**
 * cmsService.js - Zero Backend Temporal
 * Servicio puente para gestionar la configuración del sitio (CMS) usando localStorage.
 * Preparado para futura migración a Supabase.
 */

const DEFAULT_CONFIG = {
    textos: {
        bienvenida: "Bienvenido al portal médico avanzado.",
        avisoLegal: "Al usar esta plataforma aceptas nuestros términos y condiciones.",
        triaje: "Por favor, conteste las siguientes preguntas con la mayor sinceridad posible.",
        faqs: [
            { id: 1, pregunta: "¿Cómo subo mis resultados?", respuesta: "En la sección 'Mi Perfil' haz clic en 'Añadir'." },
            { id: 2, pregunta: "¿Cuánto tarda el análisis?", respuesta: "La IA procesa los PDFs en aproximadamente 5 minutos." }
        ]
    },
    planes: [
        {
            id: "basico",
            nombre: "Plan Básico",
            precio: 29,
            beneficios: ["1 Check-in mensual", "Reporte de Epigenética básico"]
        },
        {
            id: "premium",
            nombre: "Plan Premium",
            precio: 89,
            beneficios: ["Todo lo Básico", "Asistente AI 24/7", "Análisis avanzado"]
        },
        {
            id: "elite",
            nombre: "Plan Elite",
            precio: 199,
            beneficios: ["Todo lo Premium", "1 cita con Especialista", "Prioridad en laboratorio"]
        }
    ],
    clinicos: {
        diasLaborables: "Lunes a Viernes",
        horarioApertura: "08:00",
        horarioCierre: "18:00",
        duracionCitas: "30",
        meetLink: "https://meet.google.com/abc-defg-hij"
    },
    comunicaciones: {
        correoBienvenida: "Hola [Nombre],\n\n¡Bienvenido/a a la clínica epigenética! Para empezar, completa tu perfil.",
        correoRecordatorio: "Hola [Nombre],\n\nTe recordamos que tienes una cita programada mañana a las [Hora]."
    },
    educacion: {
        masterclasses: [
            {
                id: "m1_1",
                titulo: "¿Cómo actúan los precursores NAD+ en tu ADN?",
                descripcion: "Entiende la ciencia detrás del envejecimiento celular y cómo el suplemento de esta fase activa tus sirtuinas.",
                modulo: "Módulo 1",
                duracion: "12:45",
                url: "#"
            },
            {
                id: "m2_1",
                titulo: "Optimización del Ritmo Circadiano",
                descripcion: "Guía paso a paso para configurar tu habitación y horarios para lograr un sueño profundo reparador.",
                modulo: "Módulo 2",
                duracion: "08:20",
                url: "#"
            }
        ]
    },
    promociones: [
        {
            codigo: "BIENVENIDA26",
            descuento: 20,
            expiracion: "2026-12-31"
        }
    ]
};

window.cmsService = {
    getSiteConfig: async () => {
        console.log('[cmsService] Ejecutando SELECT...');
        
        // Supabase API details
        const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';
        const headers = { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' };

        // Cargar configuración local de los otros módulos
        let merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        const stored = localStorage.getItem('antonella_site_config');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                merged = { ...DEFAULT_CONFIG, ...parsed };
                if (!merged.educacion) merged.educacion = DEFAULT_CONFIG.educacion;
                if (!merged.promociones) merged.promociones = DEFAULT_CONFIG.promociones;
            } catch (e) {
                console.error('Error parseando config local', e);
            }
        } else {
            localStorage.setItem('antonella_site_config', JSON.stringify(DEFAULT_CONFIG));
        }

        // Cargar planes desde Supabase
        try {
            const res = await fetch(`${supabaseBaseUrl}/rest/v1/subscription_plans?order=price.asc`, { headers });
            if (res.ok) {
                const plansDb = await res.json();
                if (plansDb && plansDb.length > 0) {
                    merged.planes = plansDb.map(p => ({
                        id: p.id,
                        nombre: p.name,
                        precio: p.price,
                        beneficios: p.features || []
                    }));
                    console.log('[cmsService] Planes cargados de Supabase:', merged.planes);
                }
            }
        } catch (err) {
            console.error('Error cargando planes de Supabase', err);
        }

        return merged;
    },

    /**
     * Actualiza la configuración del sitio en el CMS (y en Supabase para los planes).
     */
    updateSiteConfig: async (newConfig) => {
        console.log('[cmsService] Ejecutando UPDATE...', newConfig);
        
        // Supabase API details
        const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';
        const patchHeaders = { 
            'apikey': anonKey, 
            'Authorization': `Bearer ${anonKey}`, 
            'Content-Type': 'application/json', 
            'Prefer': 'return=representation' 
        };

        // Guardar planes en Supabase
        try {
            for (const plan of newConfig.planes) {
                let updateUrl = null;

                // Match by UUID if available
                if (plan.id && plan.id.length > 20) {
                    updateUrl = `${supabaseBaseUrl}/rest/v1/subscription_plans?id=eq.${plan.id}`;
                } else {
                    // Fallback: match by name
                    updateUrl = `${supabaseBaseUrl}/rest/v1/subscription_plans?name=eq.${encodeURIComponent(plan.nombre)}`;
                }

                const patchBody = { price: plan.precio, features: plan.beneficios };
                console.log('[cmsService] PATCH:', updateUrl, patchBody);
                
                const res = await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: patchHeaders,
                    body: JSON.stringify(patchBody)
                });
                
                const responseText = await res.text();
                console.log('[cmsService] Response status:', res.status, 'Body:', responseText);
                
                if (!res.ok) {
                    console.error('[cmsService] Error Supabase:', res.status, responseText);
                } else {
                    console.log('[cmsService] Plan guardado:', plan.nombre);
                }
            }
        } catch (err) {
            console.error('[cmsService] Error de red:', err);
        }

        // Guardar resto de la config en localStorage
        localStorage.setItem('antonella_site_config', JSON.stringify(newConfig));
        
        if (typeof window.showToast === 'function') {
            window.showToast("Configuración guardada exitosamente");
        }
        return true;
    },

    /**
     * Añade una nueva masterclass al gestor de educación.
     */
    addMasterclass: async (clase) => {
        const config = await window.cmsService.getSiteConfig();
        if (!config.educacion) config.educacion = { masterclasses: [] };
        if (!config.educacion.masterclasses) config.educacion.masterclasses = [];
        
        clase.id = 'mc_' + Date.now();
        config.educacion.masterclasses.unshift(clase); // Add to the beginning
        
        await window.cmsService.updateSiteConfig(config);
        return clase;
    },

    /**
     * Obtiene promociones desde Supabase
     */
    getPromociones: async () => {
        try {
            const url = 'https://api.antonellaepigenetica.online/rest/v1/promotions?select=*&order=created_at.desc';
            const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';
            const res = await fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } });
            if (!res.ok) throw new Error('Error al obtener promociones');
            return await res.json();
        } catch(e) {
            console.error(e);
            return [];
        }
    },

    /**
     * Añade una nueva promoción a Supabase
     */
    addPromocion: async (promoData) => {
        try {
            const url = 'https://api.antonellaepigenetica.online/rest/v1/promotions';
            const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': key,
                    'Authorization': 'Bearer ' + key,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    code: promoData.codigo,
                    discount_percentage: promoData.descuento,
                    expiration_date: promoData.expiracion || null
                })
            });
            if (!res.ok) throw new Error('Error al guardar en Supabase');
            return promoData;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};
