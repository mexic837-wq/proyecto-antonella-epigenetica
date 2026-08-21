/**
 * Supabase Simulation Layer - Zero Backend
 * Este archivo simula la futura conexión con Supabase (PostgreSQL).
 * Cuando Supabase esté configurado, solo tendrás que cambiar el contenido
 * de estas funciones para que hagan peticiones reales (fetch/axios/supabase-client)
 * y la UI seguirá funcionando sin cambios (gracias al modelo async/await).
 */

// Mock Database (Persistente en memoria durante la sesión)
let db_config = {
    // Tab 1: Textos y Contenido General
    textos: {
        bienvenida: "Bienvenido al portal médico avanzado.",
        avisoLegal: "Al usar esta plataforma aceptas nuestros términos y condiciones.",
        triaje: "Por favor, conteste las siguientes preguntas con la mayor sinceridad posible.",
        faqs: [
            { id: 1, pregunta: "¿Cómo subo mis resultados?", respuesta: "En la sección 'Mi Perfil' haz clic en 'Añadir'." },
            { id: 2, pregunta: "¿Cuánto tarda el análisis?", respuesta: "La IA procesa los PDFs en aproximadamente 5 minutos." }
        ]
    },

    // Tab 2: Planes y Facturación
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

    // Tab 3: Ajustes Clínicos
    clinicos: {
        diasLaborables: "Lunes a Viernes",
        horarioApertura: "08:00",
        horarioCierre: "18:00",
        duracionCitas: "30", // en minutos
        meetLink: "https://meet.google.com/abc-defg-hij"
    },

    // Tab 4: Comunicaciones
    comunicaciones: {
        correoBienvenida: "Hola [Nombre],\n\n¡Bienvenido/a a la clínica epigenética! Para empezar, completa tu perfil.",
        correoRecordatorio: "Hola [Nombre],\n\nTe recordamos que tienes una cita programada mañana a las [Hora]."
    }
};

window.adminServices = {
    /**
     * Simula un GET a Supabase (ej. supabase.from('config').select('*'))
     * @returns {Promise<Object>} Datos de configuración
     */
    fetchConfig: async () => {
        return new Promise((resolve) => {
            console.log('[Supabase Mock] Ejecutando SELECT...');
            setTimeout(() => {
                // Devolvemos una copia profunda para evitar mutación directa sin pasar por updateConfig
                resolve(JSON.parse(JSON.stringify(db_config)));
            }, 1000); // 1 segundo de latencia
        });
    },

    /**
     * Simula un PUT/UPDATE a Supabase (ej. supabase.from('config').update(newConfig))
     * @param {Object} newConfig - Los nuevos datos a guardar
     * @returns {Promise<boolean>} Estado del guardado
     */
    updateConfig: async (newConfig) => {
        return new Promise((resolve) => {
            console.log('[Supabase Mock] Ejecutando UPDATE...', newConfig);
            setTimeout(() => {
                // Actualizamos la base de datos simulada
                db_config = JSON.parse(JSON.stringify(newConfig));
                resolve(true);
            }, 1500); // 1.5 segundos de latencia
        });
    }
};
