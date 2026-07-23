# Master Sprint 4 — Plataforma Frontend Enterprise SMS CNM

Este sprint es enorme (16 módulos, ~60 pantallas, auth, layout, mock data, tablas, formularios). Ejecutarlo en un solo turno produciría código superficial y roto. Lo divido en **6 fases incrementales**, cada una completamente funcional y con typecheck limpio antes de pasar a la siguiente. Todas las fases respetan la arquitectura actual: `Components → Hooks → Repositories → Services → Mock Provider`.

---

## Principios transversales (aplican a todas las fases)

- Sin tocar Design System, Layout, Landing, Dashboard actuales, RBAC, Feature Flags, Company Context.
- Toda pantalla nueva consume datos vía `useXxx()` hook → repository → service → mock.
- Mock data realista se centraliza en `src/services/mocks/` (nuevo), consumido desde services existentes.
- Estados obligatorios en cada módulo: `Loading` (Skeleton), `Empty`, `Error`, `Success`.
- Formularios: React Hook Form + Zod (schemas ya existen en `src/schemas/`, se extienden).
- Tablas: un único `DataTable` Enterprise reutilizable (TanStack Table) usado por todos los módulos.
- Auth screens sin conectar proveedores (botones preparados, sin lógica OAuth).
- Responsive real: sidebar colapsable ya existe; se auditan tablas y charts en mobile.

---

## Fase 1 — Fundamentos reutilizables + Mock Data

Sin esta fase, cada módulo reinventa lo mismo. Se construye una sola vez y todos los módulos lo consumen.

**Componentes nuevos en `src/components/common/`:**
- `data-table.tsx` — TanStack Table Enterprise: paginación, sort, filtros, selección múltiple, columnas configurables, export (CSV), toolbar buscador, acciones por fila.
- `empty-state.tsx`, `error-state.tsx`, `skeleton-table.tsx`, `skeleton-card.tsx`.
- `stat-card.tsx` (variante compacta reutilizable), `section-header.tsx`.
- `confirm-dialog.tsx`, `sheet-form.tsx` (drawer con form estándar).
- `filter-bar.tsx`, `tag-input.tsx`, `phone-input.tsx`, `file-drop.tsx` (CSV/Excel).

**Mock providers en `src/services/mocks/`:**
- `sms.mock.ts`, `campaigns.mock.ts`, `contacts.mock.ts`, `crm.mock.ts`, `analytics.mock.ts`, `billing.mock.ts`, `recharges.mock.ts`, `invoices.mock.ts`, `api-keys.mock.ts`, `support.mock.ts`, `notifications.mock.ts`, `users.mock.ts`, `nova.mock.ts`.
- Generadores deterministas (seeded) con nombres, teléfonos MX/CO/ES, timestamps recientes, estados variados. ~50-200 filas por dominio.
- Cada service existente pasa a leer de su mock (hoy devuelven `[]`).

**Extensión mínima de arquitectura (no rompe nada):**
- Nuevos hooks bajo `src/hooks/` (uno por dominio faltante): `use-contacts`, `use-crm`, `use-recharges`, `use-invoices`, `use-api-keys`, `use-notifications`, `use-users`.
- Nuevos repositories espejo bajo `src/repositories/` para los mismos dominios.
- Nuevas claves en `src/hooks/queries/keys.ts`.

---

## Fase 2 — Autenticación (rutas públicas)

Ruta padre pathless `/_auth` con layout centrado (marca a la izquierda, form a la derecha).

