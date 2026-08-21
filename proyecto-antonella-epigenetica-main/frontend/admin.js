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

// --- Admin Chat Interaction ---
document.addEventListener('DOMContentLoaded', () => {
    const adminChatInput = document.getElementById('crm-textarea');
    const btnSendAdminMsg = document.getElementById('btn-send-admin-msg');
    const adminChatMessages = document.getElementById('chat-messages-container');

    if (adminChatInput && btnSendAdminMsg && adminChatMessages) {
        const sendMessage = () => {
            const text = adminChatInput.value.trim();
            if (!text) return;

            // Remove placeholder if it exists
            const placeholder = adminChatMessages.querySelector('.text-center');
            if(placeholder) placeholder.remove();

            const now = new Date();
            const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            const msgHtml = `
                <div class="flex flex-col items-end w-full animate-fade-in mb-4">
                    <div class="bg-primary-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[80%] text-sm shadow-sm text-left">
                        ${text.replace(/\n/g, '<br>')}
                    </div>
                    <span class="text-[10px] text-clinical-muted mt-1">${timeString}</span>
                </div>
            `;
            
            adminChatMessages.insertAdjacentHTML('beforeend', msgHtml);
            adminChatInput.value = '';
            adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
        };

        btnSendAdminMsg.addEventListener('click', sendMessage);
        adminChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// ==========================================
// 13. CHAT SYNC (ADMIN SIDE)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const adminChatContainer = document.getElementById('chat-messages-container');
    const adminChatInput = document.getElementById('crm-textarea');
    const adminBtnSend = document.getElementById('btn-send-admin-msg');

    if (adminChatContainer && adminChatInput && adminBtnSend) {
        const loadAdminMessages = () => {
            const saved = localStorage.getItem('antonella_chat_messages');
            if (saved) {
                const messages = JSON.parse(saved);
                adminChatContainer.innerHTML = '';
                messages.forEach(msg => {
                    if (msg.role === 'user') {
                        adminChatContainer.insertAdjacentHTML('beforeend', `
                            <div class="flex items-start gap-3 w-full">
                                <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0 border border-clinical-border overflow-hidden flex items-center justify-center">
                                    <span class="material-symbols-outlined text-[16px] text-clinical-muted">person</span>
                                </div>
                                <div class="bg-white border border-clinical-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                                    <p class="text-sm text-clinical-text">${msg.text}</p>
                                    <span class="text-[10px] text-clinical-muted block mt-1">${msg.time}</span>
                                </div>
                            </div>
                        `);
                    } else {
                        adminChatContainer.insertAdjacentHTML('beforeend', `
                            <div class="flex items-start justify-end gap-3 w-full">
                                <div class="bg-primary-50 border border-primary-200 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] shadow-sm">
                                    <p class="text-sm text-primary-900">${msg.text}</p>
                                    <span class="text-[10px] text-primary-600/70 block text-right mt-1">${msg.time}</span>
                                </div>
                                <div class="w-8 h-8 rounded-full bg-primary-100 shrink-0 border border-primary-200 overflow-hidden flex items-center justify-center">
                                    <span class="material-symbols-outlined text-[16px] text-primary-600">${msg.isDoctor ? 'medical_services' : 'auto_awesome'}</span>
                                </div>
                            </div>
                        `);
                    }
                });
                adminChatContainer.scrollTop = adminChatContainer.scrollHeight;
            }
        };

        loadAdminMessages();
        setInterval(loadAdminMessages, 3000);

        adminBtnSend.addEventListener('click', () => {
            const text = adminChatInput.value.trim();
            if (!text) return;

            const saved = localStorage.getItem('antonella_chat_messages');
            const messages = saved ? JSON.parse(saved) : [];
            const time = new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
            messages.push({ role: 'ai', text, time, isDoctor: true });
            localStorage.setItem('antonella_chat_messages', JSON.stringify(messages));
            
            loadAdminMessages();
            adminChatInput.value = '';
        });
        
        adminChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                adminBtnSend.click();
            }
        });
    }
});

