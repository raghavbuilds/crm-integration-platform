export interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Sales Manager" | "Sales Executive";
  created_at: string;
}

export interface Lead {
  id: string;
  salesforce_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  lead_source: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Closed Won" | "Closed Lost";
  assigned_to: string;
  created_at: string;
  updated_at: string;
  ai_score?: number;
  ai_notes?: string;
}

export interface Contact {
  id: string;
  salesforce_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: "Call Log" | "Meeting Notes" | "Follow-Up Event" | "Modification";
  description: string;
  lead_id?: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export interface SyncLog {
  id: string;
  entity_type: "Lead" | "Contact" | "All";
  entity_id: string;
  sync_status: "SUCCESS" | "CONFLICT_RESOLVED" | "ERROR";
  sync_timestamp: string;
  error_message?: string;
}

export interface SalesforceConfig {
  connection_status: "Connected" | "Disconnected";
  instance_url: string;
  clientId: string;
  auto_sync_interval_sec: number;
  conflict_resolution: "Keep Local" | "Keep Salesforce";
  last_sync_timestamp: string | null;
}

export interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  activeContacts: number;
  conversionRate: number;
  monthlyTrends: Array<{ month: string; leads: number; conversions: number; contacts: number }>;
  leadSources: Array<{ name: string; value: number }>;
  salesforce_config: SalesforceConfig;
}
