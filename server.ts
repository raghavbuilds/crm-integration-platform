import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// ---------------------------------------------------------
// DATABASE INITIALIZATION & SCHEMA
// ---------------------------------------------------------
interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Sales Manager" | "Sales Executive";
  created_at: string;
}

interface Lead {
  id: string;
  salesforce_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  lead_source: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Closed Won" | "Closed Lost";
  assigned_to: string; // user id or username
  created_at: string;
  updated_at: string;
  ai_score?: number;
  ai_notes?: string;
}

interface Contact {
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

interface Activity {
  id: string;
  type: "Call Log" | "Meeting Notes" | "Follow-Up Event" | "Modification";
  description: string;
  lead_id?: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface SyncLog {
  id: string;
  entity_type: "Lead" | "Contact" | "All";
  entity_id: string;
  sync_status: "SUCCESS" | "CONFLICT_RESOLVED" | "ERROR";
  sync_timestamp: string;
  error_message?: string;
}

interface DBStructure {
  users: User[];
  leads: Lead[];
  contacts: Contact[];
  activities: Activity[];
  sync_logs: SyncLog[];
  salesforce_config: {
    connection_status: "Connected" | "Disconnected";
    instance_url: string;
    clientId: string;
    auto_sync_interval_sec: number;
    conflict_resolution: "Keep Local" | "Keep Salesforce";
    last_sync_timestamp: string | null;
  };
}

const DEFAULT_DB: DBStructure = {
  users: [
    { id: "u_1", username: "admin", email: "admin@crmplatform.com", role: "Admin", created_at: "2026-01-10T08:00:00Z" },
    { id: "u_2", username: "sarah_sales", email: "sarah@crmplatform.com", role: "Sales Manager", created_at: "2026-01-12T09:30:00Z" },
    { id: "u_3", username: "alex_exec", email: "alex@crmplatform.com", role: "Sales Executive", created_at: "2026-01-15T10:15:00Z" }
  ],
  leads: [
    {
      id: "ld_1",
      salesforce_id: "00Q8W00000abc12AAA",
      first_name: "Bruce",
      last_name: "Wayne",
      email: "bruce@waynecorp.com",
      phone: "+1-650-555-0199",
      company: "Wayne Enterprises",
      lead_source: "Cold Outreach",
      status: "Qualified",
      assigned_to: "u_2",
      created_at: "2026-05-15T14:30:00Z",
      updated_at: "2026-06-15T11:20:00Z",
      ai_score: 95,
      ai_notes: "Very high interest. Tech stacks match WayneCorp infrastructure perfectly. High conversion potential."
    },
    {
      id: "ld_2",
      salesforce_id: "00Q8W00000xyz98BBB",
      first_name: "Selina",
      last_name: "Kyle",
      email: "selina@gothamcats.org",
      phone: "+1-650-555-0144",
      company: "Gotham Heist & Security",
      lead_source: "Website",
      status: "Proposal Sent",
      assigned_to: "u_3",
      created_at: "2026-06-01T09:00:00Z",
      updated_at: "2026-06-14T16:45:00Z",
      ai_score: 82,
      ai_notes: "Engaged in proposals. Recommends reviewing audit parameters before locking contact contract."
    },
    {
      id: "ld_3",
      salesforce_id: "",
      first_name: "Clark",
      last_name: "Kent",
      email: "clark.kent@dailyplanet.co",
      phone: "+1-202-555-0177",
      company: "Daily Planet Newspaper",
      lead_source: "Webinar",
      status: "New",
      assigned_to: "u_3",
      created_at: "2026-06-16T10:00:00Z",
      updated_at: "2026-06-16T10:00:00Z"
    },
    {
      id: "ld_4",
      salesforce_id: "00Q8W00000qwe45CCC",
      first_name: "Diana",
      last_name: "Prince",
      email: "diana@themyscira.gov",
      phone: "+1-312-555-1100",
      company: "Themyscira Cultural Museum",
      lead_source: "Referral",
      status: "Contacted",
      assigned_to: "u_1",
      created_at: "2026-06-10T11:15:00Z",
      updated_at: "2026-06-12T14:10:00Z",
      ai_score: 88,
      ai_notes: "Strong network connection. Highly responsive via email but rare phone connectivity."
    }
  ],
  contacts: [
    {
      id: "ct_1",
      salesforce_id: "0038W00000con11AAA",
      first_name: "Barry",
      last_name: "Allen",
      email: "barry.allen@centralcitypd.gov",
      phone: "+1-313-555-0112",
      company: "Central City Forensics Lab",
      created_at: "2026-04-18T16:22:00Z",
      updated_at: "2026-06-15T09:00:00Z"
    },
    {
      id: "ct_2",
      salesforce_id: "0038W00000con22BBB",
      first_name: "Oliver",
      last_name: "Queen",
      email: "oliver@queenindustries.com",
      phone: "+1-206-555-0321",
      company: "Queen Consolidated",
      created_at: "2026-05-02T13:10:00Z",
      updated_at: "2026-06-12T10:30:00Z"
    }
  ],
  activities: [
    {
      id: "act_1",
      type: "Call Log",
      description: "Introductory phone call from executive. Lead expressed interest in Salesforce sync capabilities.",
      lead_id: "ld_1",
      user_id: "u_3",
      user_name: "alex_exec",
      created_at: "2026-05-18T10:00:00Z"
    },
    {
      id: "act_2",
      type: "Meeting Notes",
      description: "Discussed system specifications and bi-directional API flows during standard Zoom sync. Proposal drafted.",
      lead_id: "ld_2",
      user_id: "u_2",
      user_name: "sarah_sales",
      created_at: "2026-06-05T14:00:00Z"
    }
  ],
  sync_logs: [
    {
      id: "sl_1",
      entity_type: "Lead",
      entity_id: "ld_1",
      sync_status: "SUCCESS",
      sync_timestamp: "2026-06-15T11:20:00Z"
    },
    {
      id: "sl_2",
      entity_type: "All",
      entity_id: "system",
      sync_status: "SUCCESS",
      sync_timestamp: "2026-06-16T08:00:00Z"
    }
  ],
  salesforce_config: {
    connection_status: "Connected",
    instance_url: "https://enterprise-dev-ed.my.salesforce.com",
    clientId: "3MVG9tgK3ZreV17uGq_v2Tz6A_jP7dY6m176WbB7Bv",
    auto_sync_interval_sec: 120,
    conflict_resolution: "Keep Local",
    last_sync_timestamp: "2026-06-16T08:00:00Z"
  }
};

// Database persistence helpers
function loadDb(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to read database file, initializing fallback", error);
  }
  saveDb(DEFAULT_DB);
  return DEFAULT_DB;
}

function saveDb(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database file:", error);
  }
}

