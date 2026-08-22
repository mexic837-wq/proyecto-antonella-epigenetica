// evaluaciones.js
// Maneja la carga de informes de laboratorio y el tracker de energía en el dashboard del paciente

document.addEventListener('DOMContentLoaded', () => {
    const supabaseBaseUrl = 'https://api.antonellaepigenetica.online';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';
    
    const headers = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
    };

    // Helper: arreglar URLs de PDFs en Cloudinary (si se subieron como image)
    const fixUrl = (url) => {
        if (url && url.toLowerCase().includes('.pdf') && url.includes('/image/upload/')) {
            return url.replace('/image/upload/', '/raw/upload/');
        }
        return url;
    };

    // ==========================================
    // 1. CARGA DE INFORMES (Resultados)
    // ==========================================
    const loadReports = async () => {
        try {
            const res = await fetch(`${supabaseBaseUrl}/rest/v1/results?order=uploaded_at.desc`, { headers });
            if (!res.ok) throw new Error('Error cargando resultados');
            
            const results = await res.json();
            
            // Separar por tipo (tomamos el más reciente de cada uno)
            const capilar = results.find(r => r.report_type === 'capilar');
            const bio = results.find(r => r.report_type === 'bioresonancia');

            // Actualizar Tarjeta Capilar
            if (capilar) {
                const dateStr = new Date(capilar.uploaded_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                document.getElementById('date-capilar').innerText = `Actualizado: ${dateStr}`;
                document.getElementById('badge-capilar').className = 'px-2 py-1 bg-mint/20 text-mint text-[10px] font-bold rounded-full';
                document.getElementById('badge-capilar').innerText = 'Completado';
                document.getElementById('desc-capilar').innerText = 'Tu informe capilar está listo. Puedes descargarlo para revisarlo en detalle con tu médico.';
                
                const btn = document.getElementById('btn-capilar');
                btn.className = 'w-full py-2 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2';
                btn.innerHTML = `<span class="material-symbols-outlined text-sm">download</span> Descargar PDF Completo`;
                btn.disabled = false;
                btn.onclick = () => window.open(fixUrl(capilar.pdf_url), '_blank');
            }

            // Actualizar Tarjeta Bioresonancia
            if (bio) {
                const dateStr = new Date(bio.uploaded_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                document.getElementById('date-bioresonancia').innerText = `Fecha: ${dateStr}`;
                document.getElementById('badge-bioresonancia').className = 'px-2 py-1 bg-mint/20 text-mint text-[10px] font-bold rounded-full flex items-center gap-1 cursor-help';
                document.getElementById('badge-bioresonancia').innerHTML = `Completado <span class="material-symbols-outlined text-[12px]">check_circle</span>`;
                document.getElementById('desc-bioresonancia').innerText = 'El análisis frecuencial ha finalizado. Descarga el reporte para ver tus resultados.';
                
                const btn = document.getElementById('btn-bioresonancia');
                btn.className = 'w-full py-2 border-2 border-tertiary text-tertiary rounded-lg font-bold hover:bg-tertiary hover:text-white transition-colors flex items-center justify-center gap-2';
                btn.innerHTML = `<span class="material-symbols-outlined text-sm">download</span> Descargar Reporte`;
                btn.disabled = false;
                btn.onclick = () => window.open(fixUrl(bio.pdf_url), '_blank');
            }

        } catch (err) {
            console.error('Error:', err);
        }
    };

    // ==========================================
    // 2. TRACKER DE ENERGÍA (Guardar Registro)
    // ==========================================
    const btnSaveEnergy = document.getElementById('btn-save-energy');
    if (btnSaveEnergy) {
        btnSaveEnergy.addEventListener('click', async () => {
            const energyRadio = document.querySelector('input[name="energia"]:checked');
            const sleepRadio = document.querySelector('input[name="sueno"]:checked');
            const inflaRadio = document.querySelector('input[name="inflamacion"]:checked');
            
            const energyValue = energyRadio ? energyRadio.value : 'normal';
            const sleepValue = sleepRadio ? sleepRadio.value : 'bueno';
            const inflaValue = inflaRadio ? inflaRadio.value : 'leve';
            
            btnSaveEnergy.disabled = true;
            btnSaveEnergy.innerHTML = 'Guardando...';

            try {
                const res = await fetch(`${supabaseBaseUrl}/rest/v1/daily_metrics`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ 
                        energy_level: energyValue,
                        sleep_quality: sleepValue,
                        inflammation_level: inflaValue
                    })
                });

                if (!res.ok) throw new Error('Error al guardar registro');
                
                if (typeof window.showToast === 'function') {
                    window.showToast('Progreso guardado. ¡Sigue así!');
                } else {
                    alert('Progreso guardado exitosamente.');
                }

                // Recargar el gráfico para reflejar el nuevo dato según lo que esté seleccionado en el dropdown
                const metricSelect = document.getElementById('chart-metric-select');
                loadEnergyChart(metricSelect ? metricSelect.value : 'energia');

            } catch (err) {
                console.error('Error saving:', err);
                alert('No se pudo guardar el registro. Intenta de nuevo.');
            } finally {
                btnSaveEnergy.disabled = false;
                btnSaveEnergy.innerHTML = 'Guardar Registro Diario';
            }
        });
    }

    // ==========================================
    // 3. GRÁFICO HISTÓRICO CON CHART.JS
    // ==========================================
    let energyChartInstance = null;

    const loadEnergyChart = async (metricType = 'energia') => {
        try {
            const skeleton = document.getElementById('chart-skeleton');
            if (skeleton) skeleton.style.display = 'flex';

            let labels = [];
            let dataPoints = [];
            let chartLabel = 'Nivel';
            let chartColor = '#2F6B60'; 
            let chartBg = 'rgba(47, 107, 96, 0.1)';

            const res = await fetch(`${supabaseBaseUrl}/rest/v1/daily_metrics?order=created_at.asc`, { headers });
            if (!res.ok) throw new Error('Error cargando métricas');
            
            const metrics = await res.json();
            const recentMetrics = metrics.slice(-14);

            if (metricType === 'energia') {
                const energyValues = { 'agotado': 1, 'cansado': 2, 'normal': 3, 'con_energia': 4 };
                recentMetrics.forEach(m => {
                    const d = new Date(m.created_at);
                    labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
                    dataPoints.push(energyValues[m.energy_level] || 3);
                });
                if (dataPoints.length === 0) {
                    labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                    dataPoints = [3, 3, 2, 3, 4, 3, 4];
                }
                chartLabel = 'Nivel de Energía';
                chartColor = '#2F6B60'; 
                chartBg = 'rgba(47, 107, 96, 0.1)';

            } else if (metricType === 'inflamacion') {
                const inflaValues = { 'nula': 1, 'leve': 2, 'moderada': 3, 'alta': 4 };
                recentMetrics.forEach(m => {
                    const d = new Date(m.created_at);
                    labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
                    dataPoints.push(inflaValues[m.inflammation_level] || 2); // Default leve
                });
                if (dataPoints.length === 0) {
                    labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                    dataPoints = [2, 2, 3, 2, 1, 2, 1];
                }
                chartLabel = 'Nivel de Inflamación';
                chartColor = '#dc2626'; 
                chartBg = 'rgba(220, 38, 38, 0.1)';

            } else if (metricType === 'sueno') {
                const sleepValues = { 'pobre': 1, 'regular': 2, 'bueno': 3, 'excelente': 4 };
                recentMetrics.forEach(m => {
                    const d = new Date(m.created_at);
                    labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
                    dataPoints.push(sleepValues[m.sleep_quality] || 3); // Default bueno
                });
                if (dataPoints.length === 0) {
                    labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                    dataPoints = [3, 3, 2, 4, 3, 4, 4];
                }
                chartLabel = 'Calidad del Sueño';
                chartColor = '#6366f1'; 
                chartBg = 'rgba(99, 102, 241, 0.1)';
            }

            renderChart(labels, dataPoints, chartLabel, chartColor, chartBg, metricType);

            if (skeleton) skeleton.style.display = 'none';

        } catch (err) {
            console.error('Error chart:', err);
        }
    };

    const renderChart = (labels, dataPoints, chartLabel, chartColor, chartBg, metricType) => {
        const canvas = document.getElementById('historicalChart');
        if (!canvas) return;
        
        if (energyChartInstance) {
            energyChartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        energyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: chartLabel,
                    data: dataPoints,
                    borderColor: chartColor,
                    backgroundColor: chartBg,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: chartColor,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.parsed.y;
                                if (metricType === 'energia') {
                                    if(val === 1) return ' Agotado';
                                    if(val === 2) return ' Cansado';
                                    if(val === 3) return ' Normal';
                                    if(val === 4) return ' Con Energía';
                                }
                                return ` ${chartLabel}: ${val}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0.5,
                        max: 4.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                if (metricType === 'energia') {
                                    if(value === 1) return 'Agotado';
                                    if(value === 2) return 'Cansado';
                                    if(value === 3) return 'Normal';
                                    if(value === 4) return 'Óptimo';
                                } else if (metricType === 'inflamacion') {
                                    if(value === 1) return 'Baja';
                                    if(value === 4) return 'Alta';
                                    return '';
                                } else if (metricType === 'sueno') {
                                    if(value === 1) return 'Pobre';
                                    if(value === 4) return 'Excelente';
                                    return '';
                                }
                                return '';
                            }
                        },
                        grid: { borderDash: [5, 5] }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    };

    // Event listener para el desplegable del gráfico
    const metricSelect = document.getElementById('chart-metric-select');
    if (metricSelect) {
        metricSelect.addEventListener('change', (e) => {
            loadEnergyChart(e.target.value);
        });
    }

    // Inicializar todo
    loadReports();
    loadEnergyChart('energia');
});
