import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import { generateText, streamText, UIMessage } from "ai";
import { channel, topic } from "@inngest/realtime";
import { z } from "zod";
import { boolean } from "zod/v4";

const systemInstruction = `You are an intelligent chat assistant that helps users improve their messages. Your job is to ALWAYS provide a useful response.\n\n
    Instructions:
    1. Follow the context and If the INPUT seems to be a specific request, instruction, or question to the ai (e.g., 'write a poem', 'draft an email', 'explain quantum physics'), fulfill that request completely.
    2. If the INPUT is a draft message, fragment, or casual text, improve it by:
       - fixing grammar and spelling
       - improving clarity and tone
       - making it natural, complete, and polite
    3. If the INPUT is short or ambiguous, interpret it reasonably and produce a complete improved version.
    4. If the INPUT is pure gibberish (nonsense symbols or random characters), return it unchanged.
    5. If the request is not a text-generation task, answer with: "I'm sorry, I can't assist with that."

    CRITICAL RULES:
    - Do not repeat specific details from earlier responses unless required for clarity.
    - Do not ask for clarification or say you don’t understand.
    - Do not use meta-comments (e.g., “I apologize”, “as an AI”).
    - Output only the improved or generated text, nothing else.
  `;

export const streamingChannel = channel((id: string) => "chat/generate.content:" + id).addTopic(
  topic("stream").type<any>()
);

export const generateContent = inngest.createFunction(
  { id: "generate-content" },
  { event: "chatapp-generate-content" },
  async ({ event, step, publish }) => {
    const { prompt, context, enableContext, originalInput, uuid } = event.data;

    const response = await step.run("generate-text", async () => {
      let string = "";
      let contextSection = "";

      if (enableContext && context && Array.isArray(context) && context.length > 0) {
        const limitedContext = context.slice(-20);
        contextSection = `\n\nCONVERSATION CONTEXT:\n`;
        contextSection += limitedContext
          .map((msg: { from: string; message: string }) => `[${msg.from}]: ${msg.message}`)
          .join("\n");
        contextSection += `\n\nUse this conversation context to provide more relevant and contextually appropriate responses.\n`;
      }

      let contents = `${contextSection ? contextSection + "\n\n" : ""}INPUT: ${prompt}`;

      if (originalInput) {
        contents += `\n\n⚠️ FOLLOW-UP INSTRUCTION (DUPLICATE OR SIMILAR REQUEST).\n\n`;
        contents += `ORIGINAL_INPUT: ${originalInput}\n\n`;
        contents += `Compare INPUT with ORIGINAL_INPUT\n`;
        contents += `If they are similar, produce a fresh variation. Do not repeat wording, structure, or phrasing from your previous answer\n`;
        contents += `If the INPUT contains a new request or follow-up instruction, obey the new request fully\n`;
        contents += `If the INPUT is significantly different from ORIGINAL_INPUT, ignore these variation rules\n`;
      }

      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: systemInstruction,
        prompt: contents,
      });

      const stream = result.toUIMessageStream();

      for await (const chunk of stream) {
        string += chunk.type === "reasoning-delta" ? chunk.delta + " " : chunk.type === "finish" ? "" : "";
        await publish(streamingChannel(uuid).stream(chunk));
      }

      return string;
    });

    return response;
  }
);