// Global active current user session mock (simple session store)
let activeUser: User | null = DEFAULT_DB.users[0]; // defaults to Admin out of the box for presentation

// Helper to write activity logs
function logActivity(type: Activity["type"], description: string, lead_id?: string) {
  const db = loadDb();
  const newActivity: Activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    description,
    lead_id,
    user_id: activeUser ? activeUser.id : "system",
    user_name: activeUser ? activeUser.username : "System Scheduler",
    created_at: new Date().toISOString()
  };
  db.activities.unshift(newActivity);
  saveDb(db);
}

// Helper to write sync logs
function logSync(entity_type: SyncLog["entity_type"], entity_id: string, sync_status: SyncLog["sync_status"], error_message?: string) {
  const db = loadDb();
  const newLog: SyncLog = {
    id: `sl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    entity_type,
    entity_id,
    sync_status,
    sync_timestamp: new Date().toISOString(),
    error_message
  };
  db.sync_logs.unshift(newLog);
  saveDb(db);
}

// ---------------------------------------------------------
// AUTHENTICATION APIs
// ---------------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = loadDb();
  const user = db.users.find(u => u.username === username);
  if (user && password === "password") {
    activeUser = user;
    res.json({ success: true, user });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  activeUser = null;
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: activeUser });
});

// ---------------------------------------------------------
// DASHBOARD STATS API
// ---------------------------------------------------------
app.get("/api/dashboard/stats", (req, res) => {
  const db = loadDb();
  const totalLeads = db.leads.length;
  const convertedLeads = db.leads.filter(l => l.status === "Closed Won").length;
  // Converted rate
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const activeContacts = db.contacts.length;

  // Monthly trends mock
  const monthlyTrends = [
    { month: "Jan", leads: 15, conversions: 2, contacts: 12 },
    { month: "Feb", leads: 18, conversions: 3, contacts: 14 },
    { month: "Mar", leads: 22, conversions: 4, contacts: 17 },
    { month: "Apr", leads: 28, conversions: 6, contacts: 22 },
    { month: "May", leads: 35, conversions: 8, contacts: 30 },
    { month: "Jun", leads: totalLeads + 25, conversions: convertedLeads + 12, contacts: activeContacts + 19 }
  ];

  // Lead sources distribution
  const sourcesHash: Record<string, number> = {};
  db.leads.forEach(l => {
    sourcesHash[l.lead_source] = (sourcesHash[l.lead_source] || 0) + 1;
  });
  const leadSources = Object.keys(sourcesHash).map(source => ({
    name: source,
    value: sourcesHash[source]
  }));

  res.json({
    totalLeads,
    convertedLeads,
    activeContacts,
    conversionRate,
    monthlyTrends,
    leadSources,
    salesforce_config: db.salesforce_config
  });
});

// ---------------------------------------------------------
// LEADS CRUD APIs
// ---------------------------------------------------------
app.get("/api/leads", (req, res) => {
  const db = loadDb();
  const { search, status, source, sortField, sortOrder } = req.query;
  
  let result = [...db.leads];

  // Search filter
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(l => 
      `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      (l.salesforce_id && l.salesforce_id.toLowerCase().includes(q))
    );
  }

  // Status Filter
  if (status && status !== "ALL") {
    result = result.filter(l => l.status === status);
  }

  // Source Filter
  if (source && source !== "ALL") {
    result = result.filter(l => l.lead_source === source);
  }

  // Sorting
  if (sortField) {
    const field = String(sortField) as keyof Lead;
    const order = sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const valA = a[field] || "";
      const valB = b[field] || "";
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });
  } else {
    // Default descending by created date
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  res.json(result);
});

