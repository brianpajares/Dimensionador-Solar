import { sendJson } from './_shared.js';

function fallbackProposal(designSummary: any) {
  const isOffgrid = designSummary.systemType === 'offgrid';
  const sysType = isOffgrid ? 'AISLADO (OFF-GRID)' : 'CONECTADO A RED (GRID-TIED)';

  return `
1. RESUMEN EJECUTIVO
SolConfigura evaluo el proyecto ${designSummary.projectId} en ${designSummary.address} y preparo una prefactibilidad solar ${sysType}. El sistema propuesto considera ${designSummary.design?.arrayPowerWp} Wp en ${designSummary.design?.nPanels} paneles, con CAPEX estimado de $${designSummary.finance?.capexUsd} USD, ahorro anual aproximado de $${Math.round(designSummary.finance?.annualSavingsUsd || 0)} USD y payback de ${designSummary.finance?.paybackYears} anos.

2. DISENO TECNICO PRELIMINAR
El dimensionamiento usa el recurso solar ${designSummary.site?.source?.toUpperCase()} del sitio: ${designSummary.site?.hspAnnualAvg} HSP promedio y ${designSummary.site?.hspWorstMonth} HSP en peor mes. ${isOffgrid ? `Para continuidad energetica se incluye banco de baterias de ${designSummary.design?.batteryCapacityWh} Wh, ${designSummary.design?.autonomyDays} dias de autonomia y sistema a ${designSummary.design?.systemVoltage}V.` : 'Para autoconsumo conectado a red, se prioriza reducir compra de energia durante horas solares y evitar sobredimensionamiento.'}

3. CONSIDERACIONES COMERCIALES
El BOM es trazable por proveedor, fuente y fecha de verificacion. La cotizacion final debe reconfirmar disponibilidad, IGV, flete, montaje, protecciones especificas y condiciones de interconexion.

4. RESPONSABILIDAD TECNICA
Este reporte es prefactibilidad automatizada. No reemplaza visita en campo, revision estructural, estudio de sombras, calculo de conductores/protecciones ni firma de ingenieria final.
  `.trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const designSummary = req.body;
    if (!designSummary?.projectId) {
      sendJson(res, 400, { error: 'Faltan los detalles del proyecto para redactar la propuesta.' });
      return;
    }

    sendJson(res, 200, { text: fallbackProposal(designSummary), source: 'local_template_no_ai' });
  } catch (err: any) {
    sendJson(res, 500, { error: 'Fallo al redactar la propuesta tecnica: ' + err.message });
  }
}
