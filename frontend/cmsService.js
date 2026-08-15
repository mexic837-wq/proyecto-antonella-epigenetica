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
    /**
     * Obtiene la configuración del sitio. Si no existe en localStorage, inicializa con DEFAULT_CONFIG.
     */
    getSiteConfig: async () => {
        return new Promise((resolve) => {
            console.log('[cmsService] Ejecutando SELECT...');
            setTimeout(() => {
                const stored = localStorage.getItem('antonella_site_config');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        // Merge DEFAULT_CONFIG with parsed to ensure new keys (like educacion) exist
                        const merged = { ...DEFAULT_CONFIG, ...parsed };
                        // Deep merge for specific keys if needed, e.g., educacion
                        if (!merged.educacion) merged.educacion = DEFAULT_CONFIG.educacion;
                        if (!merged.promociones) merged.promociones = DEFAULT_CONFIG.promociones;
                        resolve(merged);
                    } catch (e) {
                        resolve(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
                    }
                } else {
                    localStorage.setItem('antonella_site_config', JSON.stringify(DEFAULT_CONFIG));
                    resolve(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
                }
            }, 500); // 0.5s de latencia simulada
        });
    },

    /**
     * Actualiza la configuración global del sitio.
     */
    updateSiteConfig: async (newConfig) => {
        return new Promise((resolve) => {
            console.log('[cmsService] Ejecutando UPDATE...', newConfig);
            setTimeout(() => {
                localStorage.setItem('antonella_site_config', JSON.stringify(newConfig));
                resolve(true);
            }, 500);
        });
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
     * Añade una nueva promoción
     */
    addPromocion: async (promoData) => {
        const config = await window.cmsService.getSiteConfig();
        if (!config.promociones) config.promociones = [];
        
        config.promociones.push(promoData);
        await window.cmsService.updateSiteConfig(config);
        return promoData;
    }
};