// --- Gestor de Educación Interaction ---
document.addEventListener('DOMContentLoaded', () => {
    const formAddClass = document.getElementById('form-add-class');
    if (formAddClass && window.cmsService) {
        formAddClass.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('class-title').value;
            const desc = document.getElementById('class-desc').value;
            const module = document.getElementById('class-module').value;
            const url = document.getElementById('class-url').value || '#';

            // Extract duration if possible, otherwise default
            const newClass = {
                titulo: title,
                descripcion: desc,
                modulo: module,
                duracion: "10:00", // Default duration for mock
                url: url
            };

            await window.cmsService.addMasterclass(newClass);
            if(typeof showAdminToast === 'function') showAdminToast('Clase publicada y sincronizada.');
            
            formAddClass.reset();
            // TODO: Reload the admin classes list if we decide to render it dynamically in admin too
            loadAdminDynamicContent();
        });
    }

    // --- Dynamic Content Rendering (CMS Sync) ---
    const loadAdminDynamicContent = async () => {
        if (!window.cmsService) return;
        
        try {
            const config = await window.cmsService.getSiteConfig();
            
            // 1. Render Admin Masterclasses
            const adminMcGrid = document.getElementById('admin-masterclasses-grid');
            if (adminMcGrid && config.educacion && config.educacion.masterclasses) {
                adminMcGrid.innerHTML = ''; // Clear fallback
                
                if (config.educacion.masterclasses.length === 0) {
                    adminMcGrid.innerHTML = '<p class="text-sm text-clinical-muted col-span-full">No hay clases publicadas aún.</p>';
                } else {
                    config.educacion.masterclasses.forEach(mc => {
                        const cardHtml = `
                        <div class="bg-clinical-surface border border-clinical-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                            <div class="h-32 bg-slate-100 relative overflow-hidden">
                                <div class="w-full h-full bg-gradient-to-br from-slate-200 to-primary-100 flex flex-col items-center justify-center text-primary-400">
                                    <span class="material-symbols-outlined text-3xl mb-1">movie</span>
                                    <span class="text-[9px] font-bold uppercase tracking-wider">Próximamente</span>
                                </div>
                                <div class="absolute top-3 left-3">
                                    <span class="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">Publicado</span>
                                </div>
                            </div>
                            <div class="p-5">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Video (${mc.duracion || '00:00'})</span>
                                    <button class="text-clinical-muted hover:text-primary-600" onclick="showAdminToast('Opciones de contenido')"><span class="material-symbols-outlined text-[18px]">more_vert</span></button>
                                </div>
                                <h3 class="font-bold text-clinical-text text-sm mb-1 leading-tight">${mc.titulo}</h3>
                                <p class="text-xs text-clinical-muted line-clamp-2">${mc.descripcion}</p>
                            </div>
                        </div>`;
                        adminMcGrid.insertAdjacentHTML('beforeend', cardHtml);
                    });
                }
            }

            // 2. Render Admin Promociones
            const tablaPromo = document.getElementById('tabla-promociones');
            if (tablaPromo && config.promociones) {
                tablaPromo.innerHTML = '';
                if (config.promociones.length === 0) {
                    tablaPromo.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-clinical-muted">No hay cupones activos</td></tr>';
                } else {
                    config.promociones.forEach(promo => {
                        const trHtml = `
                        <tr class="hover:bg-slate-50 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-emerald-500 text-[18px]">sell</span>
                                    <span class="font-bold text-sm text-clinical-text">${promo.codigo}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-xs text-clinical-muted">Admin Global</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-md">${promo.descuento}% OFF</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm font-medium text-clinical-text">0</span>
                                <span class="text-xs text-clinical-muted"> / ilimitado</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button class="text-clinical-muted hover:text-red-500 transition-colors" onclick="showAdminToast('Desactivar cupón')">
                                    <span class="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </td>
                        </tr>`;
                        tablaPromo.insertAdjacentHTML('beforeend', trHtml);
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

    // CMS Save Settings
    const btnSaveConfig = document.getElementById('btn-save-config');
    if (btnSaveConfig) {
        btnSaveConfig.addEventListener('click', async () => {
            const originalText = btnSaveConfig.innerHTML;
            btnSaveConfig.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Guardando...';
            btnSaveConfig.disabled = true;

            try {
                if (window.cmsService) {
                    const config = await window.cmsService.getSiteConfig();
                    
                    if (!config.textos) config.textos = {};
                    
                    config.textos.bienvenida = document.getElementById('cfg-bienvenida').value;
                    config.textos.avisoLegal = document.getElementById('cfg-avisoLegal').value;
                    config.textos.triaje = document.getElementById('cfg-triaje').value;

                    await window.cmsService.updateSiteConfig(config);
                    showAdminToast('Configuración del sitio actualizada');
                }
            } catch (error) {
                showAdminToast('Error al guardar configuración');
                console.error(error);
            } finally {
                btnSaveConfig.innerHTML = originalText;
                btnSaveConfig.disabled = false;
            }
        });
    }

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
