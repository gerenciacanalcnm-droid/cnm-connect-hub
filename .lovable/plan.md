# Plan - SPRINT WHATSAPP — ENCUESTAS 2.0 (CORREGIDO)

## Objetivo
Optimizar el editor de encuestas en `Comunicación → WhatsApp → Encuestas` convirtiéndolo en una herramienta profesional de tres columnas. Se reutilizará al 100% la arquitectura actual de base de datos, servicios comerciales y webhooks, mejorando únicamente la capacidad expresiva y multimedia del editor y la precisión del envío a Meta.

## Arquitectura a Reutilizar (EXISTENTE)
- **Tablas**: `whatsapp_surveys`, `whatsapp_survey_options`, `whatsapp_survey_responses`.
- **Lógica**: `sendWhatsAppSurvey` (Server Fn), `trackServiceUsage` (Wallet), `whatsapp-webhook.ts`.
- **Trigger**: `SURVEY_RESPONSE` en el motor de automatizaciones.

## Tareas Técnicas

### 1. Interfaz de Usuario (Editor Pro 3 Columnas)
- [ ] **Rediseño de `whatsapp-surveys.tsx`**:
    - **Panel Izquierdo**: Configuración de información general, tipo de encuesta (Lista vs Botones), contenido (título, cuerpo, multimedia, footer) y opciones dinámicas.
    - **Panel Central**: Simulador de WhatsApp realista con actualización instantánea (Hot Preview). Mostrará datos de ejemplo para variables `{{n}}`.
    - **Panel Derecho**: Ajustes específicos del elemento seleccionado (ej: editar etiquetas de botones, configurar URL de multimedia).
- [ ] **Validación Meta**: Implementar reglas estrictas de Meta (Opciones: máx 24 caracteres; Botones: máx 3; Listas: máx 10).

### 2. Soporte Multimedia y Tipos de Mensaje
- [ ] **Multimedia**: Habilitar carga/URL para cabeceras (Imagen, Video, Documento) solo cuando el tipo de mensaje de Meta lo permita.
- [ ] **Tipos de Respuesta**:
    - `INTERACTIVE_LIST`: 2 a 10 opciones.
    - `INTERACTIVE_BUTTONS`: 1 a 3 botones de respuesta rápida.
- [ ] **Dynamic UI**: Ocultar/deshabilitar campos multimedia o de footer si el tipo de encuesta seleccionado no los soporta según la API de Meta.

### 3. Backend y Conectividad Real
- [ ] **Refactor `sendWhatsAppSurvey`**: Actualizar para que el payload enviado a Meta use `type: "interactive"` con el subtipo correspondiente (`list` o `button`) y soporte `header` multimedia.
- [ ] **Estadísticas Reales**: Implementar lectura directa desde Supabase en el editor para mostrar:
    - Total enviados vs respuestas.
    - Tasa de respuesta (%).
    - Distribución de votos por opción (Realtime).

### 4. Flujo de Datos y Wallet
- [ ] Mantener la integridad de `trackServiceUsage` y `applyWalletMovement` sin cambios estructurales.
- [ ] Asegurar que el webhook registre la respuesta en `whatsapp_survey_responses` vinculando correctamente el `option_key`.

## Criterio de Terminación
- [ ] Editor de 3 columnas funcionando sin errores.
- [ ] Preview refleja cambios en Título/Cuerpo/Opciones/Multimedia/Footer al instante.
- [ ] Envío exitoso a Meta Cloud API validado con un dispositivo real.
- [ ] Wallet descuenta saldo correctamente basado en el consumo real.
- [ ] Webhook procesa la respuesta y dispara la automatización `SURVEY_RESPONSE`.
- [ ] Estadísticas muestran datos verídicos de la base de datos.
