import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type ErrorBoundaryState = {
  hasError: boolean;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  private readonly childrenNode: React.ReactNode;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.childrenNode = props.children;
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.childrenNode;

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <section className="max-w-xl w-full rounded-2xl border border-amber-400/30 bg-slate-900 p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-black">SolConfigura necesita recargar</h1>
              <p className="text-sm text-slate-300 mt-1">El calculador tuvo un error de interfaz, pero tus datos maestros y el motor siguen disponibles.</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Recargar calculador
          </button>
        </section>
      </main>
    );
  }
}
