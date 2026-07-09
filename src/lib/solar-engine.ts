/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Appliance, OffGridInput, OffGridResult, GridTiedInput, GridTiedResult, FinancialResult, CatalogItem, BomItem, SystemType } from '../types';
import { CATALOG } from './catalog';

// Constants specified in PRD Section 7.3
export const ETA_INVERTER = 0.90;      // inverter efficiency
export const ETA_BATTERY = 0.85;       // battery round-trip efficiency
export const ETA_PV_PATH = 0.75;       // MPPT charge, wiring, dust, temp losses
export const OVERSIZE_PV = 1.15;       // safety margin for cloudy days
export const CTRL_MARGIN = 1.25;       // MPPT safety factor
export const INV_SURGE = 1.25;         // inverter startup surge factor

/**
 * Calculates total AC Wh/day from a list of appliances
 */
export function dailyEnergyFromAppliances(appliances: Appliance[]): number {
  return appliances.reduce((sum, a) => sum + a.power_w * a.hours_per_day * a.quantity, 0);
}

/**
 * Dimensions an OFF-GRID solar system based on PRD formulas
 */
export function sizeOffGrid(input: {
  appliances: Appliance[];
  autonomyDays: number;
  batteryChemistry: 'lifepo4' | 'agm';
  hspWorstMonth: number;
  peakSimultaneousW: number;
}): OffGridResult {
  const E_ac = dailyEnergyFromAppliances(input.appliances);
  const E_daily = E_ac / ETA_INVERTER; // Wh/day in DC

  // 7.5 selection of system voltage based on daily AC demand (E_ac)
  // <1.5 kWh/day -> 12V; 1.5-5 kWh/day -> 24V; >5 kWh/day -> 48V
  let systemVoltage: 12 | 24 | 48 = 12;
  if (E_ac >= 1500 && E_ac <= 5000) {
    systemVoltage = 24;
  } else if (E_ac > 5000) {
    systemVoltage = 48;
  }

  // Battery bank sizing
  const DoD = input.batteryChemistry === 'lifepo4' ? 0.8 : 0.5;
  const battWh = (E_daily * input.autonomyDays) / (DoD * ETA_BATTERY);
  const battAh = battWh / systemVoltage;

  // PV array sizing
  const arrayWp = (E_daily / (input.hspWorstMonth * ETA_PV_PATH)) * OVERSIZE_PV;

  // Charge controller sizing
  const controllerA = (arrayWp / systemVoltage) * CTRL_MARGIN;

  // Inverter sizing
  const inverterW = input.peakSimultaneousW * INV_SURGE;

  return {
    E_daily,
    E_ac,
    battWh,
    battAh,
    arrayWp,
    controllerA,
    inverterW,
    DoD,
    systemVoltage
  };
}

/**
 * Dimensions a GRID-TIED solar system based on PRD formulas
 */
export function sizeGridTied(input: {
  annualKwhTarget: number;
  specificYield: number; // kWh/kWp/year
  panelWp: number;
}): GridTiedResult {
  const kWp = input.annualKwhTarget / input.specificYield;
  const nPanels = Math.ceil((kWp * 1000) / input.panelWp);
  const inverterKw = kWp / 1.15; // standard DC/AC ratio of 1.15

  return {
    kWp,
    nPanels,
    inverterKw
  };
}

/**
 * Solves Net Present Value (NPV)
 */
export function calculateNPV(
  capexUsd: number,
  annualSavingsUsd: number,
  discountRate: number, // e.g. 0.10 for 10%
  years: number = 20,
  degradationPct: number = 0.005 // 0.5% per year
): { npv: number; cashFlows: number[] } {
  const cashFlows: number[] = [-capexUsd];
  let npv = -capexUsd;

  for (let t = 1; t <= years; t++) {
    // Linear PV output degradation
    const degradationMultiplier = 1 - (t - 1) * degradationPct;
    const savingsForYear = annualSavingsUsd * Math.max(0, degradationMultiplier);
    cashFlows.push(savingsForYear);
    npv += savingsForYear / Math.pow(1 + discountRate, t);
  }

  return { npv, cashFlows };
}

