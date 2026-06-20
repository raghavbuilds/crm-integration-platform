import React, { useState, useEffect } from "react";
import { User, DashboardStats } from "./types";
import { dashboardService, authService } from "./services/api";
import LoginScreen from "./components/LoginScreen";
import DashboardOverview from "./components/DashboardOverview";
import LeadsManager from "./components/LeadsManager";
import ContactsManager from "./components/ContactsManager";
import SalesforceSyncConsole from "./components/SalesforceSyncConsole";
import { 
  Users, FileText, LayoutDashboard, RefreshCw, LogOut, 
  Settings, Loader2, Database, KeyRound, Menu, X, Landmark, Eye 
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  // Dashboard Analytics States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Tab Routing
  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "contacts" | "sync">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check active user session on startup
  useEffect(() => {
    checkSession();
  }, []);

  // Fetch metrics automatically when user is logged in
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  const checkSession = async () => {
    setLoadingSession(true);
    try {
      const res = await authService.getMe();
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.error("Session verification failed:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await dashboardService.getStats();
      setStats(res);
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setStats(null);
      setActiveTab("dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  // Callback to reload stats when records are mutated
  const handleDataChanged = () => {
    loadStats();
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-semibold tracking-wide">Connecting secure full-stack session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md transform rotate-3 shrink-0">
            <KeyRound className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-extrabold text-[#F1F5F9] text-sm tracking-wide">CRM PLATFORM</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION FRAME (Desktop + Mobile drawer) */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 py-6 px-4 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 z-30
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:block"}
      `}>
        <div className="space-y-7">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 shrink-0">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-black text-slate-100 text-sm tracking-wider uppercase block">CRM PLATFORM</span>
              <span className="text-[10px] text-indigo-400 font-bold tracking-widest block uppercase">Salesforce Sync</span>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="space-y-1">
            <span className="block px-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Menu Core</span>
            
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === "dashboard" 
                  ? "bg-indigo-600/95 text-white shadow-md shadow-indigo-600/10" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              <span>Pipeline Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab("leads"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === "leads" 
                  ? "bg-indigo-600/95 text-white shadow-md shadow-indigo-600/10" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-4.5 w-4.5 shrink-0" />
              <span>Lead Registry</span>
            </button>

            <button
              onClick={() => { setActiveTab("contacts"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === "contacts" 
                  ? "bg-indigo-600/95 text-white shadow-md shadow-indigo-600/10" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Users className="h-4.5 w-4.5 shrink-0" />
              <span>Stakeholders</span>
            </button>
          </nav>

          <nav className="space-y-1">
            <span className="block px-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Settings Portal</span>
            
            <button
              onClick={() => { setActiveTab("sync"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === "sync" 
                  ? "bg-indigo-600/95 text-white shadow-md shadow-indigo-600/10" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              <span>Salesforce Config</span>
            </button>
          </nav>
        </div>

        {/* Selected login User Card Footer */}
        <div className="border-t border-slate-800/80 pt-4 mt-8 space-y-4">
          <div className="flex items-center gap-2.5 px-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/50">
            <div className="h-8 w-8 bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center font-black text-xs uppercase shrink-0">
              {currentUser.username[0]}
            </div>
            <div className="overflow-hidden">
              <div className="font-extrabold text-[11px] text-slate-200 uppercase tracking-wide truncate">{currentUser.username}</div>
              <div className="text-[10px] text-slate-500 truncate font-semibold">{currentUser.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-extrabold rounded-xl bg-slate-800 hover:bg-[#F43F5E] hover:text-white text-slate-400 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR CONTAINER DRAWER (Mobile) */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs md:hidden z-20"
        />
      )}

      {/* MAIN VIEWPORT BODY PANEL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-300">
        
        {/* Render loading mask if dashboard stats are initially missing */}
        {!stats ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-400">Loading synchronization metrics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "dashboard" && (
              <DashboardOverview
                stats={stats}
                currentUser={currentUser}
                onNavigateToLeads={() => setActiveTab("leads")}
                onNavigateToContacts={() => setActiveTab("contacts")}
                onNavigateToSync={() => setActiveTab("sync")}
              />
            )}

            {activeTab === "leads" && (
              <LeadsManager 
                currentUser={currentUser}
                onLeadChange={handleDataChanged}
              />
            )}

            {activeTab === "contacts" && (
              <ContactsManager
                currentUser={currentUser}
                onContactChange={handleDataChanged}
              />
            )}

            {activeTab === "sync" && (
              <SalesforceSyncConsole
                currentUser={currentUser}
                onSyncCompleted={handleDataChanged}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}
