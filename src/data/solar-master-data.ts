import type { CatalogItem } from '../types';

export const MASTER_DATA_VERSION = 'solconfigura-master-2026.08.10';
export const MASTER_DATA_SOURCE = 'SolConfigura_Master_Data.xlsx';

export type MasterSolarRegion = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  hspByMonth: number[];
  hspWorstMonth: number;
  hspAnnualAvg: number;
  specificYield: number;
  optimalTilt: number;
  optimalAzimuth: number;
  segment: 'coast' | 'andes' | 'jungle';
  confidence: 'high' | 'medium';
};

export const SOLAR_REGIONS: MasterSolarRegion[] = [
  { id: 'pe-cajamarca', name: 'Cajamarca - Sierra norte', country: 'PE', lat: -7.15, lon: -78.51, hspByMonth: [5.9, 5.7, 5.5, 5.2, 4.9, 4.8, 5.0, 5.4, 5.8, 6.0, 6.1, 6.0], hspWorstMonth: 4.8, hspAnnualAvg: 5.53, specificYield: 1615, optimalTilt: 10, optimalAzimuth: 0, segment: 'andes', confidence: 'high' },
  { id: 'pe-lima', name: 'Lima - Costa central', country: 'PE', lat: -12.05, lon: -77.04, hspByMonth: [5.8, 5.7, 5.2, 4.4, 3.7, 3.3, 3.2, 3.6, 4.3, 5.0, 5.6, 5.9], hspWorstMonth: 3.2, hspAnnualAvg: 4.64, specificYield: 1355, optimalTilt: 14, optimalAzimuth: 0, segment: 'coast', confidence: 'high' },
  { id: 'pe-arequipa', name: 'Arequipa - Costa/sierra sur', country: 'PE', lat: -16.4, lon: -71.54, hspByMonth: [6.5, 6.3, 6.1, 5.8, 5.5, 5.4, 5.6, 5.9, 6.2, 6.5, 6.7, 6.8], hspWorstMonth: 5.4, hspAnnualAvg: 6.11, specificYield: 1785, optimalTilt: 18, optimalAzimuth: 0, segment: 'andes', confidence: 'high' },
  { id: 'pe-cusco', name: 'Cusco - Andes alto', country: 'PE', lat: -13.52, lon: -71.97, hspByMonth: [5.8, 5.7, 5.5, 5.3, 5.1, 5.0, 5.2, 5.5, 5.8, 6.0, 6.1, 6.0], hspWorstMonth: 5.0, hspAnnualAvg: 5.58, specificYield: 1630, optimalTilt: 16, optimalAzimuth: 0, segment: 'andes', confidence: 'high' },
  { id: 'pe-piura', name: 'Piura - Costa norte', country: 'PE', lat: -5.19, lon: -80.63, hspByMonth: [6.2, 6.1, 5.9, 5.7, 5.4, 5.2, 5.3, 5.5, 5.8, 6.0, 6.2, 6.3], hspWorstMonth: 5.2, hspAnnualAvg: 5.8, specificYield: 1695, optimalTilt: 8, optimalAzimuth: 0, segment: 'coast', confidence: 'high' },
  { id: 'pe-iquitos', name: 'Iquitos - Selva baja', country: 'PE', lat: -3.75, lon: -73.25, hspByMonth: [4.6, 4.5, 4.4, 4.3, 4.1, 3.9, 4.0, 4.2, 4.4, 4.5, 4.6, 4.6], hspWorstMonth: 3.9, hspAnnualAvg: 4.34, specificYield: 1265, optimalTilt: 8, optimalAzimuth: 0, segment: 'jungle', confidence: 'medium' }
];

