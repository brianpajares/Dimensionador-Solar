/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CatalogItem } from '../types';

export const CATALOG_VERSION = 'catalog-pe-2026.08.10';
const DEFAULT_PRICE_SOURCE = 'Benchmark mayorista Peru / importadores solares Lima';
const DEFAULT_LAST_VERIFIED = '2026-08-10';
const DEFAULT_VALID_UNTIL = '2026-09-10';

const RAW_CATALOG: CatalogItem[] = [
  // --- PANELS (Paneles Solares) ---
  {
    id: 'panel-jinko-550',
    category: 'panel',
    brand: 'Jinko Solar',
    model: 'Tiger Pro 550Wp Monocristalino',
    sku: 'JKM550M-72HL4-V',
    power_w: 550,
    unit_price_usd: 125,
    active: true,
    meta: { efficiency: 0.213, cells: 144, warranty_years: 12 }
  },
  {
    id: 'panel-longi-580',
    category: 'panel',
    brand: 'Longi Solar',
    model: 'Hi-MO 6 Explorer 580Wp',
    sku: 'LR5-72HTH-580M',
    power_w: 580,
    unit_price_usd: 139,
    active: true,
    meta: { efficiency: 0.224, cells: 144, warranty_years: 15 }
  },

  // --- BATTERIES (Baterías) ---
  {
    id: 'battery-ritar-12v-100ah',
    category: 'battery',
    brand: 'Ritar',
    model: 'Batería de Gel 12V 100Ah',
    sku: 'DG12-100',
    capacity_wh: 1200,
    voltage_v: 12,
    chemistry: 'gel',
    unit_price_usd: 165,
    active: true,
    meta: { weight_kg: 30, max_cycles_50_dod: 1200 }
  },
  {
    id: 'battery-ultracell-12v-200ah',
    category: 'battery',
    brand: 'Ultracell',
    model: 'Batería de Gel Deep Cycle 12V 200Ah',
    sku: 'UCG200-12',
    capacity_wh: 2400,
    voltage_v: 12,
    chemistry: 'gel',
    unit_price_usd: 295,
    active: true,
    meta: { weight_kg: 60, max_cycles_50_dod: 1200 }
  },
  {
    id: 'battery-eco-worthy-12v-100ah-lfp',
    category: 'battery',
    brand: 'Eco-Worthy',
    model: 'Bateria LiFePO4 12V 100Ah con BMS',
    sku: 'LFP12-100-BMS',
    capacity_wh: 1280,
    voltage_v: 12,
    chemistry: 'lifepo4',
    unit_price_usd: 285,
    active: true,
    meta: { weight_kg: 11, max_cycles_80_dod: 4000, bms: true }
  },
  {
    id: 'battery-pylontech-24v-100ah',
    category: 'battery',
    brand: 'Pylontech',
    model: 'Batería de Litio LiFePO4 24V 100Ah (2.56kWh)',
    sku: 'UP2500',
    capacity_wh: 2560,
    voltage_v: 24,
    chemistry: 'lifepo4',
    unit_price_usd: 850,
    active: true,
    meta: { weight_kg: 27, max_cycles_80_dod: 6000 }
  },
  {
    id: 'battery-pylontech-48v-100ah',
    category: 'battery',
    brand: 'Pylontech',
    model: 'Batería de Litio LiFePO4 48V 100Ah (4.8kWh)',
    sku: 'US5000',
    capacity_wh: 4800,
    voltage_v: 48,
    chemistry: 'lifepo4',
    unit_price_usd: 1395,
    active: true,
    meta: { weight_kg: 40, max_cycles_80_dod: 6000 }
  },

  // --- OFF-GRID INVERTERS (Inversores Aislados) ---
  {
    id: 'inverter-offgrid-must-1kw',
    category: 'inverter_offgrid',
    brand: 'Must Solar',
    model: 'Inversor Cargador Híbrido 1kW 12V',
    sku: 'PV18-1012-VPM',
    power_w: 1000,
    voltage_v: 12,
    current_a: 40,
    unit_price_usd: 245,
    active: true,
    meta: { max_pv_input_w: 625, peak_efficiency: 0.93 }
  },
  {
    id: 'inverter-offgrid-must-3kw',
    category: 'inverter_offgrid',
    brand: 'Must Solar',
    model: 'Inversor Cargador Híbrido 3kW 24V',
    sku: 'PV18-3024-VPM',
    power_w: 3000,
    voltage_v: 24,
    current_a: 80,
    unit_price_usd: 475,
    active: true,
    meta: { max_pv_input_w: 2000, peak_efficiency: 0.93 }
  },
  {
    id: 'inverter-offgrid-must-5kw',
    category: 'inverter_offgrid',
    brand: 'Must Solar',
    model: 'Inversor Cargador Híbrido 5kW 48V',
    sku: 'PV18-5048-VHM',
    power_w: 5000,
    voltage_v: 48,
    current_a: 100,
    unit_price_usd: 785,
    active: true,
    meta: { max_pv_input_w: 5000, peak_efficiency: 0.93 }
  },

  // --- GRID-TIED INVERTERS (Inversores de Inyección a Red) ---
  {
    id: 'inverter-grid-growatt-2kw',
    category: 'inverter_grid',
    brand: 'Growatt',
    model: 'Inversor On-Grid Monofásico 2kW',
    sku: 'MIC-2000TL-X',
    power_w: 2000,
    unit_price_usd: 375,
    active: true,
    meta: { phase: 'monofasico', warranty_years: 5, peak_efficiency: 0.974 }
  },
  {
    id: 'inverter-grid-growatt-3.6kw',
    category: 'inverter_grid',
    brand: 'Growatt',
    model: 'Inversor On-Grid Monofásico 3.6kW',
    sku: 'MIC-3600TL-X',
    power_w: 3600,
    unit_price_usd: 515,
    active: true,
    meta: { phase: 'monofasico', warranty_years: 5, peak_efficiency: 0.976 }
  },
  {
    id: 'inverter-grid-growatt-5kw',
    category: 'inverter_grid',
    brand: 'Growatt',
    model: 'Inversor On-Grid Trifásico 5kW',
    sku: 'MOD-5000TL3-X',
    power_w: 5000,
    unit_price_usd: 745,
    active: true,
    meta: { phase: 'trifasico', warranty_years: 5, peak_efficiency: 0.983 }
  },
  {
    id: 'inverter-grid-growatt-10kw',
    category: 'inverter_grid',
    brand: 'Growatt',
    model: 'Inversor On-Grid Trifásico 10kW',
    sku: 'MOD-10KTL3-X',
    power_w: 10000,
    unit_price_usd: 1095,
    active: true,
    meta: { phase: 'trifasico', warranty_years: 5, peak_efficiency: 0.986 }
  },

  // --- MPPT CHARGE CONTROLLERS (Controladores de Carga Standalone) ---
  {
    id: 'mppt-srne-40a',
    category: 'charge_controller',
    brand: 'SRNE',
    model: 'Controlador de Carga MPPT 12V/24V 40A',
    sku: 'MC2440N10',
    current_a: 40,
    unit_price_usd: 115,
    active: true,
    meta: { max_pv_voc: 100, max_pv_input_24v: 1040 }
  },
  {
    id: 'mppt-srne-60a',
    category: 'charge_controller',
    brand: 'SRNE',
    model: 'Controlador de Carga MPPT 24V/48V 60A',
    sku: 'MC4860N15',
    current_a: 60,
    unit_price_usd: 215,
    active: true,
    meta: { max_pv_voc: 150, max_pv_input_48v: 3200 }
  },
  {
    id: 'mppt-srne-100a',
    category: 'charge_controller',
    brand: 'SRNE',
    model: 'Controlador de Carga MPPT 48V 100A',
    sku: 'MA48100N15',
    current_a: 100,
    unit_price_usd: 375,
    active: true,
    meta: { max_pv_voc: 150, max_pv_input_48v: 5200 }
  },

  // --- ACCESSORIES (Montaje, Protecciones, Cableado) ---
  {
    id: 'structure-2p-roof',
    category: 'mounting',
    brand: 'ZoneSolar',
    model: 'Estructura Alum. Coplanar para 2 Paneles (Calamina/Teja)',
    sku: 'ST-CP-2P',
    unit_price_usd: 45,
    active: true,
    meta: { material: 'aluminio AL6005-T5', wind_resistance: '130km/h' }
  },
  {
    id: 'structure-4p-ground',
    category: 'mounting',
    brand: 'ZoneSolar',
    model: 'Soporte Triángulo Inclinado Suelo/Plano para 4 Paneles',
    sku: 'ST-TR-4P',
    unit_price_usd: 110,
    active: true,
    meta: { material: 'aluminio AL6005-T5', adjustable_angle: '15-30 deg' }
  },
  {
    id: 'protection-cabinet',
    category: 'protection',
    brand: 'Chint',
    model: 'Gabinete de Protecciones IP65 AC/DC (Fusibles + SPD + Breakers)',
    sku: 'PROT-BOX-IP65',
    unit_price_usd: 95,
    active: true,
    meta: { rating: 'IP65', components: 'SPD DC 1000V, Breaker DC 32A, Breaker AC' }
  },
  {
    id: 'cabling-kit-solar',
    category: 'wiring',
    brand: 'Top Cable',
    model: 'Kit Cable Solar 6mm² Rojo/Negro (20m) + Conectores MC4',
    sku: 'CAB-SOL-6MM-20M',
    unit_price_usd: 49,
    active: true,
    meta: { section: '6mm2', current_max_a: 50, double_insulated: true }
  },
  {
    id: 'monitoring-wifi',
    category: 'monitoring',
    brand: 'Must Solar',
    model: 'Módulo de Monitoreo Wifi USB Smart PV',
    sku: 'WIFI-PLUG-MUST',
    unit_price_usd: 35,
    active: true,
    meta: { interface: 'RS232/USB', cloud_app: 'SmartESS' }
  }
];

export const CATALOG: CatalogItem[] = RAW_CATALOG.map((item) => ({
  supplier: 'ZoneSolar Partner Network',
  country: 'PE',
  source: DEFAULT_PRICE_SOURCE,
  last_verified_at: DEFAULT_LAST_VERIFIED,
  valid_until: DEFAULT_VALID_UNTIL,
  ...item
}));
