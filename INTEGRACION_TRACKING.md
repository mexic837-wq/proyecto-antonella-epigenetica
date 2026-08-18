# Integración: Rastreador de Secciones

Este documento está dirigido al **Desarrollador 2 (Rama Login)** y al **Desarrollador 3 (Rama Admin/Dashboard)**. Sirve como guía para consumir la información de rastreo generada por la Landing Page.

## Contexto
En la Landing Page (`index.html`), hemos implementado un observador (`IntersectionObserver`) que detecta constantemente qué sección de la página está mirando el usuario. 

Para evitar falsos positivos (como cuando el usuario simplemente hace scroll rápido de arriba a abajo), el sistema está configurado con un **retraso de 3 segundos**. Es decir, si el usuario detiene su pantalla en una sección por 3 segundos o más, el sistema asume que el usuario "se quedó" allí y guarda esa información.

## Dónde encontrar el dato
La Landing Page guarda esta información directamente en el almacenamiento local del navegador (**LocalStorage**).

*   **Key (Clave):** `last_seen_section`
*   **Values (Valores posibles actuales):** 
    *   `hero` (Sección principal de arriba)
    *   `video_proceso` (Video VSL)
    *   `programa_bienestar` (Sección de recolección de Leads)
    *   `especialidades` (Bloque de desarrollo infantil)
    *   `como_funciona` (Pasos del proceso)
    *   `asistente_triaje` (Chat interactivo)
    *   `info_adicional` (Ciencia detrás)
    *   `contacto` (Redes sociales y contacto)

## Acciones Requeridas (Ramas Login & Admin)

Cuando el usuario navegue hacia las páginas de ustedes (por ejemplo, `login.html`), ustedes tendrán acceso a este mismo `localStorage` siempre que estén bajo el mismo dominio principal.

### Implementación sugerida al Iniciar Sesión / Registrarse

1.  En el momento en que el usuario hace submit a su formulario de registro/login, ustedes deben capturar este valor.
2.  Deben enviarlo a su backend como un campo adicional (ej. `source_section` o `last_viewed_section`).
3.  Una vez guardado exitosamente en su base de datos, es recomendable limpiar el valor para futuras sesiones: `localStorage.removeItem('last_seen_section');`.

**Ejemplo de código (Rama Login):**
```javascript
// Al procesar el login/registro
const lastSeen = localStorage.getItem('last_seen_section') || 'direct_login';

const payload = {
    email: userEmail,
    password: userPassword,
    last_seen_section: lastSeen
};

// ... enviar payload al backend ...

// Tras el éxito:
localStorage.removeItem('last_seen_section');
```

### Implementación sugerida para el Panel de Administrador (Rama Admin)

1. En la base de datos de usuarios/pacientes, el equipo de Backend debe asegurarse de tener una columna o campo (ej. `seccion_de_captacion`).
2. En el Dashboard administrativo, cuando se listen los usuarios registrados, se debe incluir una columna visual que muestre desde qué sección de la landing page llegó el usuario, utilizando el dato recolectado en el paso anterior.
3. Esto permitirá al equipo de marketing saber qué secciones de la Landing Page son más efectivas para convertir visitantes en usuarios registrados.

---
**Regla de Arquitectura:** El equipo de Landing Page se encarga de inyectar el dato en el LocalStorage. La extracción, almacenamiento en base de datos y despliegue en el panel de administrador es responsabilidad exclusiva de las áreas de Backend, Login y Admin.
