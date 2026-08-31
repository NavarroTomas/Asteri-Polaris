# ASTERI V50 — Cleanup Report

Esta versión fue limpiada de manera conservadora a partir del ZIP funcional recibido.

## Eliminado

- `.git/` del paquete de entrega: no se debe reemplazar el historial Git local.
- `node_modules/`: se regenera con `npm install`.
- `dist/`: se regenera con `npm run build`.
- `src/data/players.js`: no tenía imports activos.
- `src/data/matches.js`: no tenía imports activos.
- `src/lib/demoAuth.js`: sistema de autenticación demo abandonado y sin imports.
- `tus-js-client`: ya no se usa desde que se eliminó la subida de demos `.dem`.
- Reglas CSS muertas de `.vod-admin-demo`.
- `public/players/AnyDesk.exe` y su copia temporal: no pertenecían al sitio y habrían quedado públicamente desplegables.
- `public/media/hero.mp4`: archivo viejo; el componente actual usa `ejemplox.mp4`.
- `Founder.png` y `Founder1.png`: sin referencias; se conserva `Founder3.png`.
- Assets de referencia y wordmark viejo sin imports.

## Conservado intencionalmente

- El diseño y estructura visual actual.
- Todas las rutas actuales.
- Auth y guards.
- Panel Owner/Admin.
- Roster Manager.
- VOD Manager.
- Auditoría.
- Player Account / Player Page.
- Fallback del roster dentro de `src/lib/rosterPlayers.js`, porque protege el Home ante una caída temporal de Supabase.
- `public/media/ejemplox.mp4` y las imágenes actualmente usadas.

## Para reemplazar tu proyecto local sin perder GitHub/Vercel

1. Hacé backup de tu carpeta actual.
2. Dentro de la carpeta actual, conservá `.git/` y tu `.env`.
3. Eliminá el resto de los archivos del proyecto.
4. Copiá encima el contenido de esta versión limpia.
5. Ejecutá:

```bash
npm install
npm run dev
```

6. Si funciona, verificá:

```bash
npm run build
```

7. Después actualizá el mismo repositorio:

```bash
git status
git add .
git commit -m "Cleanup ASTERI V50"
git push origin main
```

Vercel seguirá usando el mismo proyecto y la misma URL si ya está conectado a ese repo/rama.
