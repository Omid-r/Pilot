# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability.

Report security issues privately to the repository owner through GitHub's private vulnerability reporting mechanism when available.

## Secret handling

Runtime credentials, signing keys, authentication databases, bootstrap passwords, and local environment files must never be committed to this repository.

Use environment variables or the deployment host's protected secret storage for runtime credentials.

If a real credential is ever committed, treat it as compromised: rotate/revoke it first, then remove it from the repository history.
