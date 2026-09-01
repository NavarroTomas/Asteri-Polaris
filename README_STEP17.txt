ASTERI — STEP 17
PRODUCCIÓN / SEO / PRESENTACIÓN

BASE
Preparado sobre el main actual de NavarroTomas/Asteri-Polaris después del
Step 16 final. No modifica Supabase, RLS, Admin, roster, VOD logic ni .env.

ARCHIVOS A REEMPLAZAR
- index.html
- package.json
- vercel.json
- src/App.jsx

ARCHIVOS NUEVOS
- src/components/SeoManager.jsx
- src/pages/NotFoundPage.jsx
- scripts/generate-sitemap.mjs
- public/robots.txt
- public/sitemap.xml

QUÉ CAMBIA
1. Se elimina "team website prototype" de la metadata.
2. Title y description definitivos.
3. Open Graph + Twitter Card.
4. Favicon usando el asset oficial src/assets/brand/asteri-a.png.
5. Datos estructurados básicos SportsTeam (JSON-LD).
6. Canonical y metadata se actualizan al navegar en React.
7. /players/:slug y /vods/:slug reciben title/description dinámicos por slug.
8. Login, account, admin y recuperación quedan noindex.
9. Vercel agrega X-Robots-Tag noindex a rutas privadas.
10. robots.txt excluye rutas privadas.
11. sitemap.xml se regenera en CADA npm run build.
    - Home
    - jugadores activos
    - VODs publicados
    Los datos se leen con la publishable key; no usa service role.
12. Las URLs inexistentes ya no redirigen silenciosamente a Home:
    muestran una 404 propia.
13. Headers de producción:
    - X-Content-Type-Options: nosniff
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy para cámara/micrófono/geolocalización.

IMPORTANTE SOBRE OPEN GRAPH DINÁMICO
ASTERI sigue siendo una SPA Vite estática. SeoManager cambia metadata después
de cargar React, lo cual sirve para navegador y motores que renderizan JS.
Discord/WhatsApp y algunos crawlers sociales suelen leer únicamente el HTML
inicial, por lo que por ahora el preview de /players/:slug y /vods/:slug usa
la tarjeta general de ASTERI.

Para tarjetas sociales realmente distintas por jugador/VOD hace falta
prerender/SSR o una capa server/edge. No se agregó ahora para no convertir
la arquitectura del proyecto innecesariamente.

OPEN GRAPH IMAGE
La tarjeta usa el wordmark oficial desde el repositorio GitHub:
src/assets/brand/asteri-wordmark-wide.png

EJECUCIÓN
1. Reemplazar/copiar los archivos.
2. npm run build

Durante build deberías ver algo similar:
[sitemap] X URL(s) -> public/sitemap.xml

Después:
npm run dev

Probar:
/
 /players/pma
 /login
 /admin
 /ruta-que-no-existe
 /robots.txt
 /sitemap.xml

SUBIR
git add index.html package.json vercel.json src/App.jsx src/components/SeoManager.jsx src/pages/NotFoundPage.jsx scripts/generate-sitemap.mjs public/robots.txt public/sitemap.xml
git commit -m "Step 17 production SEO"
git push origin main

NOTA
No hace falta npm install porque no se agregó ninguna dependencia.
package-lock.json no cambia.

CUANDO VERCEL TERMINE
Comprobar:
https://asteri-polaris.vercel.app/robots.txt
https://asteri-polaris.vercel.app/sitemap.xml

PERFORMANCE
El hero actual pesa aproximadamente 11.8 MB y usa preload="metadata".
El viejo public/media/ejemplox.mp4 pesa aproximadamente 38.9 MB.
No se elimina en este parche porque es una limpieza separada y no afecta
el bundle si no se solicita desde la web.