app.get("/api/leads/:id", (req, res) => {
  const db = loadDb();
  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // Get activities related to this lead
  const activities = db.activities.filter(a => a.lead_id === lead.id);

  res.json({ lead, activities });
});

app.post("/api/leads", (req, res) => {
  const db = loadDb();
  const { first_name, last_name, email, phone, company, lead_source, status, assigned_to } = req.body;

  if (!first_name || !last_name || !company) {
    return res.status(400).json({ error: "First Name, Last Name, and Company are required fields." });
  }

  const newLead: Lead = {
    id: `ld_${Date.now()}`,
    salesforce_id: "", // local new lead starts offline
    first_name,
    last_name,
    email: email || "",
    phone: phone || "",
    company,
    lead_source: lead_source || "Website",
    status: status || "New",
    assigned_to: assigned_to || (activeUser ? activeUser.id : "u_1"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.leads.unshift(newLead);
  saveDb(db);

  logActivity("Modification", `Created lead record for ${first_name} ${last_name} of ${company}.`, newLead.id);

  res.status(201).json(newLead);
});

app.put("/api/leads/:id", (req, res) => {
  const db = loadDb();
  const leadIndex = db.leads.findIndex(l => l.id === req.params.id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const existingLead = db.leads[leadIndex];
  const { first_name, last_name, email, phone, company, lead_source, status, assigned_to } = req.body;

  const updatedLead: Lead = {
    ...existingLead,
    first_name: first_name ?? existingLead.first_name,
    last_name: last_name ?? existingLead.last_name,
    email: email ?? existingLead.email,
    phone: phone ?? existingLead.phone,
    company: company ?? existingLead.company,
    lead_source: lead_source ?? existingLead.lead_source,
    status: status ?? existingLead.status,
    assigned_to: assigned_to ?? existingLead.assigned_to,
    updated_at: new Date().toISOString()
  };

  // Track status transitions
  if (existingLead.status !== updatedLead.status) {
    logActivity("Modification", `Status Transition: Changed status from '${existingLead.status}' to '${updatedLead.status}'.`, updatedLead.id);
  } else {
    logActivity("Modification", `Updated lead details for ${updatedLead.first_name} ${updatedLead.last_name}.`, updatedLead.id);
  }

  db.leads[leadIndex] = updatedLead;
  saveDb(db);

  res.json(updatedLead);
});

app.delete("/api/leads/:id", (req, res) => {
  const db = loadDb();
  const leadIndex = db.leads.findIndex(l => l.id === req.params.id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const lead = db.leads[leadIndex];
  db.leads.splice(leadIndex, 1);
  saveDb(db);

  logActivity("Modification", `Deleted lead record for ${lead.first_name} ${lead.last_name} (formerly of ${lead.company}).`);

  res.json({ success: true, message: "Lead successfully removed" });
});

// Endpoint for logging custom manual sales activities (Like custom call logs or meeting notes)
app.post("/api/leads/:id/activities", (req, res) => {
  const db = loadDb();
  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return res.status(404).json({ error: "Lead no longer exists" });
  }

  const { type, description } = req.body;
  if (!type || !description) {
    return res.status(400).json({ error: "Type and description are mandatory fields." });
  }

  logActivity(type, description, lead.id);
  res.status(201).json({ success: true, message: "Activity logged and stored successfully" });
});

// ---------------------------------------------------------
// CONTACTS CRUD APIs
// ---------------------------------------------------------
app.get("/api/contacts", (req, res) => {
  const db = loadDb();
  const { search, sortBy, sortDir } = req.query;

  let result = [...db.contacts];

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(c => 
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      (c.salesforce_id && c.salesforce_id.toLowerCase().includes(q))
    );
  }

  if (sortBy) {
    const field = String(sortBy) as keyof Contact;
    const order = sortDir === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const valA = a[field] || "";
      const valB = b[field] || "";
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });
  } else {
    // Default sorting by creation
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  res.json(result);
});

app.post("/api/contacts", (req, res) => {
  const db = loadDb();
  const { first_name, last_name, email, phone, company } = req.body;

  if (!first_name || !last_name || !company) {
    return res.status(400).json({ error: "First Name, Last Name, and Company are required." });
  }

  const newContact: Contact = {
    id: `ct_${Date.now()}`,
    salesforce_id: "",
    first_name,
    last_name,
    email: email || "",
    phone: phone || "",
    company,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.contacts.unshift(newContact);
  saveDb(db);

  logActivity("Modification", `Created Contact record for ${first_name} ${last_name} (${company}).`);

  res.status(201).json(newContact);
});

app.put("/api/contacts/:id", (req, res) => {
  const db = loadDb();
  const contactIndex = db.contacts.findIndex(c => c.id === req.params.id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }

  const existingContact = db.contacts[contactIndex];
  const { first_name, last_name, email, phone, company } = req.body;

  const updatedContact: Contact = {
    ...existingContact,
    first_name: first_name ?? existingContact.first_name,
    last_name: last_name ?? existingContact.last_name,
    email: email ?? existingContact.email,
    phone: phone ?? existingContact.phone,
    company: company ?? existingContact.company,
    updated_at: new Date().toISOString()
  };

  db.contacts[contactIndex] = updatedContact;
  saveDb(db);

  logActivity("Modification", `Updated Contact detail for ${updatedContact.first_name} ${updatedContact.last_name}.`);

  res.json(updatedContact);
});

app.delete("/api/contacts/:id", (req, res) => {
  const db = loadDb();
  const contactIndex = db.contacts.findIndex(c => c.id === req.params.id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }

  const contact = db.contacts[contactIndex];
  db.contacts.splice(contactIndex, 1);
  saveDb(db);

  logActivity("Modification", `Removed Contact record for ${contact.first_name} ${contact.last_name}.`);

  res.json({ success: true, message: "Contact successfully deleted" });
});


// ---------------------------------------------------------
// SALESFORCE SYNC SERVICES
// ---------------------------------------------------------
app.get("/api/salesforce/status", (req, res) => {
  const db = loadDb();
  res.json({
    config: db.salesforce_config,
    logs: db.sync_logs.slice(0, 50) // Return last 50 sync logs
  });
});

app.post("/api/salesforce/config", (req, res) => {
  const db = loadDb();
  const { conflict_resolution, auto_sync_interval_sec, instance_url } = req.body;

  db.salesforce_config = {
    ...db.salesforce_config,
    conflict_resolution: conflict_resolution ?? db.salesforce_config.conflict_resolution,
    auto_sync_interval_sec: auto_sync_interval_sec ?? db.salesforce_config.auto_sync_interval_sec,
    instance_url: instance_url ?? db.salesforce_config.instance_url
  };

  saveDb(db);
  res.json({ success: true, config: db.salesforce_config });
});

app.post("/api/salesforce/sync", (req, res) => {
  const db = loadDb();
  
  if (db.salesforce_config.connection_status !== "Connected") {
    logSync("All", "system", "ERROR", "OAuth token registration failure; connection broken.");
    return res.status(400).json({ error: "Salesforce CRM state is currently disconnected. Please hook client token first." });
  }

  const timestamp = new Date().toISOString();
  let syncSuccessCount = 0;
  let conflictCount = 0;

  // 1. Sync local-only leads to Salesforce (Assign mock Salesforce IDs)
  db.leads.forEach(l => {
    if (!l.salesforce_id) {
      l.salesforce_id = `sf_ld_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      l.updated_at = timestamp;
      logSync("Lead", l.id, "SUCCESS");
      syncSuccessCount++;
    } else {
      // Simulate Conflict Resolution
      // If we configured "Keep Salesforce", we simulate downloading remote edits
      if (db.salesforce_config.conflict_resolution === "Keep Salesforce" && Math.random() < 0.2) {
        l.company = l.company + " (SF Corporate)";
        l.updated_at = timestamp;
        logSync("Lead", l.id, "CONFLICT_RESOLVED", "Overwritten with remote Salesforce changes.");
        conflictCount++;
      } else {
        l.updated_at = timestamp;
        logSync("Lead", l.id, "SUCCESS");
        syncSuccessCount++;
      }
    }
  });

  // 2. Sync local-only contacts to Salesforce
  db.contacts.forEach(c => {
    if (!c.salesforce_id) {
      c.salesforce_id = `sf_ct_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      c.updated_at = timestamp;
      logSync("Contact", c.id, "SUCCESS");
      syncSuccessCount++;
    } else {
      c.updated_at = timestamp;
      logSync("Contact", c.id, "SUCCESS");
      syncSuccessCount++;
    }
  });

  // Log final sync event
  db.salesforce_config.last_sync_timestamp = timestamp;
  db.salesforce_config.connection_status = "Connected";
  
  const finishLog: SyncLog = {
    id: `sl_${Date.now()}`,
    entity_type: "All",
    entity_id: "system",
    sync_status: "SUCCESS",
    sync_timestamp: timestamp,
    error_message: `Triggered complete bi-directional synchronization. Synced: ${syncSuccessCount} rows. Conflicts Resolved: ${conflictCount} items.`
  };
  
  db.sync_logs.unshift(finishLog);
  saveDb(db);

  res.json({
    success: true,
    message: `Salesforce sync executed successfully. Synced ${syncSuccessCount} records.`,
    lastSyncTime: timestamp
  });
});

// ---------------------------------------------------------
// SERVER-SIDE GEMINI AI INSIGHTS
// ---------------------------------------------------------
app.post("/api/leads/:id/ai-score", async (req, res) => {
  const db = loadDb();
  const leadIndex = db.leads.findIndex(l => l.id === req.params.id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found." });
  }

  const lead = db.leads[leadIndex];

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      // Graceful local simulation fallback if API key is not yet set
      const simulatedScore = Math.floor(Math.random() * 41) + 60; // 60 to 100
      const simulatedNotes = `[SIMULATED INSIGHT]: Since GEMINI_API_KEY is not configured yet in the Secrets tab, we simulated this response. Lead ${lead.first_name} shows strong alignment with ${lead.company} based on ${lead.lead_source}. Recommended follow-up within 24 hours.`;
      
      lead.ai_score = simulatedScore;
      lead.ai_notes = simulatedNotes;
      db.leads[leadIndex] = lead;
      saveDb(db);
      
      logActivity("Modification", `Generated simulated AI Lead Insights for ${lead.first_name} ${lead.last_name}.`, lead.id);
      return res.json({ score: simulatedScore, notes: simulatedNotes });
    }

    // Modern SDK Usage as commanded in gemini-api guidelines
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an enterprise CRM AI assistant built to evaluate potential buyers.
      Evaluate the following B2B sales lead and assign a numeric qualification score (0 to 100) and actionable next-step follow-up suggestions:
      - Full Name: ${lead.first_name} ${lead.last_name}
      - Email: ${lead.email || "N/A"}
      - Phone: ${lead.phone || "N/A"}
      - Company Name: ${lead.company}
      - Lead Acquisition Channel: ${lead.lead_source}
      - Current Stage: ${lead.status}

      Output ONLY valid raw JSON without code blocks or markdown, containing these exact keys: "score" (integer) and "notes" (string with insights and next steps).`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const textResult = response.text || "{}";
    const insights = JSON.parse(textResult.trim());

    const finalScore = Number(insights.score) || 75;
    const finalNotes = String(insights.notes) || "Review lead information and schedule an initial discovery call.";

    lead.ai_score = finalScore;
    lead.ai_notes = finalNotes;
    
    db.leads[leadIndex] = lead;
    saveDb(db);

    logActivity("Modification", `Generated server-side Gemini AI Score and Actionable Insights for ${lead.first_name} ${lead.last_name} (${lead.company}).`, lead.id);

    res.json({ score: finalScore, notes: finalNotes });

  } catch (error: any) {
    console.error("Gemini AI API Call failed:", error);
    // Graceful error fallback for active server
    const simulatedScore = 78;
    const simulatedNotes = `AI qualification estimate: Strong fit metrics from ${lead.lead_source}. Recommence email pitch. Error executing service: ${error.message}`;
    
    lead.ai_score = simulatedScore;
    lead.ai_notes = simulatedNotes;
    db.leads[leadIndex] = lead;
    saveDb(db);

    res.json({ score: simulatedScore, notes: simulatedNotes });
  }
});

// ---------------------------------------------------------
// VITE CLIENT DEV MIDDLEWARE & SPA FALLBACK SETUP
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server middleware
    app.use(vite.middlewares);
  } else {
    // In production, serve the compiled assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CRM Server] running successfully on http://localhost:${PORT}`);
  });
}

startServer();
