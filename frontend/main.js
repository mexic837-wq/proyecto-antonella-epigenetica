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
                e.preventDefault();
                const targetId = item.getAttribute('data-target');
                if (!targetId) return;

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
});
