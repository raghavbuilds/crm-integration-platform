import { User, Lead, Contact, Activity, SyncLog, SalesforceConfig, DashboardStats } from "../types";

// Base API URL helper
const API_BASE = "/api";

export const authService = {
  async login(username: string): Promise<{ success: boolean; user: User }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "password" }), // simple simulated password
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Authentication failed");
    }
    return response.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
    });
    return response.json();
  },

  async getMe(): Promise<{ user: User | null }> {
    const response = await fetch(`${API_BASE}/auth/me`);
    if (!response.ok) return { user: null };
    return response.json();
  },
};

export const leadService = {
  async getAll(params?: {
    search?: string;
    status?: string;
    source?: string;
    sortField?: string;
    sortOrder?: string;
  }): Promise<Lead[]> {
    const url = new URL(`${window.location.origin}${API_BASE}/leads`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) url.searchParams.append(key, val);
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to fetch leads");
    return response.json();
  },

  async getById(id: string): Promise<{ lead: Lead; activities: Activity[] }> {
    const response = await fetch(`${API_BASE}/leads/${id}`);
    if (!response.ok) throw new Error("Lead not found");
    return response.json();
  },

  async create(lead: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${API_BASE}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create lead");
    }
    return response.json();
  },

  async update(id: string, lead: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${API_BASE}/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update lead");
    }
    return response.json();
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/leads/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete lead");
    return response.json();
  },

  async addActivity(leadId: string, type: string, description: string): Promise<any> {
    const response = await fetch(`${API_BASE}/leads/${leadId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to log activity");
    }
    return response.json();
  },

  async fetchAIScore(leadId: string): Promise<{ score: number; notes: string }> {
    const response = await fetch(`${API_BASE}/leads/${leadId}/ai-score`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to generate AI Insights");
    return response.json();
  },
};

export const contactService = {
  async getAll(params?: { search?: string; sortBy?: string; sortDir?: string }): Promise<Contact[]> {
    const url = new URL(`${window.location.origin}${API_BASE}/contacts`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) url.searchParams.append(key, val);
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to fetch contacts");
    return response.json();
  },

  async create(contact: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create contact");
    }
    return response.json();
  },

  async update(id: string, contact: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update contact");
    }
    return response.json();
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/contacts/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete contact");
    return response.json();
  },
};

export const salesforceService = {
  async getStatus(): Promise<{ config: SalesforceConfig; logs: SyncLog[] }> {
    const response = await fetch(`${API_BASE}/salesforce/status`);
    if (!response.ok) throw new Error("Failed to fetch Salesforce status");
    return response.json();
  },

  async updateConfig(config: Partial<SalesforceConfig>): Promise<{ success: boolean; config: SalesforceConfig }> {
    const response = await fetch(`${API_BASE}/salesforce/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error("Failed to update config");
    return response.json();
  },

  async triggerSync(): Promise<{ success: boolean; message: string; lastSyncTime: string }> {
    const response = await fetch(`${API_BASE}/salesforce/sync`, {
      method: "POST",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Sync execution aborted");
    }
    return response.json();
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE}/dashboard/stats`);
    if (!response.ok) throw new Error("Failed to load dashboard metrics");
    return response.json();
  },
};
