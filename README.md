# ASTERI Web — v0.6.0

Base React + Vite del sitio de ASTERI.

## Cambios de esta versión

- Hero simplificado: ya no usa secuencia de imágenes ni scroll-scrub.
- El hero reproduce un MP4 normal en loop desde `public/media/hero.mp4`.
- Se eliminaron los 83 frames WebP del proyecto para reducir peso.
- Nueva paleta más sobria: negro neutro + verde del logo + verdes profundos y un lima usado solamente como acento.
- Historia más angosta, títulos más chicos y menor separación vertical entre los tres escudos.
- Historia sobre fondo negro puro.
- El selector superior del plantel ahora cambia el jugador activo al hacer click en su imagen/nombre, sin obligar a desplazar la página.
- El nombre gigante detrás del jugador destacado se redujo y usa aproximadamente 40% de opacidad.
- El wordmark inferior del footer vuelve a usar el PNG `src/assets/brand/asteri-wordmark-wide.png`.
- Footer y PNG comparten el fondo `#020505` para integrarse visualmente.

## Paleta v0.6

```css
--color-primary: #01D069;
--color-secondary: #78A887;
--color-accent: #B5E925;
--color-green-medium: #168252;
--color-green-dark: #123A28;

--color-bg: #050706;
--color-bg-secondary: #0D100E;
--color-surface: #151A17;
--color-border: #29312C;

--color-text: #F2F4F0;
--color-text-muted: #939F97;
```

El verde principal mantiene el tono central del logo. El lima queda reservado para pequeños puntos de atención, evitando convertir toda la UI en una composición neón.

## Video del hero

Reemplazá:

`public/media/hero.mp4`

por el highlight definitivo. No hace falta modificar código si conservás ese nombre y ruta.

También podés definir otra ruta mediante:

```env
VITE_HERO_VIDEO_URL=/media/otro-video.mp4
```

Recomendación para producción: MP4 H.264, 1920x1080, sin audio, 8–15 segundos.

## Jugadores

Las imágenes siguen configurándose desde `src/data/players.js`.

Ejemplo:

```js
image: '/players/character1.png'
```

Los PNG transparentes se reutilizan automáticamente tanto en el selector como en la ficha destacada.

## Ejecutar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
