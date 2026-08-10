import { sendJson } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { projectId, action, consent } = req.body || {};
  if (!projectId || !action || consent !== true) {
    sendJson(res, 400, { error: 'Se requiere projectId, accion y consentimiento para registrar el lead.' });
    return;
  }

  // MVP production-safe acknowledgement. Connect this to Postgres/CRM for durable monetization.
  sendJson(res, 200, {
    ok: true,
    leadId: 'LEAD_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    message: 'Solicitud registrada. Un asesor puede priorizar este proyecto.'
  });
}
