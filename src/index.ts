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
    description: '"Find protein structure of [target]" / "search PDB for [protein]" / "is there a crystal structure of [X]" / "[disease target] structures" / "CRISPR / kinase / GPCR structures" — text search the RCSB PDB (the global archive of experimentally-determined 3D protein/RNA/DNA structures). Returns matching PDB IDs you can pass to `structure` or `summary`. Use for structural biology, drug design, protein characterization.',
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
    description: '"PDB entry [1abc] details" / "fetch protein structure [pdb_id]" / "metadata for [PDB ID]" — full PDB entry record by ID (e.g. "1abc", "7BV2"). Returns experimental method (X-ray / cryo-EM / NMR), resolution, authors, deposition date, organism, ligands, related entities. Use after `search` to inspect a specific structure.',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' } },
      required: ['pdb_id'],
    },
  },
  {
    name: 'polymer_entity',
    description: '"Chain [N] of PDB [ID]" / "sequence of chain in [pdb_id]" — fetch the polymer-entity (protein/DNA/RNA chain) metadata for a specific PDB entry. Returns sequence, source organism, UniProt cross-references, GO annotations. Use to drill into one chain of a multi-chain structure.',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' }, entity_id: { type: 'string' } },
      required: ['pdb_id', 'entity_id'],
    },
  },
  {
    name: 'ligand',
    description: '"Ligand / cofactor / drug bound to [pdb_id]" / "small molecule in [PDB entry]" — fetch a non-polymer ligand record (small molecule, cofactor, ion, or bound drug) for a PDB entry. Use to inspect what\'s bound in a co-crystal structure — common in drug discovery / SBDD.',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' }, ligand_id: { type: 'string' } },
      required: ['pdb_id', 'ligand_id'],
    },
  },
  {
    name: 'assembly',
    description: '"Biological assembly of [pdb_id]" / "functional oligomer for [PDB entry]" — fetch a biological assembly record (the functional oligomeric unit, which often differs from the crystallographic asymmetric unit). Use when you need the actual functional form of a protein (dimer / tetramer / etc.) rather than the crystal contents.',
    inputSchema: {
      type: 'object',
      properties: { pdb_id: { type: 'string' }, assembly_id: { type: 'string' } },
      required: ['pdb_id'],
    },
  },
  {
    name: 'summary',
    description: 'Lightweight lookup for a PDB entry by 4-char ID: tries the RCSB UniProt endpoint first, falls back to the core entry record. Returns title, experimental method, resolution, and deposition date without the full polymer/ligand detail of `structure`.',
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
