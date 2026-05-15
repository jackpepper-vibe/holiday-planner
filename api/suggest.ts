import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors() });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response('API key not configured', { status: 500, headers: cors() });
  }

  let body: { location?: unknown; type?: unknown; distance?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors() });
  }

  const location = String(body.location ?? '').trim();
  const type     = String(body.type     ?? '').trim();
  const distance = String(body.distance ?? '').trim();

  if (!location || !type || !distance) {
    return new Response('Missing fields', { status: 400, headers: cors() });
  }

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 900,
    system: `You are an expert French travel guide with deep local knowledge.
Give specific, practical, and vivid recommendations.
Format as a numbered list (1. through 5.).
Each entry: bold name, then 2 sentences. Be warm and enthusiastic.
Write in English.`,
    messages: [{
      role: 'user',
      content: `I am staying at ${location} in France. Suggest ${type} options within ${distance}. Give me 5 specific recommendations with descriptions.`,
    }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(enc.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      ...cors(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
