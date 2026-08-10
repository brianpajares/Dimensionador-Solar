import React from 'react';
import { AlertTriangle, BadgeCheck, Database, GitBranch, ShieldCheck } from 'lucide-react';
import { ProjectAssessmentResponse } from '../types';

interface ValidationPanelProps {
  assessment: ProjectAssessmentResponse;
}

export default function ValidationPanel({ assessment }: ValidationPanelProps) {
  const confidence = assessment.meta.confidenceScore;
  const tone =
    confidence >= 80
      ? {
          card: 'bg-emerald-500/10 border-emerald-500/20',
          text: 'text-emerald-300',
          icon: 'text-emerald-400'
        }
      : confidence >= 65
        ? {
            card: 'bg-amber-500/10 border-amber-500/20',
            text: 'text-amber-300',
            icon: 'text-amber-400'
          }
        : {
            card: 'bg-rose-500/10 border-rose-500/20',
            text: 'text-rose-300',
            icon: 'text-rose-400'
          };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className={`border p-5 rounded-2xl ${tone.card}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pre-feasibility Confidence</p>
            <h3 className={`text-3xl font-black mt-1 ${tone.text}`}>{confidence}%</h3>
          </div>
          <ShieldCheck className={`h-8 w-8 ${tone.icon}`} />
        </div>
        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          Score calculado por fuente solar, trazabilidad de catalogo y advertencias tecnicas. No sustituye ingenieria de detalle.
        </p>
      </div>

      <div className="lg:col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <BadgeCheck className="h-4.5 w-4.5 text-amber-400" />
          Auditoria del proyecto
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3">
            <Database className="h-4 w-4 text-sky-400 mb-2" />
            <p className="text-slate-400 text-[10px] uppercase font-bold">Fuente solar</p>
            <p className="text-white font-semibold uppercase">{assessment.site.source}</p>
            <p className="text-slate-500 mt-1">{assessment.site.fetchedAt ? new Date(assessment.site.fetchedAt).toLocaleDateString() : 'cache historico'}</p>
          </div>
          <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3">
            <GitBranch className="h-4 w-4 text-emerald-400 mb-2" />
            <p className="text-slate-400 text-[10px] uppercase font-bold">Versiones</p>
            <p className="text-white font-semibold">{assessment.meta.engineVersion}</p>
            <p className="text-slate-500 mt-1">{assessment.meta.catalogVersion}</p>
          </div>
          <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mb-2" />
            <p className="text-slate-400 text-[10px] uppercase font-bold">Accion recomendada</p>
            <p className="text-white font-semibold">
              {assessment.meta.nextAction === 'quote_request' ? 'Solicitar cotizacion' : 'Revision de ingenieria'}
            </p>
            <p className="text-slate-500 mt-1">Proyecto {assessment.projectId}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {assessment.meta.warnings.map((warning, index) => (
            <div key={index} className="flex gap-2 text-[11px] text-amber-100 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
