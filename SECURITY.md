# Security Policy

## Supported surface

This public repository is a fixture-only static demo.

The intended public artifact contains:

- static HTML/CSS/JS
- synthetic sample fixture data
- public documentation

It must not contain real local AI session logs or private task data.

## Reporting a vulnerability or private-data leak

If you find a security issue or accidentally exposed private data in this repository, please open a GitHub issue with a minimal description and avoid reposting secrets in the issue body.

If the issue includes credentials, tokens, cookies, local paths, private client data, or personal information, rotate/revoke the affected secret first and remove the exposed artifact from public distribution.

## Public data safety

Before publishing fixture data, run:

```powershell
npm run release:check
```

For a deployed Pages check:

```powershell
npm run release:check:pages
```

The release checks include fixture validation, distribution build, static smoke, and browser smoke. They are guards, not a substitute for reviewing what you publish.

## Private/local usage

Real `.codex` logs and private session summaries should stay local or in a private repository.

The browser import flow is static and local to the page, but importing private JSON into the browser does not make that data safe to commit, screenshot, or publish.
