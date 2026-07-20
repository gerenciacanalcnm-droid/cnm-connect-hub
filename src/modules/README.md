# SMS CNM — Módulos

Cada carpeta representa un dominio de negocio de la plataforma.
La arquitectura sigue principios **Clean Architecture** y **SOLID**:

```
modules/<dominio>/
  components/    # UI específica del módulo
  hooks/         # Hooks del dominio
  services/      # Acceso a datos / API
  types/         # Contratos y tipos
  utils/         # Helpers puros
  index.ts       # Barrel público del módulo
```

Los módulos NO deben importarse entre sí directamente.
Toda comunicación pasa por:

- `@/services/*` (API, Auth)
- `@/store/*` (estado global compartido)
- Eventos/react-query cache

Módulos previstos:

- `auth` — Autenticación (Email, Google OAuth, JWT)
- `dashboard` — Panel principal
- `crm` — Contactos, empresas, segmentos
- `sms` — Envío individual y programado
- `campanas` — Campañas y automatización
- `analytics` — Métricas y reportes
- `cnm-nova` — Asistente IA propietario
- `automatizaciones` — Flujos y disparadores
- `api` — Claves, webhooks, documentación
- `contactos` — Gestión de directorios
- `reportes` — Exportación e informes
- `configuracion` — Preferencias y equipo
- `soporte` — Tickets y ayuda
- `facturacion` — Planes, consumo y pagos
