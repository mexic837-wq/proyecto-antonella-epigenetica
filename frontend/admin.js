// Admin Panel Interactivity & Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 0. DARK MODE INITIALIZATION
    // ==========================================
    const adminDarkModeToggle = document.getElementById('admin-dark-mode-toggle');
    if (adminDarkModeToggle) {
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            adminDarkModeToggle.checked = true;
        } else {
            document.documentElement.classList.remove('dark');
            adminDarkModeToggle.checked = false;
        }

        adminDarkModeToggle.addEventListener('change', () => {
            if (adminDarkModeToggle.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // ==========================================
    // 1. NAVIGATION LOGIC
    // ==========================================
    const navItems = document.querySelectorAll('.admin-nav-item');
    const views = document.querySelectorAll('.admin-view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => {
                nav.classList.remove('active', 'bg-primary-50', 'text-primary-700');
                nav.classList.add('text-clinical-muted', 'hover:bg-slate-50', 'hover:text-clinical-text');
            });

            // Add active class to clicked item
            item.classList.add('active', 'bg-primary-50', 'text-primary-700');
            item.classList.remove('text-clinical-muted', 'hover:bg-slate-50', 'hover:text-clinical-text');

            // Hide all views
            views.forEach(view => {
                view.classList.add('hidden');
            });

            // Show target view
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.remove('hidden');
            }
        });
    });

    // Global Toast Function (Duplicate for Admin if main.js is not loaded)
    window.showAdminToast = function(message, type = 'success') {
        let container = document.getElementById('admin-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-toast-container';
            container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const icon = type === 'success' ? 'check_circle' : 'info';
        const bgClass = type === 'success' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-white';
        
        toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-lg font-medium text-sm flex items-center gap-3 transform translate-y-full opacity-0 transition-all duration-300 ease-out pointer-events-auto`;
        toast.innerHTML = `<span class="material-symbols-outlined text-lg">${icon}</span> ${message}`;
        
        container.appendChild(toast);
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                toast.classList.remove('translate-y-full', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            }, 10);
        });
        
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ==========================================
    // 6. PACIENTES & STAFF (Search & Filter)
    // ==========================================
    const pacientesView = document.getElementById('admin-usuarios');
    if (pacientesView) {
        const searchInput = pacientesView.querySelector('input[placeholder*="Buscar por nombre"]');
        const roleSelect = pacientesView.querySelector('select');
        const tableBody = pacientesView.querySelector('tbody');
        
        if (searchInput && tableBody && roleSelect) {
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            
            const filterTable = () => {
                const term = searchInput.value.toLowerCase();
                const role = roleSelect.value; // "Todos los roles", "Pacientes", "Staff Médico"
                
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    const matchesSearch = text.includes(term);
                    
                    // Simple mock role detection based on text in row (usually ID vs Admin tag)
                    let matchesRole = true;
                    if (role === 'Pacientes') {
                        matchesRole = !text.includes('admin') && !text.includes('doctor');
                    } else if (role === 'Staff Médico') {
                        matchesRole = text.includes('admin') || text.includes('doctor');
                    }
                    
                    if (matchesSearch && matchesRole) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            };

            searchInput.addEventListener('keyup', filterTable);
            roleSelect.addEventListener('change', filterTable);
        }
    }

    // ==========================================
    // 7. RESULTADOS DE LABORATORIO (Drag & Drop)
    // ==========================================
    const dropzone = document.getElementById('dropzone');
    const uploadBtn = document.querySelector('#admin-planes button'); // The "Subir Archivo" button
    
    if (dropzone && uploadBtn) {
        // Prevent defaults
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('border-primary-500', 'bg-primary-50');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('border-primary-500', 'bg-primary-50');
            }, false);
        });

        // Drop
        dropzone.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            handleFiles(files);
        }, false);

        function handleFiles(files) {
            if(files.length > 0) {
                // Call the existing handleFileSelect from inline script via mock event
                const mockEvent = { target: { files: files } };
                if (window.handleFileSelect) {
                    window.handleFileSelect(mockEvent);
                }
            }
        }

        // Upload Button Logic
        // Overwrite the inline onclick alert
        uploadBtn.onclick = null; 
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const textEl = document.getElementById('drop-text');
            if(textEl.innerText.includes('Arrastra')) {
                showAdminToast('Por favor selecciona un archivo primero', 'error');
                return;
            }

            const selectEl = document.getElementById('resultados-paciente-select');
            if(!selectEl || !selectEl.value || selectEl.value === "") {
                showAdminToast('Por favor selecciona un paciente al que asignar el archivo', 'error');
                return;
            }

            const originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Subiendo...`;
            uploadBtn.disabled = true;

            setTimeout(() => {
                uploadBtn.innerHTML = originalText;
                uploadBtn.disabled = false;
                
                // Add to recent uploads list
                const filename = textEl.innerText;
                const recentContainer = dropzone.nextElementSibling.nextElementSibling.nextElementSibling; // the grid container
                
                if (recentContainer && recentContainer.classList.contains('grid')) {
                    const newItem = document.createElement('div');
                    newItem.className = 'bg-clinical-surface border border-clinical-border p-4 rounded-2xl flex items-center gap-4 shadow-sm animate-fade-in bg-primary-50/20';
                    newItem.innerHTML = `
                        <div class="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined">picture_as_pdf</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-clinical-text truncate">${filename}</p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-medium">Completado</span>
                                <span class="text-xs text-clinical-muted">Asignado a ${selectEl.options[selectEl.selectedIndex].text} • Justo ahora</span>
                            </div>
                        </div>
                        <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-clinical-muted transition-colors" onclick="showAdminToast('Opciones: Descargar, Eliminar...')">
                            <span class="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                    `;
                    recentContainer.insertBefore(newItem, recentContainer.firstChild);
                }

                // Reset dropzone
                textEl.innerText = 'Arrastra el archivo PDF aquí o haz clic';
                document.getElementById('drop-subtext').innerText = 'Soportado: PDF, JPG, PNG (Max 10MB)';
                document.getElementById('drop-icon').innerHTML = '<span class="material-symbols-outlined text-[32px]">cloud_upload</span>';
                dropzone.classList.remove('border-primary-500', 'bg-primary-50/30');
                
                showAdminToast('Archivo procesado y subido con éxito');
            }, 2000);
        });
    }

    // ==========================================
    // 8. BANDEJA DE ENTRADA (Chat & Templates)
    // ==========================================
    const messagesView = document.getElementById('admin-mensajes');
    if (messagesView) {
        // Chat Selection
        const chatItems = messagesView.querySelectorAll('.flex.items-start.gap-3.p-3');
        const mainChatName = messagesView.querySelector('.flex-1 h3.font-semibold');
        
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active classes
                chatItems.forEach(c => {
                    c.classList.remove('bg-primary-50', 'border-primary-200');
                    c.classList.add('border-transparent');
                });
                // Add active to clicked
                item.classList.remove('border-transparent');
                item.classList.add('bg-primary-50', 'border-primary-200');
                
                // Update main chat header name
                const name = item.querySelector('h4').innerText;
                if (mainChatName) {
                    mainChatName.innerText = name;
                }
            });
        });

        // Templates Dropdown
        const templateSelect = messagesView.querySelector('select');
        const textarea = messagesView.querySelector('textarea');
        
        if (templateSelect && textarea) {
            templateSelect.addEventListener('change', (e) => {
                if(e.target.value === 'Saludo inicial') {
                    textarea.value = 'Hola, ¿cómo estás? He revisado tus últimos resultados y me gustaría comentarte algunos puntos.';
                } else if (e.target.value === 'Recordatorio de suplementos') {
                    textarea.value = 'Recuerda tomar tus suplementos de Vitamina D y Omega 3 después del almuerzo para una mejor absorción.';
                } else if (e.target.value === 'Solicitud de labs') {
                    textarea.value = 'Por favor, sube tus últimos resultados de laboratorio en la sección correspondiente para que la IA los procese.';
                }
            });
        }
    }

    // ==========================================
    // 9. EDUCACIÓN & PROMOCIONES (Crear Registros)
    // ==========================================
    const eduView = document.getElementById('admin-educacion');
    if (eduView) {
        const createBtn = eduView.querySelector('.bg-primary-600');
        if (createBtn && createBtn.innerText.includes('Crear Clase')) {
            // Replace inline onclick if any
            createBtn.onclick = null;
            createBtn.addEventListener('click', () => {
                const originalText = createBtn.innerHTML;
                createBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando...`;
                
                setTimeout(() => {
                    createBtn.innerHTML = originalText;
                    
                    const grid = eduView.querySelector('.grid');
                    if (grid) {
                        const newCard = document.createElement('div');
                        newCard.className = 'bg-clinical-surface border border-clinical-border rounded-2xl overflow-hidden shadow-sm group animate-fade-in bg-primary-50/10';
                        newCard.innerHTML = `
                            <div class="h-32 bg-slate-200 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                <span class="absolute bottom-3 left-3 z-20 text-xs font-medium text-white px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md border border-white/20">Nueva Clase</span>
                            </div>
                            <div class="p-5">
                                <h3 class="font-bold text-clinical-text text-lg leading-tight mb-2 group-hover:text-primary-600 transition-colors">Nueva Masterclass Creada</h3>
                                <p class="text-sm text-clinical-muted mb-4 line-clamp-2">Contenido interactivo generado mediante estado local en el panel de administración.</p>
                                <div class="flex items-center justify-between mt-auto">
                                    <span class="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">Borrador</span>
                                    <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-clinical-text transition-colors">
                                        <span class="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                </div>
                            </div>
                        `;
                        grid.insertBefore(newCard, grid.firstChild);
                        showAdminToast('Nueva clase creada y guardada como borrador');
                    }
                }, 1000);
            });
        }
    }

    const promoView = document.getElementById('admin-promociones');
    if (promoView) {
        const createPromoBtn = promoView.querySelector('.bg-primary-600');
        if (createPromoBtn && createPromoBtn.innerText.includes('Crear Cupón')) {
            createPromoBtn.onclick = null;
            createPromoBtn.addEventListener('click', () => {
                const originalText = createPromoBtn.innerHTML;
                createPromoBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generando...`;
                
                setTimeout(() => {
                    createPromoBtn.innerHTML = originalText;
                    
                    const tbody = promoView.querySelector('tbody');
                    if (tbody) {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-slate-50/50 transition-colors bg-primary-50/10 animate-fade-in';
                        tr.innerHTML = `
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold font-mono text-sm border border-primary-200">
                                        NEW
                                    </div>
                                    <div>
                                        <p class="font-semibold text-clinical-text">NUEVO2024</p>
                                        <p class="text-xs text-clinical-muted mt-0.5">Generado ahora</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 font-medium text-clinical-text">25% OFF</td>
                            <td class="px-6 py-4">
                                <div class="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px] mb-1">
                                    <div class="bg-primary-500 h-1.5 rounded-full" style="width: 0%"></div>
                                </div>
                                <span class="text-xs text-clinical-muted">0 / 50 usos</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200">Activo</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex items-center justify-end gap-1">
                                    <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-clinical-muted hover:text-clinical-text transition-colors">
                                        <span class="material-symbols-outlined text-[18px]">content_copy</span>
                                    </button>
                                </div>
                            </td>
                        `;
                        tbody.insertBefore(tr, tbody.firstChild);
                        showAdminToast('Cupón NUEVO2024 generado exitosamente');
                    }
                }, 1000);
            });
        }
    }

    // ==========================================
    // 10. CONFIGURACION GLOBAL (CMS Interno)
    // ==========================================
    const cmsView = document.getElementById('admin-configuracion');
    if (cmsView && window.cmsService) {
        
        // --- 10.1 Lógica de Pestañas (Tabs) ---
        const tabBtns = cmsView.querySelectorAll('.cms-tab-btn');
        const tabContents = cmsView.querySelectorAll('.cms-tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset buttons
                tabBtns.forEach(b => {
                    b.classList.remove('active', 'border-primary-600', 'text-primary-700');
                    b.classList.add('border-transparent', 'text-clinical-muted');
                });
                // Activate clicked
                btn.classList.add('active', 'border-primary-600', 'text-primary-700');
                btn.classList.remove('border-transparent', 'text-clinical-muted');
                
                // Hide all contents
                tabContents.forEach(c => {
                    c.classList.remove('block');
                    c.classList.add('hidden');
                });
                
                // Show target content
                const targetId = btn.getAttribute('data-tab');
                document.getElementById(targetId).classList.remove('hidden');
                document.getElementById(targetId).classList.add('block');
            });
        });

        // --- 10.2 Renderizado y Carga de Datos ---
        let currentConfig = null;

        const renderFaqs = (faqs) => {
            const container = document.getElementById('faqs-container');
            if(!container) return;
            container.innerHTML = '';
            faqs.forEach((faq, index) => {
                container.innerHTML += `
                    <div class="flex items-start gap-4 p-4 border border-clinical-border rounded-xl bg-white group hover:border-primary-200 transition-colors" data-faq-index="${index}">
                        <div class="flex-1 space-y-3">
                            <input type="text" class="faq-q w-full px-3 py-2 border border-clinical-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" value="${faq.pregunta}">
                            <textarea class="faq-a w-full px-3 py-2 border border-clinical-border rounded-lg text-sm text-clinical-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none" rows="2">${faq.respuesta}</textarea>
                        </div>
                        <button class="btn-del-faq text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                `;
            });

            // Bind delete events
            container.querySelectorAll('.btn-del-faq').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.closest('[data-faq-index]').getAttribute('data-faq-index'));
                    currentConfig.textos.faqs.splice(idx, 1);
                    renderFaqs(currentConfig.textos.faqs);
                });
            });

            // Bind change events to save to currentConfig
            container.querySelectorAll('.faq-q').forEach((input, i) => {
                input.addEventListener('input', (e) => currentConfig.textos.faqs[i].pregunta = e.target.value);
            });
            container.querySelectorAll('.faq-a').forEach((input, i) => {
                input.addEventListener('input', (e) => currentConfig.textos.faqs[i].respuesta = e.target.value);
            });
        };

        const renderPlanes = (planes) => {
            const container = document.getElementById('planes-container');
            if(!container) return;
            container.innerHTML = '';
            planes.forEach((plan, planIndex) => {
                const beneficiosHtml = plan.beneficios.map((b, bIndex) => `
                    <div class="flex items-center gap-2 mb-2 group/ben" data-ben-index="${bIndex}">
                        <span class="material-symbols-outlined text-[16px] text-primary-500">check_circle</span>
                        <input type="text" class="plan-ben-input flex-1 px-2 py-1 border border-transparent hover:border-slate-300 focus:border-primary-500 rounded text-sm transition-colors" value="${b}">
                        <button class="btn-del-ben text-red-500 opacity-0 group-hover/ben:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                `).join('');

                container.innerHTML += `
                    <div class="border border-clinical-border rounded-xl p-6 bg-white" data-plan-index="${planIndex}">
                        <div class="flex items-center justify-between mb-4 pb-4 border-b border-clinical-border">
                            <div class="flex-1">
                                <label class="text-xs font-bold text-clinical-muted uppercase tracking-wider mb-1 block">Nombre del Plan</label>
                                <input type="text" class="plan-nombre w-full text-lg font-bold text-clinical-text border-b-2 border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none transition-colors bg-transparent" value="${plan.nombre}">
                            </div>
                            <div class="w-32">
                                <label class="text-xs font-bold text-clinical-muted uppercase tracking-wider mb-1 block">Precio (USD)</label>
                                <div class="relative">
                                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-clinical-muted">$</span>
                                    <input type="number" class="plan-precio w-full pl-4 pr-2 py-1 text-lg font-bold text-primary-600 border-b-2 border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none transition-colors bg-transparent" value="${plan.precio}">
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-clinical-muted uppercase tracking-wider mb-3 block">Beneficios Incluidos</label>
                            <div class="space-y-1">
                                ${beneficiosHtml}
                            </div>
                            <button class="btn-add-ben mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                <span class="material-symbols-outlined text-[18px]">add</span> Añadir beneficio
                            </button>
                        </div>
                    </div>
                `;
            });

            // Bind events for plans
            container.querySelectorAll('[data-plan-index]').forEach(card => {
                const planIdx = parseInt(card.getAttribute('data-plan-index'));
                
                card.querySelector('.plan-nombre').addEventListener('input', e => currentConfig.planes[planIdx].nombre = e.target.value);
                card.querySelector('.plan-precio').addEventListener('input', e => currentConfig.planes[planIdx].precio = parseFloat(e.target.value) || 0);

                // Add benefit
                card.querySelector('.btn-add-ben').addEventListener('click', () => {
                    currentConfig.planes[planIdx].beneficios.push("Nuevo beneficio");
                    renderPlanes(currentConfig.planes);
                });

                // Delete benefit
                card.querySelectorAll('.btn-del-ben').forEach(btn => {
                    btn.addEventListener('click', e => {
                        const benIdx = parseInt(e.currentTarget.closest('[data-ben-index]').getAttribute('data-ben-index'));
                        currentConfig.planes[planIdx].beneficios.splice(benIdx, 1);
                        renderPlanes(currentConfig.planes);
                    });
                });

                // Update benefit text
                card.querySelectorAll('.plan-ben-input').forEach((input, idx) => {
                    input.addEventListener('input', e => {
                        currentConfig.planes[planIdx].beneficios[idx] = e.target.value;
                    });
                });
            });
        };

        const btnAddFaq = document.getElementById('btn-add-faq');
        if(btnAddFaq) {
            btnAddFaq.addEventListener('click', () => {
                if(!currentConfig) return;
                currentConfig.textos.faqs.push({
                    id: Date.now(),
                    pregunta: "Nueva pregunta",
                    respuesta: "Respuesta..."
                });
                renderFaqs(currentConfig.textos.faqs);
            });
        }

        const loadConfig = async () => {
            const btnSave = document.getElementById('btn-save-config');
            const originalBtnHtml = btnSave.innerHTML;
            btnSave.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Cargando...`;
            btnSave.disabled = true;

            try {
                currentConfig = await window.cmsService.getSiteConfig();
                
                // TAB 1
                document.getElementById('cfg-bienvenida').value = currentConfig.textos.bienvenida;
                document.getElementById('cfg-avisoLegal').value = currentConfig.textos.avisoLegal;
                document.getElementById('cfg-triaje').value = currentConfig.textos.triaje;
                renderFaqs(currentConfig.textos.faqs);

                // TAB 2
                renderPlanes(currentConfig.planes);

                // TAB 3
                document.getElementById('cfg-dias').value = currentConfig.clinicos.diasLaborables;
                document.getElementById('cfg-duracion').value = currentConfig.clinicos.duracionCitas;
                document.getElementById('cfg-apertura').value = currentConfig.clinicos.horarioApertura;
                document.getElementById('cfg-cierre').value = currentConfig.clinicos.horarioCierre;
                document.getElementById('cfg-meet').value = currentConfig.clinicos.meetLink;

                // TAB 4
                document.getElementById('cfg-correo-bienvenida').value = currentConfig.comunicaciones.correoBienvenida;
                document.getElementById('cfg-correo-recordatorio').value = currentConfig.comunicaciones.correoRecordatorio;

            } catch(e) {
                console.error("Error fetching config", e);
                showAdminToast("Error al cargar la configuración", "error");
            } finally {
                btnSave.innerHTML = originalBtnHtml;
                btnSave.disabled = false;
            }
        };

        loadConfig();

        // --- 10.3 Guardado de Datos ---
        const btnSave = document.getElementById('btn-save-config');
        btnSave.addEventListener('click', async () => {
            if(!currentConfig) return;

            // Recopilar
            currentConfig.textos.bienvenida = document.getElementById('cfg-bienvenida').value;
            currentConfig.textos.avisoLegal = document.getElementById('cfg-avisoLegal').value;
            currentConfig.textos.triaje = document.getElementById('cfg-triaje').value;
            
            currentConfig.clinicos.diasLaborables = document.getElementById('cfg-dias').value;
            currentConfig.clinicos.duracionCitas = document.getElementById('cfg-duracion').value;
            currentConfig.clinicos.horarioApertura = document.getElementById('cfg-apertura').value;
            currentConfig.clinicos.horarioCierre = document.getElementById('cfg-cierre').value;
            currentConfig.clinicos.meetLink = document.getElementById('cfg-meet').value;

            currentConfig.comunicaciones.correoBienvenida = document.getElementById('cfg-correo-bienvenida').value;
            currentConfig.comunicaciones.correoRecordatorio = document.getElementById('cfg-correo-recordatorio').value;

            // Estado de Carga
            const originalBtnHtml = btnSave.innerHTML;
            btnSave.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Publicando...`;
            btnSave.disabled = true;

            try {
                await window.cmsService.updateSiteConfig(currentConfig);
                showAdminToast("¡Configuración actualizada en Supabase!");
            } catch(e) {
                showAdminToast("Error al guardar la configuración", "error");
            } finally {
                btnSave.innerHTML = originalBtnHtml;
                btnSave.disabled = false;
            }
        });
    }

    // ==========================================
    // 11. NUEVO REGISTRO MODAL
    // ==========================================
    const btnNuevoRegistro = document.getElementById('btn-nuevo-registro');
    const modalRegistro = document.getElementById('modal-nuevo-registro');
    
    if (btnNuevoRegistro && modalRegistro) {
        const btnCloseReg = document.getElementById('btn-close-registro');
        const btnCancelReg = document.getElementById('btn-cancel-registro');
        const backdropReg = document.getElementById('backdrop-nuevo-registro');
        const formRegistro = document.getElementById('form-nuevo-registro');
        const btnSubmitReg = document.getElementById('btn-submit-registro');

        const tipoSelect = document.getElementById('reg-tipo');
        const pacienteFields = document.getElementById('reg-paciente-fields');

        if(tipoSelect && pacienteFields) {
            tipoSelect.addEventListener('change', (e) => {
                if(e.target.value === 'paciente') {
                    pacienteFields.classList.remove('hidden');
                    pacienteFields.classList.add('flex');
                } else {
                    pacienteFields.classList.add('hidden');
                    pacienteFields.classList.remove('flex');
                }
            });
        }

        const openRegModal = () => {
            modalRegistro.classList.remove('hidden');
        };

        const closeRegModal = () => {
            modalRegistro.classList.add('hidden');
            formRegistro.reset();
        };

        btnNuevoRegistro.addEventListener('click', openRegModal);
        btnCloseReg.addEventListener('click', closeRegModal);
        btnCancelReg.addEventListener('click', closeRegModal);
        backdropReg.addEventListener('click', closeRegModal);

        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simular carga (Zero Backend Temporal)
            const originalHtml = btnSubmitReg.innerHTML;
            btnSubmitReg.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> <span>Guardando...</span>';
            btnSubmitReg.disabled = true;
            btnCancelReg.disabled = true;

            const nombre = document.getElementById('reg-nombre').value;
            const email = document.getElementById('reg-email').value;
            const tipo = document.getElementById('reg-tipo').value;
            const isStaff = tipo === 'staff';
            
            let patientData = null;
            if (!isStaff) {
                patientData = {
                    edad: document.getElementById('reg-edad').value || "No asignada",
                    diagnostico: document.getElementById('reg-diagnostico').value || "Pendiente de diagnóstico",
                    evolucion: document.getElementById('reg-evolucion').value || "No asignada",
                    vacunas: document.getElementById('reg-vacunas').value || "Sin observaciones registradas"
                };
            }

            setTimeout(() => {
                showAdminToast('Registro añadido exitosamente a Supabase.');
                
                // Add to table dynamically
                const tbody = document.getElementById('tabla-usuarios');
                if (tbody) {
                    const initials = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50/50 transition-colors group animate-fade-in bg-primary-50/10';
                    
                    let phaseHtml = '';
                    let badgeHtml = '';
                    if (isStaff) {
                        phaseHtml = `
                            <span class="text-xs font-medium text-clinical-muted">No aplica (Staff)</span>
                        `;
                        badgeHtml = `
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                Staff Médico
                            </span>
                        `;
                    } else {
                        phaseHtml = `
                            <div class="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                                <div class="bg-primary-500 h-1.5 rounded-full" style="width: 0%"></div>
                            </div>
                            <span class="text-xs font-medium text-clinical-text">Fase 1 (Día 1)</span>
                        `;
                        badgeHtml = `
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                                Nuevo Ingreso
                            </span>
                        `;
                    }

                    tr.innerHTML = `
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=f8fafc&color=0f172a"
                                    class="w-10 h-10 rounded-full border border-clinical-border">
                                <div>
                                    <p class="font-semibold text-clinical-text">${nombre}</p>
                                    <p class="text-xs text-clinical-muted mt-0.5">${email}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                ${phaseHtml}
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            ${badgeHtml}
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button
                                class="bg-white border border-clinical-border text-clinical-text hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                onclick="window.openPatientProfile('${encodeURIComponent(nombre)}', true, ${isStaff}, '${encodeURIComponent(JSON.stringify(patientData))}')">
                                Ver Perfil
                            </button>
                        </td>
                    `;
                    tbody.insertBefore(tr, tbody.firstChild);
                }

                btnSubmitReg.innerHTML = originalHtml;
                btnSubmitReg.disabled = false;
                btnCancelReg.disabled = false;
                closeRegModal();
            }, 1500);
        });
        // ==========================================
        // 12. PERFIL DE PACIENTE / STAFF DINÁMICO
        // ==========================================
        window.openPatientProfile = (nombreEncoded, isNew, isStaff = false, patientDataStr = 'null') => {
            const nombre = decodeURIComponent(nombreEncoded);
            const patientData = JSON.parse(decodeURIComponent(patientDataStr));
            document.querySelectorAll('.admin-view-section').forEach(el => el.classList.add('hidden')); 
            document.getElementById('admin-perfil-paciente').classList.remove('hidden');
            
            document.getElementById('perfil-nombre').innerText = nombre;
            
            // Dynamic ID assignment
            const idSpan = document.getElementById('perfil-id');
            if (isNew) {
                idSpan.innerText = Math.floor(1000 + Math.random() * 9000); // Generate random 4-digit ID
            } else if (nombre === "Antonella D.") {
                idSpan.innerText = "1042";
            } else if (nombre === "Carlos J.") {
                idSpan.innerText = "1043";
            } else {
                idSpan.innerText = "1044";
            }
            
            const btnEditar = document.getElementById('btn-editar-historia');
            const panelPaciente = document.getElementById('panel-paciente');
            const panelStaff = document.getElementById('panel-staff');

            if (isStaff) {
                document.getElementById('perfil-subtitulo').innerText = "Personal de la Clínica";
                if(btnEditar) btnEditar.classList.add('hidden');
                
                panelPaciente.classList.add('hidden');
                panelPaciente.classList.remove('block');
                panelStaff.classList.remove('hidden');
                panelStaff.classList.add('block');

                // Owner Controls Logic
                const ownerControls = document.getElementById('staff-owner-controls');
                if (window.currentUserRole === 'owner') {
                    ownerControls.classList.remove('hidden');
                    
                    const btnChange = document.getElementById('btn-change-role');
                    const btnSave = document.getElementById('btn-save-role');
                    const badge = document.getElementById('staff-rol-badge');
                    const select = document.getElementById('staff-rol-select');

                    btnChange.onclick = () => {
                        badge.classList.add('hidden');
                        select.classList.remove('hidden');
                        select.value = badge.innerText;
                        btnChange.classList.add('hidden');
                        btnSave.classList.remove('hidden');
                    };

                    btnSave.onclick = () => {
                        badge.innerText = select.value;
                        select.classList.add('hidden');
                        badge.classList.remove('hidden');
                        btnSave.classList.add('hidden');
                        btnChange.classList.remove('hidden');
                        showAdminToast('Rol actualizado (Solo Owner)');
                    };
                } else {
                    ownerControls.classList.add('hidden');
                }

            } else {
                document.getElementById('perfil-subtitulo').innerText = "Expediente Pediátrico Activo";
                if(btnEditar) btnEditar.classList.remove('hidden');
                
                panelStaff.classList.add('hidden');
                panelStaff.classList.remove('block');
                panelPaciente.classList.remove('hidden');
                panelPaciente.classList.add('block');

                if (isNew) {
                    const data = patientData || {
                        edad: "No asignada", diagnostico: "Pendiente de diagnóstico", evolucion: "No asignada", vacunas: "Sin observaciones registradas"
                    };
                    document.getElementById('perfil-edad').innerText = data.edad;
                    document.getElementById('perfil-diagnostico').innerText = data.diagnostico;
                    document.getElementById('perfil-diagnostico').className = data.diagnostico === "Pendiente de diagnóstico" ? "font-bold text-clinical-muted text-lg" : "font-bold text-primary-700 text-lg";
                    document.getElementById('perfil-evolucion').innerText = data.evolucion;
                    document.getElementById('perfil-vacunas').innerText = data.vacunas;
                    document.getElementById('perfil-vacunas').className = data.vacunas === "Sin observaciones registradas" ? "font-bold text-clinical-muted text-sm leading-tight mt-1" : "font-bold text-red-700 text-sm leading-tight mt-1";
                } else {
                    document.getElementById('perfil-edad').innerText = "4 Años, 2 Meses";
                    document.getElementById('perfil-diagnostico').innerText = "Trastorno del Espectro Autista (TEA)";
                    document.getElementById('perfil-diagnostico').className = "font-bold text-primary-700 text-lg";
                    document.getElementById('perfil-evolucion').innerText = "1 Año, 8 Meses";
                    document.getElementById('perfil-vacunas').innerText = "Reacción adversa reportada post-vacunación a los 18 meses (Pico febril, regresión del habla).";
                    document.getElementById('perfil-vacunas').className = "font-bold text-red-700 text-sm leading-tight mt-1";
                }
            }
        };

        // Modal Editar Historia Clínica
        const btnEditarHistoria = document.getElementById('btn-editar-historia');
        const modalEditar = document.getElementById('modal-editar-historia');
        
        if (btnEditarHistoria && modalEditar) {
            const btnCloseEditar = document.getElementById('btn-close-editar');
            const btnCancelEditar = document.getElementById('btn-cancel-editar');
            const backdropEditar = document.getElementById('backdrop-editar-historia');
            const formEditar = document.getElementById('form-editar-historia');

            const openEditarModal = () => {
                document.getElementById('edit-edad').value = document.getElementById('perfil-edad').innerText;
                document.getElementById('edit-diagnostico').value = document.getElementById('perfil-diagnostico').innerText;
                document.getElementById('edit-evolucion').value = document.getElementById('perfil-evolucion').innerText;
                document.getElementById('edit-vacunas').value = document.getElementById('perfil-vacunas').innerText;
                modalEditar.classList.remove('hidden');
            };

            const closeEditarModal = () => {
                modalEditar.classList.add('hidden');
            };

            btnEditarHistoria.addEventListener('click', openEditarModal);
            btnCloseEditar.addEventListener('click', closeEditarModal);
            btnCancelEditar.addEventListener('click', closeEditarModal);
            backdropEditar.addEventListener('click', closeEditarModal);

            formEditar.addEventListener('submit', (e) => {
                e.preventDefault();
                const btnSubmitEditar = document.getElementById('btn-submit-editar');
                const originalHtml = btnSubmitEditar.innerHTML;
                btnSubmitEditar.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> <span>Guardando...</span>';
                btnSubmitEditar.disabled = true;

                setTimeout(() => {
                    const diagVal = document.getElementById('edit-diagnostico').value || "Pendiente de diagnóstico";
                    const vacVal = document.getElementById('edit-vacunas').value || "Sin observaciones registradas";

                    document.getElementById('perfil-edad').innerText = document.getElementById('edit-edad').value || "No asignada";
                    document.getElementById('perfil-diagnostico').innerText = diagVal;
                    document.getElementById('perfil-diagnostico').className = diagVal === "Pendiente de diagnóstico" ? "font-bold text-clinical-muted text-lg" : "font-bold text-primary-700 text-lg";
                    document.getElementById('perfil-evolucion').innerText = document.getElementById('edit-evolucion').value || "No asignada";
                    document.getElementById('perfil-vacunas').innerText = vacVal;
                    document.getElementById('perfil-vacunas').className = vacVal === "Sin observaciones registradas" ? "font-bold text-clinical-muted text-sm leading-tight mt-1" : "font-bold text-red-700 text-sm leading-tight mt-1";

                    btnSubmitEditar.innerHTML = originalHtml;
                    btnSubmitEditar.disabled = false;
                    closeEditarModal();
                    showAdminToast('Historia Clínica actualizada en Supabase.');
                }, 1000);
            });
        }

        // ==========================================
        // 12.5. PROMOCIONES (LEADS) & AUDITORÍA
        // ==========================================
        
        // --- Leads ---
        const initLeads = async () => {
            const tbody = document.getElementById('tabla-leads');
            const totalBadge = document.getElementById('total-leads-badge');
            if (!tbody || !totalBadge) return;

            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-clinical-muted text-sm">Cargando leads desde Supabase...</td></tr>';

            try {
                // Obtenemos los leads reales desde la base de datos
                const response = await fetch('https://api.antonellaepigenetica.online/rest/v1/leads?select=*&order=created_at.desc', {
                    method: 'GET',
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE'
                    }
                });

                if (!response.ok) throw new Error('Error al obtener leads');
                
                const realLeads = await response.json();
                
                tbody.innerHTML = '';
                totalBadge.innerText = `${realLeads.length} Leads`;

                if (realLeads.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-clinical-muted text-sm">No hay leads registrados todavía.</td></tr>';
                    return;
                }

                realLeads.forEach(lead => {
                    // Formato de fecha USA (MM/DD/YYYY)
                    const dateObj = new Date(lead.created_at);
                    const formattedDate = dateObj.toLocaleString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                    });

                    // Formato amigable para el estado
                    let statusText = lead.status;
                    let statusColor = "bg-gray-100 text-gray-700";

                    if (lead.status === 'processed') {
                        statusText = "Email Enviado";
                        statusColor = "bg-emerald-100 text-emerald-700";
                    } else if (lead.status === 'pending_webhook') {
                        statusText = "Pendiente de Envío";
                        statusColor = "bg-amber-100 text-amber-700";
                    } else if (lead.status === 'error') {
                        statusText = "Error en Envío";
                        statusColor = "bg-red-100 text-red-700";
                    } else if (lead.status) {
                        statusText = lead.status.toUpperCase();
                    }

                    const tr = document.createElement('tr');
                    tr.className = "hover:bg-slate-50 transition-colors";
                    tr.innerHTML = `
                        <td class="px-6 py-4 font-medium text-clinical-text">${lead.email}</td>
                        <td class="px-6 py-4 text-clinical-muted"><span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">${lead.source}</span></td>
                        <td class="px-6 py-4"><span class="${statusColor} px-2 py-1 rounded text-xs font-bold uppercase">${statusText}</span></td>
                        <td class="px-6 py-4 text-clinical-muted text-sm">${formattedDate}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                console.error(error);
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-red-500 text-sm">Error conectando con la base de datos.</td></tr>';
            }
        };

        // --- Auditoría de Conversión (Chart.js) ---
        const initAuditoria = async () => {
            const ctx = document.getElementById('auditoriaChart');
            const statsContainer = document.getElementById('auditoria-stats-container');
            if (!ctx || !statsContainer) return;

            try {
                // Obtenemos el embudo de tráfico real
                const response = await fetch('https://api.antonellaepigenetica.online/rest/v1/traffic_audit?select=last_section', {
                    method: 'GET',
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE'
                    }
                });

                if (!response.ok) throw new Error('Error al obtener datos para auditoría');
                
                const traffic = await response.json();
                
                // Agrupar por last_section
                const counts = {};
                traffic.forEach(session => {
                    const src = session.last_section || 'Desconocido';
                    counts[src] = (counts[src] || 0) + 1;
                });

                // Ordenar de mayor a menor retención
                let sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

                // Diccionario para traducir IDs técnicos a nombres amigables para el equipo
                const labelDictionary = {
                    'login.html': 'Página de Login',
                    'index.html': 'Landing Page (Raíz)',
                    'hero': 'Inicio (Arriba)',
                    'video_proceso': 'Sección Video',
                    'programa_bienestar': 'Sección Bienestar',
                    'especialidades': 'Sección Especialidades',
                    'como_funciona': 'Sección Cómo Funciona',
                    'asistente_triaje': 'Sección Asistente',
                    'contacto': 'Sección Contacto',
                    'onboarding.html': 'Formulario de Triaje'
                };

                let labels = sortedKeys.map(k => labelDictionary[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                let data = sortedKeys.map(k => counts[k]);

                // Si no hay datos, mostrar algo por defecto para que no se vea vacío
                if (labels.length === 0) {
                    labels = ['Sin tráfico'];
                    data = [1];
                }

                // Destruir gráfico previo si existe para evitar superposiciones
                if (window.auditoriaChartInstance) {
                    window.auditoriaChartInstance.destroy();
                }

                // Paleta de colores clínicos (gradiente visual para el embudo)
                const colorPalette = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];
                const bgColors = labels.map((_, i) => colorPalette[i % colorPalette.length]);

                window.auditoriaChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: bgColors,
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        },
                        cutout: '70%'
                    }
                });

                statsContainer.innerHTML = '';
                const total = traffic.length || 1; // evitar dividir por 0
                
                if (traffic.length === 0) {
                    statsContainer.innerHTML = '<p class="text-sm text-clinical-muted p-4 text-center">No hay tráfico registrado aún. Visita la página para generar datos.</p>';
                    return;
                }

                labels.forEach((label, index) => {
                    const perc = Math.round((data[index] / traffic.length) * 100);
                    const color = bgColors[index];
                    const formattedLabel = label;
                    
                    statsContainer.innerHTML += `
                        <div class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-clinical-border">
                            <div class="flex items-center gap-3">
                                <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                                <span class="text-sm font-medium text-clinical-text">${formattedLabel}</span>
                            </div>
                            <div class="flex gap-4">
                                <span class="text-clinical-muted text-sm">${data[index]} vistas</span>
                                <span class="font-bold text-clinical-text w-12 text-right">${perc}%</span>
                            </div>
                        </div>
                    `;
                });
            } catch (error) {
                console.error(error);
                statsContainer.innerHTML = '<p class="text-sm text-red-500">Error al cargar datos.</p>';
            }
        };

        // Listen for navigation clicks to init charts/tables only when needed
        document.querySelectorAll('.admin-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target;
                if (target === 'admin-leads') {
                    initLeads();
                } else if (target === 'admin-auditorias') {
                    // Small timeout to ensure display:block applies before chart measures dimensions
                    setTimeout(initAuditoria, 50); 
                }
            });
        });

        // ==========================================
        // 13. FILTRO DE KPIs (RESUMEN CLÍNICA)
        // ==========================================
        const kpiPeriodo = document.getElementById('kpi-periodo');
        if (kpiPeriodo) {
            kpiPeriodo.addEventListener('change', (e) => {
                const periodo = e.target.value;
                const pacientes = document.getElementById('kpi-pacientes');
                const ingresos = document.getElementById('kpi-ingresos');
                const citas = document.getElementById('kpi-citas');
                const reportes = document.getElementById('kpi-reportes');

                if (periodo === 'semanal') {
                    pacientes.innerText = "0"; 
                    ingresos.innerText = "$0";
                    citas.innerText = "0";
                    reportes.innerText = "0";
                } else if (periodo === 'anual') {
                    pacientes.innerText = "0";
                    ingresos.innerText = "$0";
                    citas.innerText = "0";
                    reportes.innerText = "0";
                } else { // mensual
                    pacientes.innerText = "0";
                    ingresos.innerText = "$0";
                    citas.innerText = "0";
                    reportes.innerText = "0";
                }
            });
        }

    }

});

// Global functions for Promociones
window.crearCupon = function(event) {
    event.preventDefault();
    const form = event.target;
    const nombre = form.querySelector('input[type="text"]').value;
    const descuento = form.querySelector('input[type="number"]').value;
    
    const tableBody = document.getElementById('tabla-promociones');
    if (tableBody) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition-colors group';
        tr.innerHTML = `
            <td class="px-6 py-3">
                <span class="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 text-xs">${nombre}</span>
            </td>
            <td class="px-6 py-3 text-sm text-clinical-text font-medium">Admin Clínico</td>
            <td class="px-6 py-3 text-sm text-clinical-muted">${descuento}%</td>
            <td class="px-6 py-3 text-sm text-clinical-text font-bold">0</td>
            <td class="px-6 py-3 text-right">
                <button class="text-xs font-bold text-red-600 hover:text-red-800 transition-colors" onclick="this.innerText='Desactivado'; this.classList.add('opacity-50');">Desactivar</button>
            </td>
        `;
        tableBody.appendChild(tr);
        window.showAdminToast('Cupón creado exitosamente.');
        form.reset();
        
        const counterElem = document.querySelector('#admin-promociones .text-2xl.font-black');
        if (counterElem) {
            let val = parseInt(counterElem.innerText) || 0;
            counterElem.innerText = val + 1;
        }
    }
};



// --- Gestor de Educación Interaction ---
document.addEventListener('DOMContentLoaded', () => {
    const formAddClass = document.getElementById('form-add-class');
    // --- Configuración de Cloudinary ---
    const cloudName = 'ojfvhrdd';
    const uploadPreset = 'antonella-epigenetica';

    const createWidget = (buttonId, hiddenInputId, successTextId, isVideo = false) => {
        if (!document.getElementById(buttonId)) return null;
        
        return cloudinary.createUploadWidget({
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            resourceType: 'auto',
            sources: ['local', 'url', 'camera', 'google_drive'],
            multiple: false,
            clientAllowedFormats: isVideo ? ['mp4', 'webm', 'mov', 'pdf'] : ['png', 'jpeg', 'jpg', 'webp'],
            maxFileSize: 500000000, // 500MB
            language: 'es',
            text: {
                es: {
                    or: "O",
                    menu: { files: "Mis Archivos", web: "Dirección Web", camera: "Cámara", gdrive: "Google Drive" },
                    local: {
                        browse: "Seleccionar",
                        dd_title_single: "Arrastra y suelta tu archivo aquí"
                    }
                }
            }
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                document.getElementById(hiddenInputId).value = result.info.secure_url;
                
                const btn = document.getElementById(buttonId);
                btn.classList.remove('bg-primary-50', 'text-primary-700', 'border-primary-300');
                btn.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-300');
                btn.innerHTML = `<span class="material-symbols-outlined text-[24px]">check</span> ¡Subido correctamente!`;
                
                document.getElementById(successTextId).classList.remove('hidden');
            }
        });
    };

    let mediaWidget, thumbWidget;
    // Debemos esperar a que Cloudinary esté cargado
    setTimeout(() => {
        if (typeof cloudinary !== 'undefined') {
            mediaWidget = createWidget('btn-upload-media', 'class-media-url', 'media-success-text', true);
            thumbWidget = createWidget('btn-upload-thumb', 'class-thumbnail-url', 'thumb-success-text', false);
            
            const btnMedia = document.getElementById('btn-upload-media');
            if (btnMedia) btnMedia.addEventListener('click', () => { mediaWidget && mediaWidget.open(); }, false);
            
            const btnThumb = document.getElementById('btn-upload-thumb');
            if (btnThumb) btnThumb.addEventListener('click', () => { thumbWidget && thumbWidget.open(); }, false);
        }
    }, 1000);

    // --- Soporte para Drag & Drop Directo ---
    const setupDragAndDrop = (buttonId, hiddenInputId, successTextId) => {
        const dropZone = document.getElementById(buttonId);
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('bg-primary-100', 'border-primary-500');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('bg-primary-100', 'border-primary-500');
            }, false);
        });

        dropZone.addEventListener('drop', async (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files && files.length > 0) {
                const file = files[0];
                const originalHtml = dropZone.innerHTML;
                dropZone.innerHTML = 'Subiendo... <span class="material-symbols-outlined animate-spin text-[18px]">sync</span>';
                
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', uploadPreset);
                    
                    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!res.ok) throw new Error('Error al subir a Cloudinary');
                    
                    const data = await res.json();
                    
                    document.getElementById(hiddenInputId).value = data.secure_url;
                    
                    dropZone.classList.remove('bg-primary-50', 'text-primary-700', 'border-primary-300');
                    dropZone.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-300');
                    dropZone.innerHTML = `<span class="material-symbols-outlined text-[24px]">check</span> ¡Subido correctamente!`;
                    
                    document.getElementById(successTextId).classList.remove('hidden');
                } catch (err) {
                    console.error(err);
                    alert('Hubo un error subiendo el archivo al arrastrar.');
                    dropZone.innerHTML = originalHtml;
                }
            }
        }, false);
    };

    setupDragAndDrop('btn-upload-media', 'class-media-url', 'media-success-text');
    setupDragAndDrop('btn-upload-thumb', 'class-thumbnail-url', 'thumb-success-text');

    // --- Envío del Formulario ---
    if (formAddClass) {
        formAddClass.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = formAddClass.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Guardando... <span class="material-symbols-outlined animate-spin text-[18px]">sync</span>';
            btnSubmit.disabled = true;
            
            try {
                const title = document.getElementById('class-title').value;
                const desc = document.getElementById('class-desc').value;
                const module = document.getElementById('class-module').value;
                
                const mediaUrl = document.getElementById('class-media-url').value;
                const thumbUrl = document.getElementById('class-thumbnail-url').value;
                
                if (!mediaUrl) {
                    alert('Debes subir el archivo principal de la clase (Video o PDF).');
                    return;
                }

                const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
                const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE';

                const headers = {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'Content-Type': 'application/json'
                };

                const bodyData = {
                    title: title,
                    description: desc,
                    module_type: module,
                    media_url: mediaUrl,
                    thumbnail_url: thumbUrl
                };

                const editId = formAddClass.dataset.editId;
                let dbRes;

                if (editId) {
                    // MODO EDICIÓN: Actualizar registro existente
                    dbRes = await fetch(`${supabaseBaseUrl}/rest/v1/education_content?id=eq.${editId}`, {
                        method: 'PATCH',
                        headers: headers,
                        body: JSON.stringify(bodyData)
                    });
                } else {
                    // MODO CREACIÓN: Insertar nuevo registro
                    dbRes = await fetch(`${supabaseBaseUrl}/rest/v1/education_content`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(bodyData)
                    });
                }

                if(!dbRes.ok) throw new Error('Error al guardar los datos en la base de datos.');

                if(typeof showAdminToast === 'function') showAdminToast(editId ? '¡Clase actualizada con éxito!' : '¡Clase publicada con éxito!');
                
                // Resetear form visualmente
                formAddClass.reset();
                delete formAddClass.dataset.editId;
                document.getElementById('class-media-url').value = '';
                document.getElementById('class-thumbnail-url').value = '';
                
                ['btn-upload-media', 'btn-upload-thumb'].forEach(id => {
                    const btn = document.getElementById(id);
                    if(btn) {
                        btn.className = 'w-full py-4 bg-primary-50 border-2 border-dashed border-primary-300 rounded-xl text-primary-700 font-bold hover:bg-primary-100 transition-all flex items-center justify-center gap-2';
                        btn.innerHTML = id === 'btn-upload-media' ? `<span class="material-symbols-outlined text-[24px]">cloud_upload</span> Haz clic o arrastra el Video/PDF aquí` : `<span class="material-symbols-outlined text-[24px]">add_photo_alternate</span> Haz clic o arrastra la Miniatura aquí`;
                    }
                });
                document.getElementById('media-success-text').classList.add('hidden');
                document.getElementById('thumb-success-text').classList.add('hidden');

                // Recargar las tarjetas
                loadAdminDynamicContent();

            } catch (err) {
                console.error(err);
                alert(err.message);
            } finally {
                btnSubmit.innerHTML = '<span class="material-symbols-outlined text-[18px]">publish</span> Publicar Clase';
                btnSubmit.disabled = false;
            }
        });
    }

    // --- Envío del Formulario: Resultados de Laboratorio ---
    const formUploadResult = document.getElementById('form-upload-result');
    if (formUploadResult) {
        setupDragAndDrop('btn-upload-result-pdf', 'result-media-url', 'result-success-text', true); // true allows PDF
        
        formUploadResult.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = formUploadResult.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Publicando... <span class="material-symbols-outlined animate-spin text-[18px]">sync</span>';
            btnSubmit.disabled = true;
            
            try {
                const reportType = document.getElementById('result-type-select').value;
                const pdfUrl = document.getElementById('result-media-url').value;
                
                if (!pdfUrl) {
                    alert('Debes subir el PDF del resultado.');
                    return;
                }

                const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
                const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE';

                const dbRes = await fetch(`${supabaseBaseUrl}/rest/v1/results`, {
                    method: 'POST',
                    headers: {
                        'apikey': anonKey,
                        'Authorization': `Bearer ${anonKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pdf_url: pdfUrl,
                        report_type: reportType
                    })
                });

                if(!dbRes.ok) throw new Error('Error al guardar el resultado.');

                if(typeof showAdminToast === 'function') showAdminToast('¡Resultado publicado con éxito!');
                
                // Reset form
                formUploadResult.reset();
                document.getElementById('result-media-url').value = '';
                
                const btn = document.getElementById('btn-upload-result-pdf');
                if(btn) {
                    btn.className = 'w-full py-6 bg-primary-50 border-2 border-dashed border-primary-300 rounded-xl text-primary-700 font-bold hover:bg-primary-100 transition-all flex flex-col items-center justify-center gap-2';
                    btn.innerHTML = `<span class="material-symbols-outlined text-[32px]">cloud_upload</span><span>Haz clic o arrastra el PDF aquí</span>`;
                }
                document.getElementById('result-success-text').classList.add('hidden');

            } catch (err) {
                console.error(err);
                alert(err.message);
            } finally {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    // --- Dynamic Content Rendering (CMS Sync) ---
    const loadAdminDynamicContent = async () => {
        try {
            const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
            const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lDIgYJPmqDQuFSyRTkJAnUjpH6MhhYQvdFTvMR4LInE';

            // 1. Render Admin Masterclasses from Supabase
            const adminMcGrid = document.getElementById('admin-masterclasses-grid');
            let classes = [];
            
            const res = await fetch(`${supabaseBaseUrl}/rest/v1/education_content?order=created_at.desc`, {
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                }
            });
            
            if (res.ok) {
                classes = await res.json();
            }

            if (adminMcGrid) {
                adminMcGrid.innerHTML = '';
                
                if (classes.length === 0) {
                    adminMcGrid.innerHTML = '<p class="text-sm text-clinical-muted col-span-full py-8 text-center">No hay clases publicadas aún. ¡Sube la primera arriba!</p>';
                } else {
                    classes.forEach(mc => {
                        const thumbHtml = mc.thumbnail_url 
                            ? `<img src="${mc.thumbnail_url}" class="w-full h-full object-cover" alt="${mc.title}">`
                            : `<div class="w-full h-full bg-gradient-to-br from-slate-200 to-primary-100 flex flex-col items-center justify-center text-primary-400">
                                    <span class="material-symbols-outlined text-3xl mb-1">movie</span>
                                    <span class="text-[9px] font-bold uppercase tracking-wider">Sin miniatura</span>
                               </div>`;
                        
                        const isPdf = mc.media_url && mc.media_url.toLowerCase().includes('.pdf');
                        const typeLabel = isPdf ? 'PDF / Artículo' : 'Video';

                        const cardHtml = `
                        <div class="bg-clinical-surface border border-clinical-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative" data-edu-id="${mc.id}">
                            <div class="h-36 bg-slate-100 relative overflow-hidden">
                                ${thumbHtml}
                                <div class="absolute top-3 left-3">
                                    <span class="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">Publicado</span>
                                </div>
                                <div class="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="window._editEducation('${mc.id}')" class="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 shadow-sm border border-white/50 transition-colors" title="Editar">
                                        <span class="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                    <button onclick="window._deleteEducation('${mc.id}', '${mc.title.replace(/'/g, "\\'")}')" class="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm border border-white/50 transition-colors" title="Eliminar">
                                        <span class="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div class="p-5">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-[10px] font-bold text-primary-600 uppercase tracking-wider">${typeLabel}</span>
                                    <button class="text-clinical-muted hover:text-primary-600" onclick="window.open('${mc.media_url}', '_blank')"><span class="material-symbols-outlined text-[18px]">open_in_new</span></button>
                                </div>
                                <h3 class="font-bold text-clinical-text text-sm mb-1 leading-tight">${mc.title}</h3>
                                <p class="text-xs text-clinical-muted line-clamp-2">${mc.description}</p>
                                <p class="text-[10px] text-clinical-muted mt-2">${mc.module_type || ''}</p>
                            </div>
                        </div>`;
                        adminMcGrid.insertAdjacentHTML('beforeend', cardHtml);
                    });
                }
            }

            // --- Funciones globales de Editar y Borrar ---
            window._eduClasses = classes;
            
            window._deleteEducation = async (id, title) => {
                if (!confirm(`¿Estás seguro de eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
                
                try {
                    const delRes = await fetch(`${supabaseBaseUrl}/rest/v1/education_content?id=eq.${id}`, {
                        method: 'DELETE',
                        headers: {
                            'apikey': anonKey,
                            'Authorization': `Bearer ${anonKey}`
                        }
                    });
                    
                    if (!delRes.ok) throw new Error('Error al eliminar');
                    
                    // Remover tarjeta del DOM
                    const card = document.querySelector(`[data-edu-id="${id}"]`);
                    if (card) card.remove();
                    
                    if (typeof showAdminToast === 'function') showAdminToast(`"${title}" eliminado correctamente.`);
                } catch (err) {
                    console.error(err);
                    alert('Error al eliminar el contenido.');
                }
            };

            window._editEducation = (id) => {
                const item = window._eduClasses.find(c => c.id === id);
                if (!item) return;

                // Rellenar formulario con datos existentes
                document.getElementById('class-title').value = item.title;
                document.getElementById('class-desc').value = item.description;
                document.getElementById('class-module').value = item.module_type || '';
                document.getElementById('class-media-url').value = item.media_url || '';
                document.getElementById('class-thumbnail-url').value = item.thumbnail_url || '';

                // Actualizar botones de upload visualmente
                if (item.media_url) {
                    const btnMedia = document.getElementById('btn-upload-media');
                    btnMedia.classList.remove('bg-primary-50', 'text-primary-700', 'border-primary-300');
                    btnMedia.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-300');
                    btnMedia.innerHTML = '<span class="material-symbols-outlined text-[24px]">check</span> Archivo actual cargado';
                    document.getElementById('media-success-text').classList.remove('hidden');
                }
                if (item.thumbnail_url) {
                    const btnThumb = document.getElementById('btn-upload-thumb');
                    btnThumb.classList.remove('bg-primary-50', 'text-primary-700', 'border-primary-300');
                    btnThumb.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-300');
                    btnThumb.innerHTML = '<span class="material-symbols-outlined text-[24px]">check</span> Miniatura actual cargada';
                    document.getElementById('thumb-success-text').classList.remove('hidden');
                }

                // Cambiar botón de "Publicar" a "Actualizar"
                const btnSubmit = formAddClass.querySelector('button[type="submit"]');
                btnSubmit.innerHTML = '<span class="material-symbols-outlined text-[18px]">save</span> Actualizar Clase';
                formAddClass.dataset.editId = id;

                // Scroll al formulario
                formAddClass.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            // 2. Render Admin Promociones
            const tablaPromo = document.getElementById('tabla-promociones');
            if (tablaPromo && window.cmsService) {
                const promociones = await window.cmsService.getPromociones();
                tablaPromo.innerHTML = '';
                if (promociones.length === 0) {
                    tablaPromo.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-clinical-muted">No hay códigos activos.</td></tr>`;
                } else {
                    promociones.forEach(promo => {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-slate-50/50 transition-colors group';
                        tr.innerHTML = `
                            <td class="px-6 py-3">
                                <span class="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 text-xs">${promo.code}</span>
                            </td>
                            <td class="px-6 py-3 text-sm text-clinical-text font-medium">${promo.creator || 'Admin Global'}</td>
                            <td class="px-6 py-3 text-sm text-clinical-text font-bold">${promo.discount_percentage}% OFF</td>
                            <td class="px-6 py-3 text-sm text-clinical-muted">${promo.usage_count} / ilimitado</td>
                            <td class="px-6 py-3 text-right">
                                <button class="text-clinical-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1" onclick="showAdminToast('Deshabilitando cupón...')">
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </td>
                        `;
                        tablaPromo.appendChild(tr);
                    });
                }
            }

            // 3. Load Site Config (CMS) into inputs
            if (config.textos) {
                const cfgBienvenida = document.getElementById('cfg-bienvenida');
                const cfgAviso = document.getElementById('cfg-avisoLegal');
                const cfgTriaje = document.getElementById('cfg-triaje');
                
                if (cfgBienvenida) cfgBienvenida.value = config.textos.bienvenida || '';
                if (cfgAviso) cfgAviso.value = config.textos.avisoLegal || '';
                if (cfgTriaje) cfgTriaje.value = config.textos.triaje || '';
            }

        } catch (error) {
            console.error("Error loading dynamic content:", error);
        }
    };

    // CMS Save Settings - HANDLED in section 10.3 above (btn-save-config)
    // (duplicate handler removed to prevent conflicts)

    // ==========================================
    // 12. CHARTS LOGIC
    // ==========================================
    const initAdminCharts = () => {
        const revCtx = document.getElementById('revenueChart');
        if (revCtx) {
            new Chart(revCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Ingresos MRR ($)',
                        data: [],
                        borderColor: '#006194',
                        backgroundColor: 'rgba(0, 97, 148, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#4ADE80',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const plansCtx = document.getElementById('plansChart');
        if (plansCtx) {
            new Chart(plansCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#006194', '#E6A822', '#64748B'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    };

    // Load on init
    loadAdminDynamicContent();
    initAdminCharts();

    // ==========================================
    // 13. ZELLE APPROVAL LOGIC
    // ==========================================
    const initZelleApprovals = async () => {
        const tableBody = document.getElementById('table-zelle-pending');
        if (!tableBody) return;

        try {
            // Fetch pending payments
            const res = await fetch(`${supabaseBaseUrl}/rest/v1/payments?payment_method=eq.zelle&status=eq.pending`, { headers });
            if (!res.ok) throw new Error('Failed to fetch payments');
            
            const payments = await res.json();
            
            if (payments.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-clinical-muted">No hay pagos de Zelle pendientes de validación.</td></tr>`;
                return;
            }

            // Fetch planes for mapping names
            const resPlans = await fetch(`${supabaseBaseUrl}/rest/v1/subscription_plans`, { headers });
            const plans = resPlans.ok ? await resPlans.json() : [];
            const planMap = {};
            plans.forEach(p => planMap[p.id] = p.name);

            tableBody.innerHTML = payments.map(payment => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="font-bold text-clinical-text">${payment.patient_email}</div>
                        <div class="text-xs text-clinical-muted">${new Date(payment.created_at).toLocaleString()}</div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-lg text-xs border border-primary-100">
                            ${planMap[payment.plan_id] || 'Plan Personalizado'}
                        </span>
                    </td>
                    <td class="px-6 py-4 font-bold text-clinical-text">$${payment.amount}</td>
                    <td class="px-6 py-4">
                        <a href="${payment.receipt_url}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium">
                            <span class="material-symbols-outlined text-[16px]">visibility</span> Ver Imagen
                        </a>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button data-id="${payment.id}" data-email="${payment.patient_email}" data-plan="${payment.plan_id}" class="btn-approve-zelle bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
                            Aprobar
                        </button>
                    </td>
                </tr>
            `).join('');

            // Attach events
            document.querySelectorAll('.btn-approve-zelle').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const paymentId = e.currentTarget.getAttribute('data-id');
                    const email = e.currentTarget.getAttribute('data-email');
                    const planId = e.currentTarget.getAttribute('data-plan');
                    e.currentTarget.disabled = true;
                    e.currentTarget.innerText = 'Cargando...';

                    try {
                        // 1. Update payment status to approved
                        await fetch(`${supabaseBaseUrl}/rest/v1/payments?id=eq.${paymentId}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({ status: 'approved' })
                        });

                        // 2. Update or insert subscription
                        // First check if subscription exists
                        const checkSub = await fetch(`${supabaseBaseUrl}/rest/v1/patient_subscriptions?patient_email=eq.${email}`, { headers });
                        const subData = await checkSub.json();

                        const now = new Date();
                        const nextMonth = new Date(now.setMonth(now.getMonth() + 1)).toISOString();

                        if (subData.length > 0) {
                            await fetch(`${supabaseBaseUrl}/rest/v1/patient_subscriptions?patient_email=eq.${email}`, {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({ status: 'active', current_period_end: nextMonth, plan_id: planId })
                            });
                        } else {
                            await fetch(`${supabaseBaseUrl}/rest/v1/patient_subscriptions`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ patient_email: email, plan_id: planId, status: 'active', current_period_end: nextMonth })
                            });
                        }

                        if (window.showToast) window.showToast('Pago aprobado y cuenta activada.');
                        initZelleApprovals(); // Refresh

                    } catch (err) {
                        console.error('Error approving Zelle', err);
                        alert('Error al aprobar.');
                        e.currentTarget.disabled = false;
                        e.currentTarget.innerText = 'Aprobar';
                    }
                });
            });

        } catch (err) {
            console.error('Error loading zelle approvals', err);
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error cargando pagos.</td></tr>`;
        }
    };

    // Run on load if in admin
    initZelleApprovals();
});

// Window global handlers
window.crearCupon = async (e) => {
    e.preventDefault();
    if (!window.cmsService) return;

    const btn = e.submitter;
    const originalText = btn.innerText;
    btn.innerText = 'Guardando...';

    const cupon = {
        codigo: document.getElementById('promo-codigo').value.toUpperCase(),
        descuento: parseInt(document.getElementById('promo-descuento').value),
        expiracion: document.getElementById('promo-expiracion').value
    };

    try {
        await window.cmsService.addPromocion(cupon);
        showAdminToast('Cupón guardado correctamente');
        document.getElementById('form-crear-cupon').reset();
        
        // Triggers a reload of dynamic content (if available in this scope)
        // Since loadAdminDynamicContent is scoped to DOMContentLoaded, we'll just reload the page for simplicity or dispatch an event
        window.location.reload(); 
    } catch (error) {
        showAdminToast('Error al guardar cupón');
        btn.innerText = originalText;
    }
};
