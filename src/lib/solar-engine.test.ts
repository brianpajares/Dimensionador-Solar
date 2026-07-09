/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sizeOffGrid, sizeGridTied, dailyEnergyFromAppliances, finance } from './solar-engine';
import { Appliance } from '../types';

console.log("==========================================");
console.log("RUNNING SOLAR ENGINE TESTS");
console.log("==========================================");

// Test 1: Off-Grid Case Sierra
try {
  const appliances: Appliance[] = [
    { id: '1', name: 'Focos LED', power_w: 9, hours_per_day: 5, quantity: 3, is_critical: true },
    { id: '2', name: 'Refrigeradora (150W c/ factor)', power_w: 150, hours_per_day: 10, quantity: 1, is_critical: true },
    { id: '3', name: 'TV LED', power_w: 60, hours_per_day: 4, quantity: 1, is_critical: false },
    { id: '4', name: 'Bomba de agua', power_w: 500, hours_per_day: 1, quantity: 1, is_critical: true }
  ];

  // Sum AC Watts of simultaneous appliances for peak demand
  // Simulating peak demand as sum of simultaneously on critical devices or total AC watts
  // Water pump (500W) + Fridge (150W) + Lights (27W) + TV (60W) = 737W total power
  const peakSimultaneousW = 737;

  const offgridRes = sizeOffGrid({
    appliances,
    autonomyDays: 2,
    batteryChemistry: 'lifepo4',
    hspWorstMonth: 3.5,
    peakSimultaneousW
  });

  console.log("\n[TEST 1] Off-grid Sierra Case:");
  console.log(`- Daily AC Demand: ${offgridRes.E_ac} Wh/day`);
  console.log(`- Daily DC Demand (incl. inverter losses): ${offgridRes.E_daily.toFixed(1)} Wh/day`);
  console.log(`- Recommended System Voltage: ${offgridRes.systemVoltage} V`);
  console.log(`- Required Battery Capacity: ${offgridRes.battWh.toFixed(1)} Wh (${offgridRes.battAh.toFixed(1)} Ah)`);
  console.log(`- Required PV Array Power: ${offgridRes.arrayWp.toFixed(1)} Wp`);
  console.log(`- MPPT Charge Current: ${offgridRes.controllerA.toFixed(1)} A`);
  console.log(`- Recommended Inverter Rating: ${offgridRes.inverterW.toFixed(1)} W`);

  // Assertions for off-grid Sierra
  if (offgridRes.arrayWp < 1000 || offgridRes.arrayWp > 1500) {
    throw new Error(`Array Wp (${offgridRes.arrayWp}) out of expected Sierra range!`);
  }
  if (offgridRes.battAh < 150 || offgridRes.battAh > 400) {
    throw new Error(`Battery Ah (${offgridRes.battAh}) out of expected 24V class range!`);
  }
  if (offgridRes.inverterW < 800 || offgridRes.inverterW > 1200) {
    throw new Error(`Inverter W (${offgridRes.inverterW}) out of expected surge range!`);
  }
  console.log("✓ TEST 1 PASSED: Off-grid Sierra calculations are accurate and within engineering ranges.");
} catch (e: any) {
  console.error("✗ TEST 1 FAILED:", e.message);
  process.exit(1);
}

// Test 2: Grid-Tied Case
try {
  const gridRes = sizeGridTied({
    annualKwhTarget: 3000,
    specificYield: 1600,
    panelWp: 550
  });

  console.log("\n[TEST 2] Grid-tied Case (3000 kWh/year):");
  console.log(`- Required kWp: ${gridRes.kWp.toFixed(3)} kWp`);
  console.log(`- Number of 550Wp Panels: ${gridRes.nPanels} panels`);
  console.log(`- Recommended Grid Inverter: ${gridRes.inverterKw.toFixed(2)} kW`);

  // Assertions
  // kWp should be 3000 / 1600 = 1.875
  if (Math.abs(gridRes.kWp - 1.875) > 0.001) {
    throw new Error(`Expected kWp ~1.875, got ${gridRes.kWp}`);
  }
  if (gridRes.nPanels !== 4) {
    throw new Error(`Expected 4 panels, got ${gridRes.nPanels}`);
  }
  console.log("✓ TEST 2 PASSED: Grid-tied calculations are strictly correct (kWp = 1.875, nPanels = 4).");
} catch (e: any) {
  console.error("✗ TEST 2 FAILED:", e.message);
  process.exit(1);
}

// Test 3: Financial Calculations & IRR Convergence
try {
  const finRes = finance({
    capexUsd: 4000,
    systemType: 'offgrid',
    annualSelfConsumedKwh: 2000,
    tariffUsdPerKwh: 0.35, // average avoided diesel cost in rural Peru
    years: 20,
    degradationPct: 0.005,
    discountPct: 0.10
  });

  console.log("\n[TEST 3] Financial Engine Projections:");
  console.log(`- Initial Capex: $4000 USD`);
  console.log(`- Year 1 Savings: $${finRes.annualSavings.toFixed(1)} USD`);
  console.log(`- Payback Period: ${finRes.paybackYears} years`);
  console.log(`- Net Present Value (NPV @ 10% discount): $${finRes.npv} USD`);
  console.log(`- Internal Rate of Return (IRR): ${finRes.irr}%`);

  // Assertions
  if (finRes.paybackYears < 5 || finRes.paybackYears > 7) {
    throw new Error(`Expected payback period around 5.7 years, got ${finRes.paybackYears}`);
  }
  if (finRes.npv <= 0) {
    throw new Error(`NPV should be positive, got ${finRes.npv}`);
  }
  if (finRes.irr < 10 || finRes.irr > 30) {
    throw new Error(`IRR is out of normal boundaries, got ${finRes.irr}%`);
  }
  console.log("✓ TEST 3 PASSED: Financial metrics solved successfully with correct payback and converging IRR.");
} catch (e: any) {
  console.error("✗ TEST 3 FAILED:", e.message);
  process.exit(1);
}

console.log("\n==========================================");
console.log("ALL SOLAR ENGINE TESTS CONVERGED SUCCESSFULLY");
console.log("==========================================");
