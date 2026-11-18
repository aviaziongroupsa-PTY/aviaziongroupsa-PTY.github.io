# Portal RRHH Aviazion Group

Sitio estático de recursos humanos para Aviazion Group Panamá. Construido con Astro 7 + Tailwind CSS v4 + Alpine.js (build CSP, CDN). Sin base de datos, sin backend, sin auth. Deploy automático a GitHub Pages via GitHub Actions.

**URL de producción:** https://aviaziongroupsa-pty.github.io

## Commands

- `npm run dev` — Servidor de desarrollo en localhost:4321
- `npm test` — Pruebas de las calculadoras (`node --test`, sin dependencias)
- `npm run build` — Build de producción (output en ./dist/)
- `npm run check` — Pruebas + build (lo mismo que corre el workflow)
- `npm run preview` — Preview del build de producción

**Un push a `main` publica en producción.** Trabaja en una rama y verifica antes de fusionar.

## Tech Stack

Astro 7 (static) + TypeScript (strict) + Tailwind CSS v4 + Alpine.js v3.17.5 build CSP (`@alpinejs/csp`, CDN) + GitHub Pages. Portal gemelo: `laats-panama-rrhh` (mismo stack); una mejora en uno suele valer para el otro.

## REGLA FUNDAMENTAL: Jornada 6×1 / 208 horas

Todos los empleados de Aviazion Group trabajan jornada 6×1 (6 días trabajo + 1 día descanso).
Esto equivale a 26 días laborales × 8 horas = **208 horas mensuales**.

**El salario por hora SIEMPRE se calcula como: salarioMensual / 208**

Nunca usar 240 (que corresponde a jornada fija de 30 días). Si ves 240 en calculations.ts o en los componentes Alpine, es un bug crítico.

## Architecture

### Directory Structure
- `src/components/layout/` — Header, Footer, BaseLayout
- `src/components/sections/` — Hero, QuickLinks, Calculators, FAQ
- `src/components/calculators/` — Marcado de las 4 calculadoras (OvertimeCalc, VacationCalc, ThirteenthCalc, LiquidationCalc). Solo HTML + directivas Alpine: **sin fórmulas**.
- `src/lib/calculations.ts` — ÚNICA implementación de los cálculos (funciones puras, tabla de factores de sobretiempo, cuotas del décimo).
- `src/scripts/calculators.ts` — Registra los componentes Alpine (`overtimeCalc`, `vacationCalc`, `thirteenthCalc`, `liquidationCalc`) que llaman a `calculations.ts`.
- `tests/calculations.test.ts` — Casos de prueba de las cuatro calculadoras.
- `src/styles/globals.css` — Tokens de color (`@theme`) y clases de componente (`.btn`, `.field`, `.result`, `.disclaimer`, `.calc-note`).
- `src/pages/index.astro` — Página única que ensambla todas las secciones
- `content/content.json` — Fuente de verdad del contenido: links y FAQs
- `public/` — Logos oficiales del kit de marca (negativo y símbolo blanco), favicon y `og-portal.jpg` (imagen para compartir el enlace)
- `scripts/generar-og.py` — Genera `public/og-portal.jpg` con Pillow a partir del logo oficial (`scripts/logo-aviazion-negativo-1024.png`) y Century Gothic Bold. Todo el contenido va en el cuadrado central de 630 px, que es lo que WhatsApp muestra. No generes esta imagen con Canva: redibuja el logo. La versión editable vive en Canva (carpeta Aviazion Group › Portal RRHH, diseño `DAHbSPQAS1A`) y se regenera con `scripts/generar-og-editable.py` (PPTX por capas que se importa con Subir archivos); si cambias una medida, cámbiala en los dos scripts.
- `.github/workflows/deploy.yml` — Pruebas + build + deploy a GitHub Pages (SHAs fijos)

### Data Flow
content.json → importado en build time → props de componentes Astro → HTML estático
Campos de la calculadora → componente Alpine (`src/scripts/calculators.ts`) → `calculations.ts` → resultado. Sin llamadas a red.

### Key Patterns
- Links y FAQs vienen de content.json. Los títulos de sección y los textos de las calculadoras viven en sus componentes.
- Las fórmulas viven SOLO en calculations.ts. Si cambias una, actualiza o agrega su caso en tests/.
- Alpine.js se carga via CDN con SRI (integrity hash) — no instalar el paquete npm. Es el **build CSP**: en las plantillas no uses `?.`, `??`, `window` ni objetos en `x-data`; el estado va en `Alpine.data()` (`src/scripts/calculators.ts`) y las plantillas leen el resultado con el getter `r`.
- Al editar cualquier campo, la calculadora borra su resultado (`invalidar()`), para no mostrar un monto viejo junto a datos nuevos.
- Los montos se formatean con `formatMoney` (`B/. 12,345.67`).
- En BaseLayout el módulo de calculadoras va ANTES del script de Alpine (escucha `alpine:init`).
- Cada sección tiene ID de anchor para smooth scroll desde el nav
- Las calculadoras son un acordeón: todas cerradas al cargar y una abierta a la vez. En Sobretiempos cada grupo de la tabla se despliega por separado (solo el primero abre al cargar) y un grupo cerrado con horas las muestra en su encabezado.
- Las FAQ 4 y 5 repiten los factores de `OVERTIME_GROUPS`: si cambias un factor, cambia también esas respuestas en content.json.
- Las URLs de QuickLinks pasan por `safeUrl()`: si no es http(s) con dominio real (p. ej. un marcador `REEMPLAZAR_...`), la tarjeta sale como "Próximamente" sin enlace.
- Los IDs del FAQ pasan por `safeId()` antes de usarse en expresiones Alpine

