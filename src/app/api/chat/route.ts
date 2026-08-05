import { NextRequest, NextResponse } from "next/server";
import { callModel, type ChatMessage } from "@/lib/llm";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tools";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { loadProfile, createProfile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, messages } = body as {
      sessionId: string;
      messages: ChatMessage[];
    };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    let profile = await loadProfile(sessionId);
    if (!profile) {
      profile = await createProfile(sessionId);
    }

    const userTurns = messages.filter((m) => m.role === "user").length;

    if (profile.stage === "complete") {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "content",
                content: "You're all set — heading to your dashboard now.",
              })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "stage", stage: "complete" })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const allMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    if (userTurns >= 10) {
      allMessages.push({
        role: "system",
        content:
          "Turn budget notice: this onboarding has gone on long enough. Wrap up NOW — one short closing line, then call advance_stage(\"complete\"). Do not ask anything else.",
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = [...allMessages];
          const MAX_TOOL_ROUNDS = 5;

          for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const response = await callModel({
              messages: currentMessages,
              tools: TOOL_DEFINITIONS,
            });

            const choice = response.choices[0];
            const assistantMessage = choice.message;

            currentMessages.push({
              role: "assistant",
              content: assistantMessage.content,
              tool_calls: assistantMessage.tool_calls?.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.function.name, arguments: tc.function.arguments },
              })),
            });

            if (assistantMessage.content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", content: assistantMessage.content })}\n\n`
                )
              );
            }

            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
              break;
            }

            for (const toolCall of assistantMessage.tool_calls) {
              const toolName = toolCall.function.name;
              let args: Record<string, unknown>;
              try {
                args = JSON.parse(toolCall.function.arguments);
              } catch {
                args = {};
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_call", name: toolName, args })}\n\n`
                )
              );

              const result = await executeTool(toolName, args, sessionId);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_result", name: toolName, result })}\n\n`
                )
              );

              // Emit stage event in real-time if the stage changed
              if (toolName === "advance_stage" || toolName === "save_founder_profile") {
                const liveProfile = await loadProfile(sessionId);
                if (liveProfile) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "stage", stage: liveProfile.stage })}\n\n`
                    )
                  );
                }
              }

              currentMessages.push({
                role: "tool",
                content: result,
                tool_call_id: toolCall.id,
              });
            }
          }

          const updatedProfile = await loadProfile(sessionId);
          if (updatedProfile) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "stage", stage: updatedProfile.stage })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Something went wrong. Please try again.";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
