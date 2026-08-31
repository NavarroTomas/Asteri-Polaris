# ASTERI POLARIS

Sitio y plataforma de gestión del equipo ASTERI POLARIS, construido con React + Vite y Supabase.

## Stack

- React + Vite
- React Router
- Supabase Auth
- Supabase PostgreSQL + RLS
- Supabase Storage para imágenes y clips
- GSAP / Motion para animaciones

## Módulos actuales

### Público

- Home del equipo
- Roster cargado desde Supabase
- Partidos / calendario cargados desde VODs publicados
- Fichas públicas en `/players/:slug`
- VODs públicas en `/vods/:slug`

### Jugadores

- Registro e inicio de sesión
- Estado pendiente hasta aprobación del staff
- Edición de ficha, estadísticas y configuración CS2
- Cambio y recuperación de contraseña

### Staff

- `/admin` — overview, usuarios, plantel y auditoría
- `/admin/vods` — gestión de VODs, lineup y clips
- Aprobación y vínculo de cuentas con jugadores
- Activar/desactivar y ordenar jugadores

## Variables de entorno

Copiá `.env.example` como `.env` y completá:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICA
```

`.env` está ignorado por Git y no debe subirse al repositorio.

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

El resultado se genera en `dist/`.

## Hero

Por defecto se utiliza:

```text
public/media/ejemplox.mp4
```

Se puede cambiar sin tocar código con:

```env
VITE_HERO_VIDEO_URL=/media/otro-video.mp4
```

## Datos de jugadores

La fuente principal es Supabase. `src/lib/rosterPlayers.js` conserva un fallback visual de los seis jugadores actuales para que el Home no quede inutilizable si falla temporalmente la consulta.

## VODs

ASTERI no almacena demos `.dem`. La VOD principal se gestiona mediante una URL externa, por ejemplo YouTube o Google Drive. Los clips sí pueden usar URL externa o Supabase Storage.

## Vercel

`vercel.json` contiene el rewrite necesario para que las rutas de React Router funcionen al recargar una URL directa.

Antes de producción, configurar en Vercel las mismas variables de entorno y agregar el dominio final a los Redirect URLs de Supabase Auth para `/update-password`.
