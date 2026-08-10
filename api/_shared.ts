import { finance, selectEquipment, sizeGridTied, sizeOffGrid, ENGINE_VERSION } from '../src/lib/solar-engine.js';
import { CATALOG_VERSION } from '../src/lib/catalog.js';
import type { FinanceScenario, ProjectAssessmentRequest, ProjectAssessmentResponse, SolarSiteData } from '../src/types';

const DATASOURCE_VERSION = 'pvgis-5.3+geographic-fallback-2026.08.10';

export function sendJson(res: any, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function estimatePeruSolar(lat: number, lon: number): SolarSiteData {
  const isHighAndes = lon >= -78.0 && lon <= -69.0 && lat >= -18.0 && lat <= -5.0;
  const isCoast = lon >= -81.5 && lon <= -75.0 && lat >= -14.0 && lat <= -6.0;
  const isJungle = lon >= -75.0 && lon <= -69.0 && lat >= -6.0 && lat <= -1.0;

  let hspWorstMonth = 4.2;
  let hspAnnualAvg = 5.0;
  let optimalTilt = 12;

  if (isHighAndes) {
    hspWorstMonth = 4.8;
    hspAnnualAvg = 5.7;
    optimalTilt = Math.abs(lat) + 3;
  } else if (isCoast) {
    if (lat < -11) {
      hspWorstMonth = 5.2;
      hspAnnualAvg = 6.0;
    } else {
      hspWorstMonth = 3.6;
      hspAnnualAvg = 4.5;
    }
    optimalTilt = Math.abs(lat) + 2;
  } else if (isJungle) {
    hspWorstMonth = 3.9;
    hspAnnualAvg = 4.6;
    optimalTilt = 8;
  } else {
    hspWorstMonth = Math.max(3.5, 4.5 - Math.abs(lat) * 0.05);
    hspAnnualAvg = Math.max(4.2, 5.2 - Math.abs(lat) * 0.03);
    optimalTilt = Math.max(10, Math.abs(lat) + 2);
  }

  const isNorthernHemisphere = lat > 0;
  const hspByMonth = Array.from({ length: 12 }, (_, m) => {
    const phase = isNorthernHemisphere ? m : (m + 6) % 12;
    const factor = Math.cos((phase - 6) * Math.PI / 6);
    const monthVal = hspAnnualAvg + (hspAnnualAvg - hspWorstMonth) * factor * 0.8;
    return Number(Math.max(hspWorstMonth, Math.min(6.8, monthVal)).toFixed(2));
  });

  return {
    hspByMonth,
    hspWorstMonth: Number(hspWorstMonth.toFixed(2)),
    hspAnnualAvg: Number(hspAnnualAvg.toFixed(2)),
    specificYield: Number((hspAnnualAvg * 365 * 0.8).toFixed(1)),
    optimalTilt: Math.round(optimalTilt),
    optimalAzimuth: isNorthernHemisphere ? 180 : 0,
    source: 'estimated',
    fetchedAt: new Date().toISOString(),
    confidence: 'medium',
    limitations: ['Fallback geografico usado por indisponibilidad de PVGIS; requiere verificacion de recurso solar para propuesta final.']
  };
}

export async function getSolarSiteData(location: { lat: number; lon: number }): Promise<SolarSiteData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500);
    const mrUrl = `https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat=${location.lat}&lon=${location.lon}&horirrad=1&outputformat=json`;
    const mrResponse = await fetch(mrUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!mrResponse.ok) throw new Error(`PVGIS MRcalc returned ${mrResponse.status}`);
    const mrData = await mrResponse.json();
    const monthlyOutputs = mrData?.outputs?.monthly;
    if (!Array.isArray(monthlyOutputs) || monthlyOutputs.length === 0) {
      throw new Error('Invalid PVGIS monthly response');
    }

    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const hspByMonth = monthlyOutputs.slice(0, 12).map((item: any, idx: number) => {
      const hMonthKwh = (item.H_m_g || item.H_m || 0) / 1000;
      return Number((hMonthKwh / daysInMonths[idx]).toFixed(2));
    });

    const hspWorstMonth = Math.min(...hspByMonth);
    const hspAnnualAvg = hspByMonth.reduce((a, b) => a + b, 0) / 12;
    let specificYield = hspAnnualAvg * 365 * 0.78;
    let optimalTilt = Math.abs(location.lat);
    let optimalAzimuth = location.lat > 0 ? 180 : 0;

    try {
      const pvUrl = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${location.lat}&lon=${location.lon}&peakpower=1&loss=14&mountingplace=building&optimalangles=1&outputformat=json`;
      const pvRes = await fetch(pvUrl);
      if (pvRes.ok) {
        const pvData = await pvRes.json();
        specificYield = pvData?.outputs?.totals?.fixed?.E_y || specificYield;
        optimalTilt = pvData?.inputs?.mounting_system?.fixed?.slope?.value ?? optimalTilt;
        optimalAzimuth = pvData?.inputs?.mounting_system?.fixed?.azimuth?.value ?? optimalAzimuth;
      }
    } catch {
      // PVcalc is helpful but not required for a usable pre-feasibility result.
    }

    return {
      hspByMonth,
      hspWorstMonth: Number(hspWorstMonth.toFixed(2)),
      hspAnnualAvg: Number(hspAnnualAvg.toFixed(2)),
      specificYield: Number(specificYield.toFixed(1)),
      optimalTilt: Math.round(optimalTilt),
      optimalAzimuth: Math.round(optimalAzimuth),
      source: 'pvgis',
      fetchedAt: new Date().toISOString(),
      confidence: 'high',
      limitations: ['Prefactibilidad automatizada; no incluye sombras, area util de techo, estructura ni visita tecnica.']
    };
  } catch {
    return estimatePeruSolar(location.lat, location.lon);
  }
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
    if (siteSolar.source === 'estimated') warnings.push('PVGIS no respondio; se uso estimador geografico.');

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

  const confidenceScore = Math.max(55, Math.min(92, (siteSolar.source === 'pvgis' ? 86 : 68) - Math.max(0, warnings.length - 1) * 6));

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
