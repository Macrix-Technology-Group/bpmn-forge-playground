import { textToIrWithLlm, renderUnifiedSvg } from '@macrix-technology-group/bpmn-forge';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response('Missing or empty `prompt`', { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        'ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and fill it in.',
        { status: 500 }
      );
    }

    const ir = await textToIrWithLlm(prompt);
    const { svg } = await renderUnifiedSvg(ir);

    return new Response(svg, {
      status: 200,
      headers: { 'content-type': 'image/svg+xml; charset=utf-8' }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(message, { status: 500 });
  }
}
