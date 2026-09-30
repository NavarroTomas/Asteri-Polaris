import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const backupRoot = path.join(root, '.asteri-backup-sep27')

function filePath(relative) {
  return path.join(root, relative)
}

function assertFile(relative) {
  const full = filePath(relative)
  if (!fs.existsSync(full)) {
    throw new Error(
      `No existe ${relative}. Ejecutá este script desde la raíz de Asteri-Polaris.`,
    )
  }
  return full
}

function backup(relative) {
  const source = assertFile(relative)
  const destination = path.join(backupRoot, relative)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
}

function read(relative) {
  return fs.readFileSync(assertFile(relative), 'utf8')
}

function write(relative, content) {
  fs.writeFileSync(assertFile(relative), content, 'utf8')
}

function replaceExact(relative, oldText, newText, label) {
  const content = read(relative)

  if (!content.includes(oldText)) {
    throw new Error(
      `No encontré el bloque "${label}" en ${relative}. ` +
        'El script se detuvo para no romper el archivo.',
    )
  }

  write(relative, content.replace(oldText, newText))
}

function replaceRegex(relative, regex, replacement, label) {
  const content = read(relative)

  if (!regex.test(content)) {
    throw new Error(
      `No encontré el bloque "${label}" en ${relative}. ` +
        'El script se detuvo para no romper el archivo.',
    )
  }

  regex.lastIndex = 0
  write(relative, content.replace(regex, replacement))
}

const required = [
  'src/components/RosterShowcase.jsx',
  'src/components/RosterManager.jsx',
  'src/components/RosterInteractionEnhancer.css',
  'src/components/TeamApplicationSection.jsx',
  'src/lib/rosterPlayers.js',
  'src/lib/rosterAdmin.js',
  'src/lib/publicPlayer.js',
  'src/lib/playerAccount.js',
  'src/pages/AccountPage.jsx',
  'src/pages/PlayerPage.jsx',
  'src/pages/PlayerPage.css',
  'src/pages/HomePage.jsx',
]

for (const file of required) {
  assertFile(file)
}

for (const file of required.filter(file => !file.endsWith('TeamApplicationSection.jsx'))) {
  backup(file)
}

console.log('Aplicando ASTERI Sep27...')

// ---------------------------------------------------------------------------
// ROSTER PUBLIC DATA: AGE + REAL NAME DEDUPE
// ---------------------------------------------------------------------------
replaceExact(
  'src/lib/rosterPlayers.js',
  `      real_name,\n      player_role,\n`,
  `      real_name,\n      age,\n      player_role,\n`,
  'age en select de roster',
)

replaceExact(
  'src/lib/rosterPlayers.js',
  `function fallbackForSlug(slug) {\n  return rosterFallback.find((player) => player.slug === slug)\n}\n`,
  `function fallbackForSlug(slug) {\n  return rosterFallback.find((player) => player.slug === slug)\n}\n\nfunction normalizeIdentity(value) {\n  return String(value || '')\n    .trim()\n    .toLocaleLowerCase('es')\n    .replace(/\\s+/g, ' ')\n}\n\nfunction distinctRealName(realName, nickname) {\n  const real = String(realName || '').trim()\n  const nick = String(nickname || '').trim()\n\n  if (!real) return ''\n  if (normalizeIdentity(real) === normalizeIdentity(nick)) return ''\n\n  return real\n}\n`,
  'helper para nombre real',
)

replaceExact(
  'src/lib/rosterPlayers.js',
  `      name:\n        player.real_name ||\n        fallback?.name ||\n        player.nickname ||\n        'ASTERI PLAYER',\n      role: player.player_role || fallback?.role || 'PLAYER',\n`,
  `      name:\n        distinctRealName(player.real_name, player.nickname) ||\n        distinctRealName(fallback?.name, player.nickname),\n      age:\n        player.age !== null && player.age !== undefined\n          ? displayNumber(player.age)\n          : '—',\n      role: player.player_role || fallback?.role || 'PLAYER',\n`,
  'nombre real y edad en roster',
)

