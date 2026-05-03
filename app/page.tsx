'use client';

import { useEffect, useState } from 'react';

const EXAMPLE_PROMPT = `When a sales order is released by ERP, the WES validates stock and creates a wave. Picking and label requesting happen in parallel; after both, the parcel is packed, weighed, QC'd (loop on fail), staged, loaded, and a shipment confirmation is sent back to ERP.`;

const MODELS = [
  { id: 'claude-opus-4-7', label: 'Opus 4.7' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' }
] as const;

type ModelId = (typeof MODELS)[number]['id'];
const DEFAULT_MODEL: ModelId = 'claude-opus-4-7';
const MODEL_STORAGE_KEY = 'bpmn-forge-playground:model';

export default function Home() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    setSvg('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      setSvg(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
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
          {loading ? 'Generating…' : 'Generate SVG'}
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
        {svg && (
          <button
            onClick={() => {
              const blob = new Blob([svg], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'process.svg';
              a.click();
              URL.revokeObjectURL(url);
            }}
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
            Download SVG
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

      {svg && (
        <div
          style={{
            marginTop: 16,
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: 16,
            overflow: 'auto',
            background: 'white'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </main>
  );
}
