# @pipeworx/rcsb-pdb

RCSB Protein Data Bank MCP — 3-D structure metadata for ~225 k experimentally determined macromolecules. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search(query, return_type?, limit?)` — text search across PDB
- `structure(pdb_id)` — full entry record (experiment, ligands, polymer entities)
- `polymer_entity(pdb_id, entity_id)` — single polymer entity (chain) metadata
- `ligand(pdb_id, ligand_id)` — ligand record
- `assembly(pdb_id, assembly_id?)` — biological assembly
- `summary(pdb_id)` — short summary view

## Data sources

- Search: `https://search.rcsb.org/rcsbsearch/v2/query`
- Data: `https://data.rcsb.org/rest/v1/core/`

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

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

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