// ---------------------------------------------------------------------------
// ROSTER MOBILE DRAG + PUBLIC STATS
// ---------------------------------------------------------------------------
replaceExact(
  'src/components/RosterShowcase.jsx',
  `  const onPointerDown = (event) => {\n    const scroller = scrollerRef.current\n    if (!scroller) return\n\n    dragRef.current = {\n      down: true,\n      startX: event.clientX,\n      startScroll: scroller.scrollLeft,\n      moved: false,\n    }\n\n    scroller.classList.add('is-dragging')\n  }\n`,
  `  const onPointerDown = (event) => {\n    const scroller = scrollerRef.current\n    if (!scroller) return\n\n    if (event.pointerType !== 'mouse') {\n      try {\n        scroller.setPointerCapture?.(event.pointerId)\n      } catch {\n        // Algunos navegadores móviles no exponen pointer capture.\n      }\n    }\n\n    dragRef.current = {\n      down: true,\n      startX: event.clientX,\n      startScroll: scroller.scrollLeft,\n      moved: false,\n    }\n\n    scroller.classList.add('is-dragging')\n  }\n`,
  'pointer capture táctil',
)

replaceExact(
  'src/components/RosterShowcase.jsx',
  `        .selected-player-stats {\n          gap: clamp(18px, 2vw, 34px) !important;\n          border: 0 !important;\n          background: transparent !important;\n        }\n`,
  `        .selected-player-stats {\n          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;\n          gap: clamp(18px, 2vw, 34px) !important;\n          border: 0 !important;\n          background: transparent !important;\n        }\n\n        .selected-player-name > span:empty {\n          display: none !important;\n        }\n\n        .roster-carousel {\n          touch-action: pan-y;\n          overscroll-behavior-x: contain;\n          -webkit-overflow-scrolling: touch;\n          user-select: none;\n        }\n`,
  'grid stats y soporte táctil',
)

replaceExact(
  'src/components/RosterShowcase.jsx',
  `          <div className="selected-player-stats">\n            <div>\n              <strong>{player.stats.rating}</strong>\n              <span>RATING</span>\n            </div>\n            <div>\n              <strong>{player.stats.kd}</strong>\n              <span>K/D</span>\n            </div>\n            <div>\n              <strong>{player.stats.hs}</strong>\n              <span>HS%</span>\n            </div>\n            <div>\n              <strong>{player.stats.maps}</strong>\n              <span>MAPAS</span>\n            </div>\n          </div>\n`,
  `          <div className="selected-player-stats">\n            <div>\n              <strong>{player.stats.maps}</strong>\n              <span>MATCHES JUGADOS</span>\n            </div>\n            <div>\n              <strong>{player.age}</strong>\n              <span>EDAD</span>\n            </div>\n            <div>\n              <strong>{player.role}</strong>\n              <span>POSICIÓN</span>\n            </div>\n          </div>\n`,
  'stats públicas del roster',
)

replaceExact(
  'src/components/RosterShowcase.jsx',
  `          .selected-player-stats {\n            order: 3 !important;\n            width: 100%;\n            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;\n            gap: 8px !important;\n          }\n`,
  `          .selected-player-stats {\n            order: 3 !important;\n            width: 100%;\n            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;\n            gap: 8px !important;\n          }\n`,
  'stats móviles en tres columnas',
)

replaceExact(
  'src/components/RosterShowcase.jsx',
  `          .selected-player-stats strong {\n            font-size: clamp(28px, 10vw, 40px) !important;\n          }\n`,
  `          .selected-player-stats strong {\n            font-size: clamp(22px, 7vw, 34px) !important;\n            overflow-wrap: anywhere;\n          }\n`,
  'tamaño stats móviles',
)

const enhancerCss = read('src/components/RosterInteractionEnhancer.css')
if (!enhancerCss.includes('/* Mobile / touch roster navigation */')) {
  write(
    'src/components/RosterInteractionEnhancer.css',
    `${enhancerCss.trimEnd()}\n\n/* Mobile / touch roster navigation */\n.roster-carousel {\n  touch-action: pan-y;\n  overscroll-behavior-x: contain;\n  -webkit-overflow-scrolling: touch;\n}\n\n.roster-carousel.is-dragging,\n.roster-carousel.is-dragging * {\n  cursor: grabbing !important;\n  user-select: none !important;\n}\n`,
  )
}

