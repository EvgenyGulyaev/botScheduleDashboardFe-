# vue
- In Vue templates, refs and computed auto-unwrap — do not use `.value` in template expressions (e.g., use `:disabled="!canUndo"` not `:disabled="!canUndo.value"`). Confidence: 0.70

# security
- Never trust client-supplied proxy headers (X-Forwarded-For, X-Real-IP, X-Remote-Addr) for IP-derived logic — always derive the remote address from the actual TCP connection, and only fall back to proxy headers when the TCP remote is a known/trusted proxy. Confidence: 0.75
