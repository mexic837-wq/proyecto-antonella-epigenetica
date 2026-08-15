// Antonella Epigenética - Frontend Interactivity

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 0. Page Entry Blur Effect
        document.body.classList.add('page-blur-transition');
        document.body.classList.add('page-blur-active');
        
        // Remove blur slightly after load for a smooth entry
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.body.classList.remove('page-blur-active');
                
                // CRITICAL FIX: After animations end, remove the classes.
                // CSS filters and animations on the body create a "containing block" 
                // that breaks position: fixed for the navbar.
                setTimeout(() => {
                    document.body.classList.remove('page-blur-transition');
                    document.body.classList.remove('page-transition');
                }, 800);
            }, 50);
        });

        // 0.5 Skeleton Screen Logic
        const skeletonView = document.getElementById('skeleton-view');
        const realContent = document.getElementById('real-content');
        
        if (skeletonView && realContent) {
            setTimeout(() => {
                skeletonView.style.display = 'none';
                realContent.classList.remove('hidden');
            }, 100); // Reduce simulate network load for faster perceived performance
        }

        // Sidebar Toggle Logic
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');

        if (sidebarToggle && sidebar && mainContent) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded-main');
            });
        }

    // 0.6 Three.js DNA Animation
    const container = document.getElementById('canvas-container');
    if (container) {
        let scene, camera, renderer;
        let particlesMesh, linesMesh;
        let mouseX = 0;
        let mouseY = 0;
        let windowHalfX = container.clientWidth / 2;
        let windowHalfY = container.clientHeight / 2;
        let clock = new THREE.Clock();
        
        // Estructura principal
        const dnaGroup = new THREE.Group();

        function init() {
            // 1. Escena
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x010103, 0.015);

            // 2. Cámara (Posicionada en el centro)
            camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 200);
            camera.position.set(0, 0, 70); 

            // 3. Renderizador
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar pixel ratio para rendimiento
            renderer.setSize(container.clientWidth, container.clientHeight);
            // Hacer que los colores destaquen más vibrantes
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.8; // Aumentado de 1.2 a 1.8 para más brillo
            container.appendChild(renderer.domElement);

            scene.add(dnaGroup);

            // Centrar el ADN y ajustar rotación
            dnaGroup.position.x = 0;
            dnaGroup.rotation.z = Math.PI / 8; // Inclinación estilizada

            buildHolographicDNA();
            buildAmbientDust();

            // Event Listeners
            container.addEventListener('mousemove', onDocumentMouseMove, false);
            container.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
            window.addEventListener('resize', onWindowResize, false);
        }

        function buildHolographicDNA() {
            const numBasePairs = 150;
            const height = 90;
            const radius = 6;
            
            // Geometría para las partículas principales (esqueleto)
            const backboneGeo = new THREE.BufferGeometry();
            const backbonePositions = [];
            const backboneColors = [];
            const backboneSizes = [];

            // Geometría para las partículas interiores (bases)
            const basesGeo = new THREE.BufferGeometry();
            const basesPositions = [];
            const basesColors = [];

            // Geometría para las líneas de conexión
            const linesGeo = new THREE.BufferGeometry();
            const linesPositions = [];
            const linesColors = [];

            const color1 = new THREE.Color(0x00f0ff); // Cian
            const color2 = new THREE.Color(0x8a2be2); // Morado
            const color3 = new THREE.Color(0xff007a); // Rosa

            for (let i = 0; i <= numBasePairs; i++) {
                const y = (i / numBasePairs) * height - (height / 2);
                const angle = i * 0.25; // Separación de la espiral
                
                // Posiciones de las dos hebras principales
                const x1 = Math.cos(angle) * radius;
                const z1 = Math.sin(angle) * radius;
                
                const x2 = Math.cos(angle + Math.PI) * radius;
                const z2 = Math.sin(angle + Math.PI) * radius;

                // Añadir partículas al esqueleto
                // Hebra 1
                backbonePositions.push(x1, y, z1);
                backboneColors.push(color1.r, color1.g, color1.b);
                backboneSizes.push(Math.random() * 2.5 + 1.5); // Tamaños ligeramente mayores

                // Hebra 2
                backbonePositions.push(x2, y, z2);
                backboneColors.push(color2.r, color2.g, color2.b);
                backboneSizes.push(Math.random() * 2.5 + 1.5); // Tamaños ligeramente mayores

                // Partículas de glow secundarias
                for(let j=0; j<4; j++) { // Aumentada la cantidad de glow (de 3 a 4)
                    const jitter = 0.8;
                    backbonePositions.push(x1 + (Math.random()-0.5)*jitter, y + (Math.random()-0.5)*jitter, z1 + (Math.random()-0.5)*jitter);
                    backboneColors.push(color1.r, color1.g, color1.b);
                    backboneSizes.push(Math.random() * 0.8 + 0.3);

                    backbonePositions.push(x2 + (Math.random()-0.5)*jitter, y + (Math.random()-0.5)*jitter, z2 + (Math.random()-0.5)*jitter);
                    backboneColors.push(color2.r, color2.g, color2.b);
                    backboneSizes.push(Math.random() * 0.8 + 0.3);
                }

                // Generar los "puentes" (pares de bases)
                // Solo ponemos puentes cada cierto intervalo para que no se vea denso
                if (i % 2 === 0) {
                    const steps = 10;
                    for (let j = 0; j <= steps; j++) {
                        const t = j / steps;
                        const bx = THREE.MathUtils.lerp(x1, x2, t);
                        const bz = THREE.MathUtils.lerp(z1, z2, t);
                        
                        // Agregar algo de ruido al puente
                        const noiseX = (Math.random() - 0.5) * 0.5;
                        const noiseY = (Math.random() - 0.5) * 0.5;
                        const noiseZ = (Math.random() - 0.5) * 0.5;

                        basesPositions.push(bx + noiseX, y + noiseY, bz + noiseZ);
                        
                        // Interpolar color a lo largo del puente
                        const lerpColor = color1.clone().lerp(color3, t);
                        basesColors.push(lerpColor.r, lerpColor.g, lerpColor.b);
                    }
                    
                    // Línea sólida de conexión principal para el puente
                    linesPositions.push(x1, y, z1);
                    linesPositions.push(x2, y, z2);
                    linesColors.push(color1.r, color1.g, color1.b);
                    linesColors.push(color2.r, color2.g, color2.b);
                }
            }

            // Configurar atributos del esqueleto
            backboneGeo.setAttribute('position', new THREE.Float32BufferAttribute(backbonePositions, 3));
            backboneGeo.setAttribute('color', new THREE.Float32BufferAttribute(backboneColors, 3));
            backboneGeo.setAttribute('size', new THREE.Float32BufferAttribute(backboneSizes, 1));

            // Configurar atributos de las bases
            basesGeo.setAttribute('position', new THREE.Float32BufferAttribute(basesPositions, 3));
            basesGeo.setAttribute('color', new THREE.Float32BufferAttribute(basesColors, 3));

            // Configurar atributos de las líneas
            linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linesPositions, 3));
            linesGeo.setAttribute('color', new THREE.Float32BufferAttribute(linesColors, 3));

            // Material para puntos (Custom Shader simple para puntos redondeados y glow)
            const pointMaterial = new THREE.PointsMaterial({
                size: 0.9, // Ligeramente más grande
                vertexColors: true,
                transparent: true,
                opacity: 1.0, // Aumentada opacidad (antes 0.8)
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true,
                map: createCircleTexture() // Textura de círculo difuminado
            });

            const basesMaterial = new THREE.PointsMaterial({
                size: 0.5, // Ligeramente más grande
                vertexColors: true,
                transparent: true,
                opacity: 0.9, // Aumentada opacidad (antes 0.6)
                blending: THREE.AdditiveBlending,
                map: createCircleTexture()
            });

            // Material para las líneas conectivas
            const lineMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.3, // Líneas conectivas más visibles (antes 0.15)
                blending: THREE.AdditiveBlending
            });

            // Crear mallas
            const backbonePoints = new THREE.Points(backboneGeo, pointMaterial);
            const basesPoints = new THREE.Points(basesGeo, basesMaterial);
            const connectionLines = new THREE.LineSegments(linesGeo, lineMaterial);

            dnaGroup.add(backbonePoints);
            dnaGroup.add(basesPoints);
            dnaGroup.add(connectionLines);
        }

        // Función auxiliar para crear una textura de punto suave (glow)
        function createCircleTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            
            const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, 64, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        }

        function buildAmbientDust() {
            const particleCount = 800;
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];

            const colorTheme = new THREE.Color(0x4a00e0);

            for (let i = 0; i < particleCount; i++) {
                // Distribuir en toda la escena
                positions.push(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 100 - 20
                );

                // Variar ligaremente el color de polvo
                const color = colorTheme.clone().lerp(new THREE.Color(0x00f0ff), Math.random());
                colors.push(color.r, color.g, color.b);
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 0.5,
                vertexColors: true,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                map: createCircleTexture()
            });

            const dust = new THREE.Points(geometry, material);
            scene.add(dust);
        }

        function onWindowResize() {
            windowHalfX = container.clientWidth / 2;
            windowHalfY = container.clientHeight / 2;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        function onDocumentMouseMove(event) {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            mouseX = (x - windowHalfX) * 0.02;
            mouseY = (y - windowHalfY) * 0.02;
        }

        function onDocumentTouchMove(event) {
            if (event.touches.length == 1) {
                const rect = container.getBoundingClientRect();
                const x = event.touches[0].pageX - rect.left;
                const y = event.touches[0].pageY - rect.top;
                mouseX = (x - windowHalfX) * 0.02;
                mouseY = (y - windowHalfY) * 0.02;
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            render();
        }

        function render() {
            const time = clock.getElapsedTime();

            // Rotación principal del ADN (Elegante y lenta)
            dnaGroup.rotation.y = time * 0.1;
            
            // Movimiento sinusoide suave arriba y abajo
            dnaGroup.position.y = Math.sin(time * 0.5) * 2;

            // Efecto Parallax súper suave con la cámara basado en la posición del cursor
            camera.position.x += (mouseX - camera.position.x) * 0.05; 
            camera.position.y += (-mouseY - camera.position.y) * 0.05;
            
            // La cámara siempre mira hacia el centro
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }

        init();
        animate();
    }

    // 1. Navigation Simulation & Login Dummy Check
    const loginForm = document.querySelector('form');
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email === 'admin@prueba' && password === '123') {
                window.location.href = '/dashboard.html';
            } else {
                alert('Credenciales incorrectas. Usa correo: admin@prueba y contraseña: 123');
            }
        });
    }

    const portalButtons = document.querySelectorAll('button');
    portalButtons.forEach(btn => {
        if (btn.innerText.includes('Portal') || btn.innerText.includes('Iniciar') || btn.innerText.includes('Acceder') || btn.innerText.includes('Ingresar')) {
            btn.addEventListener('click', (e) => {
                const path = window.location.pathname;
                if ((path.includes('index.html') || path === '/' || path.endsWith('/')) && btn.type !== 'submit') {
                    e.preventDefault(); // Stop immediate navigation
                    document.body.classList.add('page-blur-active'); // Apply blur
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 400); // Wait for transition
                }
            });
        }
    });

    // 2. Fading Text Cycle Logic
    const fadeElement = document.querySelector('.texto-fade');
    if (fadeElement) {
        const phrases = ["tu destino", "una sentencia", "inmutables"];
        let phraseIndex = 0;

        // Cambiamos la palabra exactamente cuando la animación CSS se reinicia (opacidad 0)
        fadeElement.addEventListener('animationiteration', () => {
            phraseIndex = (phraseIndex + 1) % phrases.length;
            fadeElement.innerHTML = phrases[phraseIndex];
        });
    }

    // 3. Parallax Scrolling Effect
    const parallaxImages = document.querySelectorAll('.parallax-layer');
    if (parallaxImages.length > 0) {
        window.addEventListener('scroll', () => {
            let scrolled = window.pageYOffset;
            parallaxImages.forEach(layer => {
                // Adjust this value to change parallax speed
                layer.style.transform = `translateY(${scrolled * 0.4}px)`;
            });
        });
    }

    // 4. Sticky Navbar Transition on Scroll
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                // Scrolled state
                mainNav.classList.remove('bg-transparent', 'py-4');
                mainNav.classList.add('glass', 'py-2', 'shadow-md');
            } else {
                // Top state
                mainNav.classList.add('bg-transparent', 'py-4');
                mainNav.classList.remove('glass', 'py-2', 'shadow-md');
            }
        });
    }

    // 5. Staggered Animations on Scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.hover-card').forEach((el, index) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`;
        observer.observe(el);
    });

    // 6. Dashboard Navigation & Logic
    const navItems = document.querySelectorAll('.nav-item, .nav-item-mobile');
    const viewSections = document.querySelectorAll('.view-section');

    if (navItems.length > 0 && viewSections.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = item.getAttribute('data-target');
                if (!targetId) return;
                e.preventDefault();

                // Update active state on nav items
                navItems.forEach(nav => nav.classList.remove('active', 'bg-primary-container', 'text-on-primary-container'));
                
                // For sidebar
                if(item.classList.contains('nav-item')) {
                    item.classList.add('active', 'bg-primary-container', 'text-on-primary-container');
                    item.classList.remove('text-on-surface-variant');
                }
                
                // Hide all views, show target
                viewSections.forEach(section => {
                    section.classList.add('hidden');
                });
                
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                }
            });
        });

        // Dashboard Accordion
        const accordionBtn = document.getElementById('perfil-accordion-btn');
        const submenu = document.getElementById('perfil-submenu');
        const arrow = document.getElementById('perfil-arrow');

        if (accordionBtn && submenu && arrow) {
            accordionBtn.addEventListener('click', () => {
                submenu.classList.toggle('hidden');
                if (submenu.classList.contains('hidden')) {
                    arrow.style.transform = 'rotate(0deg)';
                } else {
                    arrow.style.transform = 'rotate(180deg)';
                }
            });
        }

        // Chart.js Initialization
        const ctx = document.getElementById('historicalChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
                    datasets: [{
                        label: 'Niveles de Energía',
                        data: [40, 55, 65, 80, 85],
                        borderColor: '#006194', // primary color
                        backgroundColor: 'rgba(0, 97, 148, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#4ADE80', // mint color
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }
    // 8. Prevent Google Translate from breaking Material Icons
    document.querySelectorAll('.material-symbols-outlined').forEach(icon => {
        icon.classList.add('notranslate');
        icon.setAttribute('translate', 'no');
    });

    // 9. Custom Native i18n Translation System
    const i18nDictionary = {
        'es': {
            'nav_plan': 'Mi Plan',
            'nav_appointments': 'Mis Citas',
            'nav_evaluations': 'Evaluaciones',
            'nav_education': 'Educación',
            'nav_messages': 'Mensajes',
            'nav_profile': 'Mi Perfil',
            'nav_personal_data': 'Datos Personales',
            'nav_medical_history': 'Historial Médico',
            'nav_billing': 'Facturación',
            'nav_settings': 'Ajustes',
            'nav_admin': 'Ir a Panel Admin',
            'nav_logout': 'Cerrar Sesión',
            'settings_lang_desc': 'Selecciona tu idioma preferido para la plataforma.'
        },
        'en': {
            'nav_plan': 'My Plan',
            'nav_appointments': 'My Appointments',
            'nav_evaluations': 'Evaluations',
            'nav_education': 'Education',
            'nav_messages': 'Messages',
            'nav_profile': 'My Profile',
            'nav_personal_data': 'Personal Data',
            'nav_medical_history': 'Medical History',
            'nav_billing': 'Billing',
            'nav_settings': 'Settings',
            'nav_admin': 'Go to Admin Panel',
            'nav_logout': 'Logout',
            'settings_lang_desc': 'Select your preferred language for the platform.'
        }
    };

    function applyTranslations(lang) {
        if (!i18nDictionary[lang]) return;
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18nDictionary[lang][key]) {
                el.innerText = i18nDictionary[lang][key];
            }
        });
        localStorage.setItem('preferred_lang', lang);
    }

    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        // Initialize
        const savedLang = localStorage.getItem('preferred_lang') || 'es';
        langSelect.value = savedLang;
        applyTranslations(savedLang);

        // On change
        langSelect.addEventListener('change', (e) => {
            applyTranslations(e.target.value);
        });
    }

    // 10. Dark Mode Toggle Logic
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Initialize state from localStorage or system preference
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            darkModeToggle.checked = true;
        } else {
            document.documentElement.classList.remove('dark');
            darkModeToggle.checked = false;
        }

        // Toggle event listener
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // ==========================================
    // ZERO BACKEND INTERACTIVITY (DASHBOARD)
    // ==========================================

    // --- Onboarding / Triaje Logic ---
    const triajeModal = document.getElementById('triaje-modal');
    if (triajeModal) {
        if (!localStorage.getItem('triaje_completado')) {
            // Show modal and prevent scrolling
            triajeModal.classList.remove('hidden');
        }
    }

    // --- Chat Simulator Logic ---
    const chatInput = document.getElementById('patient-chat-input');
    const btnSendChat = document.getElementById('btn-send-patient-msg');
    const chatContainer = document.getElementById('patient-chat-messages');

    if (chatInput && btnSendChat && chatContainer) {
        // Load existing messages
        const loadMessages = () => {
            const saved = localStorage.getItem('antonella_chat_messages');
            if (saved) {
                const messages = JSON.parse(saved);
                const emptyPlaceholder = document.getElementById('patient-chat-empty');
                if (emptyPlaceholder && messages.length > 0) emptyPlaceholder.remove();
                
                chatContainer.innerHTML = '';
                messages.forEach(msg => {
                    if (msg.role === 'user') {
                        chatContainer.insertAdjacentHTML('beforeend', `
                            <div class="flex items-end justify-end gap-3 mb-4 animate-fade-in">
                                <div class="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] shadow-sm">
                                    <p class="text-sm">${msg.text}</p>
                                    <span class="text-[10px] text-white/70 block text-right mt-1">${msg.time}</span>
                                </div>
                            </div>
                        `);
                    } else {
                        chatContainer.insertAdjacentHTML('beforeend', `
                            <div class="flex items-end gap-3 mb-4 animate-fade-in">
                                <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant shadow-sm overflow-hidden">
                                    <span class="material-symbols-outlined text-[16px] text-primary">${msg.isDoctor ? 'medical_services' : 'auto_awesome'}</span>
                                </div>
                                <div class="bg-white border border-outline-variant text-on-surface rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm">
                                    <p class="text-sm">${msg.text}</p>
                                    <span class="text-[10px] text-on-surface-variant block mt-1">${msg.time}</span>
                                </div>
                            </div>
                        `);
                    }
                });
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        };

        const saveMessage = (role, text, isDoctor = false) => {
            const saved = localStorage.getItem('antonella_chat_messages');
            const messages = saved ? JSON.parse(saved) : [];
            const time = new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
            messages.push({ role, text, time, isDoctor });
            localStorage.setItem('antonella_chat_messages', JSON.stringify(messages));
            return time;
        };

        loadMessages();
        // Polling to sync messages from admin
        setInterval(loadMessages, 3000);

        const sendChatMessage = () => {
            const text = chatInput.value.trim();
            if (!text) return;

            const time = saveMessage('user', text);
            loadMessages();
            
            chatInput.value = '';

            // Append Typing Indicator
            const typingId = 'typing-' + Date.now();
            const typingHtml = `
            <div id="${typingId}" class="flex items-end gap-3 mb-4 animate-fade-in">
                <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant shadow-sm overflow-hidden">
                    <span class="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
                </div>
                <div class="bg-white border border-outline-variant text-on-surface rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm flex items-center gap-1">
                    <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></div>
                    <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>`;
            chatContainer.insertAdjacentHTML('beforeend', typingHtml);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            // AI or Admin logic is handled in admin panel or a simulated delay for AI
            setTimeout(() => {
                const svd = JSON.parse(localStorage.getItem('antonella_chat_messages') || '[]');
                if(svd.length > 0 && svd[svd.length - 1].role === 'user' && !svd[svd.length - 1].text.includes('Dra.')) {
                    document.getElementById(typingId)?.remove();
                    
                    const aiResponses = [
                        "He registrado tu mensaje. Si requieres atención de la doctora, puedes dejar tu consulta y te responderá por aquí mismo pronto.",
                        "Recibido. ¿Hay algo más en lo que pueda ayudarte mientras esperamos la revisión del equipo médico?",
                        "Perfecto, lo añadiré a tus notas para la Dra. Mónica."
                    ];
                    const reply = aiResponses[Math.floor(Math.random() * aiResponses.length)];
                    saveMessage('ai', reply, false);
                    loadMessages();
                } else {
                     document.getElementById(typingId)?.remove();
                }
            }, 1500);
        };

        btnSendChat.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // 1. Global Toast System (Overrides inline if exists)
    window.showToast = function(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const icon = type === 'success' ? 'check_circle' : 'info';
        const bgClass = type === 'success' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface';
        
        toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-3 transform translate-y-full opacity-0 transition-all duration-300 ease-out pointer-events-auto`;
        toast.innerHTML = `<span class="material-symbols-outlined text-lg">${icon}</span> ${message}`;
        
        container.appendChild(toast);
        
        // Show
        requestAnimationFrame(() => {
            setTimeout(() => {
                toast.classList.remove('translate-y-full', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            }, 10);
        });
        
        // Hide
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // 2. Mi Plan - Roadmap "Marcar de hoy"
    window.marcarHoy = function() {
        const btn = document.getElementById('btn-marcar-hoy');
        if (!btn || btn.disabled) return;
        
        // Simular carga
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando...`;
        btn.disabled = true;
        btn.classList.add('opacity-80', 'cursor-wait');

        setTimeout(() => {
            // Completado
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Completado';
            btn.classList.remove('bg-primary', 'hover:bg-secondary', 'opacity-80', 'cursor-wait');
            btn.classList.add('bg-surface-variant', 'text-on-surface-variant', 'cursor-not-allowed');
            
            // Update progress bar
            const progressText = document.querySelector('.font-headline-md.font-bold.text-on-surface');
            const progressPercentText = document.querySelector('.font-bold.text-mint');
            const progressBar = document.querySelector('.progress-bar-fill');
            
            if (progressPercentText && progressBar) {
                progressPercentText.innerText = '51%';
                progressBar.style.width = '51%';
            }
            if (progressText && progressText.innerHTML.includes('Día 45')) {
                progressText.innerHTML = 'Día 46 <span class="text-sm font-normal text-on-surface-variant">/ 90</span>';
            }

            showToast('¡Progreso guardado correctamente!');
        }, 1500);
    };

    // 3. Formularios (Validación en tiempo real y mock de guardado)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Skip specific forms that have their own logic
        if(form.id === 'chat-form' || form.closest('#admin-view-section')) return;

        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                // Remove previous error
                const parent = input.parentElement;
                const existingError = parent.querySelector('.error-msg');
                if(existingError) existingError.remove();
                input.classList.remove('border-error', 'text-error');

                if (input.type === 'email' && input.value) {
                    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        input.classList.add('border-error', 'text-error');
                        const error = document.createElement('span');
                        error.className = 'error-msg text-xs text-error mt-1 block';
                        error.innerText = 'Formato de correo inválido';
                        parent.appendChild(error);
                    }
                }
            });
        });

        form.addEventListener('submit', (e) => {
            // Only handle if it's a settings/profile form with a submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if(!submitBtn || form.id === 'checkin-form') return; // We'll handle checkin separately
            
            e.preventDefault();
            
            const originalText = submitBtn.innerHTML;
            const originalWidth = submitBtn.offsetWidth;
            
            submitBtn.style.width = `${originalWidth}px`; // maintain width
            submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-80', 'cursor-wait');

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.width = '';
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-80', 'cursor-wait');
                showToast('Cambios guardados exitosamente');
            }, 1500);
        });
    });

    // 4. Evaluaciones: "Tu Energía Hoy" Single Selection & Chart Update
    const energyButtons = document.querySelectorAll('.energy-btn');
    let selectedEnergy = null;

    if (energyButtons.length > 0) {
        energyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset all
                energyButtons.forEach(b => {
                    b.classList.remove('bg-primary-container', 'text-on-primary-container', 'border-primary');
                    b.classList.add('bg-surface', 'text-on-surface-variant', 'border-outline-variant');
                });
                // Set active
                btn.classList.remove('bg-surface', 'text-on-surface-variant', 'border-outline-variant');
                btn.classList.add('bg-primary-container', 'text-on-primary-container', 'border-primary');
                selectedEnergy = btn.getAttribute('data-value'); // e.g. 20, 50, 80, 100
            });
        });

        const saveEnergyBtn = document.getElementById('btn-guardar-energia');
        if (saveEnergyBtn) {
            saveEnergyBtn.addEventListener('click', () => {
                if (!selectedEnergy) {
                    showToast('Por favor selecciona tu nivel de energía primero', 'info');
                    return;
                }

                const originalText = saveEnergyBtn.innerHTML;
                saveEnergyBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
                saveEnergyBtn.disabled = true;

                setTimeout(() => {
                    saveEnergyBtn.innerHTML = originalText;
                    saveEnergyBtn.disabled = false;
                    showToast('Registro guardado correctamente');
                    
                    // Update Chart
                    const chartCanvas = document.getElementById('historicalChart');
                    if(chartCanvas) {
                        const chartInstance = Chart.getChart(chartCanvas);
                        if (chartInstance) {
                            chartInstance.data.labels.push('Hoy');
                            chartInstance.data.datasets[0].data.push(parseInt(selectedEnergy));
                            chartInstance.update();
                        }
                    }
                }, 1500);
            });
        }
    }

    // 5. Facturación: Radio Group Behavior
    const paymentMethods = document.querySelectorAll('.payment-method-card');
    paymentMethods.forEach(card => {
        card.addEventListener('click', () => {
            paymentMethods.forEach(c => {
                c.classList.remove('border-primary', 'bg-primary-50/50', 'ring-1', 'ring-primary');
                c.classList.add('border-outline-variant');
                const radio = c.querySelector('input[type="radio"]');
                if(radio) radio.checked = false;
            });
            card.classList.remove('border-outline-variant');
            card.classList.add('border-primary', 'bg-primary-50/50', 'ring-1', 'ring-primary');
            const radio = card.querySelector('input[type="radio"]');
            if(radio) radio.checked = true;
        });
    });

    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('click', () => {
            planCards.forEach(c => {
                c.classList.remove('border-primary', 'ring-2', 'ring-primary');
                c.classList.add('border-outline-variant');
                const btn = c.querySelector('button');
                if(btn) {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-primary-container', 'text-on-primary-container');
                    btn.innerText = 'Seleccionar';
                }
            });
            card.classList.remove('border-outline-variant');
            card.classList.add('border-primary', 'ring-2', 'ring-primary');
            const btn = card.querySelector('button');
            if(btn) {
                btn.classList.remove('bg-primary-container', 'text-on-primary-container');
                btn.classList.add('bg-primary', 'text-white');
                btn.innerText = 'Plan Actual';
            }
        });
    });

    // 6. Mensajes (Paciente) - Override existing logic
    const chatSendBtn = document.getElementById('chat-send');
    const chatInputEl = document.getElementById('chat-input');
    const chatMessagesEl = document.getElementById('chat-messages');

    if (chatSendBtn && chatInputEl && chatMessagesEl) {
        // Remove old event listeners by cloning
        const newSendBtn = chatSendBtn.cloneNode(true);
        chatSendBtn.parentNode.replaceChild(newSendBtn, chatSendBtn);
        
        const newChatInput = chatInputEl.cloneNode(true);
        chatInputEl.parentNode.replaceChild(newChatInput, chatInputEl);

        const handleSend = () => {
            const text = newChatInput.value.trim();
            if (!text) return;

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'bg-primary text-white p-3 rounded-xl rounded-tr-none self-end max-w-[80%] text-sm shadow-sm opacity-0 transform translate-y-2 transition-all duration-300';
            userMsg.innerText = text;
            chatMessagesEl.appendChild(userMsg);
            
            requestAnimationFrame(() => {
                userMsg.classList.remove('opacity-0', 'translate-y-2');
            });

            newChatInput.value = '';
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

            // Show typing indicator
            const typingMsg = document.createElement('div');
            typingMsg.className = 'bg-surface-container text-on-surface p-3 rounded-xl rounded-tl-none self-start max-w-[80%] text-sm shadow-sm flex gap-1 items-center';
            typingMsg.innerHTML = '<div class="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></div><div class="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style="animation-delay: 0.2s"></div>';
            chatMessagesEl.appendChild(typingMsg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

            // Simulate bot reply
            setTimeout(() => {
                typingMsg.remove();
                
                const botMsg = document.createElement('div');
                botMsg.className = 'bg-surface-container text-on-surface p-3 rounded-xl rounded-tl-none self-start max-w-[80%] text-sm shadow-sm opacity-0 transform translate-y-2 transition-all duration-300 border border-outline-variant';
                botMsg.innerHTML = `<strong>Dra. Mónica (IA):</strong> ¡Recibido! ¿Hace cuánto tiempo notas estos síntomas? El equipo revisará tu mensaje en breve.`;
                chatMessagesEl.appendChild(botMsg);
                
                requestAnimationFrame(() => {
                    botMsg.classList.remove('opacity-0', 'translate-y-2');
                });
                chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            }, 1500);
        };

        newSendBtn.addEventListener('click', handleSend);
        newChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // 7. Modals (Historial Médico & Check-in)
    const btnAddDiagnosis = document.getElementById('btn-add-diagnosis');
    if (btnAddDiagnosis) {
        btnAddDiagnosis.addEventListener('click', () => {
            document.getElementById('add-diagnosis-modal').classList.remove('hidden');
        });
    }

    const addDiagnosisForm = document.getElementById('add-diagnosis-form');
    if (addDiagnosisForm) {
        addDiagnosisForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = addDiagnosisForm.querySelector('button[type="submit"]');
            
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            submitBtn.disabled = true;

            setTimeout(() => {
                const name = document.getElementById('diag-name').value;
                const date = document.getElementById('diag-date').value;
                const doctor = document.getElementById('diag-doctor').value;

                // Format date roughly for display
                const dateObj = new Date(date);
                const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                const formattedDate = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

                const listContainer = document.querySelector('#view-historial-medico .space-y-4');
                if (listContainer) {
                    const newDiag = document.createElement('div');
                    newDiag.className = 'p-4 bg-surface-container-low border border-surface-variant rounded-xl flex justify-between items-center group hover:border-primary/30 transition-colors bg-primary-50/20'; // Highlight new entry slightly
                    newDiag.innerHTML = `
                        <div>
                            <h3 class="font-bold text-on-surface">${name}</h3>
                            <p class="text-xs text-on-surface-variant mt-1">Diagnosticado en ${formattedDate} por ${doctor}</p>
                        </div>
                        <button class="w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                    `;
                    listContainer.insertBefore(newDiag, listContainer.firstChild);
                }

                // Reset
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                addDiagnosisForm.reset();
                document.getElementById('add-diagnosis-modal').classList.add('hidden');
                showToast('Diagnóstico añadido a tu historial');
            }, 1000);
        });
    }

    const checkinForm = document.getElementById('checkin-form');
    if (checkinForm) {
        checkinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = checkinForm.querySelector('button[type="submit"]');
            
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                checkinForm.reset();
                document.getElementById('checkin-modal').classList.add('hidden');
                
                // Remove pending checkin UI logic (optional but makes it look done)
                const checkinCard = document.querySelector('.bg-secondary/10');
                if(checkinCard) {
                    checkinCard.innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                <span class="material-symbols-outlined">check</span>
                            </div>
                            <div>
                                <h3 class="font-bold text-on-surface">Check-in Completado</h3>
                                <p class="text-xs text-on-surface-variant">Tu doctor revisará los resultados pronto.</p>
                            </div>
                        </div>
                    `;
                    checkinCard.classList.remove('bg-secondary/10', 'border-secondary/30');
                    checkinCard.classList.add('bg-primary/10', 'border-primary/30');
                }

                showToast('¡Gracias! Tu check-in mensual ha sido registrado.');
            }, 1500);
        });
    }

    // ==========================================
    // CMS / ZERO BACKEND INTEGRATION
    // ==========================================
    if (window.cmsService) {
        window.cmsService.getSiteConfig().then(config => {
            // 1. Update Welcome Message
            const welcomeMsg = document.getElementById('dash-welcome-msg');
            if (welcomeMsg && config.textos.bienvenida) {
                welcomeMsg.innerText = config.textos.bienvenida;
            }

            // 2. Update Billing Plans
            const planesContainer = document.getElementById('dash-planes-container');
            if (planesContainer && config.planes) {
                planesContainer.innerHTML = '';
                config.planes.forEach((plan, index) => {
                    const isPremium = index === 1;
                    const borderClass = isPremium ? 'border-2 border-primary shadow-md' : 'border border-surface-variant hover:border-primary/50';
                    const titleColor = isPremium ? 'text-primary' : (index === 2 ? 'text-mint' : 'text-on-surface');
                    const checkColor = isPremium ? 'text-primary' : (index === 2 ? 'text-mint' : 'text-primary');
                    const btnClass = isPremium ? 'bg-primary text-white hover:bg-secondary' : 'bg-surface-variant text-on-surface hover:bg-outline-variant';
                    const badge = isPremium ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">Recomendado</div>' : '';

                    const beneficiosHtml = plan.beneficios.map(b => `
                        <li class="flex gap-2 items-start"><span class="material-symbols-outlined text-[14px] ${checkColor}">check</span> ${b}</li>
                    `).join('');

                    planesContainer.innerHTML += `
                        <div class="${borderClass} rounded-xl p-4 flex flex-col relative transition-colors">
                            ${badge}
                            <h3 class="font-bold ${titleColor} text-lg mt-2">${plan.nombre}</h3>
                            <p class="text-xs text-on-surface-variant mb-4">$${plan.precio} / mes</p>
                            <ul class="text-xs text-on-surface space-y-2 mb-6 flex-1">
                                ${beneficiosHtml}
                            </ul>
                            <button class="w-full py-2 font-bold rounded-lg text-sm transition-colors ${btnClass}" onclick="showToast('Plan ${plan.nombre} Seleccionado')">Elegir ${plan.nombre}</button>
                        </div>
                    `;
                });
            }
        }).catch(err => console.error("Error loading CMS config in Dashboard:", err));
    }

    // ==========================================
    // 9. CHECK-IN MENSUAL (STEPPER)
    // ==========================================
    const btnStartCheckin = document.getElementById('btn-start-checkin');
    const modalCheckin = document.getElementById('checkin-modal');
    if (btnStartCheckin && modalCheckin) {
        const btnClose = document.getElementById('btn-close-checkin');
        const backdrop = document.getElementById('checkin-backdrop');
        const btnNext = document.getElementById('btn-checkin-next');
        const btnPrev = document.getElementById('btn-checkin-prev');
        const errSpan = document.getElementById('checkin-error');
        const indicators = document.querySelectorAll('.step-indicator');
        const steps = document.querySelectorAll('.checkin-step');
        
        let currentStep = 1;
        let checkinData = {
            energy: null,
            digestion: 3,
            adherenceAvoided: [],
            adherence80: null,
            habits: [],
            supps: null,
            notes: ""
        };

        const openModal = () => {
            modalCheckin.classList.remove('hidden');
            currentStep = 1;
            updateStepperUI();
        };

        const closeModal = () => {
            modalCheckin.classList.add('hidden');
        };

        btnStartCheckin.addEventListener('click', openModal);
        btnClose.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        const validateStep = () => {
            errSpan.classList.add('hidden');
            if (currentStep === 1) {
                const energyRadio = document.querySelector('input[name="chk_energy"]:checked');
                if (!energyRadio) {
                    errSpan.classList.remove('hidden');
                    return false;
                }
                checkinData.energy = energyRadio.value;
                checkinData.digestion = document.getElementById('chk_digestion').value;
            } else if (currentStep === 2) {
                const rule80Radio = document.querySelector('input[name="chk_80_rule"]:checked');
                if (!rule80Radio) {
                    errSpan.classList.remove('hidden');
                    return false;
                }
                checkinData.adherence80 = rule80Radio.value;
                checkinData.adherenceAvoided = Array.from(document.querySelectorAll('.chk-adherence:checked')).map(cb => cb.value);
            } else if (currentStep === 3) {
                checkinData.habits = Array.from(document.querySelectorAll('.chk-habits:checked')).map(cb => cb.value);
            } else if (currentStep === 4) {
                const suppsRadio = document.querySelector('input[name="chk_supps"]:checked');
                if (!suppsRadio) {
                    errSpan.classList.remove('hidden');
                    return false;
                }
                checkinData.supps = suppsRadio.value;
                checkinData.notes = document.getElementById('chk_notes').value;
            }
            return true;
        };

        const updateStepperUI = () => {
            // Update steps visibility
            steps.forEach((step, idx) => {
                if (idx + 1 === currentStep) {
                    step.classList.remove('hidden');
                    step.classList.add('block');
                } else {
                    step.classList.add('hidden');
                    step.classList.remove('block');
                }
            });

            // Update indicators
            indicators.forEach((ind, idx) => {
                if (idx + 1 <= currentStep) {
                    ind.classList.remove('bg-surface-variant');
                    ind.classList.add('bg-primary');
                } else {
                    ind.classList.add('bg-surface-variant');
                    ind.classList.remove('bg-primary');
                }
            });

            // Update buttons
            if (currentStep === 1) {
                btnPrev.disabled = true;
            } else {
                btnPrev.disabled = false;
            }

            if (currentStep === 4) {
                btnNext.innerHTML = 'Enviar Check-in <span class="material-symbols-outlined text-sm">send</span>';
            } else {
                btnNext.innerHTML = 'Siguiente <span class="material-symbols-outlined text-sm">arrow_forward</span>';
            }
        };

        btnNext.addEventListener('click', async () => {
            if (!validateStep()) return;

            if (currentStep < 4) {
                currentStep++;
                updateStepperUI();
            } else {
                // Submit
                const originalHtml = btnNext.innerHTML;
                btnNext.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Enviando...';
                btnNext.disabled = true;
                btnPrev.disabled = true;

                try {
                    if (window.patientServices) {
                        await window.patientServices.submitMonthlyCheckin(checkinData);
                        showToast('Check-in completado exitosamente.');
                        setTimeout(() => {
                            closeModal();
                            // Reset state
                            btnNext.innerHTML = originalHtml;
                            btnNext.disabled = false;
                            btnPrev.disabled = false;
                        }, 500);
                    } else {
                        throw new Error("patientServices no cargado");
                    }
                } catch (e) {
                    console.error(e);
                    errSpan.innerText = "Error al enviar el check-in.";
                    errSpan.classList.remove('hidden');
                    btnNext.innerHTML = originalHtml;
                    btnNext.disabled = false;
                    btnPrev.disabled = false;
                }
            }
        });

        btnPrev.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepperUI();
            }
        });
    }


    // --- Educación: Recetario Slide-over ---
    const btnReadRecipe = document.getElementById('btn-read-recipe');
    const recipeSlideover = document.getElementById('recipe-slideover');
    const recipeSlideoverPanel = document.getElementById('recipe-slideover-panel');
    const recipeSlideoverBackdrop = document.getElementById('recipe-slideover-backdrop');
    const btnCloseRecipe = document.getElementById('btn-close-recipe');

    if (btnReadRecipe && recipeSlideover) {
        const closeSlideover = () => {
            recipeSlideoverPanel.classList.add('translate-x-full');
            recipeSlideoverBackdrop.classList.remove('opacity-100');
            recipeSlideoverBackdrop.classList.add('opacity-0');
            setTimeout(() => {
                recipeSlideover.classList.add('hidden');
            }, 300);
        };

        btnReadRecipe.addEventListener('click', () => {
            const btnTextSpan = btnReadRecipe.querySelector('.btn-text');
            const originalContent = btnTextSpan.innerHTML;
            btnTextSpan.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Cargando...';
            btnReadRecipe.disabled = true;

            setTimeout(() => {
                btnReadRecipe.disabled = false;
                btnTextSpan.innerHTML = originalContent;
                recipeSlideover.classList.remove('hidden');
                // Allow reflow
                setTimeout(() => {
                    recipeSlideoverBackdrop.classList.remove('opacity-0');
                    recipeSlideoverBackdrop.classList.add('opacity-100');
                    recipeSlideoverPanel.classList.remove('translate-x-full');
                }, 10);
            }, 500);
        });

        if (btnCloseRecipe) btnCloseRecipe.addEventListener('click', closeSlideover);
        if (recipeSlideoverBackdrop) recipeSlideoverBackdrop.addEventListener('click', closeSlideover);
    }

    // --- Educación: Descargar Guía Ayuno ---
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            if (btnDownloadPdf.disabled) return;
            const originalHtml = btnDownloadPdf.innerHTML;
            
            btnDownloadPdf.disabled = true;
            btnDownloadPdf.classList.add('opacity-80', 'cursor-not-allowed');
            btnDownloadPdf.innerHTML = '<span class="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> <span class="btn-text">Preparando descarga...</span>';
            
            setTimeout(() => {
                btnDownloadPdf.classList.remove('opacity-80', 'cursor-not-allowed', 'bg-surface', 'border-outline-variant', 'text-on-surface');
                btnDownloadPdf.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600', 'hover:bg-emerald-700');
                btnDownloadPdf.innerHTML = '<span class="material-symbols-outlined text-[16px]">check_circle</span> <span class="btn-text">¡Descarga Completa!</span>';
                
                if (typeof showToast === 'function') {
                    showToast('Descarga completada. Revisa tu dispositivo.');
                }
                
                // Reset after 3 seconds
                setTimeout(() => {
                    btnDownloadPdf.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600', 'hover:bg-emerald-700');
                    btnDownloadPdf.classList.add('bg-surface', 'border-outline-variant', 'text-on-surface');
                    btnDownloadPdf.innerHTML = originalHtml;
                    btnDownloadPdf.disabled = false;
                }, 3000);
            }, 2000);
        });
    }

    // --- Patient Chat Interaction ---
    const patientChatInput = document.getElementById('patient-chat-input');
    const btnSendPatientMsg = document.getElementById('btn-send-patient-msg');
    const patientChatMessages = document.getElementById('patient-chat-messages');
    const patientChatEmpty = document.getElementById('patient-chat-empty');

    if (patientChatInput && btnSendPatientMsg && patientChatMessages) {
        const sendMessage = () => {
            const text = patientChatInput.value.trim();
            if (!text) return;

            if (patientChatEmpty) {
                patientChatEmpty.style.display = 'none';
            }

            const now = new Date();
            const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            const msgHtml = `
                <div class="flex flex-col items-end w-full animate-fade-in">
                    <div class="bg-primary text-white rounded-2xl rounded-tr-sm p-3 max-w-[80%] text-sm shadow-sm text-left">
                        ${text.replace(/\n/g, '<br>')}
                    </div>
                    <span class="text-[10px] text-on-surface-variant mt-1">${timeString}</span>
                </div>
            `;
            
            patientChatMessages.insertAdjacentHTML('beforeend', msgHtml);
            patientChatInput.value = '';
            patientChatMessages.scrollTop = patientChatMessages.scrollHeight;
        };

        btnSendPatientMsg.addEventListener('click', sendMessage);
        patientChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Export Chat Functionality
    window.exportChat = () => {
        const chatContainer = document.getElementById('patient-chat-messages');
        if (!chatContainer) return;

        let chatLog = "Historial de Chat - Equipo Médico Antonella\n";
        chatLog += "Fecha: " + new Date().toLocaleDateString() + "\n\n";

        const messages = chatContainer.querySelectorAll('.animate-fade-in');
        
        if (messages.length === 0) {
            if(typeof showToast === 'function') showToast('El chat está vacío, no hay nada que exportar.');
            return;
        }

        messages.forEach(msg => {
            const bubble = msg.querySelector('.bg-primary');
            const time = msg.querySelector('span.text-on-surface-variant');
            if (bubble && time) {
                chatLog += `[${time.innerText}] Tú:\n${bubble.innerText.trim()}\n\n`;
            }
        });

        const blob = new Blob([chatLog], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat_antonella_historial.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if(typeof showToast === 'function') showToast('Historial descargado correctamente.');
    };

    // --- Dynamic Content Rendering (CMS Sync) ---
    window.loadDynamicContent = async () => {
        if (!window.cmsService) return;
        
        try {
            const config = await window.cmsService.getSiteConfig();
            
            // 0. Render Site Texts
            if (config.textos && config.textos.bienvenida) {
                const welcomeMsg = document.getElementById('dash-welcome-msg');
                if (welcomeMsg) {
                    welcomeMsg.innerHTML = `¡Hola, Antonella! <span class="block text-xl font-normal text-on-surface-variant mt-1">${config.textos.bienvenida}</span>`;
                }
            }

            // 1. Render Masterclasses
            const mcGrid = document.getElementById('masterclasses-grid');
            if (mcGrid && config.educacion && config.educacion.masterclasses) {
                mcGrid.innerHTML = ''; // Clear fallback
                
                if (config.educacion.masterclasses.length === 0) {
                    mcGrid.innerHTML = '<p class="text-sm text-on-surface-variant col-span-full">No hay clases publicadas aún.</p>';
                } else {
                    config.educacion.masterclasses.forEach(mc => {
                        const cardHtml = `
                        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer" onclick="if(typeof showToast === 'function') showToast('Abriendo reproductor...')">
                            <div class="h-48 bg-surface-variant relative overflow-hidden">
                                <div class="w-full h-full bg-gradient-to-br from-surface-variant to-primary/10 flex flex-col items-center justify-center text-on-surface-variant/50 group-hover:scale-105 transition-transform duration-500">
                                    <span class="material-symbols-outlined text-4xl mb-1">movie</span>
                                    <span class="text-[10px] font-bold uppercase tracking-wider">Próximamente</span>
                                </div>
                                <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span class="material-symbols-outlined text-white text-5xl drop-shadow-md">play_arrow</span>
                                </div>
                                <span class="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded font-medium backdrop-blur-sm">${mc.duracion || '00:00'}</span>
                            </div>
                            <div class="p-4">
                                <span class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 block">${mc.modulo || 'Módulo'}</span>
                                <h3 class="font-bold text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors">${mc.titulo}</h3>
                                <p class="text-xs text-on-surface-variant line-clamp-2">${mc.descripcion}</p>
                            </div>
                        </div>`;
                        mcGrid.insertAdjacentHTML('beforeend', cardHtml);
                    });
                }
            }
            // 2. Render Subscription Plans
            const plansGrid = document.getElementById('dash-planes-container');
            if (plansGrid && config.planes) {
                plansGrid.innerHTML = '';
                
                // Determine current plan
                const historialStr = localStorage.getItem('antonella_historial_pagos');
                const historial = historialStr ? JSON.parse(historialStr) : [];
                let currentPlan = null;
                if (historial.length > 0) {
                    // Sort descending by date
                    const sorted = [...historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                    // Consider latest completed or processing as current plan
                    currentPlan = sorted[0].plan;
                }

                config.planes.forEach((plan, index) => {
                    const isPremium = plan.id === 'premium' || index === 1;
                    const highlightClass = isPremium ? 'ring-2 ring-primary bg-primary/5' : 'border-surface-variant hover:border-primary/50';
                    const badgeHtml = isPremium ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Recomendado</span>' : '';
                    
                    let btnClass = isPremium ? 'bg-primary text-white hover:bg-secondary shadow-sm' : 'bg-surface-variant text-on-surface hover:bg-outline-variant/30';
                    let btnText = 'Elegir Plan';
                    let onclickAction = `onclick="openCheckout('${plan.nombre}', ${plan.precio})"`;

                    if (currentPlan === plan.nombre) {
                        btnText = 'Tu Plan Actual';
                        btnClass = 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-60';
                        onclickAction = 'disabled';
                    } else if (currentPlan) {
                        btnText = 'Actualizar Plan';
                    }
                    
                    const benefitsHtml = plan.beneficios.map(b => `
                        <li class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check_circle</span>
                            <span class="text-xs text-on-surface-variant leading-tight">${b}</span>
                        </li>
                    `).join('');

                    const cardHtml = `
                    <div class="relative bg-surface-container-lowest border rounded-2xl p-5 flex flex-col transition-all cursor-pointer ${highlightClass}">
                        ${badgeHtml}
                        <h3 class="font-bold text-on-surface mb-1">${plan.nombre}</h3>
                        <div class="flex items-baseline gap-1 mb-4">
                            <span class="font-black text-2xl text-primary">$${plan.precio}</span>
                            <span class="text-xs text-on-surface-variant">/mes</span>
                        </div>
                        <ul class="space-y-3 mb-6 flex-1">
                            ${benefitsHtml}
                        </ul>
                        <button class="w-full py-2.5 rounded-xl font-bold text-sm transition-colors mt-auto ${btnClass}" ${onclickAction}>
                            ${btnText}
                        </button>
                    </div>`;
                    plansGrid.insertAdjacentHTML('beforeend', cardHtml);
                });
            }

        } catch (error) {
            console.error("Error loading dynamic content:", error);
        }
    };

    const renderHistorialPagos = () => {
        const tbody = document.getElementById('historial-pagos-tbody');
        if (!tbody) return;
        
        const historialStr = localStorage.getItem('antonella_historial_pagos');
        const historial = historialStr ? JSON.parse(historialStr) : [];
        
        tbody.innerHTML = '';
        if (historial.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-sm text-on-surface-variant">Aún no tienes pagos registrados.</td></tr>`;
            return;
        }
        
        // Sort by date descending
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        historial.forEach(pago => {
            const fechaObj = new Date(pago.fecha);
            const fechaStr = fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
            
            const estado = pago.estado || 'Completado';
            let badgeHtml = '';
            
            if (estado === 'Procesando') {
                badgeHtml = `<span class="px-2 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 w-max"><span class="material-symbols-outlined text-[12px] animate-spin">sync</span> Procesando</span>`;
            } else {
                badgeHtml = `<span class="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 w-max"><span class="material-symbols-outlined text-[12px]">check_circle</span> Completado</span>`;
            }
            
            const tr = `
            <tr class="hover:bg-surface-variant/20 transition-colors">
                <td class="px-4 py-3 text-sm text-on-surface whitespace-nowrap">${fechaStr}</td>
                <td class="px-4 py-3 text-sm font-bold text-primary">${pago.plan}</td>
                <td class="px-4 py-3 text-sm text-on-surface">$${pago.monto.toFixed(2)}</td>
                <td class="px-4 py-3 text-sm">
                    ${badgeHtml}
                </td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', tr);
        });
    };

    // Load dynamic content when the app starts
    window.loadDynamicContent();
    renderHistorialPagos();
    
    // --- PDF Generator Logic ---
    const btnDownloadFullReport = document.getElementById('btn-download-full-report');
    if (btnDownloadFullReport) {
        btnDownloadFullReport.addEventListener('click', () => {
            window.showToast('Generando reporte PDF, por favor espera...');
            
            // Seleccionamos la sección completa de Evaluaciones (sin el botón de descarga)
            const element = document.getElementById('view-evaluaciones');
            
            // Temporalmente ocultamos el botón de descarga para que no salga en el PDF
            const btnOriginalDisplay = btnDownloadFullReport.style.display;
            btnDownloadFullReport.style.display = 'none';

            const opt = {
                margin:       0.5,
                filename:     'Reporte_Antonella_Epigenetica.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                window.showToast('¡Reporte PDF descargado con éxito!');
                btnDownloadFullReport.style.display = btnOriginalDisplay; // Restaurar botón
            }).catch(err => {
                console.error("Error generando PDF:", err);
                window.showToast('Hubo un error al generar el PDF.');
                btnDownloadFullReport.style.display = btnOriginalDisplay;
            });
        });
    }

    // Expose render function for checkout logic to refresh
    window.refreshHistorialPagos = renderHistorialPagos;
    } catch (e) {
        console.error("Critical error during initialization:", e);
        
        // Hide skeleton even if initialization failed to prevent infinite loader
        const skeletonView = document.getElementById('skeleton-view');
        const realContent = document.getElementById('real-content');
        if (skeletonView && realContent) {
            skeletonView.style.display = 'none';
            realContent.classList.remove('hidden');
        }
    }
});

// --- Checkout Modal Logic ---
let currentCheckoutPrice = 0;
let currentDiscount = 0;

window.openCheckout = (planName, price) => {
    currentCheckoutPrice = price;
    currentDiscount = 0;
    
    document.getElementById('checkout-plan-name').innerText = planName;
    document.getElementById('checkout-plan-price').innerText = `$${price}`;
    document.getElementById('checkout-subtotal').innerText = `$${price.toFixed(2)}`;
    document.getElementById('checkout-total').innerText = `$${price.toFixed(2)}`;
    
    // Reset coupon UI
    document.getElementById('checkout-coupon-code').value = '';
    document.getElementById('checkout-discount-row').classList.add('hidden');
    const msgEl = document.getElementById('checkout-coupon-message');
    msgEl.classList.add('hidden');
    msgEl.className = 'text-xs mt-2 hidden font-medium';
    
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    // slight delay to allow display block to apply before transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('checkout-content').classList.remove('scale-95');
    }, 10);
};

window.closeCheckout = () => {
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('opacity-0');
    document.getElementById('checkout-content').classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.applyCoupon = async () => {
    const codeInput = document.getElementById('checkout-coupon-code').value.toUpperCase().trim();
    const msgEl = document.getElementById('checkout-coupon-message');
    
    if (!codeInput) {
        msgEl.innerText = "Por favor ingresa un código.";
        msgEl.className = 'text-xs mt-2 font-medium text-red-500 block';
        return;
    }
    
    if (!window.cmsService) {
        msgEl.innerText = "Servicio de cupones no disponible.";
        msgEl.className = 'text-xs mt-2 font-medium text-red-500 block';
        return;
    }
    
    const config = await window.cmsService.getSiteConfig();
    const promos = config.promociones || [];
    
    const coupon = promos.find(p => p.codigo === codeInput);
    
    if (coupon) {
        // Assume percentage discount for now
        currentDiscount = (currentCheckoutPrice * coupon.descuento) / 100;
        const total = currentCheckoutPrice - currentDiscount;
        
        document.getElementById('checkout-discount-row').classList.remove('hidden');
        document.getElementById('checkout-discount-label').innerText = `Descuento (${coupon.descuento}% OFF)`;
        document.getElementById('checkout-discount-amount').innerText = `-$${currentDiscount.toFixed(2)}`;
        document.getElementById('checkout-total').innerText = `$${total.toFixed(2)}`;
        
        msgEl.innerText = "¡Cupón aplicado correctamente!";
        msgEl.className = 'text-xs mt-2 font-medium text-emerald-600 block';
    } else {
        // Reset to original
        currentDiscount = 0;
        document.getElementById('checkout-discount-row').classList.add('hidden');
        document.getElementById('checkout-total').innerText = `$${currentCheckoutPrice.toFixed(2)}`;
        
        msgEl.innerText = "Cupón inválido o expirado.";
        msgEl.className = 'text-xs mt-2 font-medium text-red-500 block';
    }
};

window.procesarPago = () => {
    const btn = document.getElementById('btn-procesar-pago');
    const originalContent = btn.innerHTML;
    
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Procesando...';
    btn.disabled = true;
    
    setTimeout(() => {
        // Save initial processing state
        const planName = document.getElementById('checkout-plan-name').innerText;
        const totalStr = document.getElementById('checkout-total').innerText.replace('$', '');
        const total = parseFloat(totalStr);
        const pagoId = 'txn_' + Date.now();
        
        const historialStr = localStorage.getItem('antonella_historial_pagos');
        const historial = historialStr ? JSON.parse(historialStr) : [];
        
        historial.push({
            id: pagoId,
            plan: planName,
            monto: total,
            fecha: new Date().toISOString(),
            estado: 'Procesando'
        });
        
        localStorage.setItem('antonella_historial_pagos', JSON.stringify(historial));
        
        if (typeof showToast === 'function') {
            showToast('Pago en proceso, validando con pasarela...');
        }
        
        // Refresh table immediately
        if (typeof window.refreshHistorialPagos === 'function') {
            window.refreshHistorialPagos();
        }
        if (typeof window.loadDynamicContent === 'function') {
            window.loadDynamicContent(); // Refresh plan buttons to show "Tu Plan Actual"
        }
        
        // Close modal and reset button
        closeCheckout();
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 300);
        
        // Simulate gateway delay (e.g. 5 seconds)
        setTimeout(() => {
            const hStr = localStorage.getItem('antonella_historial_pagos');
            if (hStr) {
                let hList = JSON.parse(hStr);
                const txn = hList.find(t => t.id === pagoId);
                if (txn) {
                    txn.estado = 'Completado';
                    localStorage.setItem('antonella_historial_pagos', JSON.stringify(hList));
                    if (typeof window.refreshHistorialPagos === 'function') {
                        window.refreshHistorialPagos();
                    }
                    if (typeof window.loadDynamicContent === 'function') {
                        window.loadDynamicContent(); // Refresh plan buttons
                    }
                    if (typeof showToast === 'function') {
                        showToast(`¡Pago de ${planName} completado con éxito!`);
                    }
                }
            }
        }, 5000);
        
    }, 1000); // Small initial delay to show the spinner in button
};

// ==========================================
// 14. GAMIFICATION ENGINE
// ==========================================
const GAMIFICATION_ACHIEVEMENTS = [
    { id: 'perfil', title: 'Perfil Listo', icon: 'account_circle', color: 'emerald', reqLevel: 0, description: 'Perfil Completado' },
    { id: 'racha7', title: 'Racha 7D', icon: 'local_fire_department', color: 'primary', reqLevel: 0, description: '7 días de Check-in' },
    { id: 'pionero', title: 'Pionero', icon: 'biotech', color: 'purple', reqLevel: 1, description: 'Pionero Epigenético' },
    { id: 'nutricion', title: 'Nutrición', icon: 'restaurant', color: 'yellow', reqLevel: 1, description: 'Nutrición Base' },
    { id: 'detox', title: 'Detox Gen', icon: 'science', color: 'slate', reqLevel: 2, description: 'Completa la Fase 2' },
    { id: 'agua', title: 'Hidratado', icon: 'water_drop', color: 'slate', reqLevel: 2, description: 'Registra agua por 7 días' },
    { id: 'racha30', title: 'Racha 30D', icon: 'workspace_premium', color: 'slate', reqLevel: 3, description: 'Check-in por 30 días seguidos' },
    { id: 'estudiante', title: 'Estudiante', icon: 'school', color: 'slate', reqLevel: 3, description: 'Mira 5 videos de educación' },
    { id: 'metabolismo', title: 'Metabolismo', icon: 'monitor_heart', color: 'slate', reqLevel: 4, description: 'Optimiza tu TSH' },
    { id: 'zen', title: 'Zen', icon: 'self_improvement', color: 'slate', reqLevel: 4, description: 'Completa el reto de meditación' },
    { id: 'fase3', title: 'Fase 3', icon: 'verified', color: 'slate', reqLevel: 5, description: 'Completa la Fase 3 del plan' },
    { id: 'elite', title: 'Élite', icon: 'diamond', color: 'slate', reqLevel: 6, description: 'Alcanza el 100% en todas las métricas' }
];

const renderGamification = () => {
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    
    // Simulate current user level (can be updated via localStorage in a real app)
    let currentLevel = parseInt(localStorage.getItem('antonella_user_level') || '1');
    
    let html = '';
    GAMIFICATION_ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = currentLevel >= ach.reqLevel;
        
        if (isUnlocked) {
            html += `
            <div class="flex flex-col items-center gap-1 text-center group cursor-pointer" onclick="showToast('Logro: ${ach.description}')">
                <div class="w-10 h-10 rounded-full bg-${ach.color}-100 text-${ach.color}-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">${ach.icon}</span>
                </div>
                <span class="text-[9px] font-bold text-on-surface leading-tight">${ach.title}</span>
            </div>`;
        } else {
            html += `
            <div class="flex flex-col items-center gap-1 text-center group cursor-pointer grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" onclick="showToast('Bloqueado: ${ach.description}')">
                <div class="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant border border-outline-variant flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">${ach.icon}</span>
                </div>
                <span class="text-[9px] font-medium text-on-surface-variant leading-tight">${ach.title}</span>
            </div>`;
        }
    });
    container.innerHTML = html;
};

// Auto-init Gamification when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Other inits...
    setTimeout(renderGamification, 500); // Wait for DOM
});

// For testing: Expose a way to level up
window.levelUp = () => {
    let currentLevel = parseInt(localStorage.getItem('antonella_user_level') || '1');
    currentLevel++;
    localStorage.setItem('antonella_user_level', currentLevel.toString());
    showToast(`¡Felicidades! Has subido al Nivel ${currentLevel}`);
    renderGamification();
};