// ---------------------------------------------------------------------------
// PUBLIC PLAYER DATA: AGE + REAL NAME DEDUPE
// ---------------------------------------------------------------------------
replaceExact(
  'src/lib/publicPlayer.js',
  `      real_name,\n      player_role,\n`,
  `      real_name,\n      age,\n      player_role,\n`,
  'age en ficha pública',
)

replaceExact(
  'src/lib/publicPlayer.js',
  `  return {\n    player,\n    stats: statsResult.data,\n`,
  `  const normalizedRealName = String(player.real_name || '')\n    .trim()\n    .toLocaleLowerCase('es')\n    .replace(/\\s+/g, ' ')\n\n  const normalizedNickname = String(player.nickname || '')\n    .trim()\n    .toLocaleLowerCase('es')\n    .replace(/\\s+/g, ' ')\n\n  const publicPlayer = {\n    ...player,\n    real_name:\n      normalizedRealName && normalizedRealName !== normalizedNickname\n        ? player.real_name\n        : null,\n  }\n\n  return {\n    player: publicPlayer,\n    stats: statsResult.data,\n`,
  'evitar nickname duplicado con nombre real',
)

// ---------------------------------------------------------------------------
// PUBLIC PLAYER PAGE: ONLY MATCHES / AGE / POSITION
// ---------------------------------------------------------------------------
replaceExact(
  'src/pages/PlayerPage.jsx',
  `  const primaryStats = [\n    ['RATING', valueOrDash(stats.rating)],\n    ['K/D', valueOrDash(stats.kd)],\n    ['HS%', valueOrDash(stats.hs_percentage, stats.hs_percentage !== null && stats.hs_percentage !== undefined ? '%' : '')],\n    ['MAPAS', valueOrDash(stats.maps)],\n  ]\n`,
  `  const primaryStats = [\n    ['MATCHES JUGADOS', valueOrDash(stats.maps)],\n    ['EDAD', valueOrDash(player.age)],\n    ['POSICIÓN', valueOrDash(player.player_role)],\n  ]\n`,
  'stats primarias públicas',
)

replaceExact(
  'src/pages/PlayerPage.jsx',
  `          {primaryStats.map(([label, value]) => (\n            <article key={label}>\n              <span>{label}</span>\n              <strong>{value}</strong>\n            </article>\n          ))}\n`,
  `          {primaryStats.map(([label, value]) => (\n            <article\n              key={label}\n              className={label === 'POSICIÓN' ? 'is-text' : ''}\n            >\n              <span>{label}</span>\n              <strong>{value}</strong>\n            </article>\n          ))}\n`,
  'clase para posición',
)

replaceRegex(
  'src/pages/PlayerPage.jsx',
  /\n        <section className="public-player-section stats-section">[\s\S]*?\n        <\/section>\n\n        <section className="public-player-section config-section-public">/,
  `\n\n        <section className="public-player-section config-section-public">`,
  'quitar performance avanzada pública',
)

replaceExact(
  'src/pages/PlayerPage.jsx',
  `            <span>03</span>\n            <small>CONFIG CS2</small>\n`,
  `            <span>02</span>\n            <small>CONFIG CS2</small>\n`,
  'renumerar setup',
)

replaceExact(
  'src/pages/PlayerPage.jsx',
  `            <span>04</span>\n            <small>HIGHLIGHTS</small>\n`,
  `            <span>03</span>\n            <small>HIGHLIGHTS</small>\n`,
  'renumerar clips',
)

replaceExact(
  'src/pages/PlayerPage.jsx',
  `            <span>05</span>\n            <small>PARTIDOS</small>\n`,
  `            <span>04</span>\n            <small>PARTIDOS</small>\n`,
  'renumerar vods',
)

replaceExact(
  'src/pages/PlayerPage.css',
  `.public-player-primary-stats {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n`,
  `.public-player-primary-stats {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n`,
  'stats públicas tres columnas',
)

