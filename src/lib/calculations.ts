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
  label: string;
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
      { code: 'SDiu', label: 'ST Diurno DiaNor', factor: BASE.diurno },
      { code: 'SMix', label: 'ST Mixto DiaNor', factor: BASE.mixto },
      { code: 'SNoc', label: 'ST Nocturno DiaNor', factor: BASE.nocturno },
    ],
  },
  {
    title: 'Día Regular — Con Recargo (×1.75)',
    rows: [
      { code: 'SDiuRc', label: 'ST Diurno DiaNor Rec', factor: BASE.diurno * RECARGO },
      { code: 'SMixRc', label: 'ST Mixto DiaNor Rec', factor: BASE.mixto * RECARGO },
      { code: 'SNocRc', label: 'ST Nocturno DiaNor Rec', factor: BASE.nocturno * RECARGO },
    ],
  },
  {
    title: 'Día de Descanso — Sin Recargo',
    rows: [
      { code: 'SDiuDom', label: 'ST Diurno DiaDes', factor: BASE.diurno * DESCANSO },
      { code: 'SMixDom', label: 'ST Mixto DiaDes', factor: BASE.mixto * DESCANSO },
      { code: 'SNocDom', label: 'ST Nocturno DiaDes', factor: BASE.nocturno * DESCANSO },
    ],
  },
  {
    title: 'Día de Descanso — Con Recargo (×1.75)',
    rows: [
      { code: 'SDiuDomRc', label: 'ST Diurno DiaDes Rec', factor: BASE.diurno * DESCANSO * RECARGO },
      { code: 'SMixDomRc', label: 'ST Mixto DiaDes Rec', factor: BASE.mixto * DESCANSO * RECARGO },
      { code: 'SNocDomRc', label: 'ST Nocturno DiaDes Rec', factor: BASE.nocturno * DESCANSO * RECARGO },
    ],
  },
  {
    title: 'Feriado Nacional',
    rows: [{ code: 'Feriado', label: 'ST Feriado Nacional', factor: 2.5 }],
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
  let total = 0;
  const lineas: OvertimeLine[] = [];
  for (const row of OVERTIME_ROWS) {
    const hrs = toAmount(params.horas[row.code]);
    const monto = salarioHora * row.factor * hrs;
    total += monto;
    if (hrs > 0) lineas.push({ ...row, hrs, monto: round2(monto) });
  }
  return { salarioHora, lineas, total: round2(total) };
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
// LIQUIDACIÓN (estimación)
// Semana = (salario × 12) / 52
// Prima de antigüedad: 1 semana por año, PROPORCIONAL a la fracción de año
//   (3 años y 6 meses = 3.5 semanas). Se paga en cualquier motivo de salida.
// Preaviso: <2 años = 1 sem | 2–5 = 2 sem | 5–10 = 4 sem | ≥10 = 6 sem.
//   Solo se suma cuando el motivo de salida lo incluye (LIQUIDATION_REASONS).
// La indemnización por despido injustificado NO se calcula aquí: la nota del
//   motivo lo avisa.
// ------------------------------------------------------------
export const LIQUIDATION_REASONS = [
  {
    id: 'renuncia',
    label: 'Renuncia',
    preaviso: false,
    nota: 'En una renuncia no se suma preaviso ni indemnización.',
  },
  {
    id: 'mutuo',
    label: 'Mutuo acuerdo',
    preaviso: false,
    nota: 'En un mutuo acuerdo no se suma preaviso ni indemnización; cualquier monto adicional depende de lo que se pacte.',
  },
  {
    id: 'justificado',
    label: 'Despido justificado',
    preaviso: false,
    nota: 'En un despido justificado no se suma preaviso ni indemnización.',
  },
  {
    id: 'injustificado',
    label: 'Despido injustificado',
    preaviso: true,
    nota: 'Incluye el preaviso. No incluye la indemnización por despido injustificado: ese monto lo calcula RRHH según tu antigüedad.',
  },
] as const;

export type LiquidationReasonId = (typeof LIQUIDATION_REASONS)[number]['id'];

export function calcLiquidation(params: {
  salarioMensual: number;
  aniosTrabajados: number;
  mesesAdicionales: number;
  diasVacacionesPendientes: number;
  mesesDecimoPeriodoActual: number;
  motivo: LiquidationReasonId;
}): {
  primaAntiguedad: number;
  vacacionesProporcionales: number;
  decimoProporcional: number;
  incluyePreaviso: boolean;
  montoPreaviso: number;
  semanasPreaviso: number;
  total: number;
} {
  const salarioSemanal = (params.salarioMensual * 12) / 52;
  const totalAnios = params.aniosTrabajados + params.mesesAdicionales / 12;

  const primaAntiguedad = round2(salarioSemanal * totalAnios);
  const vacacionesProporcionales = round2((params.salarioMensual / 30) * params.diasVacacionesPendientes);
  const decimoProporcional = round2((params.salarioMensual * params.mesesDecimoPeriodoActual) / 12);

  const incluyePreaviso = LIQUIDATION_REASONS.find((r) => r.id === params.motivo)?.preaviso ?? false;
  let semanasPreaviso = 0;
  if (incluyePreaviso) {
    semanasPreaviso = 1;
    if (totalAnios >= 10) semanasPreaviso = 6;
    else if (totalAnios >= 5) semanasPreaviso = 4;
    else if (totalAnios >= 2) semanasPreaviso = 2;
  }

  const montoPreaviso = round2(salarioSemanal * semanasPreaviso);
  const total = round2(primaAntiguedad + vacacionesProporcionales + decimoProporcional + montoPreaviso);

  return { primaAntiguedad, vacacionesProporcionales, decimoProporcional, incluyePreaviso, montoPreaviso, semanasPreaviso, total };
}
