# mcp-rcsb-pdb

RCSB PDB MCP — experimentally determined macromolecular structures.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 965+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search` | "Find protein structure of [target]" / "search PDB for [protein]" / "is there a crystal structure of [X]" / "[disease target] structures" / "CRISPR / kinase / GPCR structures" — text search the RCSB PDB (the global archive of experimentally-determined 3D protein/RNA/DNA structures). Returns matching PDB IDs you can pass to `structure` or `summary`. Use for structural biology, drug design, protein characterization. |
| `structure` | "PDB entry [1abc] details" / "fetch protein structure [pdb_id]" / "metadata for [PDB ID]" — full PDB entry record by ID (e.g. "1abc", "7BV2"). Returns experimental method (X-ray / cryo-EM / NMR), resolution, authors, deposition date, organism, ligands, related entities. Use after `search` to inspect a specific structure. |
| `polymer_entity` | "Chain [N] of PDB [ID]" / "sequence of chain in [pdb_id]" — fetch the polymer-entity (protein/DNA/RNA chain) metadata for a specific PDB entry. Returns sequence, source organism, UniProt cross-references, GO annotations. Use to drill into one chain of a multi-chain structure. |
| `ligand` | "Ligand / cofactor / drug bound to [pdb_id]" / "small molecule in [PDB entry]" — fetch a non-polymer ligand record (small molecule, cofactor, ion, or bound drug) for a PDB entry. Use to inspect what\'s bound in a co-crystal structure — common in drug discovery / SBDD. |
| `assembly` | "Biological assembly of [pdb_id]" / "functional oligomer for [PDB entry]" — fetch a biological assembly record (the functional oligomeric unit, which often differs from the crystallographic asymmetric unit). Use when you need the actual functional form of a protein (dimer / tetramer / etc.) rather than the crystal contents. |
| `summary` | Lightweight lookup for a PDB entry by 4-char ID: tries the RCSB UniProt endpoint first, falls back to the core entry record. Returns title, experimental method, resolution, and deposition date without the full polymer/ligand detail of `structure`. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "rcsb-pdb": {
      "url": "https://gateway.pipeworx.io/rcsb-pdb/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 965+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Rcsb Pdb data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
