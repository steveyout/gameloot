import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle, Eye, Ban, ShieldCheck } from 'lucide-react';
import { getFraudLogs, updateFraudStatus, updateUserStatus } from '../services/api';
import { useAlert } from '../context/AlertContext';

export default function FraudView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { success, error, confirm } = useAlert();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getFraudLogs();
      if (res.success) setLogs(res.fraudLogs);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await updateFraudStatus(id, status);
      success('Fraud flag marked as ' + status);
      fetchLogs();
    } catch (err) {
      error('Failed: ' + err.message);
    }
  };

  const handleBanUser = async (userId, username) => {
    const ok = await confirm({
      title: 'Execute Account Ban?',
      message: `Are you sure you want to immediately ban player "${username || userId}"? This will terminate all active sessions and block withdrawal redemptions.`,
      confirmText: 'Ban Account',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await updateUserStatus(userId, 'banned');
      success(`Player ${username || userId} has been permanently banned.`);
      fetchLogs();
    } catch (err) {
      error('Failed: ' + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>Anti-Cheat & Security Inspector</span>
        </h2>
        <p className="text-xs text-slate-400 m-0 mt-0.5">Monitors proof-of-play heartbeat anomalies, automated clickers, and impossible playtimes</p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-md">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Inspecting security ledger...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
            <span>Zero fraud flags detected. Network integrity clean.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5">Flagged Reason</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Player / Game</th>
                  <th className="p-3.5">Incident Details</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Sanctions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-white">
                      {log.reason}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.severity === 'critical' || log.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {log.severity}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-cyan-400 block">{log.username || 'Anonymous'}</span>
                      <span className="text-[11px] text-slate-400">{log.game_title || 'General API'}</span>
                    </td>

                    <td className="p-3.5 text-slate-300 font-mono text-[11px] max-w-sm">
                      {log.details || 'No details provided'}
                    </td>

                    <td className="p-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                        {log.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {log.user_id && (
                          <button
                            type="button"
                            onClick={() => handleBanUser(log.user_id, log.username)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Ban User"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Ban</span>
                          </button>
                        )}

                        {log.status === 'unreviewed' && (
                          <button
                            type="button"
                            onClick={() => handleStatus(log.id, 'dismissed')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
