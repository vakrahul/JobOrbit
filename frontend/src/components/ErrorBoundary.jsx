import React from 'react';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("JobOrbit ErrorBoundary intercepted error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '';
      window.location.reload();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('joborbit_resume_draft_v2');
      localStorage.removeItem('joborbit_applied_count');
    } catch (e) {
      console.warn("Could not clear cache:", e);
    }
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>JobOrbit Self-Healing Boundary</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Something interrupted this view
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                An isolated interface error occurred, but your session and data are protected. You can recover immediately below.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Diagnostics
                </span>
                <p className="text-xs font-mono text-red-600 break-words line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload View</span>
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Reset to Home</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
