// chat.js
// Sistema de mensajería en tiempo real conectando Admin y Paciente

(function() {
    // Configuración de Supabase
    const supabaseUrl = 'https://api.antonellaepigenetica.online/rest/v1/chat_messages';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.ugacIKF0h6DVOgr71K0zyBuGc7mrEsoda9B3gHIjdXU';

    // Identificar qué panel estamos usando
    const isAdmin = window.location.pathname.includes('admin');
    
    // Configuración de la sala de pruebas
    const conversationId = 'antonella_prueba';
    const myRole = isAdmin ? 'admin' : 'patient';

    // Elementos del DOM
    let chatContainer, chatInput, btnSend;

    document.addEventListener('DOMContentLoaded', () => {
        if (isAdmin) {
            chatContainer = document.getElementById('chat-messages-container');
            chatInput = document.getElementById('crm-textarea');
            btnSend = document.getElementById('btn-send-admin-msg');
        } else {
            chatContainer = document.getElementById('patient-chat-messages');
            chatInput = document.getElementById('patient-chat-input');
            btnSend = document.getElementById('btn-send-patient-msg');
        }

        if (chatContainer && chatInput && btnSend) {
            initChat();
        }
    });

    let lastMessageCount = 0;

    async function fetchMessages() {
        try {
            const res = await fetch(`${supabaseUrl}?conversation_id=eq.${conversationId}&order=created_at.asc`, {
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                }
            });
            if (!res.ok) throw new Error('Error fetching messages');
            const messages = await res.json();
            
            // Si hay mensajes nuevos, actualizamos el DOM
            if (messages.length !== lastMessageCount) {
                renderMessages(messages);
                lastMessageCount = messages.length;
                scrollToBottom();
            }
        } catch (e) {
            console.error('Chat sync error:', e);
        }
    }

    async function sendMessage(content) {
        if (!content.trim()) return;
        
        chatInput.value = ''; // Limpiar input rápidamente
        chatInput.focus();

        try {
            const res = await fetch(supabaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    sender: myRole,
                    content: content.trim()
                })
            });
            
            if (!res.ok) throw new Error('Error sending message');
            
            // Forzar actualización inmediata
            fetchMessages();
        } catch (e) {
            console.error('Error enviando mensaje:', e);
            if (typeof window.showToast === 'function') window.showToast('Error enviando mensaje');
            if (typeof window.showAdminToast === 'function') window.showAdminToast('Error enviando mensaje');
        }
    }

    function renderMessages(messages) {
        chatContainer.innerHTML = '';
        
        if (messages.length === 0) {
            // Estado vacío
            chatContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-[32px]">speaker_notes_off</span>
                    </div>
                    <h3 class="text-slate-800 font-bold mb-1">No hay mensajes recientes</h3>
                    <p class="text-slate-500 text-sm max-w-xs">Envía el primer mensaje para iniciar la conversación.</p>
                </div>
            `;
            return;
        }

        let currentDate = '';

        messages.forEach(msg => {
            const isMe = msg.sender === myRole;
            const dateObj = new Date(msg.created_at);
            const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

            // Separador de fecha si cambia de día
            if (dateStr !== currentDate) {
                chatContainer.innerHTML += `<div class="flex justify-center my-4"><span class="px-3 py-1 bg-slate-200/50 text-slate-500 text-xs font-medium rounded-full">${dateStr}</span></div>`;
                currentDate = dateStr;
            }

            // Burbuja de mensaje
            if (isMe) {
                const bgClass = isAdmin ? 'bg-primary-600' : 'bg-primary';
                chatContainer.innerHTML += `
                    <div class="flex justify-end mb-4">
                        <div class="max-w-[80%] flex flex-col items-end">
                            <div class="${bgClass} text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm relative">
                                <p class="text-sm whitespace-pre-wrap">${escapeHTML(msg.content)}</p>
                            </div>
                            <span class="text-[11px] text-slate-400 mt-1">${timeStr}</span>
                        </div>
                    </div>
                `;
            } else {
                chatContainer.innerHTML += `
                    <div class="flex justify-start gap-3 mb-4">
                        <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                            ${msg.sender === 'admin' ? 'DR' : 'PA'}
                        </div>
                        <div class="max-w-[80%] flex flex-col items-start">
                            <div class="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                <p class="text-sm whitespace-pre-wrap">${escapeHTML(msg.content)}</p>
                            </div>
                            <span class="text-[11px] text-slate-400 mt-1">${timeStr}</span>
                        </div>
                    </div>
                `;
            }
        });
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function initChat() {
        // Cargar mensajes iniciales
        fetchMessages();

        // Polling cada 3 segundos
        setInterval(fetchMessages, 3000);

        // Eventos de botones
        btnSend.addEventListener('click', () => {
            sendMessage(chatInput.value);
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(chatInput.value);
            }
        });
    }

})();
