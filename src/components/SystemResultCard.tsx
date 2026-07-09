/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Battery, Zap, ShieldAlert, Sliders } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemResultCardProps {
  systemType: 'offgrid' | 'grid_tied';
  design: {
    systemVoltage?: number;
    arrayPowerWp: number;
    nPanels: number;
    batteryCapacityWh?: number;
    batteryCapacityAh?: number;
    nBatteries?: number;
    controllerCurrentA?: number;
    inverterPowerW: number;
    dailyEnergyWh: number;
    autonomyDays?: number;
  };
  worstMonthHsp: number;
}

export default function SystemResultCard({ systemType, design, worstMonthHsp }: SystemResultCardProps) {
  const isOffGrid = systemType === 'offgrid';

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div id="system-result-cards-wrapper" className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* 1. Panel Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md hover:border-white/20 hover:bg-white/10 transition-all"
      >
        <div className="flex justify-between items-start">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Sun className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
            FV Array
          </span>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-white">
            {design.arrayPowerWp.toLocaleString()} Wp
          </div>
          <div className="text-xs font-semibold text-slate-200 mt-1">
            {design.nPanels} Paneles de 550Wp
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Arreglo de silicio monocristalino de alta eficiencia. Satisface la demanda diaria incluso en el mes más nublado ({worstMonthHsp} HSP).
          </p>
        </div>
      </motion.div>

      {/* 2. Battery Card (Only off-grid) */}
      {isOffGrid ? (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md hover:border-white/20 hover:bg-white/10 transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Battery className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
              Baterías
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              {((design.batteryCapacityWh || 0) / 1000).toFixed(1)} kWh
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">
              {design.batteryCapacityAh} Ah @ {design.systemVoltage}V
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Banco de almacenamiento con {design.nBatteries} unidades físicas. Provee <span className="font-semibold text-indigo-400">{design.autonomyDays} días completos de autonomía</span> de respaldo.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Grid-Tied Virtual Storage Card / Net Metering note */
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md hover:border-white/20 hover:bg-white/10 transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 border border-white/10 rounded-xl text-slate-300">
              <Sliders className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">
              Sin Almacenamiento
            </span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-bold text-white">
              Autoconsumo Puro
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">
              Sistema Grid-Tied sin Baterías
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              La energía producida se inyecta directamente al tablero. En Perú no hay ley de retribución aprobada, por lo que se diseñó para no inyectar excedentes.
            </p>
          </div>
        </motion.div>
      )}

      {/* 3. Inverter Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md hover:border-white/20 hover:bg-white/10 transition-all"
      >
        <div className="flex justify-between items-start">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
            <Zap className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 uppercase tracking-wider">
            Inversor
          </span>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-white">
            {((design.inverterPowerW || 0) / 1000).toFixed(1)} kW
          </div>
          <div className="text-xs font-semibold text-slate-200 mt-1">
            Híbrido de Onda Senoidal Pura
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Inversor de potencia certificada para arranques inductivos simultáneos. {isOffGrid ? 'Soporta picos de motores y bombas de agua de forma segura.' : 'Acoplado a red monofásica/trifásica para sincronización.'}
          </p>
        </div>
      </motion.div>

      {/* 4. MPPT Controller Card / Safety Balance */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md hover:border-white/20 hover:bg-white/10 transition-all"
      >
        <div className="flex justify-between items-start">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
            Protecciones
          </span>
        </div>
        <div className="mt-4">
          <div className="text-lg font-bold text-white">
            {isOffGrid ? `${design.controllerCurrentA}A MPPT` : 'AC/DC Integrado'}
          </div>
          <div className="text-xs font-semibold text-slate-200 mt-1">
            Gabinete Técnico IP65
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Incluye breakers DC de corte rápido, fusibles de batería gPV de protección, supresor de picos de sobretensión (SPD) y puesta a tierra. Cumple CNE Perú.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
