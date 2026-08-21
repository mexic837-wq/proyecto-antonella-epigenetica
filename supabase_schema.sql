-- Supabase Schema for Antonella Epigenética

-- 1. Roles (RBAC)
-- Supabase uses Postgres Row Level Security (RLS) for access control.
-- We'll define a custom type for user roles.
CREATE TYPE user_role AS ENUM ('patient', 'admin');

-- 2. Patients Table (Linked to Supabase Auth)
CREATE TABLE public.patients (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role user_role DEFAULT 'patient'::user_role NOT NULL,
    full_name TEXT NOT NULL,
    last_name TEXT,
    date_of_birth DATE,
    email TEXT UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view their own profile" ON public.patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.patients FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Protocols Table (90-day treatment status)
CREATE TABLE public.protocols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE GENERATED ALWAYS AS (start_date + INTERVAL '90 days') STORED,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view their own protocols" ON public.protocols FOR SELECT USING (patient_id = auth.uid());

-- 4. Results Table (PDF URL and JSONB extracted data)
CREATE TABLE public.results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES public.protocols(id),
    pdf_url TEXT NOT NULL, -- URL to the file in Supabase Storage
    extracted_data JSONB, -- JSON containing extracted data for the dashboard
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view their own results" ON public.results FOR SELECT USING (patient_id = auth.uid());

-- 5. Novelties & Products Table (Cross-selling managed by Admin)
CREATE TABLE public.novelties_and_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    product_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.novelties_and_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published novelties" ON public.novelties_and_products FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage novelties" ON public.novelties_and_products USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- 6. RAG Chatbot (Base de Datos Vectorial)
-- ==========================================

-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla para almacenar los fragmentos de documentos (chunks) y sus vectores matemáticos (embeddings)
CREATE TABLE public.document_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    result_id UUID REFERENCES public.results(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- El fragmento de texto extraído del PDF
    embedding vector(1536), -- Vector matemático (1536 dimensiones es el tamaño estándar de OpenAI)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para acelerar la búsqueda vectorial
CREATE INDEX ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Habilitar RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can query their own document chunks" ON public.document_chunks FOR SELECT USING (patient_id = auth.uid());

-- Función de Búsqueda Semántica (Retrieval)
-- Esta función recibe un vector de la pregunta del usuario y devuelve los fragmentos más similares
CREATE OR REPLACE FUNCTION match_documents (
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_patient_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_chunks.id,
        document_chunks.content,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity
    FROM document_chunks
    WHERE 
        (p_patient_id IS NULL OR document_chunks.patient_id = p_patient_id)
        AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ==========================================
-- 7. Tabla de Leads (Programa de Bienestar)
-- ==========================================
CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'landing_bienestar',
    status TEXT DEFAULT 'pending_webhook', -- pending, processed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- ==========================================
-- 8. Alterar Tabla Patients (Rastreo de Secciones)
-- ==========================================
ALTER TABLE public.patients 
ADD COLUMN acquisition_section TEXT;

-- ==========================================
-- 9. Tabla de Check-ins Mensuales (Dashboard)
-- ==========================================
CREATE TABLE public.monthly_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    energy_level TEXT NOT NULL,
    digestion_score INTEGER CHECK (digestion_score BETWEEN 1 AND 5),
    adherence_items TEXT[], 
    eighty_percent_rule BOOLEAN,
    habits TEXT[], 
    supplements_consistency TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.monthly_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view and insert own checkins" ON public.monthly_checkins 
FOR ALL USING (patient_id = auth.uid());
