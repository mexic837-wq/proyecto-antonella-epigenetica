// checkout.js
// Maneja el flujo de cobro y onboarding del paciente (Zelle + Stripe)

document.addEventListener('DOMContentLoaded', () => {
    const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';
    
    const headers = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    // Elementos del Modal
    const modal = document.getElementById('checkout-modal');
    const btnClose = document.getElementById('btn-close-checkout');
    const step1 = document.getElementById('checkout-step-1');
    const step2 = document.getElementById('checkout-step-2');
    const step3 = document.getElementById('checkout-step-3');
    const planesContainer = document.getElementById('planes-checkout-container');
    const btnBack = document.getElementById('btn-back-plans');

    // Payment method elements
    const btnMethodStripe = document.getElementById('btn-method-stripe');
    const btnMethodZelle = document.getElementById('btn-method-zelle');
    const sectionStripe = document.getElementById('section-stripe');
    const sectionZelle = document.getElementById('section-zelle');

    let selectedPlan = null;

    // Buscar botones de "Iniciar Protocolo" en toda la página
    const btnIniciarProtocolo = document.querySelectorAll('button');
    btnIniciarProtocolo.forEach(btn => {
        if (btn.innerText.includes('Iniciar mi Protocolo') || btn.innerText.includes('Comenzar')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openCheckoutModal();
            });
        }
    });

    const openCheckoutModal = () => {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        loadPlanes();
    };

    const closeCheckoutModal = () => {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        
        // Reset steps
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');
        // Reset payment method to Stripe
        showPaymentMethod('stripe');
    };

    if (btnClose) btnClose.addEventListener('click', closeCheckoutModal);
    if (btnBack) btnBack.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
    });

    // ==========================================
    // PAYMENT METHOD TOGGLE
    // ==========================================
    const showPaymentMethod = (method) => {
        if (!sectionStripe || !sectionZelle) return;
        
        if (method === 'stripe') {
            sectionStripe.classList.remove('hidden');
            sectionZelle.classList.add('hidden');
            btnMethodStripe.classList.add('border-primary', 'bg-primary/5');
            btnMethodStripe.classList.remove('border-gray-200');
            btnMethodZelle.classList.remove('border-primary', 'bg-primary/5');
            btnMethodZelle.classList.add('border-gray-200');
        } else {
            sectionStripe.classList.add('hidden');
            sectionZelle.classList.remove('hidden');
            btnMethodZelle.classList.add('border-primary', 'bg-primary/5');
            btnMethodZelle.classList.remove('border-gray-200');
            btnMethodStripe.classList.remove('border-primary', 'bg-primary/5');
            btnMethodStripe.classList.add('border-gray-200');
        }
    };

    if (btnMethodStripe) btnMethodStripe.addEventListener('click', () => showPaymentMethod('stripe'));
    if (btnMethodZelle) btnMethodZelle.addEventListener('click', () => showPaymentMethod('zelle'));

    // ==========================================
    // CARGAR PLANES DESDE SUPABASE
    // ==========================================
    const loadPlanes = async () => {
        try {
            const res = await fetch(`${supabaseBaseUrl}/rest/v1/subscription_plans?order=price.asc`, { headers });
            if (!res.ok) throw new Error('Error cargando planes');
            const planes = await res.json();
            
            planesContainer.innerHTML = '';
            
            planes.forEach((plan, index) => {
                const isPremium = plan.name.toLowerCase().includes('premium');
                const badge = isPremium ? `<div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">Más Popular</div>` : '';
                const cardBorder = isPremium ? 'border-amber-400 shadow-xl scale-105 z-10' : 'border-gray-200 hover:border-primary';

                const beneficiosHtml = (plan.features || []).map(b => `
                    <div class="flex items-start gap-3 mb-4">
                        <div class="w-5 h-5 rounded-full bg-mint/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span class="material-symbols-outlined text-mint text-[14px] font-bold">check</span>
                        </div>
                        <p class="text-gray-700 text-sm leading-relaxed font-medium">${b}</p>
                    </div>
                `).join('');

                const card = document.createElement('div');
                card.className = `border-2 rounded-3xl p-8 bg-white transition-all hover:shadow-2xl cursor-pointer flex flex-col h-full relative group ${cardBorder}`;
                card.innerHTML = `
                    ${badge}
                    <div class="mb-6 text-center">
                        <h3 class="text-2xl font-black text-gray-900 mb-2">${plan.name}</h3>
                        <div class="flex items-center justify-center gap-1 mb-2">
                            <span class="text-5xl font-extrabold text-primary">$${plan.price}</span>
                            <span class="text-gray-500 font-bold mt-2">USD</span>
                        </div>
                        <p class="text-sm text-gray-400 font-medium">Pago único mensual</p>
                    </div>
                    <div class="flex-1 mb-8 pt-6 border-t border-gray-100">
                        ${beneficiosHtml}
                    </div>
                    <button class="w-full py-4 ${isPremium ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-800 group-hover:bg-primary group-hover:text-white'} font-black rounded-xl transition-all text-lg">
                        Seleccionar Plan
                    </button>
                `;

                card.addEventListener('click', () => selectPlan(plan));
                planesContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Error fetching planes', err);
            planesContainer.innerHTML = '<p class="col-span-3 text-red-500 text-center">No se pudieron cargar los planes. Intenta más tarde.</p>';
        }
    };

    const selectPlan = (plan) => {
        selectedPlan = plan;
        document.getElementById('checkout-plan-name').innerText = plan.name;
        document.getElementById('checkout-plan-price').innerText = `$${plan.price} USD`;
        
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        showPaymentMethod('stripe'); // Default to Stripe
    };

    // ==========================================
    // STRIPE CHECKOUT (Payment Links)
    // ==========================================
    const formStripe = document.getElementById('form-stripe-checkout');
    if (formStripe) {
        formStripe.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('stripe-checkout-email').value;
            const btnSubmit = document.getElementById('btn-submit-stripe');
            
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">sync</span> Redirigiendo a Stripe...';

            try {
                // 1. Registrar intento de pago en Supabase
                await fetch(`${supabaseBaseUrl}/rest/v1/payments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        patient_email: email,
                        plan_id: selectedPlan.id,
                        amount: selectedPlan.price,
                        payment_method: 'stripe',
                        status: 'pending'
                    })
                });

                // 2. Buscar si el plan tiene un stripe_price_id configurado
                if (selectedPlan.stripe_price_id) {
                    // Redirigir al Payment Link de Stripe
                    window.location.href = selectedPlan.stripe_price_id + '?prefilled_email=' + encodeURIComponent(email);
                } else {
                    // Si no hay stripe_price_id, mostrar mensaje informativo
                    alert('El pago con tarjeta estará disponible muy pronto. Por favor usa Zelle por ahora, o contáctanos por WhatsApp.');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Pagar con Tarjeta`;
                }
            } catch (err) {
                console.error('Error Stripe checkout:', err);
                alert('Hubo un error. Por favor intenta de nuevo.');
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Pagar con Tarjeta`;
            }
        });
    }

    // ==========================================
    // CLOUDINARY - Comprobante de Zelle
    // ==========================================
    const btnUpload = document.getElementById('btn-upload-zelle');
    const inputReceipt = document.getElementById('checkout-receipt-url');
    const uploadStatus = document.getElementById('upload-status-zelle');

    if (btnUpload && window.cloudinary) {
        const uploadWidget = cloudinary.createUploadWidget({
            cloudName: 'ojfvhrdd',
            uploadPreset: 'antonella-epigenetica',
            sources: ['local', 'camera'],
            multiple: false
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                inputReceipt.value = result.info.secure_url;
                uploadStatus.innerText = 'Comprobante subido exitosamente ✓';
                uploadStatus.classList.remove('hidden');
                uploadStatus.classList.add('text-mint', 'font-bold');
                btnUpload.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Recibo Cargado`;
                btnUpload.classList.replace('border-primary/50', 'border-mint');
                btnUpload.classList.replace('text-primary', 'text-mint');
            }
        });

        btnUpload.addEventListener('click', () => uploadWidget.open(), false);
    }

    // ==========================================
    // ZELLE CHECKOUT
    // ==========================================
    const formZelle = document.getElementById('form-zelle-checkout');
    if (formZelle) {
        formZelle.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('checkout-email').value;
            const password = document.getElementById('checkout-password').value;
            const receiptUrl = inputReceipt.value;
            const btnSubmit = document.getElementById('btn-submit-zelle');

            if (!receiptUrl) {
                alert('Por favor, adjunta la imagen del comprobante de transferencia.');
                return;
            }

            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres.');
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Creando cuenta...';

            try {
                // 1. Crear el usuario en Supabase Auth
                const authRes = await fetch(`${supabaseBaseUrl}/auth/v1/signup`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ email, password })
                });

                if (!authRes.ok) {
                    const err = await authRes.json();
                    throw new Error(err.msg || 'Error al crear la cuenta. Tal vez el correo ya está registrado.');
                }
                const authData = await authRes.json();
                const userId = authData?.user?.id; // Puede ser null si el correo requiere confirmación, pero el registro procede.

                btnSubmit.innerText = 'Registrando pago...';

                // 2. Guardar el pago en la tabla payments
                const resPayment = await fetch(`${supabaseBaseUrl}/rest/v1/payments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        patient_email: email,
                        plan_id: selectedPlan.id,
                        amount: selectedPlan.price,
                        payment_method: 'zelle',
                        receipt_url: receiptUrl,
                        status: 'pending'
                    })
                });

                if (!resPayment.ok) throw new Error('Error al procesar el recibo de pago');

                // 3. Crear un registro de suscripción pendiente
                await fetch(`${supabaseBaseUrl}/rest/v1/patient_subscriptions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        patient_email: email,
                        plan_id: selectedPlan.id,
                        status: 'pending_zelle'
                    })
                });

                // Éxito
                step2.classList.add('hidden');
                step3.classList.remove('hidden');

            } catch (err) {
                console.error(err);
                alert(err.message || 'Hubo un error enviando tu comprobante. Por favor intenta de nuevo.');
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Crear Cuenta y Enviar Recibo';
            }
        });
    }
});
