import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { readFileSync } from "node:fs";


const PORT = process.env.PORT || 3000;

const app = express();

// === Create MCP server ===
const server = new McpServer({
  name: "dashboard-server",
  version: "1.0.0",
});


const dashboardData = {
  organizations: [
    { name: "AWS", orgCount: 2, accountCount: 12, green: 6, yellow: 5 },
    { name: "Azure", orgCount: 2, subscriptionCount: 3, green: 2, yellow: 1 },
    { name: "GCP", orgCount: 1, projectCount: 86, green: 789, yellow: 5 },
    { name: "Oracle", orgCount: 1, compartmentCount: 86, green: 789, yellow: 5 },
    { name: "On-Premises", orgCount: 1, green: 789 },
  ],
  resourceSummary: {
    iam: 9257,
    kubernetes: 14360,
    network: 7244,
    compute: 5340,
    data: 1676,
    container: 1290,
    management: 1074,
    security: 1008,
  },
  openFindings: {
    critical: 20,
    high: 234,
    medium: 65,
    low: 985,
    categories: {
      iam: 247,
      anomalies: 247,
      workloadProtection: 1175,
      network: 69,
      data: 247,
      logging: 247,
      compute: 247,
      customPolicies: 247,
    }
  },
  compliance: {
    overallStatus: 67,
    awsWellArchitected: 67,
    cis: 67,
    gdpr: 67,
    hipaa: 67,
  },
  toxicCombination: [
    "6 Public workloads with critical vulnerabilities and high privileges",
    "110 external principals with access to sensitive data",
    "96 public storage accounts with shared key access",
    "114 external principals with high privileges",
    "1 public App service with high privileges",
  ],
  quickActions: [
    { text: "Root user MFA is not enabled", category: "AWS Dev" },
    { text: "Public EC2 instance", details: "Root: ff-896850635108-acme-prd-dbapp" },
    { text: "Container image has critical vulnerabilities", cluster: "cluster 25" },
    { text: "Public KMS key", details: "DefaultKey" },
  ],
  trends: {
    openedFindings: 1377,
    closedFindings: 314,
    staredFindings: 3,
    snoozedFindings: 9,
    ticketsCreated: 105,
    excludedResources: 35,
  }
};

// === Load frontend bundle ===
const DASHBOARD_JS = readFileSync("web/src/dashboard.js", "utf8");
const DASHBOARD_CSS = (() => {
  try {
    return readFileSync("web/src/dashboard.css", "utf8");
  } catch {
    return "";
  }
})();

// === Register UI resource ===
server.registerResource(
  "dashboard-widget",
  "ui://widget/dashboard.html",
  {},
  async () => ({
    contents: [
      {
        uri: "ui://widget/dashboard.html",
        mimeType: "text/html+skybridge",
        text: `
<div id="dashboard-root"></div>
${DASHBOARD_CSS ? `<style>${DASHBOARD_CSS}</style>` : ""}
<script type="module">${DASHBOARD_JS}</script>
      `.trim(),
      },
    ],
  })
);

// === Register tool ===
server.registerTool(
  "show-dashboard",
  {
    title: "Show Dashboard",
    description: "Displays the latest metrics dashboard.",
  },
  async () => {
    // Return the dashboard data structure here
    return {
      structuredContent: dashboardData,
      content: [{ type: "text", text: "Dashboard data loaded" }],
    };
  }
);

// === Start MCP server via stdio transport ===
const transport = new StdioServerTransport();
await server.connect(transport);

// === Optional: Serve static files for testing ===
app.use(express.static("web/src"));

app.get('/mcp', (req, res) => {
  res.json(dashboardData);
});


app.listen(PORT, () =>
  console.log(`✅ Web dashboard available at http://localhost:${PORT}`)
);
