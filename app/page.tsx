'use client';

import { useEffect, useRef, useState } from 'react';

const EXAMPLE_PROMPT = `When a sales order is released by ERP, the WES validates stock and creates a wave. Picking and label requesting happen in parallel; after both, the parcel is packed, weighed, QC'd (loop on fail), staged, loaded, and a shipment confirmation is sent back to ERP.`;

const MODELS = [
  { id: 'claude-opus-4-7', label: 'Opus 4.7' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' }
] as const;

type ModelId = (typeof MODELS)[number]['id'];
const DEFAULT_MODEL: ModelId = 'claude-opus-4-7';
const MODEL_STORAGE_KEY = 'bpmn-forge-playground:model';

type View = 'svg' | 'json' | 'xml';
const VIEWS: { id: View; label: string }[] = [
  { id: 'svg', label: 'Diagram' },
  { id: 'json', label: 'JSON (IR)' },
  { id: 'xml', label: 'BPMN XML' }
];

type GenerateResult = { svg: string; ir: unknown; bpmn: string };

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.2;

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

const zoomBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 13,
  cursor: 'pointer',
  background: 'white',
  color: '#111',
  border: '1px solid #ccc',
  borderRadius: 4,
  lineHeight: 1
};

export default function Home() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [view, setView] = useState<View>('svg');
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const svgScrollRef = useRef<HTMLDivElement | null>(null);
  const svgInnerRef = useRef<HTMLDivElement | null>(null);

  function fitSvgToWidth() {
    const scroll = svgScrollRef.current;
    const inner = svgInnerRef.current;
    if (!scroll || !inner) return;
    const svgEl = inner.querySelector('svg');
    if (!svgEl) return;
    const naturalW =
      svgEl.viewBox?.baseVal?.width || svgEl.width?.baseVal?.value;
    if (!naturalW) return;
    const visibleW = scroll.clientWidth - 32;
    setZoom(clampZoom(visibleW / naturalW));
    scroll.scrollTo({ top: 0, left: 0 });
  }

  useEffect(() => {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && MODELS.some((m) => m.id === saved)) {
      setModel(saved as ModelId);
    }
  }, []);

  function selectModel(id: ModelId) {
    setModel(id);
    localStorage.setItem(MODEL_STORAGE_KEY, id);
  }

  async function generate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as GenerateResult;
      setResult(data);
      setView('svg');
      setZoom(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function downloadActiveView() {
    if (!result) return;
    const map: Record<View, { content: string; mime: string; name: string }> = {
      svg: { content: result.svg, mime: 'image/svg+xml', name: 'process.svg' },
      json: {
        content: JSON.stringify(result.ir, null, 2),
        mime: 'application/json',
        name: 'process.ir.json'
      },
      xml: {
        content: result.bpmn,
        mime: 'application/xml',
        name: 'process.bpmn'
      }
    };
    const { content, mime, name } = map[view];
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generatePrompt() {
    setPromptLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      setPrompt(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPromptLoading(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 1200,
        width: '100%',
        minWidth: 0,
        margin: '0 auto'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px' }}>bpmn-forge playground</h1>
          <p style={{ color: '#666', marginTop: 0 }}>
            Describe a process. Get a BPMN diagram.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
            style={{
              padding: '6px 10px',
              fontSize: 13,
              cursor: 'pointer',
              background: 'white',
              color: '#111',
              border: '1px solid #ccc',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span aria-hidden="true">⚙</span>
            <span>{MODELS.find((m) => m.id === model)?.label}</span>
          </button>
          {settingsOpen && (
            <div
              role="dialog"
              aria-label="Settings"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: 200,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: 6,
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                padding: 12,
                zIndex: 10
              }}
            >
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                Model
              </div>
              {MODELS.map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 4px',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={model === m.id}
                    onChange={() => selectModel(m.id)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
        spellCheck={false}
        placeholder="Describe a process in plain language…"
        style={{
          width: '100%',
          fontFamily: 'inherit',
          fontSize: 14,
          padding: 10,
          border: '1px solid #ccc',
          borderRadius: 6,
          resize: 'vertical',
          boxSizing: 'border-box'
        }}
      />

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={generate}
          disabled={loading || promptLoading || !prompt.trim()}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            cursor:
              loading || promptLoading || !prompt.trim()
                ? 'not-allowed'
                : 'pointer',
            background: loading ? '#aaa' : '#111',
            color: 'white',
            border: 'none',
            borderRadius: 6
          }}
        >
          {loading ? 'Generating…' : 'Generate BPMN'}
        </button>
        <button
          onClick={generatePrompt}
          disabled={loading || promptLoading}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            cursor: loading || promptLoading ? 'not-allowed' : 'pointer',
            background: 'white',
            color: '#111',
            border: '1px solid #ccc',
            borderRadius: 6
          }}
        >
          {promptLoading ? 'Writing prompt…' : 'Generate prompt'}
        </button>
        {result && (
          <button
            onClick={downloadActiveView}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              cursor: 'pointer',
              background: 'white',
              color: '#111',
              border: '1px solid #ccc',
              borderRadius: 6
            }}
          >
            Download {VIEWS.find((v) => v.id === view)?.label}
          </button>
        )}
      </div>

      {error && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: '#fee',
            border: '1px solid #fbb',
            borderRadius: 6,
            color: '#900',
            whiteSpace: 'pre-wrap',
            fontSize: 13
          }}
        >
          {error}
        </pre>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div
            role="tablist"
            aria-label="Output format"
            style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid #ddd'
            }}
          >
            {VIEWS.map((v) => {
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(v.id)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: active ? '#111' : '#666',
                    border: 'none',
                    borderBottom: active
                      ? '2px solid #111'
                      : '2px solid transparent',
                    marginBottom: -1,
                    fontWeight: active ? 600 : 400
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              background: 'white'
            }}
          >
            {view === 'svg' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderBottom: '1px solid #eee',
                    background: '#fafafa'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setZoom((z) => clampZoom(z / ZOOM_STEP))}
                    aria-label="Zoom out"
                    title="Zoom out"
                    style={zoomBtnStyle}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    title="Reset zoom"
                    style={{
                      ...zoomBtnStyle,
                      minWidth: 56,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => clampZoom(z * ZOOM_STEP))}
                    aria-label="Zoom in"
                    title="Zoom in"
                    style={zoomBtnStyle}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={fitSvgToWidth}
                    title="Fit to width"
                    style={{ ...zoomBtnStyle, marginLeft: 4 }}
                  >
                    Fit
                  </button>
                </div>
                <div
                  ref={svgScrollRef}
                  style={{
                    padding: 16,
                    overflow: 'auto',
                    maxHeight: '70vh',
                    width: '100%',
                    minWidth: 0
                  }}
                  onWheel={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
                      setZoom((z) => clampZoom(z * factor));
                    }
                  }}
                >
                  <div
                    ref={svgInnerRef}
                    style={{ zoom, width: 'fit-content' }}
                    dangerouslySetInnerHTML={{ __html: result.svg }}
                  />
                </div>
              </>
            )}
            {view === 'json' && (
              <pre
                style={{
                  margin: 0,
                  padding: 16,
                  maxHeight: '70vh',
                  overflow: 'auto',
                  fontSize: 12,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  whiteSpace: 'pre',
                  color: '#111'
                }}
              >
                {JSON.stringify(result.ir, null, 2)}
              </pre>
            )}
            {view === 'xml' && (
              <pre
                style={{
                  margin: 0,
                  padding: 16,
                  maxHeight: '70vh',
                  overflow: 'auto',
                  fontSize: 12,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  whiteSpace: 'pre',
                  color: '#111'
                }}
              >
                {result.bpmn}
              </pre>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
