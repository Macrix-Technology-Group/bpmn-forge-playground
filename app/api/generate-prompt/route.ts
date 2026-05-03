export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_MODELS = new Set(['claude-opus-4-7', 'claude-sonnet-4-6']);
const DEFAULT_MODEL = 'claude-opus-4-7';

const DOMAINS = [
  'insurance claim handling',
  'hospital patient admission',
  'restaurant kitchen ticket flow',
  'hotel check-in and housekeeping',
  'tech support ticket escalation',
  'e-commerce returns and refunds',
  'employee onboarding',
  'payroll run with corrections',
  'mortgage application approval',
  'food delivery dispatch',
  'equipment preventive maintenance',
  'manufacturing line quality control',
  'customs clearance for imports',
  'library book lending and overdue handling',
  'conference paper peer review',
  'incident response in IT operations',
  'visa application processing',
  'pharmacy prescription fulfillment',
  'airline passenger rebooking after a delay',
  'invoice approval and payment',
  'university course registration with prerequisites',
  'real-estate offer negotiation',
  'warehouse inbound goods receipt',
  'helpdesk RMA processing'
];

const CONCEPT_FOCUSES = [
  'two swimlanes for two participants exchanging messages (collaboration with message flows)',
  'three or four lanes inside one pool, with handoffs between roles',
  'a timer event that triggers escalation if a step takes too long',
  'an error boundary event on a task with a compensation or retry path',
  'a parallel gateway splitting work and a join afterwards',
  'a loop that repeats until a quality check passes',
  'an exclusive gateway with three distinct outcomes',
  'a message start event from an external system and a message end event back to it',
  'a signal event broadcasting to multiple lanes',
  'an event-based gateway waiting for whichever event arrives first',
  'a call-activity / sub-process for a reusable check'
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SYSTEM_PROMPT = `You write short, realistic process descriptions for a BPMN diagram playground.

Rules:
- Output ONLY the process description as plain prose. No headings, no bullet lists, no quotes, no preamble like "Here is...".
- 2 to 4 sentences, roughly 40-90 words total.
- Concrete and grounded: name the actors/systems, the trigger, key steps, decisions, and how it ends.
- Use natural everyday business language. Avoid the word "BPMN" and avoid jargon like "swimlane", "gateway", "boundary event" — describe the behavior, don't label it.
- Each response should feel different from the last: vary the domain, the actors, and which control-flow patterns dominate.`;

export async function POST(req: Request) {
  try {
    const { model } = (await req.json().catch(() => ({}))) as {
      model?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        'ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and fill it in.',
        { status: 500 }
      );
    }

    const chosenModel =
      model && ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

    const domain = pick(DOMAINS);
    const focus = pick(CONCEPT_FOCUSES);

    const userMessage = `Write one fresh process description.

Domain: ${domain}
Emphasize this control-flow pattern (without naming it): ${focus}

Also weave in at least one other distinct pattern from: parallel work, a decision with multiple outcomes, a retry/loop on failure, a timer or deadline, a message exchange with another participant, or an exception path.

Return only the prose.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(errText || `Anthropic API error ${res.status}`, {
        status: res.status
      });
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('')
        .trim() ?? '';

    if (!text) {
      return new Response('Empty response from model', { status: 502 });
    }

    return new Response(text, {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(message, { status: 500 });
  }
}