Pantallas en `src/routes/_auth.*.tsx`:
- `login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `account-locked`, `session-expired`.

Cada una: RHF + Zod, estados de submit, botones sociales (Google/Microsoft/GitHub) deshabilitados con tooltip "Próximamente". Sin lógica de sesión real (queda para el sprint de backend).

`head()` propio por pantalla con `noindex`.

---

## Fase 3 — Layout Enterprise (extensión, no reemplazo)

Sobre `_app.tsx` actual:
- **Breadcrumb** dinámico derivado de `useRouterState` + `navigation.ts`.
- **Company Switcher** en Topbar (usa `useCompanyContext` existente).
- **Language Switcher** (ES/EN, i18n existente).
- **Notification Center** (drawer) alimentado por `useNotifications`.
- **Help menu** (docs, atajos, contacto).
- **Command Palette** (`⌘K`) con Global Search sobre mocks: campañas, contactos, clientes, SMS, facturas.
- **Nova drawer** (side sheet) con chat mock — reutiliza estado ya existente `novaOpen`.

Sin tocar `AppSidebar` ni `Topbar` estructural — se agregan slots/componentes nuevos y se ensamblan.

---

## Fase 4 — Módulos operativos (SMS, Campañas, Contactos)

Los tres módulos con más superficie. Cada uno:
- Route principal + rutas hijas donde aplica (`sms.enviar`, `sms.historial`, `sms.plantillas`, `sms.grupos`).
- Formularios completos con validación (contador caracteres/SMS, costo estimado, previsualización, importador CSV/Excel con deduplicación y validación E.164, barra de progreso simulada, dialog resumen).
- Campañas: listado con `DataTable`, wizard de creación (drawer multipaso), acciones duplicar/pausar/reanudar/eliminar (mutations sobre mock).
- Contactos: CRUD completo, importar/exportar, etiquetas, segmentos, campos personalizados, filtros.

---

## Fase 5 — CRM, Analytics, Recargas, Facturación

- **CRM**: pipeline Kanban (drag opcional, fallback botones), tabla de clientes/prospectos, drawer de detalle con tabs (notas, actividades, tareas, historial, recordatorios).
- **Analytics**: dashboard con Recharts (entregas, errores, consumo, costo), comparativos por rango, export PDF (`window.print` con stylesheet) / Excel (CSV).
- **Recargas**: saldo, catálogo de paquetes, historial, detalle de compra, resumen.
- **Facturación**: listado con estados, drawer detalle, botón descargar PDF (mock genera blob HTML→print).

---

## Fase 6 — API Center, Soporte, Nova, Configuración, Notificaciones

- **API Center**: gestión de keys (crear/rotar/revocar con confirm), webhooks, logs (tabla), documentación embebida con snippets (curl/JS/PHP), tabs SDK.
- **Soporte**: tickets con `DataTable`, nuevo ticket (form), FAQ acordeón, tutoriales/videos (grid), documentación (links).
- **CNM Nova**: interfaz chat completa (historial en sidebar, prompt library, sugerencias, acciones rápidas), respuestas simuladas con delay.
- **Configuración**: sub-rutas para Perfil, Empresa, Seguridad (cambio contraseña, sesiones, dispositivos), Notificaciones, Idioma/Zona, Preferencias, Firma, Avatar.
- **Notification Center** full page además del drawer.

---

## Detalles técnicos

- **Estructura de rutas nuevas** bajo `src/routes/_app.<modulo>.<subruta>.tsx` (convención dot-based existente).
- **Code splitting**: automático por route. Módulos pesados (CRM Kanban, Analytics charts) sin `export` de componentes.
- **DataTable API** genérica: `<DataTable data columns toolbar filters onRowClick pagination selection exportFilename />`.
- **Mutations**: `useMutation` con `queryClient.invalidateQueries` — mocks mutables en memoria durante la sesión.
- **i18n**: strings ES por defecto, keys preparadas para EN.
- **Accesibilidad**: labels en icon buttons, focus-visible, roles ARIA (shadcn ya cubre la mayoría).
- **Dark mode**: ya funcional vía tokens; se verifica en cada pantalla nueva.

## Fuera de alcance (explícito)

- Conexión real a proveedores OAuth.
- Backend real / persistencia entre sesiones.
- IA real en Nova.
- Generación real de PDF (se usa `print` con stylesheet).
- Drag & drop pesado en Kanban (versión con botones move; drag como enhancement si queda tiempo).

## Entrega y verificación

Al final de cada fase: typecheck limpio, build ok, revisión visual en desktop + mobile (viewport 375). No avanzo a la siguiente fase sin eso.

## Confirmación

Este alcance es de varios días de trabajo iterativo. ¿Arrancamos por **Fase 1 (fundamentos + mock data)** ahora, o prefieres reordenar prioridades (p.ej. Auth primero, o SMS/Campañas antes que los fundamentos comunes)?
