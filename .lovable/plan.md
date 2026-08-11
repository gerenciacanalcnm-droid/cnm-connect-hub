# Plan: Pulido Final UI/UX WhatsApp Surveys 2.0

Este plan se enfoca exclusivamente en la auditoría y pulido final de la interfaz de usuario y experiencia de usuario del módulo de Encuestas de WhatsApp, sin alterar la lógica de negocio ni la arquitectura backend existente.

## Auditoría Visual y UX

### 1. Estructura de Tres Columnas (Desktop)
*   **Verificación de Alineación:** Asegurar que los paneles Izquierdo (Configuración), Centro (Preview) y Derecho (Configuración Contextual/Estadísticas en vista detalle) mantengan proporciones correctas.
*   **Scroll Interno:** Implementar/verificar scroll independiente en el panel de configuración para evitar que el botón "Guardar" o elementos inferiores queden inaccesibles.
*   **Contraste y Visibilidad:**
    *   Revisar textos blancos sobre fondos claros (especialmente en botones y badges).
    *   Mejorar la legibilidad de los `Select` y placeholders en modo oscuro/claro.
    *   Asegurar que los iconos de Lucide tengan el contraste adecuado respecto a su fondo.

### 2. Módulos Interactivos (Meta Compliance)

#### Lista Interactiva
*   **Límites:** Validar visualmente el límite de 24 caracteres por opción con indicadores de error claros.
*   **Opciones:** Asegurar que el rango de 2 a 10 opciones sea funcional y el botón "Agregar Opción" sea visible.
*   **Preview:** Verificar que el botón de apertura de lista (actualmente con texto por defecto "completado") refleje el estado y diseño real.

#### Botones Interactivos
*   **Restricciones:** Validar el máximo de 3 botones.
*   **Preview Realista:** El preview debe mostrar el texto exacto de las opciones configuradas, eliminando textos de placeholder como "Nuevo botón" una vez el usuario escriba.

#### Multimedia
*   **Compatibilidad:** Bloquear visualmente la carga de multimedia para tipos que no lo soportan según las reglas de Meta.
*   **Visualización:** El preview debe mostrar un placeholder descriptivo (Icono + Tipo) si no hay URL, o el recurso real si es posible.

### 3. Estados de Interfaz
*   **Loading/Empty:** Mejorar los componentes de "Cargando" y "Sin encuestas" para que sigan el lenguaje visual Enterprise (glassmorphism/Nova style).
*   **Feedback:** Asegurar que los mensajes de éxito/error al guardar sean claros y no intrusivos (usando Sonner).

### 4. Responsividad
*   **Mobile (375px):** Adaptar la vista de tres columnas a una navegación por pestañas o stack vertical para asegurar usabilidad total.
*   **Tablet (768px):** Ajustar anchos de columnas.

## Verificación Técnica
*   **Typecheck:** Ejecutar `tsgo --noEmit`.
*   **Build:** Ejecutar `bun run build` para asegurar que no hay regresiones.

## Exclusiones (NO TOCAR)
*   Motores de Wallet/Comercial.
*   Webhooks de WhatsApp.
*   Lógica de CRM o Automatizaciones.
*   Arquitectura de persistencia existente.
