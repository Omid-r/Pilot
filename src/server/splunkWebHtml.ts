export interface SplunkWebLinkParams {
  port?: number | string;
  serverName?: string;
  version?: string;
  protocol?: 'http' | 'https';
}

/**
 * This module intentionally does not emulate Splunk Web.
 * It renders a local hand-off page that points the operator to the real
 * Splunk Web listener detected/provisioned by the backend.
 */
export function getSplunkWebHtml(params: SplunkWebLinkParams = {}): string {
  const port = Number(params.port || 8000);
  const serverName = String(params.serverName || 'Splunk');
  const version = String(params.version || 'detected at runtime');
  const protocol = params.protocol || 'http';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Splunk Web — ${serverName}</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0; min-height:100vh; display:grid; place-items:center;
      background:#0b1220; color:#e5edf7; font:15px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .card { width:min(720px,calc(100vw - 40px)); background:#121c2b; border:1px solid #26364d;
      border-radius:18px; padding:32px; box-shadow:0 22px 80px rgba(0,0,0,.35); }
    h1 { margin:0 0 8px; font-size:24px; }
    p { color:#9fb1c8; line-height:1.6; }
    code { color:#7dd3fc; }
    a { display:inline-block; padding:11px 16px; border-radius:10px; background:#ea0089;
      color:white; text-decoration:none; font-weight:700; }
    .meta { padding:14px; margin:18px 0; border:1px solid #26364d; border-radius:12px; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Real Splunk Web</h1>
    <p>This application does not emulate or fabricate a Splunk Enterprise Web console.</p>
    <div class="meta">
      <div>Host: <code>${serverName}</code></div>
      <div>Detected version: <code>${version}</code></div>
      <div>Target: <code>${protocol}://&lt;SERVER-IP&gt;:${port}/en-US/account/login</code></div>
    </div>
    <p>Open the real Splunk listener after the deployment/preflight check confirms that the Splunk service is running.</p>
    <a href="${protocol}://${location.hostname}:${port}/en-US/account/login">Open real Splunk Web</a>
  </main>
</body>
</html>`;
}
