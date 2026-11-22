/* Cálculos puros del dominio: se pueden probar sin navegador ni servicios externos. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.MentorCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function finiteNonNegative(value, label) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new RangeError(`${label} debe ser un número no negativo.`);
    return n;
  }
  function monthlyPayment(principal, annualRatePercent, termYears) {
    const amount = finiteNonNegative(principal, 'El capital');
    const annual = finiteNonNegative(annualRatePercent, 'La tasa anual');
    const years = finiteNonNegative(termYears, 'El plazo');
    if (amount === 0 || years === 0) return 0;
    const monthlyRate = Math.pow(1 + annual / 100, 1 / 12) - 1;
    const count = years * 12;
    return monthlyRate === 0 ? amount / count : amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -count));
  }
  function homePurchaseScenario({ price, savings, income, expenses, downPayment, termYears, annualRatePercent, closingCostPercent }) {
    const p = finiteNonNegative(price, 'El precio');
    const saved = finiteNonNegative(savings, 'Los ahorros');
    const monthlyIncome = finiteNonNegative(income, 'Los ingresos');
    const monthlyExpenses = finiteNonNegative(expenses, 'Los gastos');
    const down = finiteNonNegative(downPayment, 'La cuota inicial');
    const years = finiteNonNegative(termYears, 'El plazo');
    const rate = finiteNonNegative(annualRatePercent, 'La tasa anual');
    const costPercent = finiteNonNegative(closingCostPercent, 'El porcentaje de costos');
    if (down > p) throw new RangeError('La cuota inicial no puede superar el precio.');
    const principal = p - down;
    const installment = monthlyPayment(principal, rate, years);
    const closingCosts = p * costPercent / 100;
    return {
      principal, installment, closingCosts,
      savingsGap: Math.max(0, down + closingCosts - saved),
      paymentToIncomePercent: monthlyIncome ? 100 * installment / monthlyIncome : null,
      paymentAndExpensesToIncomePercent: monthlyIncome ? 100 * (installment + monthlyExpenses) / monthlyIncome : null,
    };
  }
  function investmentScenario({ price, monthlyRent, vacantMonths, monthlyOperatingCosts, monthlyDebtPayment, investedCapital }) {
    const p = finiteNonNegative(price, 'El precio');
    const rent = finiteNonNegative(monthlyRent, 'El canon mensual');
    const vacancy = finiteNonNegative(vacantMonths, 'Los meses vacíos');
    const costs = finiteNonNegative(monthlyOperatingCosts, 'Los gastos operativos');
    const debt = finiteNonNegative(monthlyDebtPayment, 'La cuota de deuda');
    const capital = finiteNonNegative(investedCapital, 'El capital invertido');
    if (vacancy > 12) throw new RangeError('Los meses vacíos no pueden superar 12 al año.');
    const potentialAnnualRent = rent * 12;
    const annualIncomeAfterVacancy = rent * (12 - vacancy);
    const operatingNetIncome = annualIncomeAfterVacancy - costs * 12;
    const cashFlow = operatingNetIncome - debt * 12;
    return {
      potentialAnnualRent,
      annualIncomeAfterVacancy,
      grossYieldPercent: p ? 100 * potentialAnnualRent / p : null,
      operatingNetIncome,
      operatingNetYieldPercent: p ? 100 * operatingNetIncome / p : null,
      annualCashFlow: cashFlow,
      cashOnEquityPercent: capital ? 100 * cashFlow / capital : null,
    };
  }
  function pricePerArea(price, area) {
    const p = finiteNonNegative(price, 'El precio');
    const a = finiteNonNegative(area, 'El área');
    if (a === 0) throw new RangeError('El área debe ser mayor que cero.');
    return p / a;
  }
  return Object.freeze({ monthlyPayment, homePurchaseScenario, investmentScenario, pricePerArea });
});
