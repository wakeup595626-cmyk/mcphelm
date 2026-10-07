# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues. Use GitHub private vulnerability reporting (Security tab → Report a vulnerability) and include:

- the affected version
- minimal reproduction steps
- redacted evidence (no real API keys, tunnel IDs, cookies, or session data)

The maintainer will acknowledge the report, work on a fix, and coordinate public disclosure with you.

## Security boundaries

MCPHelm is a local control center. Secrets are stored only in the local OS credential store (or a local config file when the user explicitly chooses that option), and the app never sends them to any server. If you believe secret material is being exfiltrated, report it via the channel above.
