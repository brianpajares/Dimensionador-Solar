/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MASTER_CATALOG, MASTER_DATA_VERSION } from '../data/solar-master-data.js';
import type { CatalogItem } from '../types';

export const CATALOG_VERSION = MASTER_DATA_VERSION;
export const CATALOG: CatalogItem[] = MASTER_CATALOG;
