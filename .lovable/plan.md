# Sprint 6.3 — Activación Funcional del Centro de Contactos

Objetivo: Implementar las funciones core (CRUD, Importación, Exportación, Listas, Segmentos, Etiquetas) del Centro de Contactos para que sea 100% operativo.

## 1. Gestión de Contactos (CRUD)
- [ ] Implementar `ContactFormDialog` para creación y edición.
- [ ] Conectar el botón "+ Nuevo contacto" al diálogo.
- [ ] Implementar la función de servidor `upsertContact` en `src/lib/contacts.functions.ts`.
- [ ] Actualizar `ContactsTable` para permitir edición al hacer clic en una fila.

## 2. Importación CSV
- [ ] Crear componente `CSVImporter` con flujo de pasos: Selección -> Previsualización -> Mapeo -> Validación -> Importación.
- [ ] Implementar función de servidor `processContactImportBatch` para procesamiento seguro por lotes (500 contactos/lote).
- [ ] Soporte para normalización E.164 y detección de duplicados (company_id + phone/email).

## 3. Gestión de Listas
- [ ] Completar `ContactListManager` con acciones reales (Crear, Editar, Eliminar).
- [ ] Implementar vista de contactos por lista.

## 4. Segmentos y Etiquetas
- [ ] Implementar lógica de filtrado dinámico para Segmentos en el servidor.
- [ ] Crear gestor de etiquetas con operaciones CRUD y asignación masiva.

## 5. Exportación
- [ ] Implementar generación real de CSV en el servidor y descarga en el cliente.

## 6. Navegación e Integración
- [ ] Botón "Ver en CRM" que redirija a la ficha del contacto en el módulo comercial.

## Detalles Técnicos
- **Base de Datos**: Uso exclusivo de la tabla `contacts`.
- **Seguridad**: `company_id` siempre inyectado desde el servidor (`requireSupabaseAuth`).
- **Normalización**: Uso de `normalizeWhatsAppPhone` para consistencia multicanal.
