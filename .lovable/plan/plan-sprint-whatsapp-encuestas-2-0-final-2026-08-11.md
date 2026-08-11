# Plan - SPRINT WHATSAPP — ENCUESTAS 2.0 (FINAL)

## Objetivo
Optimizar el editor de encuestas en `Comunicación → WhatsApp → Encuestas` convirtiéndolo en una herramienta profesional de tres columnas, gobernada estrictamente por las capacidades reales de la API de Meta Cloud (Interactive Messages).

## Arquitectura a Reutilizar (EXISTENTE)
- **Tablas**: `whatsapp_surveys`, `whatsapp_survey_options`, `whatsapp_survey_responses`.
- **Lógica**: `sendWhatsAppSurvey` (Server Fn), `trackServiceUsage` (Wallet), `whatsapp-webhook.ts`.
- **Trigger**: `SURVEY_RESPONSE` en el motor de automatizaciones.

## Tareas Técnicas

### 1. Interfaz de Usuario (Editor Pro 3 Columnas)
- [ ] **Estructura de 3 Columnas**:
    - **Izquierda**: Panel de componentes (Título, Tipo, Contenido, Multimedia, Footer).
    - **Centro**: Simulador de WhatsApp realista con "Hot Preview" y datos de ejemplo para variables `{{n}}`.
    - **Derecha**: Configuración contextual del elemento seleccionado.
- [ ] **Lógica de Compatibilidad Dinámica**:
    - **INTERACTIVE_LIST**: 
        - Header: Solo TEXTO (deshabilitar multimedia).
        - Botón de apertura (máx 20 chars).
        - Opciones (2-10 rows).
    - **INTERACTIVE_BUTTONS**: 
        - Header: Texto, Imagen, Video o Documento compatible.
        - Botones de respuesta rápida (1-3 máx).
- [ ] **Validaciones de Meta**: Bloquear el botón "Guardar/Enviar" si se superan los límites (Título 60, Body 1024, Botones/Opciones 24).

### 2. Backend y Conectividad Real
- [ ] **Actualizar `sendWhatsAppSurvey`**:
    - Ajustar el payload según el tipo seleccionado (`list` vs `button`).
    - Soporte para `header` multimedia en tipo `button`.
- [ ] **Estadísticas Reales**: Consultar directamente de `whatsapp_survey_responses` para mostrar:
    - Enviados, Respuestas, Tasa de respuesta, Distribución de votos.

### 3. Verificaciones de Calidad
- [ ] **A**: Lista con 2 opciones.
- [ ] **B**: Lista con 10 opciones.
- [ ] **C**: Botones con 3 respuestas rápidas.
- [ ] **D**: Botones con header de imagen.
- [ ] **E**: Validación de una configuración incompatible.
- [ ] **F**: Respuesta recibida por webhook.
- [ ] **G**: Registro de respuesta y estadísticas.
- [ ] **H**: Cobro correcto en Wallet.

## No se realizará:
- No se crearán nuevas tablas ni webhooks.
- No se usarán mocks.
- No se avanzará a otros módulos (Plantillas, etc.) en este turno.
