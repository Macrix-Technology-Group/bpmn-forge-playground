// Minimal ambient declarations for @macrix-technology-group/bpmn-forge.
// The library itself ships untyped JS at 0.1.1; this file is a placeholder
// covering only the public-API symbols this playground actually imports.
// When bpmn-forge ships real types upstream, delete this file.

declare module '@macrix-technology-group/bpmn-forge' {
  export interface BpmnIr {
    process: {
      id: string;
      name?: string;
      isExecutable?: boolean;
      nodes: Array<Record<string, unknown>>;
      edges: Array<Record<string, unknown>>;
      participants?: Array<Record<string, unknown>>;
      message_flows?: Array<Record<string, unknown>>;
      [key: string]: unknown;
    };
  }

  export interface UnifiedRenderResult {
    mode: 'elk' | 'swimlanes';
    svg: string;
  }

  export function textToIrWithLlm(
    text: string,
    options?: { model?: string; [key: string]: unknown }
  ): Promise<BpmnIr>;

  export function renderUnifiedSvg(
    ir: BpmnIr,
    options?: { mode?: 'elk' | 'swimlanes' | 'plain' }
  ): Promise<UnifiedRenderResult>;

  export function importBpmnXml(xml: string): BpmnIr;
  export function exportBpmnXml(ir: BpmnIr, options?: Record<string, unknown>): string;
  export function normalizeIr(ir: BpmnIr): BpmnIr;
  export function validateIr(ir: BpmnIr): { ok: boolean; errors: string[]; warnings: string[] };
}
