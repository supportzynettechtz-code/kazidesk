/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName?: string;
  onNavigateHome?: () => void;
  lang?: 'sw' | 'en';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`TabErrorBoundary caught an error in [${this.props.tabName || 'UnknownTab'}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      const isEn = this.props.lang === 'en' || (typeof window !== 'undefined' && localStorage.getItem('kazidesk_app_language_v1') === 'en');
      const tabTitle = this.props.tabName || (isEn ? 'This Section' : 'Sehemu Hii');

      return (
        <div className="min-h-[420px] flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full inline-block">
                KaziDesk Safe Mode · {tabTitle}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isEn ? 'Temporary Section Issue Detected' : 'Hitilafu ya Muda Imegundulika'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {isEn 
                  ? 'KaziDesk prevented a blank screen. You can retry rendering this section or return to Dashboard. All company data remains safe in Firestore.'
                  : 'KaziDesk imezuia ukurasa kuwa mtupu (blank screen). Unaweza kujaribu kupakia upya sehemu hii au kurudi kwenye Dashibodi. Data zako zote ziko salama kwenye Firestore.'}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isEn ? 'Technical Details (Error Message):' : 'Maelezo ya Kiufundi (Error Message):'}
                </span>
                <code className="text-xs font-mono text-rose-600 dark:text-rose-400 break-words block">
                  {this.state.error.message || this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isEn ? 'Retry' : 'Jaribu Tena (Retry)'}</span>
              </button>

              {this.props.onNavigateHome && (
                <button
                  type="button"
                  onClick={this.props.onNavigateHome}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Home className="w-4 h-4" />
                  <span>{isEn ? 'Back to Dashboard' : 'Rudi Dashibodi'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