/**
 * Solves Internal Rate of Return (IRR) using Bisection Fallback solver
 */
export function calculateIRR(cashFlows: number[]): number {
  // Solve for discount rate r such that NPV(r) = 0
  let low = -0.99;
  let high = 5.0;
  const precision = 1e-6;
  const maxIterations = 100;

  // Quick sign check to see if IRR is mathematically solvable
  const hasNegative = cashFlows.some(f => f < 0);
  const hasPositive = cashFlows.some(f => f > 0);
  if (!hasNegative || !hasPositive) return 0;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    let npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + mid, t);
    }

    if (Math.abs(npv) < precision) {
      return mid * 100; // as percent
    }

    // NPV decreases as mid increases
    if (npv > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return ((low + high) / 2) * 100;
}

/**
 * Financial analyzer module
 */
export function finance(input: {
  capexUsd: number;
  systemType: SystemType;
  annualSelfConsumedKwh: number;
  tariffUsdPerKwh: number;
  years?: number;
  degradationPct?: number;
  discountPct?: number;
}): FinancialResult {
  const years = input.years || 20;
  const degradationPct = input.degradationPct !== undefined ? input.degradationPct : 0.005;
  const discountPct = input.discountPct !== undefined ? input.discountPct : 0.10;

  // Annual savings calculation
  const annualSavings = input.annualSelfConsumedKwh * input.tariffUsdPerKwh;
  const paybackYears = annualSavings > 0 ? input.capexUsd / annualSavings : 99;

  // NPV and Cash flows
  const { npv, cashFlows } = calculateNPV(input.capexUsd, annualSavings, discountPct, years, degradationPct);
  
  // IRR calculation
  const irr = calculateIRR(cashFlows);

  return {
    annualSavings,
    paybackYears: Math.round(paybackYears * 10) / 10,
    npv: Math.round(npv),
    irr: Math.round(irr * 10) / 10,
    cashFlows: cashFlows.map(val => Math.round(val))
  };
}

/**
 * Hardware Selection & BOM Generator
 */