## Security

### Content Security Policy (meta tag en BaseLayout.astro)
- `script-src 'self' https://cdn.jsdelivr.net`, **sin `'unsafe-eval'`** (build CSP de Alpine) y sin `'unsafe-inline'`: los atributos `onclick`/`onmouseover` y los `<script>` en línea se bloquean. Usa CSS (`:hover`) o directivas Alpine. `astro.config.mjs` fija `assetsInlineLimit: 0` para que los scripts salgan siempre como archivo.
- Fuentes: JetBrains Mono alojada en el propio sitio (`@fontsource-variable`); Century Gothic se toma del equipo (`local`, sin archivo). La CSP no admite orígenes externos de estilos ni fuentes.
- GitHub Pages no permite cabeceras HTTP: `frame-ancestors` y `Permissions-Policy` no se pueden aplicar por `<meta>`.

### Alpine.js CDN con SRI
```html
<script src="https://cdn.jsdelivr.net/npm/@alpinejs/csp@3.17.5/dist/cdn.min.js"
  integrity="sha384-Q4UOujiwqAb/jTt3ki4pdkETk4I3rIFQX8h271PLI41okj/YIKY7IQQFMw73wkrX"
  crossorigin="anonymous" defer></script>
```

### GitHub Actions — SHAs fijos
Todos los `uses:` en deploy.yml usan SHA completo, no tags mutables. En pull requests el workflow solo compila y corre las pruebas; publica únicamente en push a `main`.

## Design System

Tema oscuro único. Fuente de verdad de marca: Kit de Marca de Aviazion Group v1.0 (Contexto-IA `aviazion-group/kit-de-marca`). Los tokens viven en `src/styles/globals.css` (`@theme`).

### Colors
- Primary (Navy): #004C80 — botones
- Primary 2 (Cyan): #149EC9 — acentos, iconos, enlaces
- Background: #001C30 · Surface (Navy profundo): #00263F · Footer: #00121F
- Text (Niebla): #F2F7FA · Muted: #9DB4C4
- Accent (Naranja chaleco): #E06A20 — SOLO avisos; en texto pequeño usar #F08A4B
- Success: #34D399 — totales de las calculadoras
- Todo texto debe medir ≥ 4.5:1 contra su fondo real. No uses clases claras de Tailwind (`bg-blue-50`, `text-green-800`…): el sitio no tiene modo claro.

### Logo
- `public/logo-aviazion-negativo.svg` (hero) y `public/logo-aviazion-simbolo-blanco.svg` (encabezado, favicon): archivos oficiales del kit. No estirar, recolorear, ponerle caja ni brillo; logo completo ≥ 100 px de ancho.

### Typography
- Texto y títulos: **Century Gothic**, la oficial del Kit de Marca, con **Arial** de respaldo (lo que fija el kit). Es de pago: no se sirve desde el sitio, se usa la instalada en el equipo (Windows con Office); en teléfonos sale Arial. No vuelvas a una fuente web sin decisión de Josué.
- Montos: JetBrains Mono, alojada en el sitio con `@fontsource-variable`.

## Ley Laboral Panameña (referencia)

- **Sobretiempo** — Base hora = salario_mensual / 208 (NO 240). Factores vigentes en la calculadora (`OVERTIME_GROUPS`): diurno ×1.25, mixto ×1.50, nocturno ×1.75; recargo por exceso ×1.75 sobre la base; día de descanso ×1.50 sobre la base; feriado nacional ×2.50.
- **Vacaciones** — Código de Trabajo Art. 54: 30 días por 11 meses trabajados
- **Décimo tercer mes** — Art. 43 CT: 3 cuotas (abril/agosto/diciembre)
- **Liquidación** — Mismas reglas que el portal de LAATS (Contexto-IA `laats/portal-rrhh/propuesta-liquidacion-2026-11-17.md`): prima de 1 semana por año, proporcional, solo en contrato indefinido; indemnización de 3.4 semanas por año hasta 10 años y 1 después, solo en despido injustificado con contrato indefinido; sin preaviso (la escala 1/2/4/6 no existe en el Código). Es una referencia general: el cálculo real lo hace RRHH.

## Reglas No Negociables

1. **BASE 208H: nunca 240.** salarioMensual/208 en todos los cálculos.
2. **content.json como única fuente de verdad de links y FAQs.**
3. **Mobile-first sin excepciones.** Verificar a 360 px sin desborde horizontal y con objetivos táctiles ≥ 44 px.
4. **Sin dependencias innecesarias.** El proyecto tiene 4 dependencias npm (Astro, Tailwind y su plugin, y JetBrains Mono); las pruebas usan `node --test`.
5. **Alpine.js solo via CDN con SRI.** Nunca instalar como paquete npm.
6. **SHAs fijos en GitHub Actions.** Nunca usar tags mutables.
7. **Una sola implementación de cada fórmula** (calculations.ts) y `npm test` en verde antes de fusionar.
