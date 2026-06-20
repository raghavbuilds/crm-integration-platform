import React, { useState, useEffect } from "react";
import { Contact, User } from "../types";
import { contactService } from "../services/api";
import { 
  Plus, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, 
  Mail, Phone, Building, UserSquare2, Trash2, Edit3 
} from "lucide-react";

interface ContactsManagerProps {
  currentUser: User;
  onContactChange: () => void;
}

export default function ContactsManager({ currentUser, onContactChange }: ContactsManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination parameters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected dossier and forms
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form parameters
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
  });

  useEffect(() => {
    fetchContacts();
    setCurrentPage(1); // reset to page 1 on search change
  }, [search, sortBy, sortDir]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await contactService.getAll({
        search,
        sortBy,
        sortDir,
      });
      setContacts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
    });
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contactService.create(formData);
      setIsCreateOpen(false);
      resetForm();
      fetchContacts();
      onContactChange();
    } catch (error: any) {
      alert(error.message || "Failed to create contact");
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    try {
      const updated = await contactService.update(selectedContact.id, formData);
      setSelectedContact(updated);
      setIsEditOpen(false);
      fetchContacts();
      onContactChange();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (currentUser.role === "Sales Executive") {
      alert("Role Permission Block: Only Admins or Sales Managers can delete records.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this contact from local and Salesforce caches?")) return;
    try {
      await contactService.delete(id);
      setSelectedContact(null);
      fetchContacts();
      onContactChange();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
    });
  };

  // Pagination bounds calculation
  const totalItems = contacts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = contacts.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      
      {/* LEFT: Grid List with Search Filters (8 cols) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-8 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              Contact Management Dossier
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Store direct contact lines of synced customer stakeholders.
            </p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Contact
          </button>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts, company, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 w-full border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs shrink-0">
            <span className="text-slate-400 font-medium">Sort by: </span>
            <button 
              onClick={() => toggleSort("first_name")} 
              className={`p-1.5 border rounded-lg flex items-center gap-1 font-semibold ${
                sortBy === "first_name" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              First Name <ArrowUpDown className="h-3 w-3" />
            </button>
            <button 
              onClick={() => toggleSort("company")} 
              className={`p-1.5 border rounded-lg flex items-center gap-1 font-semibold ${
                sortBy === "company" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              Company <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading active contacts directory...</p>
          </div>
        ) : paginatedContacts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No contacts logged in CRM yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedContacts.map((ct) => {
              const isSelected = selectedContact?.id === ct.id;
              
              return (
                <div
                  key={ct.id}
                  onClick={() => handleSelectContact(ct)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-xs hover:border-indigo-200 relative ${
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-150"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <UserSquare2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h3 className="text-xs font-bold text-slate-800">
                        {ct.first_name} {ct.last_name}
                      </h3>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                        <Building className="h-3 w-3 shrink-0" />
                        {ct.company}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {ct.email || "No Email linked"}
                      </div>
                    </div>
                  </div>

                  {ct.salesforce_id && (
                    <span className="absolute bottom-2 right-2 bg-emerald-50 text-[9px] text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                      Salesforce
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{totalItems}</span> CRM contacts
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT: Selected Details and Action dossier (4 cols) */}
      <div className="lg:col-span-4">
        {!selectedContact ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <UserSquare2 className="h-10 w-10 text-slate-300 mb-2.5" />
            <h3 className="text-sm font-bold text-slate-600">No Contact Selected</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-[200px]">
              Review the records sidebar and select an individual stakeholder to inspect communication coordinates.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#B5BAC9]">STAKEHOLDER FILE</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {selectedContact.first_name} {selectedContact.last_name}
                </h3>
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                  title="Edit Record"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteContact(selectedContact.id)}
                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                  title="Delete Record"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5 divide-y divide-slate-100/60 pb-2">
              <div className="font-semibold text-slate-700 text-xs pt-1.5 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span>Company: </span>
                  <span className="text-slate-800 font-bold">{selectedContact.company}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>Email Coordinate: </span>
                  <span className="text-slate-800 font-bold select-all truncate">{selectedContact.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>Phone Number: </span>
                  <span className="text-slate-800 font-bold select-all">{selectedContact.phone || "N/A"}</span>
                </div>
              </div>

              <div className="pt-3.5 space-y-1 text-xs">
                <span className="text-[#B5BAC9] font-bold text-[9px] tracking-widest uppercase block">Salesforce CRM status</span>
                {selectedContact.salesforce_id ? (
                  <div className="space-y-1">
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> 
                      Synchronized Active Source of Truth
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      SFID: {selectedContact.salesforce_id}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-amber-700 font-bold flex items-center gap-1 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> 
                      Pending Upload Link
                    </span>
                    <span className="text-[10px] text-slate-400 leading-relaxed block">
                      This contact was entered locally. Run the bi-directional CRM synchronizer to register them inside Salesforce.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3.5 text-[10px] text-slate-400">
                Created on: {new Date(selectedContact.created_at).toLocaleString()} <br />
                Last Modified: {new Date(selectedContact.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE CONTACT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              Add New Stakeholder Contact
            </h3>
            
            <form onSubmit={handleCreateContact} className="mt-4 space-y-4">
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
                <label className="block text-xs font-bold text-slate-600 uppercase">Company/Organization</label>
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
                  <label className="block text-xs font-bold text-slate-600 uppercase">Direct Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
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
                  Register Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              Update Contact dossier
            </h3>
            
            <form onSubmit={handleUpdateContact} className="mt-4 space-y-4">
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
                <label className="block text-xs font-bold text-slate-600 uppercase">Company/Organization</label>
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
                  <label className="block text-xs font-bold text-slate-600 uppercase">Direct Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
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
                  Update record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