export const MASTER_CATALOG: CatalogItem[] = [
  { id: 'panel-jinko-550', category: 'panel', brand: 'Jinko Solar', model: 'Tiger Pro 550Wp Monocristalino', sku: 'JKM550M-72HL4-V', power_w: 550, unit_price_usd: 125, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { efficiency: 0.213, warranty_years: 12 } },
  { id: 'battery-eco-worthy-12v-100ah-lfp', category: 'battery', brand: 'Eco-Worthy', model: 'Bateria LiFePO4 12V 100Ah con BMS', sku: 'LFP12-100-BMS', capacity_wh: 1280, voltage_v: 12, chemistry: 'lifepo4', unit_price_usd: 285, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_cycles_80_dod: 4000, bms: true } },
  { id: 'battery-ultracell-12v-200ah', category: 'battery', brand: 'Ultracell', model: 'Bateria GEL Deep Cycle 12V 200Ah', sku: 'UCG200-12', capacity_wh: 2400, voltage_v: 12, chemistry: 'gel', unit_price_usd: 295, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_cycles_50_dod: 1200 } },
  { id: 'battery-pylontech-24v-100ah', category: 'battery', brand: 'Pylontech', model: 'Bateria LiFePO4 24V 100Ah (2.56kWh)', sku: 'UP2500', capacity_wh: 2560, voltage_v: 24, chemistry: 'lifepo4', unit_price_usd: 850, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_cycles_80_dod: 6000 } },
  { id: 'battery-pylontech-48v-100ah', category: 'battery', brand: 'Pylontech', model: 'Bateria LiFePO4 48V 100Ah (4.8kWh)', sku: 'US5000', capacity_wh: 4800, voltage_v: 48, chemistry: 'lifepo4', unit_price_usd: 1395, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_cycles_80_dod: 6000 } },
  { id: 'inverter-offgrid-must-1kw', category: 'inverter_offgrid', brand: 'Must Solar', model: 'Inversor Cargador Hibrido 1kW 12V', sku: 'PV18-1012-VPM', power_w: 1000, voltage_v: 12, current_a: 40, unit_price_usd: 245, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_pv_input_w: 625 } },
  { id: 'inverter-offgrid-must-3kw', category: 'inverter_offgrid', brand: 'Must Solar', model: 'Inversor Cargador Hibrido 3kW 24V', sku: 'PV18-3024-VPM', power_w: 3000, voltage_v: 24, current_a: 80, unit_price_usd: 475, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_pv_input_w: 2000 } },
  { id: 'inverter-offgrid-must-5kw', category: 'inverter_offgrid', brand: 'Must Solar', model: 'Inversor Cargador Hibrido 5kW 48V', sku: 'PV18-5048-VHM', power_w: 5000, voltage_v: 48, current_a: 100, unit_price_usd: 785, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { max_pv_input_w: 5000 } },
  { id: 'inverter-grid-growatt-2kw', category: 'inverter_grid', brand: 'Growatt', model: 'Inversor On-Grid Monofasico 2kW', sku: 'MIC-2000TL-X', power_w: 2000, unit_price_usd: 375, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { phase: 'monofasico' } },
  { id: 'inverter-grid-growatt-3.6kw', category: 'inverter_grid', brand: 'Growatt', model: 'Inversor On-Grid Monofasico 3.6kW', sku: 'MIC-3600TL-X', power_w: 3600, unit_price_usd: 515, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { phase: 'monofasico' } },
  { id: 'inverter-grid-growatt-5kw', category: 'inverter_grid', brand: 'Growatt', model: 'Inversor On-Grid Trifasico 5kW', sku: 'MOD-5000TL3-X', power_w: 5000, unit_price_usd: 745, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { phase: 'trifasico' } },
  { id: 'inverter-grid-growatt-10kw', category: 'inverter_grid', brand: 'Growatt', model: 'Inversor On-Grid Trifasico 10kW', sku: 'MOD-10KTL3-X', power_w: 10000, unit_price_usd: 1095, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10', meta: { phase: 'trifasico' } },
  { id: 'mppt-srne-60a', category: 'charge_controller', brand: 'SRNE', model: 'Controlador MPPT 24V/48V 60A', sku: 'MC4860N15', current_a: 60, unit_price_usd: 215, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10' },
  { id: 'structure-2p-roof', category: 'mounting', brand: 'ZoneSolar', model: 'Estructura Alum. Coplanar para 2 Paneles', sku: 'ST-CP-2P', unit_price_usd: 45, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10' },
  { id: 'structure-4p-ground', category: 'mounting', brand: 'ZoneSolar', model: 'Soporte Triangulo Inclinado para 4 Paneles', sku: 'ST-TR-4P', unit_price_usd: 110, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10' },
  { id: 'protection-cabinet', category: 'protection', brand: 'Chint', model: 'Gabinete de Protecciones IP65 AC/DC', sku: 'PROT-BOX-IP65', unit_price_usd: 95, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10' },
  { id: 'cabling-kit-solar', category: 'wiring', brand: 'Top Cable', model: 'Kit Cable Solar 6mm2 + MC4', sku: 'CAB-SOL-6MM-20M', unit_price_usd: 49, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10' },
  { id: 'monitoring-wifi', category: 'monitoring', brand: 'Must Solar', model: 'Modulo Monitoreo Wifi Smart PV', sku: 'WIFI-PLUG-MUST', unit_price_usd: 35, active: true, supplier: 'ZoneSolar Partner Network', country: 'PE', source: MASTER_DATA_SOURCE, last_verified_at: '2026-08-10', valid_until: '2026-09-10' }
];

export const TARIFFS = [
  { id: 'residential', label: 'Residencial urbano', usdPerKwh: 0.22 },
  { id: 'sme', label: 'Negocio / PyME', usdPerKwh: 0.26 },
  { id: 'diesel_replacement', label: 'Costo evitado diesel rural', usdPerKwh: 0.35 }
];

export const MONETIZATION_PLANS = [
  { id: 'free', name: 'Diagnostico solar', price: '$0', target: 'Hogar o negocio', value: 'Dimensionamiento inicial, costo estimado y potencial de ahorro' },
  { id: 'pro_report', name: 'Reporte comercial', price: '$29', target: 'Cliente final', value: 'PDF para decidir: BOM, escenarios financieros y checklist tecnico' },
  { id: 'installer_saas', name: 'SolConfigura Pro', price: '$99/mes', target: 'Instaladores', value: 'Pipeline de oportunidades, catalogo y propuestas para vender mas rapido' },
  { id: 'qualified_lead', name: 'Proyecto para instalar', price: '3%-5% success fee', target: 'Instaladores/financieras', value: 'Cliente calificado con consumo, ubicacion, CAPEX y propuesta preliminar' }
];

export const DEFAULT_ASSUMPTIONS = {
  inverterEfficiency: 0.9,
  batteryEfficiency: 0.85,
  pvPathEfficiency: 0.75,
  pvOversize: 1.15,
  controllerMargin: 1.25,
  inverterSurge: 1.25,
  years: 20,
  degradationPct: 0.005,
  discountPct: 0.1
};

export function nearestSolarRegion(lat: number, lon: number): MasterSolarRegion {
  return SOLAR_REGIONS.reduce((best, region) => {
    const bestDistance = Math.hypot(best.lat - lat, best.lon - lon);
    const regionDistance = Math.hypot(region.lat - lat, region.lon - lon);
    return regionDistance < bestDistance ? region : best;
  }, SOLAR_REGIONS[0]);
}