replaceExact(
  'src/pages/PlayerPage.css',
  `.public-player-primary-stats strong {\n  font: 400 clamp(54px, 7vw, 110px)/.72 Anton, Impact, sans-serif;\n  letter-spacing: -.03em;\n}\n`,
  `.public-player-primary-stats strong {\n  font: 400 clamp(54px, 7vw, 110px)/.72 Anton, Impact, sans-serif;\n  letter-spacing: -.03em;\n  overflow-wrap: anywhere;\n}\n\n.public-player-primary-stats article.is-text strong {\n  font-size: clamp(28px, 4vw, 58px);\n  line-height: .88;\n}\n`,
  'posición textual en stats',
)

replaceExact(
  'src/pages/PlayerPage.css',
  `  .public-player-primary-stats {\n    grid-template-columns: repeat(2, 1fr);\n  }\n`,
  `  .public-player-primary-stats {\n    grid-template-columns: repeat(3, 1fr);\n  }\n`,
  'tablet stats tres columnas',
)

replaceExact(
  'src/pages/PlayerPage.css',
  `  .public-player-primary-stats {\n    grid-template-columns: 1fr 1fr;\n  }\n\n  .public-player-primary-stats article {\n    min-height: 140px;\n    padding: 17px;\n  }\n`,
  `  .public-player-primary-stats {\n    grid-template-columns: repeat(3, 1fr);\n  }\n\n  .public-player-primary-stats article {\n    min-height: 122px;\n    padding: 12px;\n  }\n\n  .public-player-primary-stats strong {\n    font-size: clamp(28px, 9vw, 40px);\n  }\n\n  .public-player-primary-stats article.is-text strong {\n    font-size: clamp(18px, 5.4vw, 27px);\n  }\n`,
  'mobile stats públicas',
)

// ---------------------------------------------------------------------------
// OWNER ROSTER ADMIN: EDIT AGE
// ---------------------------------------------------------------------------
replaceExact(
  'src/components/RosterManager.jsx',
  `  real_name: '',\n  player_role: '',\n`,
  `  real_name: '',\n  age: '',\n  player_role: '',\n`,
  'age en EMPTY_PLAYER',
)

replaceExact(
  'src/components/RosterManager.jsx',
  `    real_name: inputValue(player.real_name),\n    player_role:\n`,
  `    real_name: inputValue(player.real_name),\n    age: inputValue(player.age),\n    player_role:\n`,
  'normalizar age',
)

replaceExact(
  'src/components/RosterManager.jsx',
  `                  {fieldLabel(\n                    'ROL',\n                    <input\n                      value={\n                        form.player_role\n                      }\n                      onChange={(event) =>\n                        set(\n                          'player_role',\n                          event.target\n                            .value,\n                        )\n                      }\n                      placeholder="Rifler / AWPer / IGL"\n                    />,\n                  )}\n\n                  {fieldLabel(\n                    'PAÍS',\n`,
  `                  {fieldLabel(\n                    'ROL',\n                    <input\n                      value={\n                        form.player_role\n                      }\n                      onChange={(event) =>\n                        set(\n                          'player_role',\n                          event.target\n                            .value,\n                        )\n                      }\n                      placeholder="Rifler / AWPer / IGL"\n                    />,\n                  )}\n\n                  {fieldLabel(\n                    'EDAD',\n                    <input\n                      type="number"\n                      min="13"\n                      max="99"\n                      value={form.age}\n                      onChange={(event) =>\n                        set(\n                          'age',\n                          event.target.value,\n                        )\n                      }\n                      placeholder="20"\n                    />,\n                  )}\n\n                  {fieldLabel(\n                    'PAÍS',\n`,
  'campo edad en roster manager',
)

replaceExact(
  'src/lib/rosterAdmin.js',
  `        real_name,\n        player_role,\n`,
  `        real_name,\n        age,\n        player_role,\n`,
  'age en roster admin select',
)

