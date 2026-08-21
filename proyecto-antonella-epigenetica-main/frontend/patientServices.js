/**
 * patientServices.js - Zero Backend Temporal
 * Servicio puente para gestionar las interacciones del paciente (Check-in mensual, etc.).
 * Preparado para futura migración a Supabase.
 */

window.patientServices = {
    /**
     * Simula el envío del cuestionario mensual.
     * @param {Object} data - Los datos del check-in.
     */
    submitMonthlyCheckin: async (data) => {
        return new Promise((resolve, reject) => {
            console.log('[patientServices] Enviando Check-in mensual a Supabase...', data);
            
            // Simular delay de red de 1.5 segundos
            setTimeout(() => {
                if (!data) {
                    reject("No hay datos para enviar.");
                } else {
                    resolve({ success: true, message: "Check-in guardado exitosamente." });
                }
            }, 1500);
        });
    }
};
