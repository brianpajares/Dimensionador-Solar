import React, { useState } from 'react';
import { CheckCircle2, Handshake, Loader2, Send } from 'lucide-react';
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
    <div id="lead-capture" className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Handshake className="h-5 w-5 text-emerald-400" />
            Solicita tu propuesta solar
          </h3>
          <p className="text-xs text-emerald-100/80 mt-1">
            Recibe una cotizacion preliminar, compra el reporte tecnico-comercial o agenda un piloto con un instalador.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Inversion estimada</p>
          <p className="text-2xl text-white font-black font-mono">${assessment.finance.capexUsd.toLocaleString()}</p>
        </div>
      </div>

      {done ? (
        <div className="bg-emerald-500/15 border border-emerald-500/25 rounded-xl p-4 text-sm text-emerald-100">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Solicitud recibida. Te contactaremos para convertir este diagnostico en una propuesta comercial.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa o ciudad" className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400">
            <option value={5}>Utilidad 5/5</option>
            <option value={4}>Utilidad 4/5</option>
            <option value={3}>Utilidad 3/5</option>
            <option value={2}>Utilidad 2/5</option>
            <option value={1}>Utilidad 1/5</option>
          </select>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Que necesitas: reporte, cotizacion, financiamiento o instalador" className="md:col-span-2 bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400" />
          <label className="flex items-center gap-2 text-xs text-emerald-100/80">
            <input type="checkbox" checked={wouldUseForQuote} onChange={(e) => setWouldUseForQuote(e.target.checked)} className="accent-emerald-500" />
            Quiero que me contacten
          </label>
          <div className="flex gap-2">
            <button disabled={loading} onClick={() => submit('quote_request')} className="flex-1 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Pedir cotizacion
            </button>
            <button disabled={loading} onClick={() => submit('pilot_request')} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs rounded-xl">
              Agendar piloto
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