// Replace both create/save payload occurrences.
{
  const relative = 'src/lib/rosterAdmin.js'
  const content = read(relative)
  const oldText = `    real_name: cleanText(values.real_name),\n    player_role: cleanText(values.player_role),\n`
  const newText = `    real_name: cleanText(values.real_name),\n    age: nullableInteger(values.age),\n    player_role: cleanText(values.player_role),\n`

  if (!content.includes(oldText)) {
    throw new Error('No encontré los payloads de age en rosterAdmin.js')
  }

  write(relative, content.split(oldText).join(newText))
}

// ---------------------------------------------------------------------------
// PLAYER ACCOUNT: EDIT AGE
// ---------------------------------------------------------------------------
replaceExact(
  'src/lib/playerAccount.js',
  `      real_name,\n      player_role,\n`,
  `      real_name,\n      age,\n      player_role,\n`,
  'age en player account select',
)

replaceExact(
  'src/pages/AccountPage.jsx',
  `      real_name: player?.real_name ?? '',\n      player_role: player?.player_role ?? '',\n`,
  `      real_name: player?.real_name ?? '',\n      age: player?.age ?? '',\n      player_role: player?.player_role ?? '',\n`,
  'age en profileForm',
)

replaceExact(
  'src/pages/AccountPage.jsx',
  `      const updated = await updateMyPlayer(player.id, profileForm)\n`,
  `      const updated = await updateMyPlayer(player.id, {\n        ...profileForm,\n        age: cleanNumber(profileForm.age),\n      })\n`,
  'guardar edad del jugador',
)

replaceExact(
  'src/pages/AccountPage.jsx',
  `              <label>\n                <span>ROL</span>\n                <input\n                  value={player.player_role || ''}\n                  onChange={e => changePlayer('player_role', e.target.value)}\n                  placeholder="Rifler / AWPer / IGL"\n                />\n              </label>\n\n              <label>\n                <span>PAÍS</span>\n`,
  `              <label>\n                <span>ROL</span>\n                <input\n                  value={player.player_role || ''}\n                  onChange={e => changePlayer('player_role', e.target.value)}\n                  placeholder="Rifler / AWPer / IGL"\n                />\n              </label>\n\n              <label>\n                <span>EDAD</span>\n                <input\n                  type="number"\n                  min="13"\n                  max="99"\n                  value={player.age ?? ''}\n                  onChange={e => changePlayer('age', e.target.value)}\n                  placeholder="20"\n                />\n              </label>\n\n              <label>\n                <span>PAÍS</span>\n`,
  'campo edad en mi cuenta',
)

// ---------------------------------------------------------------------------
// TEAM APPLICATION SECTION
// ---------------------------------------------------------------------------
replaceExact(
  'src/pages/HomePage.jsx',
  `import CommunitySection from '../components/CommunitySection'\nimport Footer from '../components/Footer'\n`,
  `import CommunitySection from '../components/CommunitySection'\nimport TeamApplicationSection from '../components/TeamApplicationSection'\nimport Footer from '../components/Footer'\n`,
  'import postulación',
)

replaceExact(
  'src/pages/HomePage.jsx',
  `        <div\n          className="asteri-chapter asteri-chapter--future"\n          data-chapter="future"\n        >\n          <ScrollRevealBlock>\n            <NextObjective />\n          </ScrollRevealBlock>\n        </div>\n\n        <div\n          className="asteri-chapter asteri-chapter--community"\n`,
  `        <div\n          className="asteri-chapter asteri-chapter--future"\n          data-chapter="future"\n        >\n          <ScrollRevealBlock>\n            <NextObjective />\n          </ScrollRevealBlock>\n\n          <ScrollRevealBlock>\n            <TeamApplicationSection />\n          </ScrollRevealBlock>\n        </div>\n\n        <div\n          className="asteri-chapter asteri-chapter--community"\n`,
  'sección postulación en Home',
)

console.log('')
console.log('Cambios aplicados correctamente.')
console.log('DB: players.age agregado y lectura pública del calendario ajustada.')
console.log('Backups: .asteri-backup-sep27/')
console.log('')
console.log('Ahora ejecutá:')
console.log('  npm run dev')
console.log('  npm run build')
