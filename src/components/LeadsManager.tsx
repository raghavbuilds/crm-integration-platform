import React, { useState, useEffect } from "react";
import { Lead, Activity, User } from "../types";
import { leadService } from "../services/api";
import { 
  Plus, Search, Filter, Loader2, Sparkles, CheckCircle2, 
  Trash2, Mail, Phone, Building, Send, PlusCircle, Edit3, 
  ChevronRight, ArrowUpDown, Calendar, RefreshCw 
} from "lucide-react";

interface LeadsManagerProps {
  currentUser: User;
  onLeadChange: () => void;
}

export default function LeadsManager({ currentUser, onLeadChange }: LeadsManagerProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Lead Details & Modals State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Create / Edit Form Input State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    lead_source: "Website",
    status: "New" as Lead["status"],
  });

  // Custom activity log form state
  const [actType, setActType] = useState("Call Log");
  const [actDescription, setActDescription] = useState("");
  const [loggingActivity, setLoggingActivity] = useState(false);

  // Gemini AI rating loading state
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter, sortField, sortOrder]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await leadService.getAll({
        search,
        status: statusFilter,
        source: sourceFilter,
        sortField,
        sortOrder,
      });
      setLeads(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = async (lead: Lead) => {
    setLoadingDetails(true);
    try {
      const res = await leadService.getById(lead.id);
      setSelectedLead(res.lead);
      setRelatedActivities(res.activities);
      
      // Seed edit form in parallel if needed
      setFormData({
        first_name: res.lead.first_name,
        last_name: res.lead.last_name,
        email: res.lead.email,
        phone: res.lead.phone,
        company: res.lead.company,
        lead_source: res.lead.lead_source,
        status: res.lead.status,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leadService.create(formData);
      setIsCreateOpen(false);
      resetForm();
      fetchLeads();
      onLeadChange();
    } catch (error: any) {
      alert(error.message || "Failed to create lead");
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      const updated = await leadService.update(selectedLead.id, formData);
      setSelectedLead(updated);
      setIsEditOpen(false);
      fetchLeads();
      onLeadChange();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteLead = async (id: string) => {
    // Role Gate validation
    if (currentUser.role === "Sales Executive") {
      alert("Role Permission Block: Only Admins or Sales Managers can delete records.");
      return;
    }
    if (!confirm("Are you sure you want to permanently remove this lead from the local and Salesforce-consistent registry?")) return;
    try {
      await leadService.delete(id);
      setSelectedLead(null);
      fetchLeads();
      onLeadChange();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !actDescription.trim()) return;
    setLoggingActivity(true);
    try {
      await leadService.addActivity(selectedLead.id, actType, actDescription);
      setActDescription("");
      // Reload details to capture the new log
      const res = await leadService.getById(selectedLead.id);
      setRelatedActivities(res.activities);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoggingActivity(false);
    }
  };

  const handleTriggerGeminiAI = async () => {
    if (!selectedLead) return;
    setAiLoading(true);
    try {
      const result = await leadService.fetchAIScore(selectedLead.id);
      // Update local state details
      setSelectedLead({
        ...selectedLead,
        ai_score: result.score,
        ai_notes: result.notes,
      });
      // Refresh the lead list in background
      const data = await leadService.getAll({
        search,
        status: statusFilter,
        source: sourceFilter,
        sortField,
        sortOrder,
      });
      setLeads(data);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      lead_source: "Website",
      status: "New",
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start font-sans">
      
      {/* LEFT PANEL: Leads Registry List & Filtering (8 cols) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 xl:col-span-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              Lead Management Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Filter pipeline resources and click entries to view details.
            </p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>

        {/* Filters and search box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 w-full border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs shrink-0 font-medium">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 w-full focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs shrink-0 font-medium">Source</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 w-full focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="Website">Website</option>
              <option value="Webinar">Webinar</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Referral">Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Lead Table View */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-[#FAFBFD] text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("first_name")}>
                  Full Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("company")}>
                  Company/Source <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("status")}>
                  Status <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-3">
                  Score
                </th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading list...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                leads.map((ld) => {
                  const isSelected = selectedLead?.id === ld.id;
                  
                  return (
                    <tr 
                      key={ld.id} 
                      onClick={() => handleSelectLead(ld)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50/40 text-indigo-950 font-medium" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {ld.first_name} {ld.last_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{ld.email || "No email"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">{ld.company}</div>
                        <div className="text-[10px] text-slate-400">{ld.lead_source}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold leading-relaxed ${
                          ld.status === "Closed Won" ? "bg-emerald-50 text-emerald-700" :
                          ld.status === "Closed Lost" ? "bg-rose-50 text-rose-700" :
                          ld.status === "New" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {ld.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {ld.ai_score ? (
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ld.ai_score >= 85 ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                          }`}>
                            <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-100 shrink-0" />
                            {ld.ai_score}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-400 ml-auto mr-1" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT PANEL: Details, Activity Logs, and Gemini AI Score (5 cols) */}
      <div className="xl:col-span-5 space-y-5">
        {!selectedLead ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
            <Building className="h-10 w-10 text-slate-300 mb-2.5" />
            <h3 className="text-sm font-bold text-slate-600">No Lead Selected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
              Select any customer lead entry in the registry to reveal activity timelines, custom sales filters, and AI-powered insights.
            </p>
          </div>
        ) : loadingDetails ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Loading lead file detail record...</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Main File Detail Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {selectedLead.first_name} {selectedLead.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> {selectedLead.company}
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                    title="Edit Record"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Email</span>
                  <span className="text-slate-800 font-medium truncate block">{selectedLead.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Phone</span>
                  <span className="text-slate-800 font-medium block">{selectedLead.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Source Channel</span>
                  <span className="text-slate-800 font-medium block">{selectedLead.lead_source}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Salesforce Association</span>
                  <span className="text-slate-800 font-mono text-[10px] tracking-tight truncate block">
                    {selectedLead.salesforce_id ? selectedLead.salesforce_id : "Offline Pending Link"}
                  </span>
                </div>
              </div>

              {/* Gemini AI Score Section */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-indigo-500 fill-indigo-100" />
                    Gemini AI Lead Insights
                  </div>
                  
                  <button
                    onClick={handleTriggerGeminiAI}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-[10px] font-bold text-white px-2 py-1 rounded shadow-xs"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" /> Scoring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" /> Score Lead
                      </>
                    )}
                  </button>
                </div>

                {selectedLead.ai_score ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-extrabold text-indigo-700 font-sans tracking-tight">
                        {selectedLead.ai_score}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        selectedLead.ai_score >= 85 ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                      }`}>
                        {selectedLead.ai_score >= 85 ? "High Priority Deal" : "Routine Opportunity"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-white rounded-lg p-2.5 border border-indigo-100/40">
                      {selectedLead.ai_notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-indigo-600 font-medium">
                    Analyze pipeline fit on the fly! The server launches Google Gemini AI internally to estimate opportunity conversion chance and write tailored sales recommendations.
                  </p>
                )}
              </div>
            </div>

            {/* Custom Log Activities Form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-slate-500" /> Log Sales Contact Touch
              </h4>

              <form onSubmit={handleLogActivitySubmit} className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded-xl text-xs w-1/3 text-slate-700 focus:outline-none"
                  >
                    <option value="Call Log">Call Log</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                    <option value="Follow-Up Event">Follow-Up</option>
                  </select>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="Enter sales log details, decision metrics..."
                    value={actDescription}
                    onChange={(e) => setActDescription(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded-xl text-xs flex-1 text-slate-900 focus:outline-none placeholder-slate-450 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={loggingActivity}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 hover:shadow-xs transition-all flex items-center"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Activity History Logs (Modification lists + Call lists) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-500" /> Lead Modification & Touch History
              </h4>

              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {relatedActivities.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">No activity timeline records established for this lead file.</p>
                ) : (
                  relatedActivities.map((act) => (
                    <div key={act.id} className="text-xs relative pl-4 border-l border-slate-100 flex flex-col gap-0.5">
                      {/* Timeline dot */}
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-600" />
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span>{act.type}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{act.description}</p>
                      <span className="text-[9px] text-slate-400 font-medium">Logged by {act.user_name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              Add New Lead Record
            </h3>
            
            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Lead Acquisition</label>
                  <select
                    value={formData.lead_source}
                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="Website">Website</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Qualification Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead["status"] })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Save Lead record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              Update Lead Details
            </h3>
            
            <form onSubmit={handleUpdateLead} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Lead Acquisition</label>
                  <select
                    value={formData.lead_source}
                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="Website">Website</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Qualification Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead["status"] })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Update Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
