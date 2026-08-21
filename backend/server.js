import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar clientes
const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_ANON_KEY || 'dummy_key'
);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key'
});

/**
 * RUTA 1: Procesar y consultar el Chatbot (RAG)
 * El frontend envía un mensaje, buscamos contexto en Supabase y respondemos con OpenAI.
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, patientId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Mensaje vacío" });
        }

        // 1. Convertir el mensaje del usuario en un vector matemático (Embedding)
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small", // Modelo muy económico y rápido
            input: message,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Buscar en Supabase los documentos relevantes usando similitud de coseno
        // match_documents es una función SQL que crearemos en Supabase
        const { data: matchedChunks, error: matchError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.70, // Qué tan estricta es la similitud requerida
            match_count: 3, // Cuántos párrafos devolver
            // p_patient_id: patientId // Opcional: Filtrar solo por documentos de este paciente
        });

        if (matchError) throw matchError;

        // 3. Preparar el contexto inyectado
        let contextText = "";
        if (matchedChunks && matchedChunks.length > 0) {
            contextText = matchedChunks.map(chunk => chunk.content).join('\n\n');
        } else {
            contextText = "No se encontraron documentos médicos específicos en el perfil del paciente para responder esta consulta.";
        }

        // 4. Configurar el Prompt Estricto del Sistema (System Prompt)
        const systemPrompt = `
Eres el "Asistente de Triaje" de la clínica Antonella Epigenética.
Tu objetivo principal es recopilar información del usuario ANTES de derivarlo con un especialista o darle recomendaciones médicas.
Para pacientes nuevos, debes hacer las siguientes preguntas de forma empática y conversacional (puedes hacerlas una por una o un par a la vez):
1. ¿Qué edad tiene el niño?
2. ¿Tiene algún diagnóstico como autismo, déficit de atención o hiperactividad?
3. ¿Hace cuánto tiempo lo notas así?
4. ¿Esos cambios que describes vinieron luego de alguna vacuna?

Una vez recopilada esta información, indícales que un especialista revisará su caso.
Si el usuario hace preguntas sobre sus resultados existentes, básate EXCLUSIVAMENTE en el siguiente contexto extraído de sus exámenes médicos. No inventes datos.

CONTEXTO MÉDICO DEL PACIENTE:
${contextText}
        `;

        // 5. Consultar al LLM (GPT-4o-mini por su velocidad y bajo coste)
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.2, // Baja temperatura para respuestas lógicas y no creativas
            max_tokens: 300
        });

        const botReply = chatResponse.choices[0].message.content;

        res.json({ reply: botReply });

    } catch (error) {
        console.error("Error en /api/chat:", error);
        res.status(500).json({ error: "Hubo un error procesando tu mensaje." });
    }
});

/**
 * RUTA 2: Recibir Leads del Programa de Bienestar
 */
app.post('/api/leads', async (req, res) => {
    try {
        const { email, source } = req.body;
        if (!email) return res.status(400).json({ error: "Email requerido" });

        const { data, error } = await supabase
            .from('leads')
            .insert([{ email, source: source || 'landing_bienestar' }]);

        if (error) {
            // Si es error de duplicidad, igual respondemos success para no alertar al usuario
            if (error.code === '23505') {
                return res.json({ success: true, message: "Lead ya existía." });
            }
            throw error;
        }

        // Aquí podrías agregar un fetch() a tu webhook de n8n o Zapier si lo deseas
        // await fetch('TU_WEBHOOK_URL', { method: 'POST', body: JSON.stringify({email}) });

        res.json({ success: true, message: "Lead guardado correctamente." });
    } catch (error) {
        console.error("Error en /api/leads:", error);
        res.status(500).json({ error: "Error interno guardando lead." });
    }
});

/**
 * RUTA 3: Recibir Check-in Mensual del Dashboard
 */
app.post('/api/checkins', async (req, res) => {
    try {
        // En un entorno real, extraeríamos patient_id del token JWT en los headers (auth).
        // Por ahora, asumimos que viene en el body por propósitos de demostración.
        const { 
            patient_id, 
            energy_level, 
            digestion_score, 
            adherence_items, 
            eighty_percent_rule, 
            habits, 
            supplements_consistency, 
            additional_notes 
        } = req.body;

        if (!energy_level) return res.status(400).json({ error: "Faltan datos requeridos." });

        const { data, error } = await supabase
            .from('monthly_checkins')
            .insert([{
                patient_id: patient_id || null, // Requiere que el usuario esté logueado o pasarlo
                energy_level,
                digestion_score,
                adherence_items,
                eighty_percent_rule,
                habits,
                supplements_consistency,
                additional_notes
            }]);

        if (error) throw error;

        res.json({ success: true, message: "Check-in guardado correctamente." });
    } catch (error) {
        console.error("Error en /api/checkins:", error);
        res.status(500).json({ error: "Error interno guardando check-in." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Backend activado en el puerto ${PORT}`);
    console.log(`🔧 Recuerda configurar tu archivo .env con las claves reales de Supabase`);
});
