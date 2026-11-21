const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

test('calcula cuotas mensuales en pesos con tasa efectiva anual', () => {
  assert.equal(core.monthlyPayment(100_000_000, 0, 10), 100_000_000 / 120);
  const monthly = core.monthlyPayment(220_000_000, 12.5, 20);
  assert.ok(monthly > 2_300_000 && monthly < 2_500_000);
  assert.equal(core.monthlyPayment(0, 12.5, 20), 0);
});

test('estima cuota inicial, costos, faltante y proporción mensual', () => {
  const scenario = core.homePurchaseScenario({
    price: 280_000_000, savings: 60_000_000, income: 8_000_000, expenses: 3_200_000,
    downPayment: 56_000_000, termYears: 20, annualRatePercent: 12.5, closingCostPercent: 3,
  });
  assert.equal(scenario.principal, 224_000_000);
  assert.equal(scenario.closingCosts, 8_400_000);
  assert.equal(scenario.savingsGap, 4_400_000);
  assert.ok(scenario.paymentAndExpensesToIncomePercent > 50);
  assert.equal(core.homePurchaseScenario({price:100,savings:0,income:0,expenses:0,downPayment:100,termYears:10,annualRatePercent:0,closingCostPercent:0}).paymentToIncomePercent, null);
});

test('estima ingresos de arriendo y flujo con vacancia y deuda', () => {
  const scenario = core.investmentScenario({
    price: 300_000_000, monthlyRent: 2_200_000, vacantMonths: 1,
    monthlyOperatingCosts: 350_000, monthlyDebtPayment: 0, investedCapital: 90_000_000,
  });
  assert.equal(scenario.annualGrossIncome, 24_200_000);
  assert.equal(scenario.grossYieldPercent, 24_200_000 / 300_000_000 * 100);
  assert.equal(scenario.operatingNetIncome, 20_000_000);
  assert.equal(scenario.operatingNetYieldPercent, 20_000_000 / 300_000_000 * 100);
  assert.equal(scenario.annualCashFlow, 20_000_000);
  assert.equal(scenario.cashOnEquityPercent, 20_000_000 / 90_000_000 * 100);
});

test('calcula precio por área y rechaza entradas imposibles', () => {
  assert.equal(core.pricePerArea(300_000_000, 60), 5_000_000);
  assert.throws(() => core.monthlyPayment(-1, 10, 20), RangeError);
  assert.throws(() => core.homePurchaseScenario({price:100,savings:0,income:0,expenses:0,downPayment:101,termYears:10,annualRatePercent:0,closingCostPercent:0}), /no puede superar/);
  assert.throws(() => core.investmentScenario({price:100,monthlyRent:1,vacantMonths:13,monthlyOperatingCosts:0,monthlyDebtPayment:0,investedCapital:1}), /no pueden superar/);
  assert.throws(() => core.pricePerArea(1, 0), /mayor que cero/);
});
