/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  MapPin, 
  Zap, 
  Battery, 
  Sliders, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Cpu, 
  HelpCircle,
  FileCheck2,
  Lock,
  Compass
} from 'lucide-react';

import { Appliance, BatteryChemistry, SystemType, ProjectAssessmentResponse } from './types';
import MapPicker from './components/MapPicker';
import ApplianceTable from './components/ApplianceTable';
import SystemResultCard from './components/SystemResultCard';
import BomTable from './components/BomTable';
import FinanceSummary from './components/FinanceSummary';
import ProposalViewer from './components/ProposalViewer';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [proposalLoading, setProposalLoading] = useState<boolean>(false);

  // Form State
  const [systemType, setSystemType] = useState<SystemType>('offgrid');
  const [location, setLocation] = useState<{ lat: number; lon: number }>({ lat: -7.15, lon: -78.51 }); // Cajamarca default
  const [address, setAddress] = useState<string>('Fundo El Milagro, Cajamarca, Perú');
  
  // Off-grid states
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: '1', name: 'Focos LED Interiores', power_w: 9, hours_per_day: 5, quantity: 4, is_critical: true },
    { id: '2', name: 'Cargadores de Celular', power_w: 10, hours_per_day: 3, quantity: 2, is_critical: true },
    { id: '3', name: 'Televisor LED 32"', power_w: 60, hours_per_day: 4, quantity: 1, is_critical: false }
  ]);
  const [autonomyDays, setAutonomyDays] = useState<number>(2);
  const [batteryChemistry, setBatteryChemistry] = useState<BatteryChemistry>('lifepo4');
  const [offgridAvoidedCost, setOffgridAvoidedCost] = useState<number>(0.35); // $/kWh for offgrid generation

  // Grid-tied states
  const [monthlyKwh, setMonthlyKwh] = useState<number>(250);
  const [gridTariff, setGridTariff] = useState<number>(0.22); // $/kWh residential

  // Results State
  const [assessmentResult, setAssessmentResult] = useState<ProjectAssessmentResponse | null>(null);
  const [proposalText, setProposalText] = useState<string>('');

  // Sizing execution
  const handleCalculate = async () => {
    setLoading(true);
    setAssessmentResult(null);
    setProposalText('');

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemType,
          location,
          address,
          appliances: systemType === 'offgrid' ? appliances : undefined,
          autonomyDays: systemType === 'offgrid' ? autonomyDays : undefined,
          batteryChemistry: systemType === 'offgrid' ? batteryChemistry : undefined,
          monthlyKwh: systemType === 'grid_tied' ? monthlyKwh : undefined,
          tariffUsdPerKwh: systemType === 'offgrid' ? offgridAvoidedCost : gridTariff
        })
      });

      if (!response.ok) {
        throw new Error("Error en los servidores de cálculo solar.");
      }

      const data = await response.json();
      setAssessmentResult(data);
      setCurrentStep(4); // Advance to the output screen
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al dimensionar su sistema. Por favor reintente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposalText = async () => {
    if (!assessmentResult) return;
    setProposalLoading(true);

    try {
      const response = await fetch('/api/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentResult)
      });

      if (!response.ok) {
        throw new Error("No se pudo conectar al redactor de IA.");
      }

      const data = await response.json();
      setProposalText(data.text);
    } catch (err) {
      console.error(err);
      alert("No pudimos generar el informe de IA. Usaremos la plantilla de respaldo.");
    } finally {
      setProposalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060A] text-slate-200 flex flex-col font-sans relative overflow-x-hidden">
      {/* Mesh Gradients in the background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[160px]" />
        <div className="absolute top-[30%] right-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* 1. Global Header */}
      <header className="bg-[#05060A]/70 backdrop-blur-md border-b border-white/10 py-4 px-6 sticky top-0 z-50 shadow-lg relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-slate-950 shadow-md">
              <Sun className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  Sol<span className="text-amber-400 font-extrabold">Configura</span>
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-semibold">
                  MVP v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Evaluador y Dimensionador Fotovoltaico Profesional para Perú & LatAm
              </p>
            </div>
          </div>

          {/* Quick Stats Panel / Authority Badging */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <Compass className="h-4 w-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Base de Datos Solar</div>
                <div className="font-bold text-slate-200">PVGIS 5.3 + NASA Power</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <FileCheck2 className="h-4 w-4 text-orange-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Validado por</div>
                <div className="font-bold text-slate-200">Ing. Brian Pajares (PMP)</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 relative z-10">
        
        {/* Step Progress Bar Indicators */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex justify-between items-center overflow-x-auto shadow-lg gap-4">
          <div className="flex items-center gap-8 w-full justify-around min-w-[500px]">
            <button
              id="wizard-step-indicator-1"
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                currentStep === 1 ? 'text-amber-400' : currentStep > 1 ? 'text-slate-300 hover:text-white' : 'text-slate-600'
              }`}
            >
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 1 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold' : currentStep > 1 ? 'bg-white/10 text-slate-200 border border-white/10' : 'bg-white/5 text-slate-500 border border-white/5'
              }`}>1</span>
              Localidad & Recurso
            </button>

            <span className="h-px bg-white/10 flex-1 max-w-[40px]"></span>

            <button
              id="wizard-step-indicator-2"
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                currentStep === 2 ? 'text-amber-400' : currentStep > 2 ? 'text-slate-300 hover:text-white' : 'text-slate-600'
              }`}
            >
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 2 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold' : currentStep > 2 ? 'bg-white/10 text-slate-200 border border-white/10' : 'bg-white/5 text-slate-500 border border-white/5'
              }`}>2</span>
              Tipo de Sistema
            </button>

            <span className="h-px bg-white/10 flex-1 max-w-[40px]"></span>

            <button
              id="wizard-step-indicator-3"
              onClick={() => currentStep > 3 && setCurrentStep(3)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                currentStep === 3 ? 'text-amber-400' : currentStep > 3 ? 'text-slate-300 hover:text-white' : 'text-slate-600'
              }`}
            >
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 3 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold' : currentStep > 3 ? 'bg-white/10 text-slate-200 border border-white/10' : 'bg-white/5 text-slate-500 border border-white/5'
              }`}>3</span>
              Inventario de Consumo
            </button>

            <span className="h-px bg-white/10 flex-1 max-w-[40px]"></span>

            <button
              id="wizard-step-indicator-4"
              disabled={!assessmentResult}
              onClick={() => assessmentResult && setCurrentStep(4)}
              className={`flex items-center gap-2 text-xs font-semibold disabled:opacity-50 transition-colors ${
                currentStep === 4 ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 4 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold' : 'bg-white/5 text-slate-600 border border-white/5'
              }`}>4</span>
              Propuesta & BOM
            </button>
          </div>
        </div>

        {/* Step Contents */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl relative min-h-[400px]">
          
          {loading && (
            <div className="absolute inset-0 bg-[#05060A]/80 backdrop-blur-md z-40 rounded-3xl flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-white">Dimensionando Sistema Solar...</h4>
                <p className="text-xs text-slate-400 mt-1">Consultando bases de datos climáticos PVGIS y calculando flujos financieros.</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* STEP 1: MAP PICKER */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-500" />
                    Paso 1: Geolocalización del Proyecto
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    La radiación solar cambia drásticamente en Perú. Selecciona un departamento o pincha en el mapa para cargar el historial multianual de irradiancia.
                  </p>
                </div>

                <MapPicker
                  value={location}
                  address={address}
                  onChange={(coords, addr) => {
                    setLocation(coords);
                    setAddress(addr);
                  }}
                />

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    id="step-1-next-btn"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    Siguiente Paso
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SYSTEM TYPE SELECTOR */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Paso 2: Selección de Arquitectura Solar
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Elige el tipo de instalación adecuado para tu propiedad.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option A: Off-Grid (Default) */}
                  <button
                    id="system-type-offgrid-btn"
                    onClick={() => setSystemType('offgrid')}
                    className={`flex flex-col items-start p-6 rounded-2xl border text-left transition-all cursor-pointer ${
                      systemType === 'offgrid'
                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md'
                        : 'border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm'
                    }`}
                  >
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Battery className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white mt-4 flex items-center gap-2">
                      Aislado de la Red (Off-Grid)
                      <span className="text-[9px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                        Recomendado Rural
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Especial para casas de campo, fundos, chacras o cabañas sin acceso a la red eléctrica o con cortes frecuentes. Incluye almacenamiento por baterías de gel o litio para suministro las 24 horas del día.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5">Baterías requeridas</span>
                      <span className="text-[10px] bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5">Suministro 24/7 autónomo</span>
                    </div>
                  </button>

                  {/* Option B: Grid-Tied */}
                  <button
                    id="system-type-gridtied-btn"
                    onClick={() => setSystemType('grid_tied')}
                    className={`flex flex-col items-start p-6 rounded-2xl border text-left transition-all cursor-pointer ${
                      systemType === 'grid_tied'
                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md'
                        : 'border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm'
                    }`}
                  >
                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                      <Sliders className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white mt-4 flex items-center gap-2">
                      Conectado a Red (Grid-Tied)
                      <span className="text-[9px] font-semibold bg-white/10 text-slate-400 px-2 py-0.5 rounded-full uppercase border border-white/5">
                        Urbano de Autoconsumo
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Pensado para viviendas urbanas o comercios que ya cuentan con red pública pero buscan bajar su factura mensual. Sincroniza los paneles con la red sin almacenar energía, reduciendo costos durante horas de sol.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5">Sin costo de baterías</span>
                      <span className="text-[10px] bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5">Instalación simple</span>
                    </div>
                  </button>
                </div>

                {/* Sub-parameters sliders depending on system type */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 backdrop-blur-md">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Parámetros Financieros Regionales</h4>
                  
                  {systemType === 'offgrid' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-slate-400">Costo evitado equivalente (Combustible/Diésel o tarifa de respaldo)</label>
                        <span className="text-xs font-mono font-bold text-amber-400">${offgridAvoidedCost.toFixed(2)} USD/kWh</span>
                      </div>
                      <input
                        id="offgrid-avoided-cost-slider"
                        type="range"
                        min="0.20"
                        max="0.60"
                        step="0.01"
                        value={offgridAvoidedCost}
                        onChange={(e) => setOffgridAvoidedCost(parseFloat(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Estima cuánto te costaría producir cada kWh usando un generador diésel ruidoso o la tarifa de penalidad rural en el sitio.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-slate-400">Tarifa eléctrica del operador actual (PEN/USD equivalente)</label>
                        <span className="text-xs font-mono font-bold text-amber-400">${gridTariff.toFixed(2)} USD/kWh</span>
                      </div>
                      <input
                        id="grid-tariff-slider"
                        type="range"
                        min="0.12"
                        max="0.35"
                        step="0.01"
                        value={gridTariff}
                        onChange={(e) => setGridTariff(parseFloat(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Introduce la tarifa por kWh que te factura Luz del Sur, Enel o Seal según tu último recibo de luz en dólares.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-white/10">
                  <button
                    id="step-2-back-btn"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                  <button
                    id="step-2-next-btn"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    Siguiente Paso
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONSUMPTION LOADS */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-amber-500" />
                    Paso 3: Dimensionar Consumo Eléctrico
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Calcula la demanda energética diaria requerida para dimensionar de forma óptima el panel y las baterías.
                  </p>
                </div>

                {systemType === 'offgrid' ? (
                  /* Off-Grid Appliance Load Builder */
                  <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 backdrop-blur-md">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Días de Autonomía Requeridos</label>
                        <div className="flex items-center gap-4">
                          <input
                            id="autonomy-days-slider"
                            type="range"
                            min="1"
                            max="3"
                            step="1"
                            value={autonomyDays}
                            onChange={(e) => setAutonomyDays(parseInt(e.target.value))}
                            className="flex-1 accent-amber-500"
                          />
                          <span className="text-sm font-bold font-mono text-amber-400 min-w-[70px] bg-white/5 px-3 py-1 border border-white/10 rounded-lg text-center backdrop-blur-md">
                            {autonomyDays} {autonomyDays === 1 ? 'Día' : 'Días'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Cantidad de días que el banco de baterías podrá alimentar la casa sin recibir sol directo (nubosidad extrema). En la sierra andina se recomiendan 2 días de autonomía.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Tecnología de Batería Recomendada</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            id="battery-chem-gel-btn"
                            type="button"
                            onClick={() => setBatteryChemistry('agm')}
                            className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              batteryChemistry === 'agm'
                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-400 font-bold'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            Baterías de Gel (Económico)
                          </button>
                          <button
                            id="battery-chem-lithium-btn"
                            type="button"
                            onClick={() => setBatteryChemistry('lifepo4')}
                            className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              batteryChemistry === 'lifepo4'
                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-400 font-bold'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            Litio LiFePO4 (Premium)
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          El litio soporta descargas profundas (80% DoD) y dura más de 10 años, mientras que el gel se limita a un 50% de descarga y requiere más mantenimiento.
                        </p>
                      </div>
                    </div>

                    <ApplianceTable value={appliances} onChange={setAppliances} />
                  </div>
                ) : (
                  /* Grid-Tied Monthly Slider */
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6 backdrop-blur-md">
                    <div className="max-w-xl mx-auto space-y-4 text-center">
                      <h4 className="text-sm font-semibold text-white">¿Cuál es tu consumo promedio facturado al mes?</h4>
                      
                      <div className="py-4">
                        <div className="text-5xl font-black text-amber-400 font-mono drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          {monthlyKwh} <span className="text-base font-normal text-slate-400">kWh/mes</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Monto estimado de factura: <span className="font-semibold text-slate-200">S/. {(monthlyKwh * gridTariff * 3.78).toLocaleString(undefined, { maximumFractionDigits: 0 })} PEN</span> / <span className="font-semibold text-slate-200">${(monthlyKwh * gridTariff).toFixed(0)} USD</span> mensuales.
                        </p>
                      </div>

                      <input
                        id="monthly-kwh-slider"
                        type="range"
                        min="80"
                        max="2000"
                        step="10"
                        value={monthlyKwh}
                        onChange={(e) => setMonthlyKwh(parseInt(e.target.value))}
                        className="w-full accent-amber-500"
                      />

                      <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2">
                        <span>80 kWh (Tarifa Baja)</span>
                        <span>500 kWh</span>
                        <span>1000 kWh</span>
                        <span>2000 kWh (Comercio/Trifásico)</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-white/10">
                  <button
                    id="step-3-back-btn"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                  <button
                    id="step-3-calculate-btn"
                    onClick={handleCalculate}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse-slow"
                  >
                    <Cpu className="h-4.5 w-4.5" />
                    Calcular Dimensionamiento
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: RESULTS DISPLAY (BOM & FINANCIALS) */}
            {currentStep === 4 && assessmentResult && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Header Summary Cards */}
                <div className="border-b border-white/10 pb-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-5.5 w-5.5 text-amber-500" />
                        Paso 4: Diagnóstico y Propuesta Técnica
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Dimensionamiento preliminar completado exitosamente para el proyecto <span className="font-mono font-bold text-amber-400">{assessmentResult.projectId}</span>.
                      </p>
                    </div>
                    
                    <button
                      id="step-4-reset-btn"
                      onClick={() => setCurrentStep(1)}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Nueva Evaluación
                    </button>
                  </div>
                </div>

                {/* Sub-block A: Solar Resource Indicators */}
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/25">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold text-[10px] uppercase">Recurso Solar Promedio</div>
                      <div className="font-bold text-slate-200 mt-0.5">{assessmentResult.site.hspAnnualAvg} HSP (horas sol/día)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/15 text-orange-400 rounded-lg border border-orange-500/25">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold text-[10px] uppercase">Irradiación Peor Mes</div>
                      <div className="font-bold text-slate-200 mt-0.5">{assessmentResult.site.hspWorstMonth} HSP (Junio crítico)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/25">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold text-[10px] uppercase">Fuente Climática</div>
                      <div className="font-bold text-slate-200 mt-0.5 uppercase">Satelital {assessmentResult.site.source}</div>
                    </div>
                  </div>
                </div>

                {/* 1. Sizing results dashboard */}
                <SystemResultCard
                  systemType={systemType}
                  design={assessmentResult.design}
                  worstMonthHsp={assessmentResult.site.hspWorstMonth}
                />

                {/* 2. BOM Table component */}
                <BomTable bom={assessmentResult.bom} />

                {/* 3. Finance summary projections */}
                <FinanceSummary
                  finance={assessmentResult.finance}
                  systemType={systemType}
                />

                {/* 4. AI Proposal Generation Portal */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                  <div className="text-center max-w-md space-y-1.5">
                    <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Redacción de Propuesta Comercial con IA
                    </h3>
                    <p className="text-xs text-slate-300">
                      Redacta un reporte formal y comercial de ingeniería para tu cliente, integrando el análisis geográfico y financiero mediante modelos inteligentes de IA.
                    </p>
                  </div>

                  {proposalLoading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[11px] font-medium text-slate-400">Generando reporte formal...</span>
                    </div>
                  ) : proposalText ? (
                    <ProposalViewer
                      proposalText={proposalText}
                      projectId={assessmentResult.projectId}
                      address={assessmentResult.address}
                      location={assessmentResult.location}
                      capexUsd={assessmentResult.finance.capexUsd}
                    />
                  ) : (
                    <button
                      id="generate-ai-proposal-btn"
                      onClick={handleGenerateProposalText}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
                    >
                      <Sparkles className="h-4.5 w-4.5 fill-slate-950" />
                      Generar Documento Propuesta Formal
                    </button>
                  )}
                </div>

                {/* Back button */}
                <div className="flex justify-start pt-4 border-t border-white/10">
                  <button
                    id="step-4-back-btn"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Modificar Consumos / Parámetros
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* 3. Footer / Accreditations */}
        <footer className="text-center py-8 text-[11px] text-slate-400 space-y-2 border-t border-white/10 mt-12 leading-relaxed">
          <p>© 2026 SolConfigura Perú. Todos los derechos reservados. Diseñado por Brian Pajares / Zone Digital.</p>
          <p className="max-w-xl mx-auto">
            AVISO: Los cálculos de este evaluador solar son estimaciones preliminares basadas en modelos matemáticos e históricos satelitales (PVGIS/NASA) y no sustituyen las mediciones físicas y diseño de ingeniería de detalle final obligatoria según Código Nacional de Electricidad (Perú).
          </p>
        </footer>
      </main>
    </div>
  );
}
