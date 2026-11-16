// Pruebas de las cuatro calculadoras. Se ejecutan con `npm test`
// (node --test, sin dependencias) y en el workflow antes del build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HORAS_MES,
  OVERTIME_ROWS,
  calcLiquidation,
  calcOvertime,
  calcThirteenth,
  calcVacation,
  formatFactor,
  hourlyRate,
  toAmount,
} from '../src/lib/calculations.ts';

test('regla 208: el salario por hora es salario/208, nunca /240', () => {
  assert.equal(HORAS_MES, 208);
  assert.equal(hourlyRate(1040), 5);
  assert.notEqual(hourlyRate(1040), 1040 / 240);
});

test('toAmount: vacío, texto y negativos valen 0', () => {
  assert.equal(toAmount(''), 0);
  assert.equal(toAmount('abc'), 0);
  assert.equal(toAmount(-5), 0);
  assert.equal(toAmount(undefined), 0);
  assert.equal(toAmount('2.5'), 2.5);
});

test('sobretiempo: los 13 factores son los publicados', () => {
  const f = Object.fromEntries(OVERTIME_ROWS.map((r) => [r.code, r.factor]));
  assert.deepEqual(f, {
    SDiu: 1.25, SMix: 1.5, SNoc: 1.75,
    SDiuRc: 2.1875, SMixRc: 2.625, SNocRc: 3.0625,
    SDiuDom: 1.875, SMixDom: 2.25, SNocDom: 2.625,
    SDiuDomRc: 3.28125, SMixDomRc: 3.9375, SNocDomRc: 4.59375,
    Feriado: 2.5,
  });
  assert.equal(formatFactor(1.5), '1.50');
  assert.equal(formatFactor(2.1875), '2.1875');
  assert.equal(formatFactor(2.5), '2.50');
});

test('sobretiempo: B/. 1,040 → B/. 5.00 la hora', () => {
  const r = calcOvertime({ salarioMensual: 1040, horas: { SDiu: 2, SNocRc: 1, Feriado: 8 } });
  assert.equal(r.salarioHora, 5);
  assert.deepEqual(r.lineas.map((l) => [l.code, l.hrs, l.monto]), [
    ['SDiu', 2, 12.5],
    ['SNocRc', 1, 15.31],
    ['Feriado', 8, 100],
  ]);
  // El total suma montos sin redondear: 12.5 + 15.3125 + 100
  assert.equal(r.total, 127.81);
});

test('sobretiempo: sin horas el total es 0 y no hay líneas', () => {
  const r = calcOvertime({ salarioMensual: 800, horas: {} });
  assert.equal(r.total, 0);
  assert.equal(r.lineas.length, 0);
});

test('sobretiempo: 1 hora diurna con salario 1000 → 1000/208×1.25', () => {
  const r = calcOvertime({ salarioMensual: 1000, horas: { SDiu: 1 } });
  assert.equal(r.total, 6.01);
});

test('vacaciones: 11 meses → 30 días y un salario completo', () => {
  assert.deepEqual(calcVacation({ salarioMensual: 800, mesesTrabajados: 11 }), {
    diasCorresponden: 30,
    montoVacaciones: 800,
  });
});

test('vacaciones: proporcional a 6 meses y tope de 22 meses', () => {
  assert.deepEqual(calcVacation({ salarioMensual: 800, mesesTrabajados: 6 }), {
    diasCorresponden: 16.36,
    montoVacaciones: 436.27,
  });
  assert.deepEqual(calcVacation({ salarioMensual: 900, mesesTrabajados: 22 }), {
    diasCorresponden: 60,
    montoVacaciones: 1800,
  });
});

test('décimo: cuota de 3 y de 4 meses; las tres suman 11/12 del salario', () => {
  assert.deepEqual(calcThirteenth({ salarioMensual: 1200, mesesEnPeriodo: 3 }), {
    montoDecimo: 300,
    decimoMensualAcumulado: 100,
  });
  assert.equal(calcThirteenth({ salarioMensual: 1200, mesesEnPeriodo: 4 }).montoDecimo, 400);
  assert.equal(calcThirteenth({ salarioMensual: 800, mesesEnPeriodo: 4 }).montoDecimo, 266.67);
});

test('liquidación: 3 años y 6 meses, B/. 1,300', () => {
  const r = calcLiquidation({
    salarioMensual: 1300,
    aniosTrabajados: 3,
    mesesAdicionales: 6,
    diasVacacionesPendientes: 15,
    mesesDecimoPeriodoActual: 2,
  });
  // semana = 1300×12/52 = 300
  assert.deepEqual(r, {
    primaAntiguedad: 900,
    vacacionesProporcionales: 650,
    decimoProporcional: 216.67,
    montoPreaviso: 600,
    semanasPreaviso: 2,
    total: 2366.67,
  });
});

test('liquidación: tramos de preaviso (1, 2, 4 y 6 semanas)', () => {
  const sem = (anios: number, meses = 0) =>
    calcLiquidation({
      salarioMensual: 1300,
      aniosTrabajados: anios,
      mesesAdicionales: meses,
      diasVacacionesPendientes: 0,
      mesesDecimoPeriodoActual: 0,
    }).semanasPreaviso;
  assert.equal(sem(0), 1);
  assert.equal(sem(1, 11), 1);
  assert.equal(sem(2), 2);
  assert.equal(sem(4, 11), 2);
  assert.equal(sem(5), 4);
  assert.equal(sem(9, 11), 4);
  assert.equal(sem(10), 6);
});

test('liquidación: menos de un año no genera prima de antigüedad', () => {
  const r = calcLiquidation({
    salarioMensual: 1300,
    aniosTrabajados: 0,
    mesesAdicionales: 11,
    diasVacacionesPendientes: 0,
    mesesDecimoPeriodoActual: 0,
  });
  assert.equal(r.primaAntiguedad, 0);
  assert.equal(r.total, 300);
});
