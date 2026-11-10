/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, LogOut, CheckCircle2 } from 'lucide-react';

interface SessionTimeoutWatcherProps {
  onLogout: () => void;
  lang?: 'sw' | 'en';
  timeoutMinutes?: number; // default 20 mins
  warningMinutes?: number; // default 2 mins before timeout
}

export const SessionTimeoutWatcher: React.FC<SessionTimeoutWatcherProps> = ({
  onLogout,
  lang = 'sw',
  timeoutMinutes = 20,
  warningMinutes = 2
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningMinutes * 60);

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  const totalTimeoutMs = timeoutMinutes * 60 * 1000;
  const warningThresholdMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(warningMinutes * 60);
    }
  };

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      // Only reset if modal isn't active
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Heartbeat check every 2 seconds
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= totalTimeoutMs) {
        // Force logout
        clearInterval(timerRef.current);
        onLogout();
      } else if (elapsed >= warningThresholdMs) {
        setShowWarning(true);
        const rem = Math.max(0, Math.ceil((totalTimeoutMs - elapsed) / 1000));
        setSecondsRemaining(rem);
      } else {
        setShowWarning(false);
      }
    }, 2000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showWarning, totalTimeoutMs, warningThresholdMs, onLogout]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-5 animate-in fade-in zoom-in-95">
        
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-black tracking-tight">
            {lang === 'sw' ? 'Muda wa Kipindi Unakaribia Kuisha' : 'Session Timeout Warning'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'sw'
              ? 'Haujaonyesha shughuli yoyote kwa muda mrefu. Ili kulinda usalama wa data zako za kiofisi, utatolewa nje ya mfumo kiotomatiki baada ya:'
              : 'You have been inactive for a while. For security reasons, your session will automatically log out in:'}
          </p>

          <div className="py-2">
            <span className="font-mono text-3xl font-black text-amber-400">
              {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
            </span>
            <span className="block text-[11px] text-slate-500 uppercase tracking-widest mt-1">
              {lang === 'sw' ? 'Dakika na Sekunde Zilizobaki' : 'Minutes and Seconds Left'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onLogout}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{lang === 'sw' ? 'Ondoka Sasa' : 'Logout Now'}</span>
          </button>
          <button
            onClick={resetTimer}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'sw' ? 'Endelea Kazi' : 'Stay Signed In'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
