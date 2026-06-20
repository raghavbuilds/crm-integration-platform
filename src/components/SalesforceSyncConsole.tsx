import React, { useState, useEffect } from "react";
import { SalesforceConfig, SyncLog, User } from "../types";
import { salesforceService } from "../services/api";
import { 
  Settings, RefreshCw, Radio, HardDriveDownload, Sparkles, 
  Database, ShieldCheck, AlertCircle, PlayCircle, Terminal, 
  HelpCircle, Clock, FileBadge 
} from "lucide-react";

interface SalesforceSyncConsoleProps {
  currentUser: User;
  onSyncCompleted: () => void;
}

export default function SalesforceSyncConsole({ currentUser, onSyncCompleted }: SalesforceSyncConsoleProps) {
  const [config, setConfig] = useState<SalesforceConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form input states
  const [conflictPolicy, setConflictPolicy] = useState<SalesforceConfig["conflict_resolution"]>("Keep Local");
  const [syncInterval, setSyncInterval] = useState(120);
  const [instanceUrl, setInstanceUrl] = useState("https://enterprise-dev-ed.my.salesforce.com");
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchSyncState();
  }, []);

  const fetchSyncState = async () => {
    setLoading(true);
    try {
      const res = await salesforceService.getStatus();
      setConfig(res.config);
      setSyncLogs(res.logs);
      
      // Seed form values
      setConflictPolicy(res.config.conflict_resolution);
      setSyncInterval(res.config.auto_sync_interval_sec);
      setInstanceUrl(res.config.instance_url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setFeedback(null);
    try {
      const res = await salesforceService.updateConfig({
        conflict_resolution: conflictPolicy,
        auto_sync_interval_sec: Number(syncInterval),
        instance_url: instanceUrl,
      });
      if (res.success) {
        setConfig(res.config);
        setFeedback({ type: "success", text: "Salesforce schema mapping settings updated successfully." });
        onSyncCompleted();
      }
    } catch (error: any) {
      setFeedback({ type: "error", text: error.message || "Failed to save configuration." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTriggerSyncNow = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await salesforceService.triggerSync();
      if (res.success) {
        setFeedback({ 
          type: "success", 
          text: `Sync executed. ${res.message}. Last check resolved at ${new Date(res.lastSyncTime).toLocaleTimeString()}` 
        });
        
        // Reload sync logs
        const status = await salesforceService.getStatus();
        setConfig(status.config);
        setSyncLogs(status.logs);
        onSyncCompleted();
      }
    } catch (error: any) {
      setFeedback({ type: "error", text: error.message || "Salesforce token connection error. Re-authentication recommended." });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-sm">Loading Salesforce OAuth and Sync cache status...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      
      {/* LEFT: Sync Configurations and Triggers (7 cols) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-7 space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <Settings className="h-5 w-5 text-indigo-500" /> Salesforce Integration Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure middleware schema criteria, bi-directional resolution policies, and trigger client updates.
          </p>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            feedback.type === "success" 
              ? "bg-emerald-55/40 border-emerald-100 text-emerald-800" 
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}>
            {feedback.type === "success" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{feedback.type === "success" ? "System Confirmed" : "Authentication Alert"}</p>
              <p className="mt-0.5 font-medium">{feedback.text}</p>
            </div>
          </div>
        )}

        {/* Quick Sync trigger panel */}
        <div className="bg-[#FAFBFD] rounded-2xl border border-slate-150 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">RUN SYNCHRONIZATION CYCLE</span>
            <h3 className="text-sm font-bold text-slate-900">Execute Bi-directional Manual Sync</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Triggers instant transfer of offline leads and stakeholders, resolves schemas, and pulls remote updates.
            </p>
          </div>

          <button
            onClick={handleTriggerSyncNow}
            disabled={syncing}
            className={`inline-flex items-center justify-center gap-2 text-xs font-bold py-3 px-5 rounded-xl shadow-xs transition-colors shrink-0 ${
              syncing 
                ? "bg-indigo-300 text-indigo-50 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronizing..." : "Sync Salesforce CRM"}
          </button>
        </div>

        {/* Policy Configuration Form */}
        <form onSubmit={handleUpdateConfig} className="space-y-4 pt-1">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest block border-b border-slate-100 pb-2">
            Bi-directional Conflict Policy Config
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instance URL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                Salesforce Server Instance URL <HelpCircle className="h-3 w-3 text-slate-400" title="Full workspace instance" />
              </label>
              <input
                type="text"
                required
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
              />
            </div>

            {/* Sync Interval */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                Background Sync Interval <Clock className="h-3 w-3 text-slate-400" />
              </label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none bg-white"
              >
                <option value={60}>Every 60 Seconds (1 min)</option>
                <option value={120}>Every 120 Seconds (2 min)</option>
                <option value={300}>Every 300 Seconds (5 min)</option>
                <option value={600}>Every 600 Seconds (10 min)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
              Conflict Resolution Priority
            </span>
            <p className="text-[11px] text-slate-500 leading-normal mb-3">
              When a local lead record differs from Salesforce remote field parameters, resolve discrepancies with this strategy:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Keep Local */}
              <label className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                conflictPolicy === "Keep Local" 
                  ? "border-indigo-400 bg-indigo-50/20" 
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="conflict_resolution"
                  className="mt-0.5"
                  checked={conflictPolicy === "Keep Local"}
                  onChange={() => setConflictPolicy("Keep Local")}
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Keep Local (Override CRM)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Prioritizes updates saved inside this platform. Sync automatically overwrites the remote Salesforce cloud with your local details.
                  </p>
                </div>
              </label>

              {/* Option 2: Keep Salesforce */}
              <label className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                conflictPolicy === "Keep Salesforce" 
                  ? "border-indigo-400 bg-indigo-50/20" 
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="conflict_resolution"
                  className="mt-0.5"
                  checked={conflictPolicy === "Keep Salesforce"}
                  onChange={() => setConflictPolicy("Keep Salesforce")}
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Keep Salesforce (Source of Truth)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Prioritizes Salesforce cloud-hosted data. Overwrites local database edits with original CRM parameters when conflict arises.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingConfig}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors"
            >
              {savingConfig ? "Saving configuration..." : "Save Sync Settings"}
            </button>
          </div>
        </form>

      </div>

      {/* RIGHT: OAuth Credentials Status and History Audit (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Salesforce Connection Overview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Database className="h-4 w-4 text-emerald-500" /> Connection Credentials
          </h3>

          <div className="space-y-3.5 text-xs text-slate-600 leading-normal">
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border">
              <span className="font-semibold text-slate-500">OAuth Connection State</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Client Identifier (ClientId)</span>
              <span className="font-mono text-[10px] text-slate-700 block bg-slate-50 px-2 py-1.5 rounded truncate select-all">
                {config ? config.clientId : "Not loaded"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Last Sync Completed</span>
              <span className="font-medium text-slate-800 block">
                {config?.last_sync_timestamp 
                  ? new Date(config.last_sync_timestamp).toLocaleString() 
                  : "No synch executed yet."}
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 flex items-start gap-2 text-[11px] text-indigo-900 leading-relaxed font-semibold">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Verified secure tunnel: Local database queries translate via Salesforce REST API using bearer client credentials automatically.
              </span>
            </div>
          </div>
        </div>

        {/* Sync logs timeline */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-slate-500" /> Sync Audit Log
            </h3>
            <span className="text-[9px] font-bold text-slate-400">Showing last 20 events</span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {syncLogs.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">No synchronization records captured.</p>
            ) : (
              syncLogs.map((log) => {
                const dateText = new Date(log.sync_timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'});
                
                return (
                  <div key={log.id} className="text-[11px] border-b border-slate-50 pb-2 flex items-start gap-2">
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                      log.sync_status === "SUCCESS" ? "bg-emerald-500" :
                      log.sync_status === "CONFLICT_RESOLVED" ? "bg-indigo-500" : "bg-rose-500"
                    }`} />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between font-bold text-slate-700 gap-1.5">
                        <span className="truncate">{log.entity_type} Sync ({log.sync_status})</span>
                        <span className="text-[9px] text-slate-400 shrink-0 font-normal">{dateText}</span>
                      </div>
                      
                      {log.error_message ? (
                        <p className="text-slate-500 leading-normal">{log.error_message}</p>
                      ) : (
                        <p className="text-slate-400">Successfully synced ID: <span className="font-mono text-[9px] bg-slate-50 px-1 py-0.5 font-semibold text-slate-600">{log.entity_id}</span></p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

// Minimal loader component to resolve inline ts compilation
function Loader2({ className, ...props }: any) {
  return <Clock className={`${className} animate-pulse`} {...props} />;
}
