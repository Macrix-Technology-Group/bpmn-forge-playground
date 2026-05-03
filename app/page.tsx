'use client';

import { useState } from 'react';

const EXAMPLE_PROMPT = `When a sales order is released by ERP, the WES validates stock and creates a wave. Picking and label requesting happen in parallel; after both, the parcel is packed, weighed, QC'd (loop on fail), staged, loaded, and a shipment confirmation is sent back to ERP.`;

export default function Home() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    setSvg('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt })
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

  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 1200,
        margin: '0 auto'
      }}
    >
      <h1 style={{ margin: '0 0 4px' }}>bpmn-forge playground</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Describe a process. Get a BPMN diagram.
      </p>

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
          disabled={loading || !prompt.trim()}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            background: loading ? '#aaa' : '#111',
            color: 'white',
            border: 'none',
            borderRadius: 6
          }}
        >
          {loading ? 'Generating…' : 'Generate SVG'}
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
