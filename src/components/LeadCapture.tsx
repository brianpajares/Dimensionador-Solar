import React, { useState } from 'react';
import { Handshake, Loader2, Send } from 'lucide-react';
import { ProjectAssessmentResponse } from '../types';

interface LeadCaptureProps {
  assessment: ProjectAssessmentResponse;
}

export default function LeadCapture({ assessment }: LeadCaptureProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [wouldUseForQuote, setWouldUseForQuote] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (action: 'quote_request' | 'pilot_request') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: assessment.projectId,
          action,
          name,
          email,
          company,
          message,
          rating,
          wouldUseForQuote,
          consent: true
        })
      });

      if (!response.ok) throw new Error('No se pudo registrar la solicitud.');
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Handshake className="h-5 w-5 text-emerald-400" />
            Convertir este assessment en oportunidad real
          </h3>
          <p className="text-xs text-emerald-100/80 mt-1">
            Registra interes comercial, piloto o feedback. Cada envio queda asociado al proyecto y sirve como metrica de validacion.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">CAPEX estimado</p>
          <p className="text-2xl text-white font-black font-mono">${assessment.finance.capexUsd.toLocaleString()}</p>
        </div>
      </div>

      {done ? (
        <div className="bg-emerald-500/15 border border-emerald-500/25 rounded-xl p-4 text-sm text-emerald-100">
          Solicitud registrada. Este proyecto ya cuenta como senal de demanda para el funnel de validacion.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa / instalador" className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400">
            <option value={5}>Utilidad 5/5</option>
            <option value={4}>Utilidad 4/5</option>
            <option value={3}>Utilidad 3/5</option>
            <option value={2}>Utilidad 2/5</option>
            <option value={1}>Utilidad 1/5</option>
          </select>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje breve o necesidad" className="md:col-span-2 bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <label className="flex items-center gap-2 text-xs text-emerald-100/80">
            <input type="checkbox" checked={wouldUseForQuote} onChange={(e) => setWouldUseForQuote(e.target.checked)} className="accent-emerald-500" />
            Lo usaria para cotizar
          </label>
          <div className="flex gap-2">
            <button disabled={loading} onClick={() => submit('quote_request')} className="flex-1 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Cotizar
            </button>
            <button disabled={loading} onClick={() => submit('pilot_request')} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs rounded-xl">
              Piloto
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