export function selectEquipment(params: {
  systemType: SystemType;
  offgridResult?: OffGridResult;
  gridtiedResult?: GridTiedResult;
  batteryChemistry?: 'lifepo4' | 'agm';
}): BomItem[] {
  const bom: BomItem[] = [];

  if (params.systemType === 'offgrid' && params.offgridResult) {
    const res = params.offgridResult;
    const chemistry = params.batteryChemistry || 'lifepo4';

    // 1. Panel selection
    const panel = CATALOG.find(item => item.id === 'panel-jinko-550')!;
    const nPanels = Math.ceil(res.arrayWp / (panel.power_w || 550));
    bom.push({
      category: 'panel',
      description: `${panel.brand} ${panel.model} (${panel.sku})`,
      quantity: nPanels,
      unit_price_usd: panel.unit_price_usd,
      line_total_usd: nPanels * panel.unit_price_usd
    });

    // 2. Battery selection
    let selectedBattery: CatalogItem;
    let nBatteries = 0;

    if (chemistry === 'lifepo4') {
      if (res.systemVoltage === 12) {
        // Fallback to high-quality Gel for 12V as Lithium typically is 24V/48V in catalog
        selectedBattery = CATALOG.find(item => item.id === 'battery-ultracell-12v-200ah')!;
        const capacityPerBattery = selectedBattery.capacity_wh || 2400;
        nBatteries = Math.ceil(res.battWh / capacityPerBattery);
      } else if (res.systemVoltage === 24) {
        selectedBattery = CATALOG.find(item => item.id === 'battery-pylontech-24v-100ah')!;
        const capacityPerBattery = selectedBattery.capacity_wh || 2560;
        nBatteries = Math.ceil(res.battWh / capacityPerBattery);
      } else {
        selectedBattery = CATALOG.find(item => item.id === 'battery-pylontech-48v-100ah')!;
        const capacityPerBattery = selectedBattery.capacity_wh || 4800;
        nBatteries = Math.ceil(res.battWh / capacityPerBattery);
      }
    } else {
      // AGM/Gel selection
      selectedBattery = CATALOG.find(item => item.id === 'battery-ultracell-12v-200ah')!;
      const batteryVoltage = selectedBattery.voltage_v || 12;
      const numSeries = res.systemVoltage / batteryVoltage;
      const battWhPerString = (selectedBattery.capacity_wh || 2400) * numSeries;
      const numParallel = Math.ceil(res.battWh / battWhPerString);
      nBatteries = numSeries * numParallel;
    }

    bom.push({
      category: 'battery',
      description: `${selectedBattery.brand} ${selectedBattery.model} (${selectedBattery.sku})`,
      quantity: nBatteries,
      unit_price_usd: selectedBattery.unit_price_usd,
      line_total_usd: nBatteries * selectedBattery.unit_price_usd
    });

    // 3. Inverter Charger selection
    let inverter: CatalogItem;
    if (res.systemVoltage === 12) {
      inverter = CATALOG.find(item => item.id === 'inverter-offgrid-must-1kw')!;
    } else if (res.systemVoltage === 24) {
      inverter = CATALOG.find(item => item.id === 'inverter-offgrid-must-3kw')!;
    } else {
      inverter = CATALOG.find(item => item.id === 'inverter-offgrid-must-5kw')!;
    }

    // Adjust in case user has massive load exceeding inverter voltage class standard
    if (res.inverterW > (inverter.power_w || 1000)) {
      // Upgrade to higher voltage class if required
      if (inverter.id === 'inverter-offgrid-must-1kw') {
        inverter = CATALOG.find(item => item.id === 'inverter-offgrid-must-3kw')!;
      } else if (inverter.id === 'inverter-offgrid-must-3kw') {
        inverter = CATALOG.find(item => item.id === 'inverter-offgrid-must-5kw')!;
      }
    }

    bom.push({
      category: 'inverter_offgrid',
      description: `${inverter.brand} ${inverter.model} (Inversor Híbrido con MPPT incorporado)`,
      quantity: 1,
      unit_price_usd: inverter.unit_price_usd,
      line_total_usd: inverter.unit_price_usd
    });

    // 4. Standalone MPPT (only added if solar array exceeds inverter MPPT capacity)
    if (res.controllerA > (inverter.current_a || 40)) {
      const extraMppt = CATALOG.find(item => item.category === 'charge_controller' && item.current_a! >= (res.controllerA - inverter.current_a!)) || CATALOG.find(item => item.id === 'mppt-srne-60a')!;
      bom.push({
        category: 'charge_controller',
        description: `Controlador MPPT Adicional: ${extraMppt.brand} ${extraMppt.model} (${extraMppt.sku})`,
        quantity: 1,
        unit_price_usd: extraMppt.unit_price_usd,
        line_total_usd: extraMppt.unit_price_usd
      });
    }

    // 5. Structure
    const structuresNeeded = Math.ceil(nPanels / 4);
    const structureItem = structuresNeeded <= 1 && nPanels <= 2
      ? CATALOG.find(item => item.id === 'structure-2p-roof')!
      : CATALOG.find(item => item.id === 'structure-4p-ground')!;
    const structureQty = structuresNeeded <= 1 && nPanels <= 2 ? 1 : structuresNeeded;
    bom.push({
      category: 'mounting',
      description: `${structureItem.brand} ${structureItem.model}`,
      quantity: structureQty,
      unit_price_usd: structureItem.unit_price_usd,
      line_total_usd: structureQty * structureItem.unit_price_usd
    });

    // 6. Protections
    const prot = CATALOG.find(item => item.id === 'protection-cabinet')!;
    bom.push({
      category: 'protection',
      description: `${prot.brand} ${prot.model}`,
      quantity: 1,
      unit_price_usd: prot.unit_price_usd,
      line_total_usd: prot.unit_price_usd
    });

    // 7. Wiring
    const wire = CATALOG.find(item => item.id === 'cabling-kit-solar')!;
    const wireQty = Math.max(1, Math.ceil(nPanels / 4));
    bom.push({
      category: 'wiring',
      description: `${wire.brand} ${wire.model}`,
      quantity: wireQty,
      unit_price_usd: wire.unit_price_usd,
      line_total_usd: wireQty * wire.unit_price_usd
    });

    // 8. Monitoring Wifi (Highly premium inclusion)
    const monitor = CATALOG.find(item => item.id === 'monitoring-wifi')!;
    bom.push({
      category: 'monitoring',
      description: `${monitor.brand} ${monitor.model}`,
      quantity: 1,
      unit_price_usd: monitor.unit_price_usd,
      line_total_usd: monitor.unit_price_usd
    });

  } else if (params.systemType === 'grid_tied' && params.gridtiedResult) {
    const res = params.gridtiedResult;

    // 1. Panels selection
    const panel = CATALOG.find(item => item.id === 'panel-jinko-550')!;
    bom.push({
      category: 'panel',
      description: `${panel.brand} ${panel.model} (${panel.sku})`,
      quantity: res.nPanels,
      unit_price_usd: panel.unit_price_usd,
      line_total_usd: res.nPanels * panel.unit_price_usd
    });

    // 2. Inverter selection (Grid-Tied)
    let selectedInv = CATALOG.find(item => item.id === 'inverter-grid-growatt-2kw')!;
    const invWNeeded = res.inverterKw * 1000;
    if (invWNeeded > 2000 && invWNeeded <= 3600) {
      selectedInv = CATALOG.find(item => item.id === 'inverter-grid-growatt-3.6kw')!;
    } else if (invWNeeded > 3600 && invWNeeded <= 5000) {
      selectedInv = CATALOG.find(item => item.id === 'inverter-grid-growatt-5kw')!;
    } else if (invWNeeded > 5000) {
      selectedInv = CATALOG.find(item => item.id === 'inverter-grid-growatt-10kw')!;
    }

    bom.push({
      category: 'inverter_grid',
      description: `${selectedInv.brand} ${selectedInv.model} (${selectedInv.sku})`,
      quantity: 1,
      unit_price_usd: selectedInv.unit_price_usd,
      line_total_usd: selectedInv.unit_price_usd
    });

    // 3. Structure
    const structuresNeeded = Math.ceil(res.nPanels / 4);
    const structureItem = structuresNeeded <= 1 && res.nPanels <= 2
      ? CATALOG.find(item => item.id === 'structure-2p-roof')!
      : CATALOG.find(item => item.id === 'structure-4p-ground')!;
    const structureQty = structuresNeeded <= 1 && res.nPanels <= 2 ? 1 : structuresNeeded;
    bom.push({
      category: 'mounting',
      description: `${structureItem.brand} ${structureItem.model}`,
      quantity: structureQty,
      unit_price_usd: structureItem.unit_price_usd,
      line_total_usd: structureQty * structureItem.unit_price_usd
    });

    // 4. Protections
    const prot = CATALOG.find(item => item.id === 'protection-cabinet')!;
    bom.push({
      category: 'protection',
      description: `${prot.brand} ${prot.model}`,
      quantity: 1,
      unit_price_usd: prot.unit_price_usd,
      line_total_usd: prot.unit_price_usd
    });

    // 5. Wiring
    const wire = CATALOG.find(item => item.id === 'cabling-kit-solar')!;
    const wireQty = Math.max(1, Math.ceil(res.nPanels / 4));
    bom.push({
      category: 'wiring',
      description: `${wire.brand} ${wire.model}`,
      quantity: wireQty,
      unit_price_usd: wire.unit_price_usd,
      line_total_usd: wireQty * wire.unit_price_usd
    });
  }

  return bom;
}
