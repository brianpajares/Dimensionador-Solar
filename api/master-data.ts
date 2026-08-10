import { sendJson } from './_shared.js';
import {
  MASTER_CATALOG,
  MASTER_DATA_SOURCE,
  MASTER_DATA_VERSION,
  MONETIZATION_PLANS,
  SOLAR_REGIONS,
  TARIFFS,
} from '../src/data/solar-master-data.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  sendJson(res, 200, {
    version: MASTER_DATA_VERSION,
    source: MASTER_DATA_SOURCE,
    operatingMode: 'local_master_data_no_ai_no_external_sources',
    counts: {
      solarRegions: SOLAR_REGIONS.length,
      catalogItems: MASTER_CATALOG.length,
      tariffs: TARIFFS.length,
      monetizationPlans: MONETIZATION_PLANS.length,
    },
    regions: SOLAR_REGIONS.map((region) => ({
      id: region.id,
      name: region.name,
      hspWorstMonth: region.hspWorstMonth,
      hspAnnualAvg: region.hspAnnualAvg,
      specificYield: region.specificYield,
      confidence: region.confidence,
    })),
  });
}
