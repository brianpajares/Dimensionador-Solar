import { finance, selectEquipment, sizeGridTied, sizeOffGrid, ENGINE_VERSION } from '../src/lib/solar-engine.js';
import { CATALOG_VERSION } from '../src/lib/catalog.js';
import { MASTER_DATA_SOURCE, MASTER_DATA_VERSION, nearestSolarRegion } from '../src/data/solar-master-data.js';
import type { FinanceScenario, ProjectAssessmentRequest, ProjectAssessmentResponse, SolarSiteData } from '../src/types';

const DATASOURCE_VERSION = MASTER_DATA_VERSION;

export function sendJson(res: any, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export async function getSolarSiteData(location: { lat: number; lon: number }): Promise<SolarSiteData> {
  const region = nearestSolarRegion(location.lat, location.lon);
  return {
    hspByMonth: region.hspByMonth,
    hspWorstMonth: region.hspWorstMonth,
    hspAnnualAvg: region.hspAnnualAvg,
    specificYield: region.specificYield,
    optimalTilt: region.optimalTilt,
    optimalAzimuth: region.optimalAzimuth,
    source: 'master_excel',
    fetchedAt: new Date().toISOString(),
    confidence: region.confidence,
    limitations: [
      `Dato maestro local: ${MASTER_DATA_SOURCE}, region seleccionada: ${region.name}.`,
      'No usa PVGIS, NASA, Google Solar ni IA. Requiere visita tecnica para ingenieria final.'
    ]
  };
}

function buildFinanceScenarios(input: {
  capexUsd: number;
  systemType: ProjectAssessmentRequest['systemType'];
  annualSelfConsumedKwh: number;
  tariffUsdPerKwh: number;
}): FinanceScenario[] {
  const scenarioDefs = [
    { label: 'Conservador', capexMultiplier: 1.1, tariffMultiplier: 0.9, degradationPct: 0.008, discountPct: 0.12 },
    { label: 'Base', capexMultiplier: 1, tariffMultiplier: 1, degradationPct: 0.005, discountPct: 0.1 },
    { label: 'Optimista', capexMultiplier: 0.95, tariffMultiplier: 1.1, degradationPct: 0.003, discountPct: 0.09 }
  ];

  return scenarioDefs.map((def) => {
    const capexUsd = Math.round(input.capexUsd * def.capexMultiplier);
    const tariffUsdPerKwh = input.tariffUsdPerKwh * def.tariffMultiplier;
    const result = finance({
      capexUsd,
      systemType: input.systemType,
      annualSelfConsumedKwh: input.annualSelfConsumedKwh,
      tariffUsdPerKwh,
      degradationPct: def.degradationPct,
      discountPct: def.discountPct
    });

    return {
      label: def.label,
      capexUsd,
      annualSavingsUsd: Math.round(result.annualSavings),
      paybackYears: result.paybackYears,
      npvUsd: result.npv,
      irrPct: result.irr,
      assumptions: {
        tariffUsdPerKwh: Number(tariffUsdPerKwh.toFixed(3)),
        capexMultiplier: def.capexMultiplier,
        degradationPct: def.degradationPct,
        discountPct: def.discountPct
      }
    };
  });
}

export async function assessProject(body: ProjectAssessmentRequest): Promise<ProjectAssessmentResponse> {
  const { systemType, location, address } = body;
  if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
    throw new Error('Faltan coordenadas geograficas validas.');
  }

  const siteSolar = await getSolarSiteData(location);
  const projectId = 'PROJ_' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const warnings = ['Resultado de prefactibilidad: requiere visita tecnica, validacion estructural y diseno electrico final antes de comprar equipos.'];
  const assumptions = [
    'Perdidas PV de referencia: 25% off-grid y 14-22% grid-tied segun etapa de calculo.',
    'Horizonte financiero: 20 anos, degradacion base 0.5% anual, descuento base 10%.',
    'Precios de catalogo son benchmarks mayoristas y deben reconfirmarse antes de cotizar formalmente.'
  ];

  let design: ProjectAssessmentResponse['design'];
  let bom: ProjectAssessmentResponse['bom'];
  let fin: ProjectAssessmentResponse['finance'];

  if (systemType === 'offgrid') {
    const appliances = (body.appliances || []).map((app, i) => ({
      id: String(i),
      name: app.name,
      power_w: app.power_w,
      hours_per_day: app.hours_per_day,
      quantity: app.quantity,
      is_critical: app.is_critical || false
    }));
    if (appliances.length === 0) throw new Error('Agrega al menos una carga para dimensionar un sistema off-grid.');

    const autonomyDays = body.autonomyDays || 2;
    const batteryChemistry = body.batteryChemistry || 'lifepo4';
    const peakSimultaneousW = appliances.reduce((sum, a) => sum + a.power_w * a.quantity, 0);
    const offgridRes = sizeOffGrid({ appliances, autonomyDays, batteryChemistry, hspWorstMonth: siteSolar.hspWorstMonth, peakSimultaneousW });

    bom = selectEquipment({ systemType, offgridResult: offgridRes, batteryChemistry });
    const capexUsd = bom.reduce((sum, item) => sum + item.line_total_usd, 0) + 150;
    const annualGenerationKwh = (offgridRes.arrayWp * siteSolar.hspAnnualAvg * 365 * 0.72) / 1000;
    const annualDemandKwh = (offgridRes.E_ac * 365) / 1000;
    const annualSelfConsumedKwh = Math.min(annualGenerationKwh, annualDemandKwh);
    const tariffUsdPerKwh = body.tariffUsdPerKwh || 0.35;
    const finRes = finance({ capexUsd, systemType, annualSelfConsumedKwh, tariffUsdPerKwh });

    if (bom.some((item) => item.category === 'inverter_offgrid' && item.quantity > 1)) {
      warnings.push('La potencia exige inversores en paralelo; validar compatibilidad del fabricante y protecciones antes de ofertar.');
    }
    warnings.push(`Datos solares cargados desde ${MASTER_DATA_SOURCE}; no se consultaron fuentes externas.`);

    design = {
      systemVoltage: offgridRes.systemVoltage,
      arrayPowerWp: Math.round(offgridRes.arrayWp),
      nPanels: bom.find((item) => item.category === 'panel')?.quantity || 0,
      batteryCapacityWh: Math.round(offgridRes.battWh),
      batteryCapacityAh: Math.round(offgridRes.battAh),
      nBatteries: bom.find((item) => item.category === 'battery')?.quantity || 0,
      controllerCurrentA: Math.round(offgridRes.controllerA),
      inverterPowerW: Math.round(offgridRes.inverterW),
      dailyEnergyWh: Math.round(offgridRes.E_ac),
      autonomyDays
    };
    fin = {
      capexUsd,
      annualSavingsUsd: finRes.annualSavings,
      paybackYears: finRes.paybackYears,
      npvUsd: finRes.npv,
      irrPct: finRes.irr,
      cashFlows: finRes.cashFlows,
      scenarios: buildFinanceScenarios({ capexUsd, systemType, annualSelfConsumedKwh, tariffUsdPerKwh })
    };
  } else {
    const monthlyKwh = body.monthlyKwh || 250;
    const annualKwhTarget = monthlyKwh * 12;
    const gridRes = sizeGridTied({ annualKwhTarget, specificYield: siteSolar.specificYield || 1600, panelWp: 550 });

    bom = selectEquipment({ systemType, gridtiedResult: gridRes });
    const capexUsd = bom.reduce((sum, item) => sum + item.line_total_usd, 0) + 200;
    const annualSelfConsumedKwh = Math.min(annualKwhTarget, gridRes.kWp * (siteSolar.specificYield || 1600));
    const tariffUsdPerKwh = body.tariffUsdPerKwh || 0.22;
    const finRes = finance({ capexUsd, systemType, annualSelfConsumedKwh, tariffUsdPerKwh });

    if (gridRes.inverterKw > 10) warnings.push('Proyecto grid-tied comercial sobre 10 kW: requiere validacion trifasica, protecciones, area disponible e interconexion.');
    if (monthlyKwh > 1200) warnings.push('Consumo mensual alto: recomendar revision B2B por instalador.');

    design = {
      arrayPowerWp: Math.round(gridRes.kWp * 1000),
      nPanels: gridRes.nPanels,
      inverterPowerW: Math.round(gridRes.inverterKw * 1000),
      dailyEnergyWh: Math.round((monthlyKwh * 1000) / 30)
    };
    fin = {
      capexUsd,
      annualSavingsUsd: finRes.annualSavings,
      paybackYears: finRes.paybackYears,
      npvUsd: finRes.npv,
      irrPct: finRes.irr,
      cashFlows: finRes.cashFlows,
      scenarios: buildFinanceScenarios({ capexUsd, systemType, annualSelfConsumedKwh, tariffUsdPerKwh })
    };
  }

  const confidenceScore = Math.max(65, Math.min(90, (siteSolar.confidence === 'high' ? 86 : 74) - Math.max(0, warnings.length - 1) * 4));

  return {
    projectId,
    systemType,
    address: address || 'Ubicacion en Peru',
    location,
    site: siteSolar,
    design,
    bom,
    finance: fin,
    meta: {
      engineVersion: ENGINE_VERSION,
      catalogVersion: CATALOG_VERSION,
      datasourceVersion: DATASOURCE_VERSION,
      createdAt: new Date().toISOString(),
      confidenceScore,
      warnings,
      assumptions,
      nextAction: confidenceScore >= 80 ? 'quote_request' : 'engineering_review'
    }
  };
}
