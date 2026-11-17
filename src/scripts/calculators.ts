// Registra las cuatro calculadoras como componentes Alpine (`x-data="overtimeCalc"`, etc.).
// Toda la aritmética vive en src/lib/calculations.ts; aquí solo hay estado de interfaz.
//
// Este módulo se carga ANTES que el script de Alpine en BaseLayout.astro: Alpine
// dispara `alpine:init` al arrancar y los componentes deben estar ya registrados.
import {
  LIQUIDATION_CONTRACTS,
  LIQUIDATION_REASONS,
  OVERTIME_GROUPS,
  OVERTIME_ROWS,
  THIRTEENTH_QUOTAS,
  calcLiquidation,
  calcOvertime,
  calcThirteenth,
  calcVacation,
  formatFactor,
  formatMoney,
  hourlyRate,
  toAmount,
} from '../lib/calculations';

const SIN_SALARIO = 'Escribe tu salario mensual para calcular.';

const money = formatMoney;

// Valores por defecto que leen las plantillas mientras no hay resultado.
const SIN_RESULTADO = { lineas: [], salarioHora: 0, meses: 0, diasCorresponden: 0 } as Record<string, any>;

document.addEventListener('alpine:init', () => {
  const Alpine = (window as any).Alpine;

  Alpine.magic('money', () => money);

  // Encabezado: fondo al desplazar y menú móvil. Va como componente porque el
  // build CSP de Alpine no deja leer window desde una expresión.
  Alpine.data('siteHeader', () => ({
    scrolled: false,
    open: false,
    init() {
      this.onScroll();
    },
    get barClass() {
      return this.scrolled || this.open
        ? 'bg-[rgba(0,18,31,0.92)] border-[var(--color-border)] shadow-lg'
        : 'bg-transparent border-transparent';
    },
    get expanded() {
      return this.open ? 'true' : 'false';
    },
    get closed() {
      return !this.open;
    },
    onScroll() {
      this.scrolled = window.scrollY > 60;
    },
    toggle() {
      this.open = !this.open;
    },
    close() {
      this.open = false;
    },
  }));

  // El año del pie se calcula en el navegador; el del build queda de respaldo.
  Alpine.data('currentYear', () => ({ year: new Date().getFullYear() }));

  // Acordeón de un solo panel abierto (calculadoras y preguntas frecuentes).
  Alpine.data('accordion', () => ({
    open: null as string | null,
    toggle(id: string) {
      this.open = this.open === id ? null : id;
    },
    isOpen(id: string) {
      return this.open === id;
    },
    expanded(id: string) {
      return this.open === id ? 'true' : 'false';
    },
  }));

  Alpine.data('overtimeCalc', () => ({
    salario: '',
    horas: Object.fromEntries(OVERTIME_ROWS.map((r) => [r.code, 0])) as Record<string, number | string>,
    resultado: null as ReturnType<typeof calcOvertime> | null,
    error: '',
    // `r` es el resultado para las plantillas: el build CSP de Alpine no admite `?.` ni `??`.
    get r() {
      return this.resultado ?? SIN_RESULTADO;
    },
    // Al editar un dato, el resultado anterior deja de valer: se borra.
    invalidar() {
      this.resultado = null;
      this.error = '';
    },
    // Grupos de la tabla desplegados: solo el primero abre al cargar.
    abiertos: OVERTIME_GROUPS.map((_, i) => i === 0),
    horasEnGrupo(codes: string[]) {
      return codes.reduce((t, c) => t + toAmount(this.horas[c]), 0);
    },
    get salarioHora() {
      return hourlyRate(toAmount(this.salario));
    },
    monto(code: string) {
      const row = OVERTIME_ROWS.find((r) => r.code === code);
      return row ? this.salarioHora * row.factor * toAmount(this.horas[code]) : 0;
    },
    celda(code: string) {
      return toAmount(this.salario) > 0 && toAmount(this.horas[code]) > 0 ? money(this.monto(code)) : '—';
    },
    factor: formatFactor,
    calcular() {
      const salarioMensual = toAmount(this.salario);
      if (salarioMensual <= 0) {
        this.error = SIN_SALARIO;
        this.resultado = null;
        return;
      }
      this.error = '';
      const horas = Object.fromEntries(OVERTIME_ROWS.map((r) => [r.code, toAmount(this.horas[r.code])]));
      this.resultado = calcOvertime({ salarioMensual, horas });
    },
  }));

  Alpine.data('vacationCalc', () => ({
    salario: '',
    meses: 11,
    resultado: null as ReturnType<typeof calcVacation> | null,
    error: '',
    // `r` es el resultado para las plantillas: el build CSP de Alpine no admite `?.` ni `??`.
    get r() {
      return this.resultado ?? SIN_RESULTADO;
    },
    // Al editar un dato, el resultado anterior deja de valer: se borra.
    invalidar() {
      this.resultado = null;
      this.error = '';
    },
    calcular() {
      const salarioMensual = toAmount(this.salario);
      if (salarioMensual <= 0) {
        this.error = SIN_SALARIO;
        this.resultado = null;
        return;
      }
      this.error = '';
      this.resultado = calcVacation({ salarioMensual, mesesTrabajados: toAmount(this.meses) });
    },
  }));

  Alpine.data('thirteenthCalc', () => ({
    salario: '',
    cuota: THIRTEENTH_QUOTAS[0].id as string,
    resultado: null as (ReturnType<typeof calcThirteenth> & { meses: number }) | null,
    error: '',
    // `r` es el resultado para las plantillas: el build CSP de Alpine no admite `?.` ni `??`.
    get r() {
      return this.resultado ?? SIN_RESULTADO;
    },
    // Al editar un dato, el resultado anterior deja de valer: se borra.
    invalidar() {
      this.resultado = null;
      this.error = '';
    },
    get quota() {
      return THIRTEENTH_QUOTAS.find((q) => q.id === this.cuota) ?? THIRTEENTH_QUOTAS[0];
    },
    get mesesEnPeriodo() {
      return this.quota.meses;
    },
    get labelCuota() {
      return this.quota.label;
    },
    get acumulado() {
      const s = toAmount(this.salario);
      return s > 0 ? money(s / 12) : '—';
    },
    calcular() {
      const salarioMensual = toAmount(this.salario);
      if (salarioMensual <= 0) {
        this.error = SIN_SALARIO;
        this.resultado = null;
        return;
      }
      this.error = '';
      const meses = this.mesesEnPeriodo;
      this.resultado = { ...calcThirteenth({ salarioMensual, mesesEnPeriodo: meses }), meses };
    },
  }));

  Alpine.data('liquidationCalc', () => ({
    salario: '',
    anios: 0,
    mesesAdicionales: 0,
    diasVacaciones: 0,
    mesesDecimo: 0,
    contrato: LIQUIDATION_CONTRACTS[0].id as string,
    motivo: LIQUIDATION_REASONS[0].id as string,
    resultado: null as (ReturnType<typeof calcLiquidation> & { motivoLabel: string; indefinido: boolean; conIndemnizacion: boolean }) | null,
    error: '',
    // `r` es el resultado para las plantillas: el build CSP de Alpine no admite `?.` ni `??`.
    get r() {
      return this.resultado ?? SIN_RESULTADO;
    },
    // Al editar un dato, el resultado anterior deja de valer: se borra.
    invalidar() {
      this.resultado = null;
      this.error = '';
    },
    calcular() {
      const salarioMensual = toAmount(this.salario);
      if (salarioMensual <= 0) {
        this.error = SIN_SALARIO;
        this.resultado = null;
        return;
      }
      this.error = '';
      const reason = LIQUIDATION_REASONS.find((r) => r.id === this.motivo) ?? LIQUIDATION_REASONS[0];
      const contract = LIQUIDATION_CONTRACTS.find((c) => c.id === this.contrato) ?? LIQUIDATION_CONTRACTS[0];
      const indefinido = contract.id === 'indefinido';
      this.resultado = {
        ...calcLiquidation({
          salarioMensual,
          aniosTrabajados: toAmount(this.anios),
          mesesAdicionales: toAmount(this.mesesAdicionales),
          diasVacacionesPendientes: toAmount(this.diasVacaciones),
          mesesDecimoPeriodoActual: toAmount(this.mesesDecimo),
          contrato: contract.id,
          motivo: reason.id,
        }),
        motivoLabel: reason.label,
        indefinido,
        conIndemnizacion: indefinido && reason.indemnizacion,
      };
    },
  }));
});
