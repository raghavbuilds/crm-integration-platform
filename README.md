# CRM Integration Platform

A high-performance modern Sales & CRM CRM middleware dashboard, featuring automated and manual bi-directional **Salesforce CRM** state synchronization, comprehensive contact dossiers, pipeline lead scoring, and **Google Gemini AI**-powered qualification insights.

## 🚀 Key Features

*   **Pipeline Analytics Dashboard**: Intuitive, responsive KPI metrics tracking Conversion Rates, Acquisition channels, and monthly pipeline growth patterns.
*   **Bi-directional Salesforce Sync**: Configurable bi-directional data alignment with granular conflict resolution policies ("Keep Local" vs. "Keep Salesforce").
*   **Dual-Registry Workspace**: Robust, searchable grid registers for both pipeline leads and contact stakeholders.
*   **Gemini AI Lead Insights**: Automatic qualification assessment utilizing the latest `@google/genai` model SDK to score opportunities and write actionable next-step bullet suggestions.
*   **Role-Based Security**: Built-in mock roles (Admin, Sales Manager, Sales Executive) illustrating professional enterprise permissions gates.

## 🛠️ Tech Stack

*   **Frontend**: React 19, Tailwind CSS, Lucide icons, Motion.
*   **Backend**: Node.js, Express, tsx (dev-runner), esbuild compiler.
*   **AI Integration**: Google Gemini 3.5 Flash Model SDK.

## 📦 Local Setup Instructions

### Prerequisites
- Node.js v18.x or above
- A Salesforce Developer instance client credential details (Optional)
- A Google Gemini API Key

### Running Locally
1. Extract the bundle and open your terminal:
   ```bash
   npm install
