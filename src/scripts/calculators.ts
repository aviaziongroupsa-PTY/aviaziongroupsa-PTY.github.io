// Registra las cuatro calculadoras como componentes Alpine (`x-data="overtimeCalc"`, etc.).
// Toda la aritmética vive en src/lib/calculations.ts; aquí solo hay estado de interfaz.
//
// Este módulo se carga ANTES que el script de Alpine en BaseLayout.astro: Alpine
// dispara `alpine:init` al arrancar y los componentes deben estar ya registrados.
import {
  LIQUIDATION_REASONS,
  OVERTIME_GROUPS,
  OVERTIME_ROWS,
  THIRTEENTH_QUOTAS,
  calcLiquidation,
  calcOvertime,
  calcThirteenth,
  calcVacation,
  formatFactor,
  hourlyRate,
  toAmount,
} from '../lib/calculations';

const SIN_SALARIO = 'Escribe tu salario mensual para calcular.';

const money = (n: unknown) => 'B/. ' + (Number(n) || 0).toFixed(2);

document.addEventListener('alpine:init', () => {
  const Alpine = (window as any).Alpine;

  Alpine.magic('money', () => money);

  Alpine.data('overtimeCalc', () => ({
    salario: '',
    horas: Object.fromEntries(OVERTIME_ROWS.map((r) => [r.code, 0])) as Record<string, number | string>,
    resultado: null as ReturnType<typeof calcOvertime> | null,
    error: '',
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
    motivo: LIQUIDATION_REASONS[0].id as string,
    resultado: null as (ReturnType<typeof calcLiquidation> & { motivoLabel: string; nota: string }) | null,
    error: '',
    calcular() {
      const salarioMensual = toAmount(this.salario);
      if (salarioMensual <= 0) {
        this.error = SIN_SALARIO;
        this.resultado = null;
        return;
      }
      this.error = '';
      // El motivo queda fijado en el resultado: cambiar el selector no altera un cálculo ya mostrado.
      const reason = LIQUIDATION_REASONS.find((r) => r.id === this.motivo) ?? LIQUIDATION_REASONS[0];
      this.resultado = {
        ...calcLiquidation({
          salarioMensual,
          aniosTrabajados: toAmount(this.anios),
          mesesAdicionales: toAmount(this.mesesAdicionales),
          diasVacacionesPendientes: toAmount(this.diasVacaciones),
          mesesDecimoPeriodoActual: toAmount(this.mesesDecimo),
          motivo: reason.id,
        }),
        motivoLabel: reason.label,
        nota: reason.nota,
      };
    },
  }));
});
