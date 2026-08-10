/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { BomItem } from '../types';

interface BomTableProps {
  bom: BomItem[];
}

export default function BomTable({ bom }: BomTableProps) {
  // Exchange rate USD to PEN (Peruvian Sol)
  const TIPO_CAMBIO = 3.78;

  const grandTotalUsd = bom.reduce((sum, item) => sum + item.line_total_usd, 0);
  const grandTotalPen = grandTotalUsd * TIPO_CAMBIO;

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'panel': return 'Módulos Fotovoltaicos';
      case 'battery': return 'Acumuladores (Baterías)';
      case 'inverter_offgrid': return 'Inversor Cargador Híbrido';
      case 'inverter_grid': return 'Inversor de Conexión a Red';
      case 'charge_controller': return 'Controladores MPPT';
      case 'mounting': return 'Estructuras de Soporte';
      case 'wiring': return 'Cables y Conectores Solares';
      case 'protection': return 'Gabinete y Fusibles (Protecciones)';
      case 'monitoring': return 'Monitoreo Smart (Wifi)';
      default: return 'Accesorios Varios';
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'panel': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'battery': return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20';
      case 'inverter_offgrid':
      case 'inverter_grid': return 'bg-orange-500/15 text-orange-400 border border-orange-500/20';
      case 'protection': return 'bg-red-500/15 text-red-400 border border-red-500/20';
      default: return 'bg-white/10 text-slate-300 border border-white/5';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            Lista de Componentes Detallada (BOM)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Presupuesto valorizado con precios reales promedio del mercado mayorista peruano de energía solar.
          </p>
        </div>

        {/* Tipo de Cambio Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-mono text-slate-300 shadow-3xs">
          <ArrowRightLeft className="h-3 w-3 text-slate-400" />
          <span>T.C: $1.00 USD = S/. {TIPO_CAMBIO.toFixed(2)} PEN</span>
        </div>
      </div>

      {/* BOM Table */}
      <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-white text-[11px] font-semibold uppercase tracking-wider border-b border-white/10">
                <th className="py-3.5 px-4 w-44">Categoría</th>
                <th className="py-3.5 px-4">Descripción del Equipo</th>
                <th className="py-3.5 px-4 w-40">Trazabilidad</th>
                <th className="py-3.5 px-4 text-center w-16">Cant.</th>
                <th className="py-3.5 px-4 text-right w-24">P. Unit ($)</th>
                <th className="py-3.5 px-4 text-right w-28">Total ($ USD)</th>
                <th className="py-3.5 px-4 text-right w-28">Total (S/.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {bom.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getCategoryBadgeColor(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-[10px] text-slate-400 leading-relaxed">
                    <p className="font-semibold text-slate-300">{item.supplier || 'Proveedor por confirmar'}</p>
                    <p>{item.country || 'PE'} | {item.last_verified_at || 'sin fecha'}</p>
                    <p>{item.source || 'Benchmark de mercado'}</p>
                    {item.notes && <p className="text-amber-300 mt-1">{item.notes}</p>}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-200">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    ${item.unit_price_usd.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-amber-400">
                    ${item.line_total_usd.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    S/. {(item.line_total_usd * TIPO_CAMBIO).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary Block */}
        <div className="bg-white/5 text-white p-5 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-1 text-[11px] text-slate-300">
              <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Precios no incluyen IGV (18%). Se estimaron costos base de hardware en Lima. Los despachos a provincias de Perú (Cajamarca, Cusco, etc.) o instalación física final de obra civil de montaje se estiman de forma complementaria por un especialista en campo.
              </p>
            </div>
            
            <div className="flex-shrink-0 bg-slate-950/80 border border-white/10 p-4 rounded-xl flex flex-col items-end min-w-[240px] text-right shadow-lg">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Presupuesto Estimado de Equipamiento</span>
              <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                ${grandTotalUsd.toLocaleString()} <span className="text-xs font-normal text-slate-300">USD</span>
              </div>
              <div className="text-sm font-semibold text-slate-300 mt-1 font-mono">
                S/. {grandTotalPen.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PEN
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
