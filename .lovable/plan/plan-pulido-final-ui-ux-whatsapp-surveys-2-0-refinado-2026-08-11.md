# Plan: Pulido Final UI/UX WhatsApp Surveys 2.0 (Refinado)

Este plan se enfoca en la auditoría y pulido visual/funcional del módulo de Encuestas de WhatsApp mediante ajustes incrementales, preservando la arquitectura y lógica actual.

## Objetivos de Pulido UI/UX

### 1. Ajustes de Interfaz (3 Columnas)
*   **Alineación y Espaciado:** Revisar la estructura de 3 paneles (Configuración | Preview | Detalle/Estadísticas) para asegurar consistencia visual en desktop.
*   **Scroll e Interacción:** Verificar que los formularios largos tengan scroll interno y que los botones de acción (Guardar/Volver) permanezcan accesibles.
*   **Contraste:** Corregir elementos con baja visibilidad, selectores ilegibles o textos claros sobre fondos claros.

### 2. Componentes Interactivos
*   **Lista Interactiva:**
    *   Restaurar texto por defecto a "Ver opciones".
    *   Validar visualmente el límite de 24 caracteres.
    *   Verificar rango de 2 a 10 opciones.
*   **Botones Interactivos:**
    *   Verificar límite de 3 botones.
    *   Asegurar que el preview muestre el texto real ingresado por el usuario.
*   **Multimedia:**
    *   Validar que solo se permita multimedia compatible en el tipo "Botones".
    *   Reflejar cambios multimedia en el preview en tiempo real.

### 3. Visualización y Estados
*   **Preview Realista:** El simulador de WhatsApp debe actualizarse instantáneamente al modificar cualquier campo (título, cuerpo, botones, footer).
*   **Estados de Carga y Vacío:** Pulir los placeholders de "Sin encuestas" y estados de carga para que sigan el diseño Enterprise Nova.
*   **Estadísticas:** Verificar que los datos de Supabase (enviados, respuestas, tasa) se visualicen correctamente sin reconstruir la lógica de consulta.

### 4. Estabilidad y Responsive
*   **Responsive:** Validar usabilidad en Tablet (768px) y Mobile (375px).
*   **Calidad:** Ejecutar `typecheck` y `build` para asegurar estabilidad.

## Criterios de Ejecución
*   **Ajustes Incrementales:** No se reconstruirá el componente `WhatsAppSurveys`. Se realizarán cambios puntuales sobre el código existente.
*   **Integridad:** No se modificará el Wallet, Motor Comercial, Webhooks ni persistencia a menos que se detecte un error crítico.
*   **Validación:** Se entregará un reporte detallado de los cambios realizados y el estado de las pruebas A-K.
