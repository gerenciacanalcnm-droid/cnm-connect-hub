# Plan - SPRINT WHATSAPP — ENCUESTAS 2.0

## Objetivo
Convertir el módulo de Encuestas de WhatsApp en un editor profesional multimedia de tres columnas, permitiendo la creación de encuestas interactivas (Listas, Botones) con soporte multimedia, integrando validación de Meta y guardado real en la plataforma.

## Tareas Técnicas

### 1. Interfaz de Usuario (Editor 2.0)
- [ ] Rediseñar `src/components/comunicacion/whatsapp-surveys.tsx` con arquitectura de 3 columnas:
    - **Izquierda**: Panel de componentes (Título, Pregunta, Opciones, Multimedia, Footer).
    - **Centro**: Simulador de WhatsApp dinámico de alta fidelidad.
    - **Derecha**: Configuración contextual del elemento seleccionado.
- [ ] Implementar soporte para **Multimedia** (Imagen, Video, Documento) en la cabecera de la encuesta.
- [ ] Implementar **Opciones Dinámicas** (2 a 10 opciones) con validación de longitud de Meta (24 caracteres máx por etiqueta).

### 2. Lógica y Backend
- [ ] Actualizar el esquema de datos para soportar encuestas multimedia (si es necesario) en la tabla `public.whatsapp_surveys`.
- [ ] Refinar `sendWhatsAppSurvey` en `src/lib/whatsapp-surveys.functions.ts` para enviar el payload correcto a Meta Cloud API (mensajes tipo `list` o `interactive`).
- [ ] Asegurar el registro correcto en `whatsapp_messages` para auditoría y cobro del Wallet.

### 3. Integración y Automatización
- [ ] Validar el trigger `SURVEY_RESPONSE` en el motor de automatizaciones para que reaccione a las respuestas de estas nuevas encuestas.
- [ ] Implementar visualización de **Estadísticas Reales** para cada encuesta (votos por opción).

## Detalles Técnicos
- **Validación Meta**: Límites de caracteres (Título 60, Body 1024, Botones/Opciones 24).
- **Tipos de Mensaje**: `list` (Listas interactivas) y `button` (Botones de respuesta rápida).
- **Consumo**: Integración con `trackServiceUsage` para descuento de saldo según la tarifa de WhatsApp.

## Medición de éxito
- Editor funcional con preview en tiempo real.
- Guardado exitoso en base de datos.
- Envío real a un dispositivo de prueba vía Meta Cloud API.
