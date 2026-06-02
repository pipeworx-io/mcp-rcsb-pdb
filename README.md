# mcp-rcsb-pdb

RCSB PDB MCP — experimentally determined macromolecular structures.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search` | Text search across PDB. Returns matching PDB IDs. |
| `structure` | Full entry record by PDB ID (e.g. "1abc"). |
| `polymer_entity` | Polymer-entity (chain) metadata. |
| `ligand` | Non-polymer ligand record (e.g. cofactor, drug). |
| `assembly` | Biological assembly (defaults to "1" — the first/canonical). |
| `summary` | Short entry summary. |

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

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

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
