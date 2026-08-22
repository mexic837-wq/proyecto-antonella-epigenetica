// education.js
// Carga contenido de educación desde Supabase para el Panel de Paciente
// Separa automáticamente Videos vs PDFs en sus respectivas secciones

document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://api.antonellaepigenetica.online/rest/v1/education_content';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

    // Lógica para el Recetario Fijo
    const btnRecipe = document.getElementById('btn-read-recipe');
    if (btnRecipe) {
        btnRecipe.addEventListener('click', () => {
            if (typeof window.showToast === 'function') {
                window.showToast('Abriendo Recetario Antiinflamatorio...');
            }
            setTimeout(() => {
                window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
            }, 500);
        });
    }

    // Detectar si un archivo es PDF por su URL
    function isPdf(url) {
        if (!url) return false;
        return url.toLowerCase().includes('.pdf');
    }

    // Cargar contenido desde Supabase
    const loadEducationContent = async () => {
        const videosGrid = document.getElementById('masterclasses-grid');
        const pdfsGrid = document.getElementById('pdfs-grid');
        if (!videosGrid && !pdfsGrid) return;

        try {
            const res = await fetch(`${supabaseUrl}?order=created_at.desc`, {
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                }
            });

            if (!res.ok) throw new Error('Error cargando contenido');
            const classes = await res.json();

            // Separar videos de PDFs
            const videos = [];
            const pdfs = [];

            classes.forEach(item => {
                if (isPdf(item.media_url)) {
                    pdfs.push(item);
                } else {
                    videos.push(item);
                }
            });

            // --- Renderizar Videos en Masterclasses ---
            if (videosGrid) {
                videosGrid.innerHTML = '';

                if (videos.length === 0) {
                    videosGrid.innerHTML = `
                        <div class="col-span-full text-center py-8">
                            <span class="material-symbols-outlined text-4xl text-outline mb-2">play_circle</span>
                            <p class="text-on-surface-variant text-sm">Próximamente se publicarán nuevos videos.</p>
                        </div>`;
                } else {
                    videos.forEach(item => {
                        const thumbHtml = item.thumbnail_url
                            ? `<img src="${item.thumbnail_url}" class="w-full h-full object-cover" alt="${item.title}">`
                            : `<div class="w-full h-full bg-gradient-to-br from-surface-container to-primary/10 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-4xl text-outline">play_circle</span>
                               </div>`;

                        videosGrid.insertAdjacentHTML('beforeend', `
                        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant group hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
                            <div class="h-40 bg-surface-container relative overflow-hidden">
                                ${thumbHtml}
                                <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onclick="window.open('${item.media_url}', '_blank')">
                                    <span class="material-symbols-outlined text-white text-5xl">play_circle</span>
                                </div>
                            </div>
                            <div class="p-5 flex flex-col flex-1">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">${item.module_type || 'General'}</span>
                                <h3 class="font-bold text-on-surface text-sm mb-2">${item.title}</h3>
                                <p class="text-xs text-on-surface-variant mb-4 flex-1 line-clamp-2">${item.description}</p>
                                <button onclick="window.open('${item.media_url}', '_blank')" class="w-full py-2 bg-surface border border-outline-variant text-on-surface text-xs font-bold rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-sm">play_arrow</span> Ver Video
                                </button>
                            </div>
                        </div>`);
                    });
                }
            }

            // --- Renderizar PDFs en Guías Nutricionales ---
            if (pdfsGrid && pdfs.length > 0) {
                pdfs.forEach(item => {
                    pdfsGrid.insertAdjacentHTML('beforeend', `
                    <div class="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant group hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col h-full">
                        <div class="w-12 h-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span class="material-symbols-outlined text-2xl">picture_as_pdf</span>
                        </div>
                        <h3 class="font-bold text-on-surface text-sm mb-2">${item.title}</h3>
                        <p class="text-xs text-on-surface-variant mb-4 flex-1">${item.description}</p>
                        <button onclick="window.open('${item.media_url}', '_blank')" class="w-full py-2 bg-surface border border-outline-variant text-on-surface text-xs font-bold rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">download</span> Descargar PDF
                        </button>
                    </div>`);
                });
            }

        } catch (err) {
            console.error('Error cargando educación:', err);
        }
    };

    loadEducationContent();
});
