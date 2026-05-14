import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, codeContext } = await req.json();

  const systemPrompt = `You are an expert AI Coding Assistant embedded directly within the CodeRealm collaborative workspace.

Here is the exact code from the active file the user is currently working on:
\`\`\`
${codeContext || "// No code currently open"}
\`\`\`

Instructions:
1. Be concise, direct, and highly technical.
2. If the user asks about "this file" or "my code", refer to the code above.
3. Format all code snippets in markdown with the correct language tag.
4. If the code context is empty, simply state that no file is currently open.`;

  try {
    const result = streamText({
      model: google('gemini-1.5-pro-latest'),
      system: systemPrompt,
      messages,
      temperature: 0.2,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI API Error:", error);
    return new Response(JSON.stringify({ error: "AI API request failed." }), { status: 500 });
  }
}
