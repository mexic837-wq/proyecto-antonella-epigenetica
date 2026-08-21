document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start-checkin');
    const modal = document.getElementById('checkin-modal');
    const backdrop = document.getElementById('checkin-backdrop');
    const btnClose = document.getElementById('btn-close-checkin');
    const btnNext = document.getElementById('btn-checkin-next');
    const btnPrev = document.getElementById('btn-checkin-prev');
    
    if (!btnStart || !modal) return;

    let currentStep = 1;
    const totalSteps = 4;

    const updateSteps = () => {
        // Ocultar todos, mostrar actual
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`checkin-step-${i}`);
            if (stepEl) {
                if (i === currentStep) {
                    stepEl.classList.remove('hidden');
                    stepEl.classList.add('block');
                } else {
                    stepEl.classList.remove('block');
                    stepEl.classList.add('hidden');
                }
            }
        }

        // Actualizar indicadores visuales
        document.querySelectorAll('.step-indicator').forEach(ind => {
            const stepNum = parseInt(ind.getAttribute('data-step'));
            if (stepNum <= currentStep) {
                ind.classList.remove('bg-surface-variant');
                ind.classList.add('bg-primary');
            } else {
                ind.classList.remove('bg-primary');
                ind.classList.add('bg-surface-variant');
            }
        });

        // Actualizar botones
        if (btnPrev) btnPrev.disabled = (currentStep === 1);
        if (btnNext) {
            if (currentStep === totalSteps) {
                btnNext.innerHTML = `Enviar Respuestas <span class="material-symbols-outlined">check</span>`;
            } else {
                btnNext.innerHTML = `Siguiente <span class="material-symbols-outlined">arrow_forward</span>`;
            }
        }
    };

    const openModal = () => {
        currentStep = 1;
        updateSteps();
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    btnStart.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateSteps();
            } else {
                // Submit final
                btnNext.innerHTML = 'Enviando...';
                setTimeout(() => {
                    closeModal();
                    // Mostrar un toast en lugar de alert
                    if (window.showAdminToast) {
                        window.showAdminToast('¡Cuestionario enviado con éxito!');
                    } else {
                        alert('¡Cuestionario enviado con éxito!');
                    }
                    btnNext.innerHTML = `Siguiente <span class="material-symbols-outlined">arrow_forward</span>`;
                }, 1000);
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateSteps();
            }
        });
    }
});
