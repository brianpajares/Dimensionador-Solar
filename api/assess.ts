import { assessProject, sendJson } from './_shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const result = await assessProject(req.body);
    sendJson(res, 200, result);
  } catch (err: any) {
    sendJson(res, 500, { error: 'Fallo durante el dimensionamiento del sistema solar: ' + err.message });
  }
}

