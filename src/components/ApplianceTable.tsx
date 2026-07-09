/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Home, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { Appliance } from '../types';

interface ApplianceTableProps {
  value: Appliance[];
  onChange: (appliances: Appliance[]) => void;
}

interface PresetItem {
  name: string;
  power_w: number;
  hours_per_day: number;
  quantity: number;
  is_critical: boolean;
}

const APPLIANCE_PRESETS: PresetItem[] = [
  { name: 'Foco LED Eficiente', power_w: 9, hours_per_day: 5, quantity: 4, is_critical: true },
  { name: 'Refrigeradora Inverter', power_w: 120, hours_per_day: 10, quantity: 1, is_critical: true },
  { name: 'Televisor LED 32"', power_w: 60, hours_per_day: 4, quantity: 1, is_critical: false },
  { name: 'Bomba de Agua (0.5 HP)', power_w: 375, hours_per_day: 1, quantity: 1, is_critical: true },
  { name: 'Laptop / Cargador', power_w: 65, hours_per_day: 4, quantity: 1, is_critical: false },
  { name: 'Ventilador', power_w: 50, hours_per_day: 6, quantity: 1, is_critical: false },
  { name: 'Cargador de Celular', power_w: 10, hours_per_day: 3, quantity: 2, is_critical: true },
];

