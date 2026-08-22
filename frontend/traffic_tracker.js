// traffic_tracker.js
// Algoritmo de Rastreo de Embudo de Conversión

(function() {
    // Generador básico de UUID (v4)
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Inicializar o recuperar sesión
    let sessionId = localStorage.getItem('antonella_session_id');
    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem('antonella_session_id', sessionId);
    }

    // Función para enviar el ping a Supabase
    const supabaseUrl = 'https://api.antonellaepigenetica.online/rest/v1/traffic_audit';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

    async function pingSection(sectionName) {
        try {
            await fetch(supabaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    // Usamos UPSERT: Si el session_id ya existe, lo actualiza
                    'Prefer': 'resolution=merge-duplicates, return=minimal'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    last_section: sectionName,
                    updated_at: new Date().toISOString()
                })
            });
            console.log(`[Tracker] Se registró la sección: ${sectionName}`);
        } catch (error) {
            console.error('[Tracker] Error al registrar tráfico:', error);
        }
    }

    // Configurar el Intersection Observer para detectar cuando el usuario ve una sección
    window.addEventListener('DOMContentLoaded', () => {
        // Obtenemos todos los elementos que tienen el atributo data-section
        const sections = document.querySelectorAll('[data-section]');
        
        if (sections.length === 0) {
            // Si no hay secciones con data-section pero estamos en una página, reportamos la página
            let pageName = window.location.pathname.split('/').pop() || 'index.html';
            pingSection(pageName);
            return;
        }

        // Si el usuario ve al menos el 50% de la sección, la consideramos "vista"
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionName = entry.target.getAttribute('data-section');
                    pingSection(sectionName);
                }
            });
        }, observerOptions);

        sections.forEach(sec => observer.observe(sec));
    });
})();
