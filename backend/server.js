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
Eres el "Asistente Epigenético", un chatbot médico virtual para la clínica Antonella Epigenética.
Tu objetivo es responder las dudas del paciente basándote EXCLUSIVAMENTE en el siguiente contexto extraído de sus exámenes médicos.
Si la respuesta no está en el contexto, di amablemente que no tienes esa información y que consulte directamente con su médico.
No inventes datos. Sé muy conciso, empático y profesional.

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Cerebro RAG activado en el puerto ${PORT}`);
    console.log(`🔧 Recuerda configurar tu archivo .env con las claves reales`);
});
