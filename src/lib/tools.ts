import { loadProfile, updateProfile, type ColumnMapping } from "./store";
import { isValidStage } from "./stages";
import type { ToolDefinition } from "./llm";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Search the web for real information about comparable businesses, competitors, or market context. Use this before making any comparative claim about the founder's industry.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query — e.g. 'top D2C fashion brands in India' or 'competitors of organic skincare brands'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "classify_industry",
      description:
        "Classify the founder's business into a structured industry category with a confidence score. Use the model's own reasoning, not keyword matching.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "The industry category — e.g. 'D2C Fashion', 'SaaS', 'Food & Beverage', 'Spiritual/Puja Goods', 'Beauty & Cosmetics'",
          },
          confidence: {
            type: "number",
            description: "Confidence score from 0 to 1",
          },
          reasoning: {
            type: "string",
            description: "Brief reasoning for this classification",
          },
        },
        required: ["category", "confidence", "reasoning"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_founder_profile",
      description:
        "Save or update structured fields about the founder's business. Call this as soon as you learn a new fact. Only include fields you have new information for.",
      parameters: {
        type: "object",
        properties: {
          industry: { type: "string", description: "Industry category" },
          rawDescription: { type: "string", description: "The founder's raw description of their business" },
          differentiator: { type: "string", description: "What makes them different from comparable businesses" },
          sourcingModel: { type: "string", description: "How they source products — e.g. 'in-house manufacturing', 'dropshipping', 'wholesale'" },
          currentChannel: { type: "string", description: "Primary sales channel — e.g. 'Shopify', 'Instagram', 'Amazon', 'WhatsApp'" },
          currentTools: { type: "string", description: "Current tools/CRM they use" },
          wantsToConnectData: { type: "boolean", description: "Whether they want to connect a data source" },
          selectedCrm: { type: "string", description: "The CRM/store platform the founder selected (e.g. 'shopify', 'hubspot', 'salesforce', 'zoho', 'woocommerce', 'sheets'). Only set this after the founder explicitly names a platform." },
          recommendedAgents: {
            type: "array",
            items: { type: "string" },
            description: "List of recommended Beesz agent names",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "advance_stage",
      description: "Advance the conversation to the next stage. Call this when transitioning between stages.",
      parameters: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: ["opening", "mirror", "differentiate", "pitch", "discovery", "connect", "column_mapping", "complete"],
            description: "The stage to advance to",
          },
        },
        required: ["stage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "map_column",
      description:
        "Map one internal Beesz field to the founder's column name in their CRM/store. Call this once per field after the founder answers. If they said 'not sure' or skipped, set confidence to 'unmapped' and client_column_name to empty string.",
      parameters: {
        type: "object",
        properties: {
          internal_field: {
            type: "string",
            description: "The internal Beesz field name — e.g. 'customer_name', 'customer_contact', 'order_date', 'order_value', 'order_status', 'product_name'",
          },
          client_column_name: {
            type: "string",
            description: "The column name in the founder's system that maps to this field. Empty string if unmapped.",
          },
          confidence: {
            type: "string",
            enum: ["auto-detected", "user-confirmed", "unmapped"],
            description: "Whether this was auto-detected, typed by the founder, or left unmapped",
          },
        },
        required: ["internal_field", "client_column_name", "confidence"],
      },
    },
  },
];

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  sessionId: string
): Promise<string> {
  switch (toolName) {
    case "search_web":
      return await searchWeb(args.query as string);

    case "classify_industry": {
      const profile = await loadProfile(sessionId);
      if (profile) {
        await updateProfile(sessionId, {
          industry: args.category as string,
          industryConfidence: args.confidence as number,
        });
      }
      return JSON.stringify({
        category: args.category,
        confidence: args.confidence,
        reasoning: args.reasoning,
      });
    }

    case "save_founder_profile": {
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined) {
          updates[key] = value;
        }
      }
      const profile = await loadProfile(sessionId);
      let autoAdvanced = false;
      if (profile) {
        await updateProfile(sessionId, updates);
        // Auto-advance to connect stage when founder agrees to connect
        if (updates.wantsToConnectData === true) {
          const stageOrder = ["opening", "mirror", "differentiate", "pitch", "discovery", "connect", "column_mapping", "complete"];
          const currentIdx = stageOrder.indexOf(profile.stage);
          const connectIdx = stageOrder.indexOf("connect");
          if (currentIdx < connectIdx) {
            await updateProfile(sessionId, { stage: "connect" });
            autoAdvanced = true;
          }
        }
      }
      const result: Record<string, unknown> = { success: true, savedFields: Object.keys(updates) };
      if (autoAdvanced) {
        result.hint = "Stage auto-advanced to connect. A platform picker will appear in the UI automatically. Do NOT ask the founder which CRM they use — just say one short line like 'great, let's get you connected' and end your turn. Wait for them to pick a platform.";
      }
      if (updates.selectedCrm) {
        result.hint = "CRM selected. You can now call advance_stage('column_mapping'). Say one short confirmation and stop — the UI will show the mapping wizard.";
      }
      return JSON.stringify(result);
    }

    case "advance_stage": {
      const stageName = args.stage as string;
      if (!isValidStage(stageName)) {
        return JSON.stringify({ error: `Invalid stage: ${stageName}` });
      }
      const profile = await loadProfile(sessionId);
      if (!profile) {
        return JSON.stringify({ error: "Profile not found" });
      }

      if (stageName === "complete" && profile.wantsToConnectData === null) {
        return JSON.stringify({
          error:
            "Cannot advance to complete yet. The core objective of this onboarding is not fulfilled: you have not asked (or the founder has not given a clear yes/no) whether they want to connect their CRM/store data. Ask that question directly now — do not redirect to the dashboard until it is answered.",
        });
      }

      if (stageName === "column_mapping") {
        if (profile.wantsToConnectData !== true) {
          return JSON.stringify({
            error:
              "Cannot advance to column_mapping yet. The founder has not agreed to connect their CRM/store data. Ask the connect question first.",
          });
        }
        if (!profile.selectedCrm) {
          return JSON.stringify({
            error:
              "Cannot advance to column_mapping yet. The founder has not selected a specific CRM/store platform yet. Wait for them to pick one from the UI picker (their message will mention a specific platform like 'Shopify', 'HubSpot', etc.) before advancing. Do NOT advance to column_mapping on your own — the UI will present the picker, and the founder's selection will arrive as a message.",
          });
        }
      }

      await updateProfile(sessionId, { stage: stageName });
      return JSON.stringify({ success: true, stage: stageName });
    }

    case "map_column": {
      const internalField = args.internal_field as string;
      const clientColumnName = args.client_column_name as string;
      const confidence = args.confidence as ColumnMapping["confidence"];

      const profile = await loadProfile(sessionId);
      if (!profile) {
        return JSON.stringify({ error: "Profile not found" });
      }

      const existingMappings = profile.columnMappings || [];
      const filtered = existingMappings.filter(
        (m) => m.internalField !== internalField
      );
      const newMapping: ColumnMapping = {
        internalField,
        clientColumnName,
        confidence,
      };
      const updatedMappings = [...filtered, newMapping];

      await updateProfile(sessionId, { columnMappings: updatedMappings });

      return JSON.stringify({
        success: true,
        mapping: newMapping,
        totalMapped: updatedMappings.filter((m) => m.confidence !== "unmapped").length,
        totalFields: 6,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function searchWeb(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return JSON.stringify({ error: `Search failed with status ${res.status}` });
    }

    const html = await res.text();
    const results: Array<{ title: string; snippet: string; url: string }> = [];

    const resultBlocks = html.split(/<div class="result results_links results_links_deep web-result">/);
    for (const block of resultBlocks.slice(1, 6)) {
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const urlMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"/);

      if (titleMatch) {
        const title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : "";
        const href = urlMatch ? urlMatch[1].trim() : "";
        results.push({ title, snippet, url: href });
      }
    }

    if (results.length === 0) {
      return JSON.stringify({ results: [], note: "No results found. Try a different query." });
    }

    return JSON.stringify({ results });
  } catch (err) {
    return JSON.stringify({ error: `Search failed: ${err instanceof Error ? err.message : "unknown error"}` });
  }
}
