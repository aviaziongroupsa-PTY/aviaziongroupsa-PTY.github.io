// ============================================================
// Lógica pura de las cuatro calculadoras del portal.
//
// Esta es la ÚNICA implementación de los cálculos: los componentes
// Alpine (src/scripts/calculators.ts) llaman a estas funciones y
// tests/calculations.test.ts las verifica. No dupliques fórmulas en
// los componentes.
//
// REGLA FUNDAMENTAL: jornada 6×1 → 26 días × 8 h = 208 horas/mes.
// El salario por hora SIEMPRE es salarioMensual / 208. Nunca 240.
// ============================================================

export const HORAS_MES = 208;

/** Redondea a centésimos igual que lo hacía la interfaz original. */
export function round2(n: number): number {
  return parseFloat(n.toFixed(2));
}

/** Convierte la entrada de un campo a número ≥ 0 (vacío o inválido → 0). */
export function toAmount(value: unknown): number {
  const n = parseFloat(String(value ?? ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** B/. con separador de miles y dos decimales: B/. 12,345.67 */
export function formatMoney(n: unknown): string {
  return 'B/. ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function hourlyRate(salarioMensual: number): number {
  return salarioMensual / HORAS_MES;
}

// ------------------------------------------------------------
// SOBRETIEMPO — 13 categorías
// Base por tipo de jornada: diurno ×1.25 · mixto ×1.50 · nocturno ×1.75
// Recargo por exceso (3 h diarias / 9 h semanales): ×1.75 sobre la base
// Día de descanso: ×1.50 sobre la base
// Feriado nacional: ×2.50
// ------------------------------------------------------------
const BASE = { diurno: 1.25, mixto: 1.5, nocturno: 1.75 } as const;
const RECARGO = 1.75;
const DESCANSO = 1.5;

export interface OvertimeRow {
  code: string;
  /** Nombre corto que se lee en la tabla, bajo el título de su grupo. */
  label: string;
  /** Nombre del concepto tal como sale en planilla; se muestra entre paréntesis y en el resumen. */
  planilla: string;
  factor: number;
}

export interface OvertimeGroup {
  title: string;
  rows: OvertimeRow[];
}

export const OVERTIME_GROUPS: OvertimeGroup[] = [
  {
    title: 'Día Regular — Sin Recargo',
    rows: [
      { code: 'SDiu', label: 'Diurno', planilla: 'ST Diurno DiaNor', factor: BASE.diurno },
      { code: 'SMix', label: 'Mixto', planilla: 'ST Mixto DiaNor', factor: BASE.mixto },
      { code: 'SNoc', label: 'Nocturno', planilla: 'ST Nocturno DiaNor', factor: BASE.nocturno },
    ],
  },
  {
    title: 'Día Regular — Con Recargo (×1.75)',
    rows: [
      { code: 'SDiuRc', label: 'Diurno', planilla: 'ST Diurno DiaNor Rec', factor: BASE.diurno * RECARGO },
      { code: 'SMixRc', label: 'Mixto', planilla: 'ST Mixto DiaNor Rec', factor: BASE.mixto * RECARGO },
      { code: 'SNocRc', label: 'Nocturno', planilla: 'ST Nocturno DiaNor Rec', factor: BASE.nocturno * RECARGO },
    ],
  },
  {
    title: 'Día de Descanso — Sin Recargo',
    rows: [
      { code: 'SDiuDom', label: 'Diurno', planilla: 'ST Diurno DiaDes', factor: BASE.diurno * DESCANSO },
      { code: 'SMixDom', label: 'Mixto', planilla: 'ST Mixto DiaDes', factor: BASE.mixto * DESCANSO },
      { code: 'SNocDom', label: 'Nocturno', planilla: 'ST Nocturno DiaDes', factor: BASE.nocturno * DESCANSO },
    ],
  },
  {
    title: 'Día de Descanso — Con Recargo (×1.75)',
    rows: [
      { code: 'SDiuDomRc', label: 'Diurno', planilla: 'ST Diurno DiaDes Rec', factor: BASE.diurno * DESCANSO * RECARGO },
      { code: 'SMixDomRc', label: 'Mixto', planilla: 'ST Mixto DiaDes Rec', factor: BASE.mixto * DESCANSO * RECARGO },
      { code: 'SNocDomRc', label: 'Nocturno', planilla: 'ST Nocturno DiaDes Rec', factor: BASE.nocturno * DESCANSO * RECARGO },
    ],
  },
  {
    title: 'Feriado Nacional',
    rows: [{ code: 'Feriado', label: 'Feriado nacional', planilla: 'ST Feriado Nacional', factor: 2.5 }],
  },
];

export const OVERTIME_ROWS: OvertimeRow[] = OVERTIME_GROUPS.flatMap((g) => g.rows);

/** Muestra el factor sin ceros sobrantes pero con dos decimales como mínimo (×1.25, ×2.1875). */
export function formatFactor(factor: number): string {
  const s = String(factor);
  const decimals = s.includes('.') ? s.split('.')[1].length : 0;
  return decimals < 2 ? factor.toFixed(2) : s;
}

export interface OvertimeLine extends OvertimeRow {
  hrs: number;
  monto: number;
}

export function calcOvertime(params: {
  salarioMensual: number;
  horas: Record<string, number>;
}): { salarioHora: number; lineas: OvertimeLine[]; total: number } {
  const salarioHora = hourlyRate(params.salarioMensual);
  const lineas: OvertimeLine[] = OVERTIME_ROWS.map((row) => {
    const hrs = toAmount(params.horas[row.code]);
    return { ...row, hrs, monto: round2(salarioHora * row.factor * hrs) };
  }).filter((l) => l.hrs > 0);
  // El total es la suma de las líneas ya redondeadas, para que el desglose
  // que ve la persona sume exactamente el total.
  const total = round2(lineas.reduce((sum, l) => sum + l.monto, 0));
  return { salarioHora, lineas, total };
}

// ------------------------------------------------------------
// VACACIONES — Código de Trabajo, Art. 54
// 30 días calendario por cada 11 meses trabajados.
// Pago: (salario_mensual / 30) × días
// ------------------------------------------------------------
export function calcVacation(params: {
  salarioMensual: number;
  mesesTrabajados: number;
}): { diasCorresponden: number; montoVacaciones: number } {
  const diasCorresponden = round2((params.mesesTrabajados / 11) * 30);
  const montoVacaciones = round2((params.salarioMensual / 30) * diasCorresponden);
  return { diasCorresponden, montoVacaciones };
}

// ------------------------------------------------------------
// DÉCIMO TERCER MES — 3 cuotas
// Abril (ene–mar = 3 meses), agosto (abr–jul = 4), diciembre (ago–nov = 4)
// Fórmula: (salario_mensual × meses_del_período) / 12
// ------------------------------------------------------------
export const THIRTEENTH_QUOTAS = [
  { id: 'abril', meses: 3, label: 'Cuota Abril (ene–mar, 3 meses)', option: 'Cuota Abril — 15 abr (cubre ene–mar = 3 meses)' },
  { id: 'agosto', meses: 4, label: 'Cuota Agosto (abr–jul, 4 meses)', option: 'Cuota Agosto — 15 ago (cubre abr–jul = 4 meses)' },
  { id: 'diciembre', meses: 4, label: 'Cuota Diciembre (ago–nov, 4 meses)', option: 'Cuota Diciembre — 15 dic (cubre ago–nov = 4 meses)' },
] as const;

export function calcThirteenth(params: {
  salarioMensual: number;
  mesesEnPeriodo: number;
}): { montoDecimo: number; decimoMensualAcumulado: number } {
  const decimoMensualAcumulado = round2(params.salarioMensual / 12);
  const montoDecimo = round2((params.salarioMensual * params.mesesEnPeriodo) / 12);
  return { montoDecimo, decimoMensualAcumulado };
}

// ------------------------------------------------------------
// LIQUIDACIÓN (estimación) — Código de Trabajo (texto de la Ley 44 de 1995)
// Mismas reglas que el portal de LAATS (Contexto-IA, laats/portal-rrhh,
// propuesta-liquidacion-2026-11-17.md). Es una referencia general: el cálculo
// real lo hace RRHH.
// Semana = (salario × 12) / 52
// Prima de antigüedad (arts. 224 y 226): 1 semana por año, proporcional a la
//   fracción de año. Solo contrato por tiempo indefinido, en cualquier motivo
//   de salida.
// Indemnización por despido injustificado (art. 225-C): 3.4 semanas por año
//   en los primeros 10 años y 1 semana por año desde el 11, proporcional.
//   Solo contrato indefinido.
// La ley no prevé una escala de preaviso por antigüedad a favor del
//   trabajador; por eso no se calcula.
// ------------------------------------------------------------
export const INDEMNITY_WEEKS_FIRST_10_YEARS = 3.4;
export const INDEMNITY_WEEKS_AFTER_10_YEARS = 1;

export const LIQUIDATION_CONTRACTS = [
  { id: 'indefinido', label: 'Tiempo indefinido' },
  { id: 'definido', label: 'Tiempo definido' },
] as const;

export const LIQUIDATION_REASONS = [
  { id: 'renuncia', label: 'Renuncia', indemnizacion: false },
  { id: 'mutuo', label: 'Mutuo acuerdo', indemnizacion: false },
  { id: 'justificado', label: 'Despido justificado', indemnizacion: false },
  { id: 'injustificado', label: 'Despido injustificado', indemnizacion: true },
] as const;

export type LiquidationContractId = (typeof LIQUIDATION_CONTRACTS)[number]['id'];
export type LiquidationReasonId = (typeof LIQUIDATION_REASONS)[number]['id'];

export function calcLiquidation(params: {
  salarioMensual: number;
  aniosTrabajados: number;
  mesesAdicionales: number;
  diasVacacionesPendientes: number;
  mesesDecimoPeriodoActual: number;
  contrato: LiquidationContractId;
  motivo: LiquidationReasonId;
}): {
  primaAntiguedad: number;
  indemnizacion: number;
  vacacionesProporcionales: number;
  decimoProporcional: number;
  total: number;
} {
  const salarioSemanal = (params.salarioMensual * 12) / 52;
  const totalAnios = params.aniosTrabajados + params.mesesAdicionales / 12;
  const indefinido = params.contrato === 'indefinido';
  const injustificado = LIQUIDATION_REASONS.find((r) => r.id === params.motivo)?.indemnizacion ?? false;

  const primaAntiguedad = indefinido ? round2(salarioSemanal * totalAnios) : 0;
  const semanasIndemnizacion =
    INDEMNITY_WEEKS_FIRST_10_YEARS * Math.min(totalAnios, 10) +
    INDEMNITY_WEEKS_AFTER_10_YEARS * Math.max(totalAnios - 10, 0);
  const indemnizacion = indefinido && injustificado ? round2(salarioSemanal * semanasIndemnizacion) : 0;
  const vacacionesProporcionales = round2((params.salarioMensual / 30) * params.diasVacacionesPendientes);
  const decimoProporcional = round2((params.salarioMensual * params.mesesDecimoPeriodoActual) / 12);
  const total = round2(primaAntiguedad + indemnizacion + vacacionesProporcionales + decimoProporcional);

  return { primaAntiguedad, indemnizacion, vacacionesProporcionales, decimoProporcional, total };
}
