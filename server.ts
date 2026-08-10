/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { sizeOffGrid, sizeGridTied, finance, selectEquipment, ENGINE_VERSION } from './src/lib/solar-engine';
import { CATALOG, CATALOG_VERSION } from './src/lib/catalog';
import { FinanceScenario, ProjectAssessmentRequest, ProjectAssessmentResponse, SolarSiteData } from './src/types';

// Load environment variables if in local development
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;
const DATASOURCE_VERSION = 'pvgis-5.3+geographic-fallback-2026.08.10';

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found. Using high-fidelity custom template generator as fallback.");
}

// Global cache file path
const CACHE_FILE = path.join(process.cwd(), 'irradiance_cache.json');
const LEADS_FILE = path.join(process.cwd(), 'solconfigura_leads.jsonl');

// Helper to read cache
function readCache(): Record<string, SolarSiteData> {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Helper to write cache
function writeCache(cache: Record<string, SolarSiteData>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to write irradiance cache:", err);
  }
}

function appendJsonLine(filePath: string, payload: Record<string, any>) {
  fs.appendFileSync(filePath, JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }) + '\n', 'utf8');
}

function buildFinanceScenarios(input: {
  capexUsd: number;
  systemType: ProjectAssessmentRequest['systemType'];
  annualSelfConsumedKwh: number;
  tariffUsdPerKwh: number;
}): FinanceScenario[] {
  const scenarioDefs = [
    { label: 'Conservador', capexMultiplier: 1.10, tariffMultiplier: 0.90, degradationPct: 0.008, discountPct: 0.12 },
    { label: 'Base', capexMultiplier: 1.00, tariffMultiplier: 1.00, degradationPct: 0.005, discountPct: 0.10 },
    { label: 'Optimista', capexMultiplier: 0.95, tariffMultiplier: 1.10, degradationPct: 0.003, discountPct: 0.09 }
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

/**
 * Intelligent Geographical Fallback Estimator for Peru & LatAm
 * Used as a redundant safety system if external PVGIS/NASA APIs are slow or offline.
 */
function estimatePeruSolar(lat: number, lon: number): SolarSiteData {
  console.log(`Using geographical solar estimation for lat: ${lat}, lon: ${lon}`);
  
  // High-fidelity Andes Highlands (e.g. Cajamarca, Cusco, Arequipa)
  // High irradiance, cool temperatures, worst month is around 4.5 - 5.0
  const isHighAndes = lon >= -78.0 && lon <= -69.0 && lat >= -18.0 && lat <= -5.0;
  
  // Desert coast (e.g. Lima, Ica, Piura)
  // Coast can have fog (Lima worst month ~3.5), southern coast is extremely high (Ica worst month ~5.5)
  const isCoast = lon >= -81.5 && lon <= -75.0 && lat >= -14.0 && lat <= -6.0;

  // Jungle / Amazon (e.g. Loreto, San Martin, Ucayali)
  // Higher cloud cover, stable but moderate irradiance
  const isJungle = lon >= -75.0 && lon <= -69.0 && lat >= -6.0 && lat <= -1.0;

  let hspWorstMonth = 4.2;
  let hspAnnualAvg = 5.0;
  let optimalTilt = 12;

  if (isHighAndes) {
    hspWorstMonth = 4.8;
    hspAnnualAvg = 5.7;
    optimalTilt = Math.abs(lat) + 3;
  } else if (isCoast) {
    if (lat < -11) { // Southern coast (extremely sunny)
      hspWorstMonth = 5.2;
      hspAnnualAvg = 6.0;
    } else { // Central/Northern coast (Lima fog factor)
      hspWorstMonth = 3.6;
      hspAnnualAvg = 4.5;
    }
    optimalTilt = Math.abs(lat) + 2;
  } else if (isJungle) {
    hspWorstMonth = 3.9;
    hspAnnualAvg = 4.6;
    optimalTilt = 8;
  } else {
    // General LatAm baseline
    hspWorstMonth = Math.max(3.5, 4.5 - Math.abs(lat) * 0.05);
    hspAnnualAvg = Math.max(4.2, 5.2 - Math.abs(lat) * 0.03);
    optimalTilt = Math.max(10, Math.abs(lat) + 2);
  }

  // Generar perfil mensual con variación sinusoidal realista según hemisferio
  const hspByMonth: number[] = [];
  // Hemisferio Sur: El peor mes es Junio (solsticio de invierno)
  // El mejor mes es Diciembre/Enero (solsticio de verano)
  const isNorthernHemisphere = lat > 0;
  
  for (let m = 0; m < 12; m++) {
    const phase = isNorthernHemisphere ? m : (m + 6) % 12;
    // Variación del 20% al 30% alrededor del promedio
    const factor = Math.cos((phase - 6) * Math.PI / 6); // -1 en Junio, 1 en Diciembre
    const monthVal = hspAnnualAvg + (hspAnnualAvg - hspWorstMonth) * factor * 0.8;
    hspByMonth.push(parseFloat(Math.max(hspWorstMonth, Math.min(6.8, monthVal)).toFixed(2)));
  }

  return {
    hspByMonth,
    hspWorstMonth: parseFloat(hspWorstMonth.toFixed(2)),
    hspAnnualAvg: parseFloat(hspAnnualAvg.toFixed(2)),
    specificYield: parseFloat((hspAnnualAvg * 365 * 0.80).toFixed(1)), // HSP -> specific yield with standard PR losses
    optimalTilt: Math.round(optimalTilt),
    optimalAzimuth: isNorthernHemisphere ? 180 : 0, // South-facing in North, North-facing in South
    source: 'estimated',
    fetchedAt: new Date().toISOString(),
    confidence: 'medium',
    limitations: ['Fallback geografico usado por indisponibilidad de PVGIS; requiere verificacion de recurso solar para propuesta final.']
  };
}

// 1. GET CATALOG ENDPOINT
app.get('/api/catalog', (req, res) => {
  res.json(CATALOG);
});

app.post('/api/leads', (req, res) => {
  try {
    const { projectId, action, name, email, phone, company, message, consent, rating, wouldUseForQuote } = req.body || {};
    if (!projectId || !action || consent !== true) {
      res.status(400).json({ error: 'Se requiere projectId, accion y consentimiento para registrar el lead.' });
      return;
    }

    appendJsonLine(LEADS_FILE, {
      projectId,
      action,
      name: name || '',
      email: email || '',
      phone: phone || '',
      company: company || '',
      message: message || '',
      rating: Number(rating || 0),
      wouldUseForQuote: Boolean(wouldUseForQuote),
      source: 'web_app'
    });

    res.json({ ok: true, message: 'Solicitud registrada. Un asesor puede priorizar este proyecto.' });
  } catch (err: any) {
    res.status(500).json({ error: 'No se pudo registrar la solicitud: ' + err.message });
  }
});

// 2. ASSESS SOLAR PROJECT ENDPOINT (WITH CORS BYPASS PROXIES)
app.post('/api/assess', async (req, res) => {
  try {
    const body = req.body as ProjectAssessmentRequest;
    const { systemType, location, address } = body;

    if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      res.status(400).json({ error: "Faltan las coordenadas geográficas válidas (lat, lon)" });
      return;
    }

    // Cache lookup (rounded to 2 decimal places ~1.1km precision)
    const latRound = parseFloat(location.lat.toFixed(2));
    const lonRound = parseFloat(location.lon.toFixed(2));
    const cacheKey = `${latRound}_${lonRound}`;

    const cache = readCache();
    let siteSolar: SolarSiteData;

    if (cache[cacheKey]) {
      console.log(`Cache HIT for coordinates: ${cacheKey}`);
      siteSolar = cache[cacheKey];
    } else {
      console.log(`Cache MISS for coordinates: ${cacheKey}. Fetching real PVGIS data.`);
      
      try {
        // Fetch PVGIS Data (timeout 5s)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        // a) Fetch Grid-Tied Yield (PVcalc) if requested, or average solar data
        // We always query MRcalc first because it gives the monthly solar profile which is essential
        const mrUrl = `https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat=${location.lat}&lon=${location.lon}&horirrad=1&outputformat=json`;
        const mrResponse = await fetch(mrUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!mrResponse.ok) {
          throw new Error(`PVGIS MRcalc returned status: ${mrResponse.status}`);
        }

        const mrData = await mrResponse.json();
        
        // Extract monthly horizontal irradiation values (Wh/m2/month)
        // Let's parse JRC monthly output
        const monthlyOutputs = mrData?.outputs?.monthly;
        if (!monthlyOutputs || !Array.isArray(monthlyOutputs) || monthlyOutputs.length === 0) {
          throw new Error("Formato de respuesta de PVGIS mensual no es válido");
        }

        const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const hspByMonth = monthlyOutputs.map((item: any, idx: number) => {
          // H_m_g is irradiation per month in Wh/m2. Let's convert to kWh/m2/day
          const h_month_kwh = (item.H_m_g || item.H_m || 0) / 1000;
          const hsp_day = h_month_kwh / daysInMonths[idx];
          return parseFloat(hsp_day.toFixed(2));
        });

        const hspWorstMonth = Math.min(...hspByMonth);
        const hspAnnualAvg = hspByMonth.reduce((a, b) => a + b, 0) / 12;

        // Query PVcalc for optimal angles and specific yield
        let specificYield = hspAnnualAvg * 365 * 0.78; // Fallback math
        let optimalTilt = Math.abs(location.lat);
        let optimalAzimuth = location.lat > 0 ? 180 : 0;

        try {
          const pvUrl = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${location.lat}&lon=${location.lon}&peakpower=1&loss=14&mountingplace=building&optimalangles=1&outputformat=json`;
          const pvRes = await fetch(pvUrl);
          if (pvRes.ok) {
            const pvData = await pvRes.ok ? await pvRes.json() : null;
            if (pvData?.outputs?.totals?.fixed?.E_y) {
              specificYield = pvData.outputs.totals.fixed.E_y; // kWh/kWp/year
            }
            if (pvData?.inputs?.mounting_system?.fixed?.slope?.value !== undefined) {
              optimalTilt = pvData.inputs.mounting_system.fixed.slope.value;
            }
            if (pvData?.inputs?.mounting_system?.fixed?.azimuth?.value !== undefined) {
              optimalAzimuth = pvData.inputs.mounting_system.fixed.azimuth.value;
            }
          }
        } catch {
          // Non-blocking PVcalc failure
          console.log("PVcalc fetch failed, using mathematical fallback for specific yield.");
        }

        siteSolar = {
          hspByMonth,
          hspWorstMonth: parseFloat(hspWorstMonth.toFixed(2)),
          hspAnnualAvg: parseFloat(hspAnnualAvg.toFixed(2)),
          specificYield: parseFloat(specificYield.toFixed(1)),
          optimalTilt: Math.round(optimalTilt),
          optimalAzimuth: Math.round(optimalAzimuth),
          source: 'pvgis',
          fetchedAt: new Date().toISOString(),
          confidence: 'high',
          limitations: ['Prefactibilidad automatizada; no incluye sombras, area util de techo, estructura ni visita tecnica.']
        };

        // Save to cache
        cache[cacheKey] = siteSolar;
        writeCache(cache);

      } catch (err: any) {
        console.error("External API retrieval failed. Applying redundant fallback:", err.message);
        // NASA Power alternative or immediate geographic solver
        siteSolar = estimatePeruSolar(location.lat, location.lon);
      }
    }

    // Generate unique project ID
    const projectId = 'PROJ_' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Sizing system using calculated values
    let design: any = {};
    let bom: any[] = [];
    let fin: any = {};
    const warnings: string[] = [
      'Resultado de prefactibilidad: requiere visita tecnica, validacion estructural y diseno electrico final antes de comprar equipos.'
    ];
    const assumptions: string[] = [
      'Perdidas PV de referencia: 25% off-grid y 14-22% grid-tied segun etapa de calculo.',
      'Horizonte financiero: 20 anos, degradacion base 0.5% anual, descuento base 10%.',
      'Precios de catalogo son benchmarks mayoristas y deben reconfirmarse antes de cotizar formalmente.'
    ];

    if (systemType === 'offgrid') {
      const appliances = (body.appliances || []).map((app, i) => ({
        id: String(i),
        name: app.name,
        power_w: app.power_w,
        hours_per_day: app.hours_per_day,
        quantity: app.quantity,
        is_critical: app.is_critical || false
      }));

      const autonomyDays = body.autonomyDays || 2;
      const batteryChemistry = body.batteryChemistry || 'lifepo4';
      
      // Calculate peak simultaneous load as sum of active appliances
      const peakSimultaneousW = appliances.reduce((sum, a) => sum + (a.power_w * a.quantity), 0);

      const offgridRes = sizeOffGrid({
        appliances,
        autonomyDays,
        batteryChemistry,
        hspWorstMonth: siteSolar.hspWorstMonth,
        peakSimultaneousW
      });

      // Selection of BOM
      bom = selectEquipment({
        systemType,
        offgridResult: offgridRes,
        batteryChemistry
      });

      // Sum Capex
      const capexUsd = bom.reduce((sum, item) => sum + item.line_total_usd, 0) + 150; // add $150 minor hardware/installation premium

      // Financials (avoided cost is higher off-grid, averaging $0.35/kWh compared to diesel/generators)
      // Annual generation estimate: arrayWp * HSP avg * 365 days * efficiency
      const annualGenerationKwh = (offgridRes.arrayWp * siteSolar.hspAnnualAvg * 365 * 0.72) / 1000;
      // Self consumed is capped at either production or demand
      const annualDemandKwh = (offgridRes.E_ac * 365) / 1000;
      const annualSelfConsumedKwh = Math.min(annualGenerationKwh, annualDemandKwh);

      const finRes = finance({
        capexUsd,
        systemType,
        annualSelfConsumedKwh,
        tariffUsdPerKwh: body.tariffUsdPerKwh || 0.35, // default off-grid avoided cost
      });
      const scenarios = buildFinanceScenarios({
        capexUsd,
        systemType,
        annualSelfConsumedKwh,
        tariffUsdPerKwh: body.tariffUsdPerKwh || 0.35
      });

      const inverterItems = bom.filter(item => item.category === 'inverter_offgrid');
      if (inverterItems.some(item => item.quantity > 1)) {
        warnings.push('La potencia exige inversores en paralelo; validar compatibilidad del fabricante y protecciones antes de ofertar.');
      }
      if (siteSolar.source === 'estimated') {
        warnings.push('PVGIS no respondio; se uso estimador geografico. La confianza comercial baja hasta verificar datos solares.');
      }

      design = {
        systemVoltage: offgridRes.systemVoltage,
        arrayPowerWp: Math.round(offgridRes.arrayWp),
        nPanels: bom.find(item => item.category === 'panel')?.quantity || 0,
        batteryCapacityWh: Math.round(offgridRes.battWh),
        batteryCapacityAh: Math.round(offgridRes.battAh),
        nBatteries: bom.find(item => item.category === 'battery')?.quantity || 0,
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
        scenarios
      };

    } else {
      // Grid-Tied
      const monthlyKwh = body.monthlyKwh || 250;
      const annualKwhTarget = monthlyKwh * 12;

      const gridRes = sizeGridTied({
        annualKwhTarget,
        specificYield: siteSolar.specificYield || 1600,
        panelWp: 550
      });

      // Selection of BOM
      bom = selectEquipment({
        systemType,
        gridtiedResult: gridRes
      });

      const capexUsd = bom.reduce((sum, item) => sum + item.line_total_usd, 0) + 200; // add installation fee

      // Grid avoid price in Peru (approx $0.22/kWh standard residential)
      const annualSelfConsumedKwh = Math.min(annualKwhTarget, gridRes.kWp * (siteSolar.specificYield || 1600));
      const finRes = finance({
        capexUsd,
        systemType,
        annualSelfConsumedKwh,
        tariffUsdPerKwh: body.tariffUsdPerKwh || 0.22 // default grid avoided cost
      });
      const scenarios = buildFinanceScenarios({
        capexUsd,
        systemType,
        annualSelfConsumedKwh,
        tariffUsdPerKwh: body.tariffUsdPerKwh || 0.22
      });

      const inverterItems = bom.filter(item => item.category === 'inverter_grid');
      if (inverterItems.some(item => item.quantity > 1) || gridRes.inverterKw > 10) {
        warnings.push('Proyecto grid-tied comercial sobre 10 kW: requiere validacion trifasica, protecciones, area disponible e interconexion.');
      }
      if (monthlyKwh > 1200) {
        warnings.push('Consumo mensual alto: recomendar revision B2B por instalador para confirmar demanda, fases y perfil horario.');
      }

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
        scenarios
      };
    }

    const confidenceScore = Math.max(
      55,
      Math.min(92, (siteSolar.source === 'pvgis' ? 86 : 68) - Math.max(0, warnings.length - 1) * 6)
    );

    const response: ProjectAssessmentResponse = {
      projectId,
      systemType,
      address: address || "Ubicación en Perú",
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

    res.json(response);

  } catch (err: any) {
    console.error("Assessment route failed:", err);
    res.status(500).json({ error: "Fallo durante el dimensionamiento del sistema solar: " + err.message });
  }
});

// 3. AI PROPOSAL GENERATOR ENDPOINT
app.post('/api/proposal', async (req, res) => {
  try {
    const designSummary = req.body;
    if (!designSummary || !designSummary.projectId) {
      res.status(400).json({ error: "Faltan los detalles del proyecto para redactar la propuesta." });
      return;
    }

    const sysType = designSummary.systemType === 'offgrid' ? 'AISLADO (OFF-GRID) RURAL' : 'CONECTADO A RED (GRID-TIED) DE AUTOCONSUMO';
    
    // Construct rich prompt
    const prompt = `Actúa como un Ingeniero Solar Senior de SolConfigura y Zone Solar Perú.
Redacta una Propuesta Técnica y Comercial Profesional de Ingeniería para el proyecto con ID ${designSummary.projectId}.

Detalles de Ingeniería:
- Tipo de Sistema: ${sysType}
- Ubicación / Dirección: ${designSummary.address}
- Latitud/Longitud: ${designSummary.location?.lat}, ${designSummary.location?.lon}
- Recurso Solar Promedio (HSP): ${designSummary.site?.hspAnnualAvg} horas sol pico/día
- Recurso Solar Peor Mes (HSP): ${designSummary.site?.hspWorstMonth} horas sol pico/día (Crítico para dimensionamiento aislado)
- Consumo Diario Estimado: ${designSummary.design?.dailyEnergyWh} Wh/día
- Potencia del Arreglo Fotovoltaico: ${designSummary.design?.arrayPowerWp} Wp (${designSummary.design?.nPanels} paneles de 550Wp)
${designSummary.systemType === 'offgrid' ? `- Capacidad del Banco de Baterías: ${designSummary.design?.batteryCapacityWh} Wh (${designSummary.design?.batteryCapacityAh} Ah en ${designSummary.design?.systemVoltage}V)` : ''}
- Potencia del Inversor Seleccionado: ${designSummary.design?.inverterPowerW} W
- Presupuesto Total de Hardware (CAPEX): $${designSummary.finance?.capexUsd} USD
- Ahorro Anual Estimado: $${designSummary.finance?.annualSavingsUsd} USD
- Retorno de Inversión (Payback): ${designSummary.finance?.paybackYears} años
- Tasa Interna de Retorno (IRR): ${designSummary.finance?.irrPct}%

Escribe en ESPAÑOL, con un tono técnico, consultivo, comercial e impecable. 
La estructura del reporte DEBE tener las siguientes secciones bien formateadas:
1. RESUMEN EJECUTIVO (Un párrafo potente de venta del proyecto solar).
2. DESCRIPCIÓN TÉCNICA DEL DISEÑO (Explicar por qué se seleccionaron las potencias de paneles, baterías y el inversor en base al recurso solar local).
3. CONSIDERACIONES DE INSTALACIÓN Y MANTENIMIENTO (Sugerencias prácticas para techos en Perú, limpieza de polvo y seguridad).
4. NOTA DE RESPONSABILIDAD E INGENIERÍA (Disclaimer obligatorio declarando que este es un diseño preliminar automatizado y requiere validación en campo de un ingeniero colegiado antes de la instalación final).

Por favor escribe de forma fluida, directa, sin usar markdown de encabezados muy grandes, idealmente 250 a 350 palabras. No inventes datos fuera de los provistos.`;

    let generatedText = "";

    if (ai) {
      try {
        console.log("Calling Gemini API to draft engineering proposal...");
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
            systemInstruction: "Eres un consultor de ingeniería solar experto que redacta propuestas profesionales de energía renovable en Perú y Latinoamérica."
          }
        });
        generatedText = response.text || "";
      } catch (geminiErr: any) {
        console.error("Gemini API generation failed, falling back to expert manual template:", geminiErr);
      }
    }

    // High quality manual fallback if Gemini failed or is not configured
    if (!generatedText) {
      console.log("Generating proposal via expert high-fidelity offline template...");
      const bType = designSummary.systemType === 'offgrid';
      generatedText = `
### 1. RESUMEN EJECUTIVO
Nos complace presentar la propuesta técnico-comercial para la implementación de un sistema solar fotovoltaico de alta eficiencia en **${designSummary.address}**. En base al estudio georreferenciado de radiación solar satelital local, hemos diseñado una solución de tipo **${sysType}** optimizada para cubrir su consumo diario de **${designSummary.design?.dailyEnergyWh} Wh/día** de manera sustentable, garantizando la reducción del costo de energía o el reemplazo total de combustibles ruidosos y caros (generadores diésel). Con un CAPEX estimado de **$${designSummary.finance?.capexUsd} USD** y un payback de tan solo **${designSummary.finance?.paybackYears} años** (con un excelente IRR de **${designSummary.finance?.irrPct}%**), esta inversión asegura independencia y estabilidad energética por los próximos 20 años.

### 2. DESCRIPCIÓN TÉCNICA DEL DISEÑO
El dimensionamiento óptimo de ingeniería determinó un arreglo solar de **${designSummary.design?.arrayPowerWp} Wp**, compuesto por **${designSummary.design?.nPanels} paneles Jinko de 550Wp**, aprovechando de manera impecable el recurso solar del sitio de **${designSummary.site?.hspAnnualAvg} Horas Sol Pico (HSP)** anuales. ${bType ? `Para amortiguar las variaciones estacionales y garantizar el suministro durante los meses más nublados (donde la HSP desciende a un mínimo crítico de ${designSummary.site?.hspWorstMonth} HSP), hemos incorporado un banco de almacenamiento de baterías de tecnología avanzada con capacidad de **${designSummary.design?.batteryCapacityWh} Wh (${designSummary.design?.batteryCapacityAh} Ah)** operando a una tensión segura de **${designSummary.design?.systemVoltage}V**, configurado para soportar hasta **${designSummary.design?.autonomyDays} días de autonomía** sin radiación directa.` : 'Este sistema inyectará la energía captada en tiempo real directamente a su tablero de distribución para reducir el consumo facturado del operador de red local.'} El sistema se acopla a un inversor cargador híbrido de última generación de **${designSummary.design?.inverterPowerW}W** con protección contra sobrecargas integrado, asegurando un suministro de corriente alterna pura y estable para todos sus electrodomésticos.

### 3. CONSIDERACIONES DE INSTALACIÓN Y MANTENIMIENTO
La instalación deberá ubicarse en un área libre de sombras, preferentemente orientada al **norte geográfico** con un ángulo de inclinación recomendado de **${designSummary.site?.optimalTilt}°** para maximizar la captación de radiación perpendicular durante el año. Las estructuras provistas son de aluminio estructural anodizado con resistencia a vientos de hasta 130 km/h. Se sugiere realizar una limpieza simple con agua y paño suave sobre la superficie de los paneles solares cada 30 a 60 días para remover el polvo y hollín, cuya acumulación en la costa y sierra peruana puede mermar el rendimiento entre un 10% y un 15%.

### 4. NOTA DE RESPONSABILIDAD E INGENIERÍA
**DISCLAIMER OBLIGATORIO:** El presente documento constituye un **diseño preliminar automatizado de ingeniería** generado de manera estimativa en base a proyecciones de bases de datos satelitales multianuales (PVGIS / NASA). No reemplaza, bajo ninguna circunstancia, el levantamiento de información física en sitio, el análisis estructural de techos ni la ingeniería de detalle final. Es indispensable que el dimensionamiento final y las conexiones eléctricas sean **validados por un ingeniero colegiado habilitado** antes de proceder a la compra de los equipos o la instalación física del sistema solar. SolConfigura declina responsabilidades por variaciones climáticas atípicas o uso indebido de los componentes propuestos.
      `.trim();
    }

    res.json({ text: generatedText });

  } catch (err: any) {
    console.error("Proposal generator failed:", err);
    res.status(500).json({ error: "Fallo al redactar la propuesta técnica con IA: " + err.message });
  }
});

// Configure Vite or serve production files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SolConfigura backend server running on http://localhost:${PORT}`);
  });
}

startServer();
