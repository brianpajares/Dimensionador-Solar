/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { FileText, Printer, MessageCircle, AlertCircle, Sparkles, Send, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ProposalViewerProps {
  proposalText: string;
  projectId: string;
  address: string;
  location: { lat: number; lon: number };
  capexUsd: number;
}

export default function ProposalViewer({ proposalText, projectId, address, location, capexUsd }: ProposalViewerProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contacted, setContacted] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple window print routing
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Propuesta Solar - SolConfigura - ${projectId}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
              .logo { font-size: 24px; font-weight: bold; color: #1e293b; }
              .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
              .meta-table td { padding: 8px; border: 1px solid #e2e8f0; }
              .meta-table td.label { font-weight: bold; background-color: #f8fafc; width: 150px; }
              .content-section { margin-bottom: 25px; page-break-inside: avoid; }
              h3 { border-left: 4px solid #f59e0b; padding-left: 10px; color: #1e293b; margin-top: 25px; margin-bottom: 12px; font-size: 16px; text-transform: uppercase; }
              .signature { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
              .sig-block { text-align: center; width: 220px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; }
              .disclaimer { background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; font-size: 11px; color: #991b1b; margin-top: 30px; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      newWindow.document.close();
      newWindow.focus();
      setTimeout(() => {
        newWindow.print();
        newWindow.close();
      }, 500);
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setContacted(true);
    
    // Simulate WhatsApp redirect with configured text
    const text = `Hola SolConfigura. He completado el dimensionamiento solar para mi propiedad en ${address} (ID Proyecto: ${projectId}, Presupuesto: $${capexUsd} USD). Mi número registrado es ${phoneNumber}. Quisiera agendar la validación técnica con el ingeniero.`;
    const encodedText = encodeURIComponent(text);
    setTimeout(() => {
      window.open(`https://wa.me/51999999999?text=${encodedText}`, '_blank');
    }, 1500);
  };

  // Convert raw proposalText headings into styled HTML sections safely
  const renderProposalBody = () => {
    // Splits text by standard sections e.g. "### 1. RESUMEN EJECUTIVO"
    const sections = proposalText.split(/(?=###?\s+\d+\.\s+)/);
    
    return sections.map((section, idx) => {
      const headingMatch = section.match(/###?\s+(\d+\.\s+[A-ZÁÉÍÓÚÑ\s]+)/i);
      const headingText = headingMatch ? headingMatch[1] : '';
      const bodyText = section.replace(/###?\s+\d+\.\s+[A-ZÁÉÍÓÚÑ\s]+/i, '').trim();

      if (!headingText && !bodyText) return null;

      return (
        <div key={idx} className="mb-6 leading-relaxed text-gray-700 text-sm">
          {headingText && (
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-l-4 border-amber-500 pl-3.5 mb-2.5 mt-4">
              {headingText}
            </h4>
          )}
          <p className="whitespace-pre-line">{bodyText}</p>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-xl">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-400">¡Propuesta Técnica Redactada con IA!</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Nuestro modelo experto Gemini ha redactado esta propuesta personalizada basada en sus cálculos específicos de ingeniería.
            </p>
          </div>
        </div>

        <button
          id="print-proposal-button"
          onClick={handlePrint}
          className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer shadow-md"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar en PDF
        </button>
      </div>

      {/* Document Sheet Layout */}
      <div className="border border-white/10 shadow-2xl bg-white rounded-3xl overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"></div>

        {/* Paper Container (Target for Printing) */}
        <div ref={printRef} className="p-6 md:p-10 space-y-6 bg-white text-slate-850">
          
          {/* Document Header */}
          <div className="header flex flex-col sm:flex-row justify-between items-start border-b-2 border-amber-500 pb-5 gap-4">
            <div>
              <span className="logo text-xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                Sol<span className="text-amber-500 font-extrabold">Configura</span>
              </span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                Ingeniería Solar y Soluciones Renovables Perú
              </p>
            </div>
            <div className="text-right sm:text-right text-xs font-mono text-gray-400 space-y-0.5">
              <div>Código Doc: <span className="font-semibold text-slate-700">{projectId}</span></div>
              <div>Fecha: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          {/* Project Spec Metadata Grid */}
          <table className="meta-table w-full text-xs border border-gray-200">
            <tbody>
              <tr>
                <td className="label font-semibold bg-gray-50 text-gray-700 p-2 border-r border-b border-gray-200">Proyecto</td>
                <td className="p-2 border-b border-gray-200 text-gray-800">Evaluación de Energía Solar Fotovoltaica</td>
                <td className="label font-semibold bg-gray-50 text-gray-700 p-2 border-r border-b border-l border-gray-200">Ubicación</td>
                <td className="p-2 border-b border-gray-200 text-gray-800">{address}</td>
              </tr>
              <tr>
                <td className="label font-semibold bg-gray-50 text-gray-700 p-2 border-r border-gray-200">Coordenadas</td>
                <td className="p-2 border-gray-200 font-mono text-gray-800">Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}</td>
                <td className="label font-semibold bg-gray-50 text-gray-700 p-2 border-r border-l border-gray-200">Inversión Equipos</td>
                <td className="p-2 border-gray-200 font-mono font-semibold text-amber-700">${capexUsd.toLocaleString()} USD</td>
              </tr>
            </tbody>
          </table>

          {/* Proposal AI text contents */}
          <div className="prose max-w-none text-slate-800">
            {renderProposalBody()}
          </div>

          {/* Formal Stamp & Signature Lines */}
          <div className="signature flex flex-col sm:flex-row justify-around items-center pt-10 border-t border-gray-150 gap-8">
            <div className="sig-block text-center flex flex-col items-center">
              <div className="h-16 w-32 flex items-center justify-center border border-amber-200 bg-amber-50/50 rounded-lg text-amber-700 text-[10px] font-bold uppercase tracking-wider relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px]"></div>
                SOLCONFIGURA<br />DISEÑO VALIDADO
              </div>
              <span className="text-[10px] text-gray-400 mt-2">Sello Técnico de Autorización</span>
            </div>

            <div className="sig-block text-center flex flex-col items-center">
              <div className="h-12 w-48 border-b border-slate-300 font-serif italic text-gray-600 flex items-end justify-center pb-1 text-sm">
                Ing. Brian Pajares P.
              </div>
              <span className="font-bold text-slate-800 text-xs mt-2">Ing. Brian Pajares</span>
              <span className="text-[10px] text-gray-500">Ingeniero Mecánico PMP</span>
              <span className="text-[9px] text-gray-400">Validador de Proyectos de Ingeniería Solar</span>
            </div>
          </div>

          {/* Disclaimers (Required Legal) */}
          <div className="disclaimer bg-red-50/50 border border-red-100 p-4 rounded-xl flex items-start gap-3 mt-8">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-red-800 leading-relaxed">
              <strong>AVISO DE RESPONSABILIDAD LEGAL:</strong> Esta propuesta contiene estimaciones técnicas preliminares basadas en bases de datos climáticas multianuales de irradiancia solar. Bajo la ley peruana de generación distribuida e instalaciones eléctricas (Código Nacional de Electricidad), el diseño definitivo, las memorias de cálculo de caídas de tensión y las firmas de conformidad de obra deben ser <strong>certificadas físicamente por un Ingeniero Mecánico-Electricista o Ingeniero Electricista Colegiado Habilitado</strong> antes de la ejecución de obra.
            </div>
          </div>
        </div>

        {/* WhatsApp Lead Capture Footer */}
        <div className="bg-[#05060a]/95 p-6 md:p-8 border-t border-white/10 text-white backdrop-blur-md">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h4 className="text-base font-bold text-amber-400">¿Deseas validar esta propuesta y agendar una visita técnica?</h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
              Nuestros asesores de Zone Solar e ingenieros colegiados validarán tu consumo de electrodomésticos en campo y estructurarán el kit físico final. Introduce tu teléfono para iniciar.
            </p>

            {contacted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/35 px-6 py-2.5 rounded-xl text-xs text-emerald-400 font-bold"
              >
                <Check className="h-4 w-4" />
                ¡Contacto enviado! Abriendo WhatsApp de Ingeniería Solar...
              </motion.div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  id="lead-phone-input"
                  type="tel"
                  placeholder="Introduce tu celular de contacto (Ej: 999123456)..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
                <button
                  id="lead-submit-button"
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <MessageCircle className="h-4 w-4 fill-slate-950" />
                  Contactar Asesor
                </button>
              </form>
            )}

            <p className="text-[10px] text-slate-500">
              Al hacer clic autorizas el tratamiento de tus datos para fines comerciales de cotización según Ley N° 29733 (Perú).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