export default function ApplianceTable({ value, onChange }: ApplianceTableProps) {
  const [newName, setNewName] = useState('');
  const [newPower, setNewPower] = useState('60');
  const [newHours, setNewHours] = useState('4');
  const [newQty, setNewQty] = useState('1');
  const [newCritical, setNewCritical] = useState(false);

  // Quick house packages
  const applyHousePreset = (type: 'cabana' | 'campo' | 'bombeo') => {
    let list: Appliance[] = [];
    if (type === 'cabana') {
      list = [
        { id: 'c1', name: 'Focos LED', power_w: 9, hours_per_day: 5, quantity: 3, is_critical: true },
        { id: 'c2', name: 'TV LED 32"', power_w: 60, hours_per_day: 4, quantity: 1, is_critical: false },
        { id: 'c3', name: 'Cargadores de Celular', power_w: 10, hours_per_day: 3, quantity: 2, is_critical: true }
      ];
    } else if (type === 'campo') {
      list = [
        { id: 'ca1', name: 'Focos LED (Zonas Comunes)', power_w: 9, hours_per_day: 5, quantity: 6, is_critical: true },
        { id: 'ca2', name: 'Refrigeradora Inverter', power_w: 120, hours_per_day: 10, quantity: 1, is_critical: true },
        { id: 'ca3', name: 'Smart TV 43"', power_w: 85, hours_per_day: 5, quantity: 1, is_critical: false },
        { id: 'ca4', name: 'Bomba de Agua Doméstica', power_w: 375, hours_per_day: 1, quantity: 1, is_critical: true },
        { id: 'ca5', name: 'Laptop Trabajo', power_w: 65, hours_per_day: 4, quantity: 1, is_critical: false },
        { id: 'ca6', name: 'Licuadora Cocina', power_w: 350, hours_per_day: 0.2, quantity: 1, is_critical: false }
      ];
    } else {
      list = [
        { id: 'b1', name: 'Bomba de Agua de Riego (1 HP)', power_w: 750, hours_per_day: 2, quantity: 1, is_critical: true },
        { id: 'b2', name: 'Foco Guardián Exterior', power_w: 15, hours_per_day: 10, quantity: 1, is_critical: true }
      ];
    }
    onChange(list);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: Appliance = {
      id: 'custom_' + Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      power_w: parseFloat(newPower) || 60,
      hours_per_day: parseFloat(newHours) || 4,
      quantity: parseInt(newQty) || 1,
      is_critical: newCritical
    };

    onChange([...value, newItem]);
    setNewName('');
    setNewCritical(false);
  };

  const handleAddPreset = (preset: PresetItem) => {
    const newItem: Appliance = {
      id: 'preset_' + Math.random().toString(36).substring(2, 9),
      name: preset.name,
      power_w: preset.power_w,
      hours_per_day: preset.hours_per_day,
      quantity: preset.quantity,
      is_critical: preset.is_critical
    };
    onChange([...value, newItem]);
  };

  const handleUpdateRow = (id: string, field: keyof Appliance, val: any) => {
    const updated = value.map(item => {
      if (item.id === id) {
        let parsedVal = val;
        if (field === 'power_w' || field === 'hours_per_day') {
          parsedVal = parseFloat(val) || 0;
        } else if (field === 'quantity') {
          parsedVal = parseInt(val) || 0;
        }
        return { ...item, [field]: parsedVal };
      }
      return item;
    });
    onChange(updated);
  };

  const handleDeleteRow = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  const totalWh = value.reduce((sum, item) => sum + item.power_w * item.hours_per_day * item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* House Presets Selector */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Kits de Consumo Predefinidos (Autocompletar)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            id="preset-cabana-btn"
            type="button"
            onClick={() => applyHousePreset('cabana')}
            className="flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all shadow-xs cursor-pointer"
          >
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Home className="h-4 w-4 text-amber-500" />
              Cabaña Básica Rural
            </div>
            <p className="text-xs text-slate-400 mt-1">
              3 Focos, 1 TV chica, cargadores. Demanda: ~0.4 kWh/día.
            </p>
          </button>
          
          <button
            id="preset-campo-btn"
            type="button"
            onClick={() => applyHousePreset('campo')}
            className="flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all shadow-xs cursor-pointer"
          >
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Home className="h-4 w-4 text-orange-400" />
              Casa de Campo Familiar
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Refri, 6 Focos, TV, Bomba, Laptops. Demanda: ~2.3 kWh/día.
            </p>
          </button>

          <button
            id="preset-bombeo-btn"
            type="button"
            onClick={() => applyHousePreset('bombeo')}
            className="flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all shadow-xs cursor-pointer"
          >
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin-slow" />
              Estación de Bombeo
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bomba de agua 1 HP (riego/ganado). Demanda: ~1.6 kWh/día.
            </p>
          </button>
        </div>
      </div>

      {/* Quick Add Preset Buttons */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Añadir Electrodoméstico Común</label>
        <div className="flex flex-wrap gap-1.5">
          {APPLIANCE_PRESETS.map((preset) => (
            <button
              id={`preset-add-${preset.name.replace(/\s+/g, '-')}`}
              key={preset.name}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3 text-amber-500" />
              {preset.name} ({preset.power_w}W)
            </button>
          ))}
        </div>
      </div>

      {/* Editable Appliance List */}
      <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-white text-xs font-semibold uppercase tracking-wider border-b border-white/10">
                <th className="py-3 px-4">Equipo / Electrodoméstico</th>
                <th className="py-3 px-4 text-center w-24">Potencia (W)</th>
                <th className="py-3 px-4 text-center w-20">Cant.</th>
                <th className="py-3 px-4 text-center w-24">Horas/Día</th>
                <th className="py-3 px-4 text-center w-24">¿Crítico?</th>
                <th className="py-3 px-4 text-right w-28">Consumo (Wh)</th>
                <th className="py-3 px-4 text-center w-12">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {value.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-sm text-slate-400 font-medium">
                    No hay equipos en la lista. Haz clic en un preset o añade uno personalizado a continuación.
                  </td>
                </tr>
              ) : (
                value.map((item) => {
                  const rowTotal = item.power_w * item.hours_per_day * item.quantity;
                  return (
                    <tr key={item.id} className="text-xs hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4">
                        <input
                          id={`input-name-${item.id}`}
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateRow(item.id, 'name', e.target.value)}
                          className="w-full bg-transparent font-medium text-white border-b border-transparent focus:border-amber-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          id={`input-power-${item.id}`}
                          type="number"
                          value={item.power_w}
                          onChange={(e) => handleUpdateRow(item.id, 'power_w', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center font-mono text-white bg-transparent border border-transparent hover:border-white/10 focus:border-amber-500 focus:outline-none rounded"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          id={`input-qty-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateRow(item.id, 'quantity', e.target.value)}
                          className="w-12 px-1.5 py-1 text-center text-white bg-transparent border border-transparent hover:border-white/10 focus:border-amber-500 focus:outline-none rounded"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          id={`input-hours-${item.id}`}
                          type="number"
                          step="0.1"
                          value={item.hours_per_day}
                          onChange={(e) => handleUpdateRow(item.id, 'hours_per_day', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center font-mono text-white bg-transparent border border-transparent hover:border-white/10 focus:border-amber-500 focus:outline-none rounded"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          id={`input-critical-${item.id}`}
                          type="checkbox"
                          checked={item.is_critical}
                          onChange={(e) => handleUpdateRow(item.id, 'is_critical', e.target.checked)}
                          className="h-4 w-4 text-amber-500 border-white/10 rounded focus:ring-amber-500/50 bg-white/5"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-400">
                        {rowTotal.toLocaleString()} Wh
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          id={`delete-row-${item.id}`}
                          type="button"
                          onClick={() => handleDeleteRow(item.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Live Footer Summary */}
        <div className="bg-[#05060a]/80 backdrop-blur-md text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Demanda Diaria Total (AC):</span>
            <span className="text-lg font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              {totalWh.toLocaleString()} Wh/día
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({(totalWh / 1000).toFixed(2)} kWh/día)
            </span>
          </div>

          {totalWh > 10000 && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-200 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 max-w-xs">
              <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
              <span>Demanda elevada. El sistema requerirá tensiones de 48V y banco solar de gran tamaño.</span>
            </div>
          )}
        </div>
      </div>

      {/* Custom Add Row Form */}
      <form onSubmit={handleAddCustom} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Nombre del Equipo</label>
          <input
            id="custom-app-name-input"
            type="text"
            placeholder="Licuadora, Taladro, etc..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-1.5 border border-white/10 bg-white/5 text-white placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Potencia (W)</label>
          <input
            id="custom-app-power-input"
            type="number"
            placeholder="Watts"
            value={newPower}
            onChange={(e) => setNewPower(e.target.value)}
            className="w-full px-3 py-1.5 border border-white/10 bg-white/5 text-white placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Horas de Uso</label>
          <input
            id="custom-app-hours-input"
            type="number"
            step="0.1"
            placeholder="Horas al día"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
            className="w-full px-3 py-1.5 border border-white/10 bg-white/5 text-white placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Cant.</label>
            <input
              id="custom-app-qty-input"
              type="number"
              placeholder="1"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-full px-3 py-1.5 border border-white/10 bg-white/5 text-white placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            id="add-custom-app-btn"
            type="submit"
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-lg text-xs h-[30px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Plus className="h-4 w-4" />
            Añadir
          </button>
        </div>
      </form>
    </div>
  );
}
