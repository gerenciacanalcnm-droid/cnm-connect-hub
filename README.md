# CNM Nova — Enterprise Omnichannel Communication Platform

Plataforma SaaS Enterprise de CNM Digital Media SAS para comunicación
omnicanal: **SMS Masivos, WhatsApp Business y Email Marketing** en un único
Communication Hub, con CRM, automatizaciones, analytics, API y CNM Nova AI.

- Producto: SMS CNM · CNM Nova
- Dominio: sms.canalcnm.com
- Eslogan: Conecta con tus clientes en segundos.

## Capacidades

| Módulo | Descripción |
| --- | --- |
| Communication Hub | Centro omnicanal: dashboard por canal, envíos, campañas, plantillas unificadas, conversaciones y ajustes. |
| SMS | Envío individual, masivo y programado, historial, GSM-7/UCS-2, grupos e importación CSV. |
| WhatsApp Business | Multi-número por departamento, plantillas, campañas y conversaciones (Meta Ready). |
| Email Marketing | Campañas, listas, plantillas, automatizaciones, SMTP y analytics (preparado). |
| CRM | Contactos con canal preferido, segmentos, pipeline y timeline unificado. |
| CNM Nova AI | Copiloto con RAG (pgvector), catálogo de herramientas, prompts versionados y logs de costo. |
| Analytics | Métricas de entrega, lectura, conversión y costo por canal. |
| API Center | Llaves, webhooks, logs y documentación. |
| Super Admin | 22 secciones de control global: empresas, roles, tarifas, planes, flags, auditoría y providers. |

## Stack

TanStack Start (React 19 + TypeScript) · Tailwind CSS · shadcn/ui ·
Framer Motion · Lucide · TanStack Query · React Hook Form · Zod · Zustand ·
Recharts · TanStack Table · Lovable Cloud (Postgres + Auth + Storage + RLS).

## Arquitectura

```text
Component → Hook → Repository → Service → Server Function → Base de datos
```

Sin Mock Providers. Toda la configuración proviene del Settings Engine.

## Documentación

- [Communication Hub](docs/communication-hub.md)
- [WhatsApp Architecture](docs/whatsapp-architecture.md)
- [Email Architecture](docs/email-architecture.md)
- [SMS Architecture](docs/sms-architecture.md)
- [Meta Integration Roadmap](docs/meta-integration-roadmap.md)
