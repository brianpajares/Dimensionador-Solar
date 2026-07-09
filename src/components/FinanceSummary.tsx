/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Percent, Landmark, ChartColumnIncreasing } from 'lucide-react';
import { motion } from 'motion/react';

interface FinanceSummaryProps {
  finance: {
    capexUsd: number;
    annualSavingsUsd: number;
    paybackYears: number;
    npvUsd: number;
    irrPct: number;
    cashFlows: number[];
  };
  systemType: 'offgrid' | 'grid_tied';
}

export default function FinanceSummary({ finance, systemType }: FinanceSummaryProps) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Compute cumulative cash flows for charting
  const cumulativeFlows: number[] = [];
  let currentAccum = -finance.capexUsd;
  cumulativeFlows.push(currentAccum);

  // cashFlows[0] is -capexUsd. cashFlows[1..20] are yearly savings.
  // Let's accumulate starting from Year 1
  for (let i = 1; i < finance.cashFlows.length; i++) {
    currentAccum += finance.cashFlows[i];
    cumulativeFlows.push(Math.round(currentAccum));
  }

  // Find max and min for scaling the SVG chart
  const minFlow = Math.min(...cumulativeFlows);
  const maxFlow = Math.max(...cumulativeFlows);
  const absMax = Math.max(Math.abs(minFlow), Math.abs(maxFlow));

  // Chart proportions
  const width = 600;
  const height = 180;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Coordinate mapping helper
  const getX = (index: number) => {
    return paddingLeft + (index / (cumulativeFlows.length - 1)) * chartW;
  };

  const getY = (value: number) => {
    // Map center value (0) to half-height if there's both negative and positive
    // Scaled around absMax
    const pct = value / absMax; // -1 to 1
    const centerY = paddingTop + chartH / 2;
    return centerY - pct * (chartH / 2);
  };

  const zeroY = getY(0);

  return (
    <div id="finance-summary-section" className="space-y-6">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* KPI 1: CAPEX */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inversión (CAPEX)</span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-white font-mono">
              ${finance.capexUsd.toLocaleString()}
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Presupuesto inicial estimado</p>
          </div>
        </div>

        {/* KPI 2: Ahorro Anual */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ahorro Anual (Año 1)</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-emerald-300 font-mono">
              ${Math.round(finance.annualSavingsUsd).toLocaleString()}
            </div>
            <p className="text-[9px] text-emerald-400/80 mt-1">
              {systemType === 'offgrid' ? 'Evitado de diésel/generador' : 'Reducción de factura operador'}
            </p>
          </div>
        </div>

        {/* KPI 3: Payback */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Retorno (Payback)</span>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-amber-300 font-mono">
              {finance.paybackYears} <span className="text-xs font-semibold">Años</span>
            </div>
            <p className="text-[9px] text-amber-400/80 mt-1">Breakeven financiero esperado</p>
          </div>
        </div>

        {/* KPI 4: IRR */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-center text-indigo-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tasa Interna (IRR)</span>
            <Percent className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-indigo-300 font-mono">
              {finance.irrPct}%
            </div>
            <p className="text-[9px] text-indigo-400/80 mt-1">Rendimiento anual compuesto</p>
          </div>
        </div>

        {/* KPI 5: NPV */}
        <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1 backdrop-blur-md">
          <div className="flex justify-between items-center text-violet-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Valor Actual (NPV @10%)</span>
            <Landmark className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-violet-300 font-mono">
              ${finance.npvUsd.toLocaleString()}
            </div>
            <p className="text-[9px] text-violet-400/80 mt-1">Valor neto descontado a 20 años</p>
          </div>
        </div>
      </div>

      {/* SVG Interactive Financial Chart */}
      <div className="border border-white/10 rounded-2xl p-5 bg-white/5 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <ChartColumnIncreasing className="h-4.5 w-4.5 text-amber-500" />
              Retorno Acumulado Proyectado a 20 Años
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Visualiza el flujo de caja neto. El cruce sobre la línea cero representa el retorno definitivo de su capital.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-rose-500 rounded-full"></span>
              <span className="text-slate-400">Inversión No Retornada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-slate-400">Ganancias Netas Puras</span>
            </div>
          </div>
        </div>

        {/* SVG Render Container */}
        <div className="relative">
          <svg className="w-full h-auto text-slate-500" viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Grid Horizontal Reference Lines */}
            <line x1={paddingLeft} y1={getY(0)} x2={width - paddingRight} y2={getY(0)} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1={paddingLeft} y1={getY(maxFlow / 2)} x2={width - paddingRight} y2={getY(maxFlow / 2)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1={paddingLeft} y1={getY(minFlow / 2)} x2={width - paddingRight} y2={getY(minFlow / 2)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

            {/* Y-Axis Labels */}
            <text x={paddingLeft - 10} y={getY(maxFlow) + 4} textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-semibold">${Math.round(maxFlow / 1000)}k</text>
            <text x={paddingLeft - 10} y={getY(0) + 3} textAnchor="end" fill="#cbd5e1" className="text-[9px] font-mono font-semibold">$0</text>
            <text x={paddingLeft - 10} y={getY(minFlow) + 3} textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-semibold">-${Math.abs(Math.round(minFlow / 1000))}k</text>

            {/* The Cumulative Cash Flow Line Chart */}
            <path
              d={cumulativeFlows.map((flow, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(flow)}`).join(' ')}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Custom Interactive Bars/Circles */}
            {cumulativeFlows.map((flow, idx) => {
              const x = getX(idx);
              const y = getY(flow);
              const isPositive = flow >= 0;
              const isHovered = hoveredYear === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredYear(idx)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible broad trigger bar for mouse hover */}
                  <rect
                    x={x - 10}
                    y={paddingTop}
                    width={20}
                    height={chartH}
                    fill="transparent"
                  />

                  {/* Vertical bar anchor */}
                  <line
                    x1={x}
                    y1={zeroY}
                    x2={x}
                    y2={y}
                    stroke={isPositive ? '#10b981' : '#f43f5e'}
                    strokeWidth={isHovered ? '2.5' : '1.5'}
                    opacity={isHovered ? '0.8' : '0.4'}
                  />

                  {/* Data Point circle node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3.5}
                    fill={isPositive ? '#10b981' : '#f43f5e'}
                    stroke="#05060a"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* X-Axis labels (Years) */}
            {cumulativeFlows.map((_, idx) => {
              if (idx % 2 === 0 || idx === cumulativeFlows.length - 1) {
                return (
                  <text
                    key={idx}
                    x={getX(idx)}
                    y={height - 8}
                    textAnchor="middle"
                    fill="#94a3b8"
                    className="text-[9px] font-mono font-semibold"
                  >
                    {idx === 0 ? 'Año 0' : `A${idx}`}
                  </text>
                );
              }
              return null;
            })}
          </svg>

          {/* Dynamic Floating Tooltip */}
          {hoveredYear !== null && (
            <div
              className="absolute bg-[#0d1117]/95 border border-white/10 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg shadow-2xl pointer-events-none font-medium flex flex-col gap-0.5"
              style={{
                left: `${Math.min(85, Math.max(10, (hoveredYear / (cumulativeFlows.length - 1)) * 100))}%`,
                bottom: '40px',
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-[10px] text-slate-400">
                {hoveredYear === 0 ? 'Inversión Inicial' : `Año de Proyección ${hoveredYear}`}
              </span>
              <span className={`font-bold font-mono text-xs ${cumulativeFlows[hoveredYear] >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Saldo Neto: ${cumulativeFlows[hoveredYear].toLocaleString()} USD
              </span>
              {hoveredYear > 0 && (
                <span className="text-[9px] text-slate-400 font-mono">
                  Ahorro en este año: +${finance.cashFlows[hoveredYear].toLocaleString()} USD
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
