# Portal RRHH Aviazion Group

Sitio estático de recursos humanos para Aviazion Group Panamá. Construido con Astro 6 + Tailwind CSS v4 + Alpine.js (CDN). Sin base de datos, sin backend, sin auth. Deploy automático a GitHub Pages via GitHub Actions.

**URL de producción:** https://aviaziongroupsa-pty.github.io

## Commands

- `npm run dev` — Servidor de desarrollo en localhost:4321
- `npm run build` — Build de producción (output en ./dist/)
- `npm run preview` — Preview del build de producción

## Tech Stack

Astro 6 (static) + TypeScript (strict) + Tailwind CSS v4 + Alpine.js v3.14.9 (CDN) + GitHub Pages

## REGLA FUNDAMENTAL: Jornada 6×1 / 208 horas

Todos los empleados de Aviazion Group trabajan jornada 6×1 (6 días trabajo + 1 día descanso).
Esto equivale a 26 días laborales × 8 horas = **208 horas mensuales**.

**El salario por hora SIEMPRE se calcula como: salarioMensual / 208**

Nunca usar 240 (que corresponde a jornada fija de 30 días). Si ves 240 en calculations.ts o en los componentes Alpine, es un bug crítico.

## Architecture

### Directory Structure
- `src/components/layout/` — Header, Footer, BaseLayout
- `src/components/sections/` — Hero, QuickLinks, Calculators, FAQ
- `src/components/calculators/` — Las 4 calculadoras con Alpine.js (OvertimeCalc, VacationCalc, ThirteenthCalc, LiquidationCalc)
- `src/lib/` — calculations.ts (lógica pura de cálculo), types.ts
- `src/pages/index.astro` — Página única que ensambla todas las secciones
- `content/content.json` — Fuente de verdad del contenido: links y FAQs
- `public/` — Assets estáticos (logo-aviazion.png, favicon.png)
- `.github/workflows/deploy.yml` — Pipeline de deploy a GitHub Pages (SHAs fijos)

### Data Flow
content.json → importado en build time → props de componentes Astro → HTML estático
Alpine.js → estado local de cada calculadora → sin llamadas a red

### Key Patterns
- Todo el contenido (links, FAQs) viene de content.json — nunca hardcodear strings en componentes
- Las funciones de cálculo viven en calculations.ts como funciones TypeScript puras
- Alpine.js se carga via CDN con SRI (integrity hash) — no instalar el paquete npm
- Cada sección tiene ID de anchor para smooth scroll desde el nav
- Todas las URLs en QuickLinks pasan por `safeUrl()` que valida protocolo https:/http:
- Los IDs del FAQ pasan por `safeId()` antes de usarse en expresiones Alpine

## Security

### Content Security Policy (meta tag en BaseLayout.astro)
- `'unsafe-eval'` es requerido: Alpine.js v3 usa `new Function()` internamente.

### Alpine.js CDN con SRI
```html
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"
  integrity="sha384-9Ax3MmS9AClxJyd5/zafcXXjxmwFhZCdsT6HJoJjarvCaAkJlk5QDzjLJm+Wdx5F"
  crossorigin="anonymous" defer></script>
```

### GitHub Actions — SHAs fijos
Todos los `uses:` en deploy.yml usan SHA completo, no tags mutables.

## Design System

### Colors (verificar contra aviaziongroup.com)
- Primary: #0B2545 (azul marino — header, botones, iconos)
- Primary Dark: #071730 (hover de primary, footer)
- Accent: #E88C0E (naranja/dorado — badges, bordes activos, CTAs)
- Background: #F1F5F9
- Surface: #FFFFFF (cards, calculadoras)
- Text: #1E293B
- Muted: #64748B
- Success: #059669 (resultado de calculadoras)
- Border: #E2E8F0

### Typography
- Fuente: Inter (headings + body), JetBrains Mono (montos calculados)

## Ley Laboral Panameña (referencia)

- **Sobretiempo** — Ley 44 de 1995, Art. 26: Diurno ×1.25, Nocturno ×1.50, Feriado/Día descanso ×2.00
  - Base hora = salario_mensual / 208 (NO 240)
- **Vacaciones** — Código de Trabajo Art. 54: 30 días por 11 meses trabajados
- **Décimo tercer mes** — Art. 43 CT: 3 cuotas (abril/agosto/diciembre)
- **Liquidación** — Prima: 1 sem/año. Preaviso: <2=1sem, 2-5=2sem, 5-10=4sem, >10=6sem

## Reglas No Negociables

1. **BASE 208H: nunca 240.** salarioMensual/208 en todos los cálculos.
2. **content.json como única fuente de verdad.** Ningún componente tiene texto hardcodeado.
3. **Mobile-first sin excepciones.** Diseñar para 375px primero.
4. **Sin dependencias innecesarias.** El proyecto tiene 3 dependencias npm.
5. **Alpine.js solo via CDN con SRI.** Nunca instalar como paquete npm.
6. **SHAs fijos en GitHub Actions.** Nunca usar tags mutables.
