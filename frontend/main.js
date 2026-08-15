// Antonella Epigenética - Frontend Interactivity

document.addEventListener('DOMContentLoaded', () => {
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
        }, 1500); // Simulate 1.5s network load
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
        const arrow = document.getElementById('perfil-accordion-icon');

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
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatSendBtn && chatInput && chatMessages) {
        // Remove old event listeners by cloning
        const newSendBtn = chatSendBtn.cloneNode(true);
        chatSendBtn.parentNode.replaceChild(newSendBtn, chatSendBtn);
        
        const newChatInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newChatInput, chatInput);

        const handleSend = () => {
            const text = newChatInput.value.trim();
            if (!text) return;

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'bg-primary text-white p-3 rounded-xl rounded-tr-none self-end max-w-[80%] text-sm shadow-sm opacity-0 transform translate-y-2 transition-all duration-300';
            userMsg.innerText = text;
            chatMessages.appendChild(userMsg);
            
            requestAnimationFrame(() => {
                userMsg.classList.remove('opacity-0', 'translate-y-2');
            });

            newChatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Show typing indicator
            const typingMsg = document.createElement('div');
            typingMsg.className = 'bg-surface-container text-on-surface p-3 rounded-xl rounded-tl-none self-start max-w-[80%] text-sm shadow-sm flex gap-1 items-center';
            typingMsg.innerHTML = '<div class="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></div><div class="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style="animation-delay: 0.2s"></div>';
            chatMessages.appendChild(typingMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Simulate bot reply
            setTimeout(() => {
                typingMsg.remove();
                
                const botMsg = document.createElement('div');
                botMsg.className = 'bg-surface-container text-on-surface p-3 rounded-xl rounded-tl-none self-start max-w-[80%] text-sm shadow-sm opacity-0 transform translate-y-2 transition-all duration-300 border border-outline-variant';
                botMsg.innerHTML = `<strong>Dra. Mónica (IA):</strong> ¡Recibido! ¿Hace cuánto tiempo notas estos síntomas? El equipo revisará tu mensaje en breve.`;
                chatMessages.appendChild(botMsg);
                
                requestAnimationFrame(() => {
                    botMsg.classList.remove('opacity-0', 'translate-y-2');
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
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

});
