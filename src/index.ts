interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * RCSB PDB MCP — experimentally determined macromolecular structures.
 *
 * Auth: none. Docs:
 *   https://search.rcsb.org/
 *   https://data.rcsb.org/
 */


const SEARCH = 'https://search.rcsb.org/rcsbsearch/v2/query';
const DATA = 'https://data.rcsb.org/rest/v1/core';
const UA = 'pipeworx-mcp-rcsb-pdb/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description: 'Text search across PDB. Returns matching PDB IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text, e.g. "CRISPR Cas9".' },
        return_type: { type: 'string', description: 'entry (default) | polymer_entity | non_polymer_entity | assembly' },
        limit: { type: 'number', description: '1-1000 (default 25).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'structure',
    description: 'Full entry record by PDB ID (e.g. "1abc").',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' } },
      required: ['pdb_id'],
    },
  },
  {
    name: 'polymer_entity',
    description: 'Polymer-entity (chain) metadata.',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' }, entity_id: { type: 'string' } },
      required: ['pdb_id', 'entity_id'],
    },
  },
  {
    name: 'ligand',
    description: 'Non-polymer ligand record (e.g. cofactor, drug).',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' }, ligand_id: { type: 'string' } },
      required: ['pdb_id', 'ligand_id'],
    },
  },
  {
    name: 'assembly',
    description: 'Biological assembly (defaults to "1" — the first/canonical).',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' }, assembly_id: { type: 'string' } },
      required: ['pdb_id'],
    },
  },
  {
    name: 'summary',
    description: 'Short entry summary.',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' } },
      required: ['pdb_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search': {
      const body = {
        query: {
          type: 'terminal',
          service: 'full_text',
          parameters: { value: reqStr(args, 'query', '"CRISPR Cas9"') },
        },
        return_type: String(args.return_type ?? 'entry'),
        request_options: { paginate: { start: 0, rows: Math.min(1000, Math.max(1, (args.limit as number) ?? 25)) } },
      };
      const res = await fetch(SEARCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA },
        body: JSON.stringify(body),
      });
      if (res.status === 204) return { hits: 0, results: [] };
      if (!res.ok) throw new Error(`RCSB search: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
      return res.json();
    }
    case 'structure':
      return rcsbGet(`/entry/${pid(args)}`);
    case 'polymer_entity':
      return rcsbGet(`/polymer_entity/${pid(args)}/${encodeURIComponent(reqStr(args, 'entity_id', '"1"'))}`);
    case 'ligand':
      return rcsbGet(`/nonpolymer_entity/${pid(args)}/${encodeURIComponent(reqStr(args, 'ligand_id', '"1"'))}`);
    case 'assembly': {
      const aid = (args.assembly_id as string | undefined) ?? '1';
      return rcsbGet(`/assembly/${pid(args)}/${encodeURIComponent(aid)}`);
    }
    case 'summary':
      return rcsbGet(`/uniprot/${pid(args)}`).catch(() => rcsbGet(`/entry/${pid(args)}`));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function pid(args: Record<string, unknown>): string {
  const id = reqStr(args, 'pdb_id', '"1abc"').toLowerCase();
  if (!/^[a-z0-9]{4}$/.test(id)) throw new Error(`Invalid PDB ID "${id}". Expected 4 alphanumeric chars.`);
  return id;
}

async function rcsbGet(path: string): Promise<unknown> {
  const res = await fetch(`${DATA}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 404) throw new Error('RCSB: not found');
  if (!res.ok) throw new Error(`RCSB: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
