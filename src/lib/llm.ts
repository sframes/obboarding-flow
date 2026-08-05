import OpenAI from "openai";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolResult = {
  tool_call_id: string;
  result: string;
};

type CallModelOptions = {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  stream?: boolean;
};

function getClient() {
  const provider = process.env.LLM_PROVIDER || "openai";
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set. Check your .env.local file.");
  }

  if (provider === "openai") {
    return new OpenAI({ apiKey, baseURL: baseUrl });
  }

  if (provider === "anthropic") {
    return new OpenAI({ apiKey, baseURL: baseUrl });
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

export async function callModel(opts: CallModelOptions) {
  const client = getClient();
  const model = process.env.LLM_MODEL || "deepseek/deepseek-chat";

  const response = await client.chat.completions.create({
    model,
    messages: opts.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools: opts.tools as OpenAI.Chat.Completions.ChatCompletionTool[],
    temperature: opts.temperature ?? 0.7,
  });

  return response;
}

export async function callModelStream(opts: CallModelOptions) {
  const client = getClient();
  const model = process.env.LLM_MODEL || "deepseek/deepseek-chat";

  const stream = await client.chat.completions.create({
    model,
    messages: opts.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools: opts.tools as OpenAI.Chat.Completions.ChatCompletionTool[],
    temperature: opts.temperature ?? 0.7,
    stream: true,
  });

  return stream;
}
