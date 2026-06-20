import React from "react";
import { DashboardStats, User } from "../types";
import { Users, FileText, CheckCircle, Percent, RefreshCw, AlertCircle, ArrowUpRight } from "lucide-react";

interface DashboardOverviewProps {
  stats: DashboardStats;
  currentUser: User;
  onNavigateToLeads: () => void;
  onNavigateToContacts: () => void;
  onNavigateToSync: () => void;
}

export default function DashboardOverview({
  stats,
  currentUser,
  onNavigateToLeads,
  onNavigateToContacts,
  onNavigateToSync,
}: DashboardOverviewProps) {
  // Mock data calculations
  const totalSources = stats.leadSources.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Title Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales & CRM Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-indigo-600">{currentUser.username}</span> ({currentUser.role}). Here is the current synchronization status.
          </p>
        </div>

        {/* Sync Status Badge Panel of Salesforce */}
        <div 
          onClick={onNavigateToSync}
          className="cursor-pointer bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3 transition-colors shrink-0"
        >
          <div className={`p-2 rounded-lg ${
            stats.salesforce_config.connection_status === "Connected" 
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-amber-50 text-amber-600"
          }`}>
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Salesforce CRM
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${
                stats.salesforce_config.connection_status === "Connected" ? "bg-emerald-500" : "bg-amber-500"
              }`} />
              {stats.salesforce_config.connection_status}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div 
          onClick={onNavigateToLeads}
          className="bg-white hover:border-indigo-200 cursor-pointer p-5 rounded-2xl border border-slate-100 shadow-xs transition-all duration-250 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Total Leads
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalLeads}
            </div>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1 group-hover:underline">
              Manage leads <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-500 transition-colors">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Converted Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Closed Won
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.convertedLeads}
            </div>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Synced to Salesforce
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl text-slate-500">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Active Contacts */}
        <div 
          onClick={onNavigateToContacts}
          className="bg-white hover:border-indigo-200 cursor-pointer p-5 rounded-2xl border border-slate-100 shadow-xs transition-all duration-250 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Active Contacts
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.activeContacts}
            </div>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1 group-hover:underline">
              Manage contacts <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-500 transition-colors">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Rate of Conversions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Lead Conversion Rate
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.conversionRate}%
            </div>
            <div className="w-24 mt-2 bg-slate-150 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all" 
                style={{ width: `${stats.conversionRate}%` }} 
              />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl text-slate-500">
            <Percent className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Two Column Visual Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left 3 cols: Monthly Sales Activity Trends */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Monthly Growth Trends
            </h3>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
              Bi-directional metrics
            </span>
          </div>

          {/* Simple custom React visual charts representing months */}
          <div className="h-56 flex items-end justify-between px-2 pt-6 pb-2 border-b border-l border-slate-100 relative">
            
            {/* Grid markings */}
            <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100/60" />
            <div className="absolute left-0 right-0 top-2/4 border-t border-slate-100/60" />
            <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100/60" />

            {stats.monthlyTrends.map((trend, i) => {
              const maxLeads = 60; // scale boundary
              const leadPct = Math.min((trend.leads / maxLeads) * 100, 100);
              const conversionPct = Math.min((trend.conversions / maxLeads) * 100, 100);

              return (
                <div key={i} className="flex flex-col items-center flex-1 h-full select-none z-10">
                  <div className="flex-1 w-full flex items-end justify-center gap-1.5 px-1 relative">
                    
                    {/* Tooltip on hover popup */}
                    <div className="absolute -top-12 opacity-0 hover:opacity-100 hover:z-20 transition-opacity bg-slate-900 text-white rounded px-2 py-1 text-[10px] w-24 text-center pointer-events-none">
                      Leads: {trend.leads} <br/> Conversions: {trend.conversions}
                    </div>

                    {/* Leads bar */}
                    <div 
                      className="bg-indigo-600 w-3 md:w-5 rounded-t-sm transition-all duration-500 ease-out" 
                      style={{ height: `${leadPct}%` }}
                    />
                    {/* Conversion bar */}
                    <div 
                      className="bg-emerald-500 w-3 md:w-5 rounded-t-sm transition-all duration-500 ease-out" 
                      style={{ height: `${conversionPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2">{trend.month}</span>
                </div>
              );
            })}
          </div>

          {/* Legends */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-indigo-600 rounded-xs" />
              <span className="font-medium text-slate-600">Total Pipeline Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-emerald-500 rounded-xs" />
              <span className="font-medium text-slate-600">Converted Customers (Won)</span>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Lead Source Acquisition Channels */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lead Source Contribution
          </h3>

          <div className="space-y-4">
            {stats.leadSources.map((source, i) => {
              const percentage = totalSources > 0 ? Math.round((source.value / totalSources) * 100) : 0;
              const barColors = ["bg-indigo-600", "bg-sky-500", "bg-teal-500", "bg-purple-500", "bg-amber-500"];
              const color = barColors[i % barColors.length];

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{source.name}</span>
                    <span className="text-slate-500">
                      {source.value} leads ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`${color} h-full rounded-full transition-all`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5 mt-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>Source Pipeline Insight:</strong> Webinar-generated leads are showing the highest interest levels. Salesforce conversion processes are highly optimized for direct digital referrals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
