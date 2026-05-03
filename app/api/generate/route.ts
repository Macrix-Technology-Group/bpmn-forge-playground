import {
  textToIrWithLlm,
  renderUnifiedSvg,
  exportBpmnXmlWithDi
} from '@macrix-technology-group/bpmn-forge';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_MODELS = new Set(['claude-opus-4-7', 'claude-sonnet-4-6']);

export async function POST(req: Request) {
  try {
    const { prompt, model } = (await req.json()) as {
      prompt?: string;
      model?: string;
    };
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response('Missing or empty `prompt`', { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        'ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and fill it in.',
        { status: 500 }
      );
    }

    const options = model && ALLOWED_MODELS.has(model) ? { model } : undefined;
    const ir = await textToIrWithLlm(prompt, options);
    const { svg } = await renderUnifiedSvg(ir);
    const bpmn = exportBpmnXmlWithDi(ir);

    return Response.json({ svg, ir, bpmn });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(message, { status: 500 });
  }
}
