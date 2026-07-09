/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Appliance {
  id: string;
  name: string;
  power_w: number;
  hours_per_day: number;
  quantity: number;
  is_critical: boolean;
}

export type SystemType = 'offgrid' | 'grid_tied';
export type BatteryChemistry = 'lifepo4' | 'agm';

export interface OffGridInput {
  appliances: Appliance[];
  autonomyDays: number;
  systemVoltage: 12 | 24 | 48;
  batteryChemistry: BatteryChemistry;
  hspWorstMonth: number;
  peakSimultaneousW: number;
}

export interface OffGridResult {
  E_daily: number; // Wh/day in DC
  E_ac: number;    // Wh/day in AC
  battWh: number;
  battAh: number;
  arrayWp: number;
  controllerA: number;
  inverterW: number;
  DoD: number;
  systemVoltage: number;
}

export interface GridTiedInput {
  annualKwhTarget: number;
  specificYield: number; // kWh/kWp/year
  panelWp: number;       // e.g. 550
}

export interface GridTiedResult {
  kWp: number;
  nPanels: number;
  inverterKw: number;
}

export type CatalogCategory =
  | 'panel'
  | 'inverter_grid'
  | 'inverter_offgrid'
  | 'battery'
  | 'charge_controller'
  | 'mounting'
  | 'wiring'
  | 'protection'
  | 'monitoring'
  | 'misc';

export interface CatalogItem {
  id: string;
  category: CatalogCategory;
  brand: string;
  model: string;
  sku: string;
  power_w?: number;
  capacity_wh?: number;
  voltage_v?: number;
  current_a?: number;
  chemistry?: 'lifepo4' | 'agm' | 'gel';
  unit_price_usd: number;
  active: boolean;
  meta?: Record<string, any>;
}

export interface BomItem {
  id?: string;
  category: CatalogCategory;
  description: string;
  quantity: number;
  unit_price_usd: number;
  line_total_usd: number;
}

export interface FinancialResult {
  annualSavings: number;
  paybackYears: number;
  npv: number;
  irr: number;
  cashFlows: number[]; // 20 years projection
}

export interface SolarSiteData {
  hspByMonth: number[]; // 12 monthly values in kWh/m²/day
  hspWorstMonth: number;
  hspAnnualAvg: number;
  specificYield?: number; // for grid_tied, in kWh/kWp/year
  optimalTilt?: number;
  optimalAzimuth?: number;
  source: 'pvgis' | 'nasa_power' | 'google_solar' | 'estimated';
}

export interface ProjectAssessmentRequest {
  systemType: SystemType;
  location: { lat: number; lon: number };
  address?: string;
  appliances?: Omit<Appliance, 'id'>[];
  autonomyDays?: number;
  batteryChemistry?: BatteryChemistry;
  monthlyKwh?: number;
  tariffUsdPerKwh?: number;
  systemVoltage?: 12 | 24 | 48;
}

export interface ProjectAssessmentResponse {
  projectId: string;
  systemType: SystemType;
  address: string;
  location: { lat: number; lon: number };
  site: SolarSiteData;
  design: {
    systemVoltage?: number;
    arrayPowerWp: number;
    nPanels: number;
    batteryCapacityWh?: number;
    batteryCapacityAh?: number;
    nBatteries?: number;
    controllerCurrentA?: number;
    inverterPowerW: number;
    dailyEnergyWh: number;
    autonomyDays?: number;
  };
  bom: BomItem[];
  finance: {
    capexUsd: number;
    annualSavingsUsd: number;
    paybackYears: number;
    npvUsd: number;
    irrPct: number;
    cashFlows: number[];
  };
}
