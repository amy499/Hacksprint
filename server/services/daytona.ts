import { Daytona } from '@daytona/sdk';
import { env } from '../env.js';

const daytona = new Daytona({
  apiKey: env.DAYTONA_API_KEY,
  ...(env.DAYTONA_API_URL ? { apiUrl: env.DAYTONA_API_URL } : {}),
});

const PORT_IN_SANDBOX = 3000;
const SESSION_ID = 'app-server';

export async function runVariant(serverJs: string): Promise<{ previewUrl: string; sandboxId: string }> {
  // public: true - the preview URL needs to be openable directly by a demo audience,
  // not gated behind Daytona's own account login.
  // ttlMinutes: 30 - safety net so sandboxes self-destroy even if a caller forgets to
  // clean up (each is only 3GiB, but the org's 30GiB total quota exhausts fast without
  // this - confirmed live when 10 accumulated test sandboxes blocked all new creation).
  const sandbox = await daytona.create({ language: 'javascript', public: true, ttlMinutes: 30 });

  await sandbox.fs.uploadFile(Buffer.from(serverJs, 'utf-8'), 'server.js');

  await sandbox.process.createSession(SESSION_ID);
  await sandbox.process.executeSessionCommand(SESSION_ID, {
    command: 'node server.js',
    runAsync: true,
  });

  // Give the server a moment to start listening before requesting a preview link.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Signed preview URL, not getPreviewLink: a plain preview link shows Daytona's own
  // "Preview URL Warning" interstitial on first browser visit, which a plain <iframe src>
  // or <a href> can't click through (no way to set the X-Daytona-Skip-Preview-Warning
  // header from either). The signed URL embeds its own auth token and bypasses the
  // warning entirely - Daytona's own docs recommend it specifically for iframe embeds.
  // Expiry set to match the sandbox's own ttlMinutes (30 min) with headroom, since the
  // sandbox is destroyed by then regardless.
  const preview = await sandbox.getSignedPreviewUrl(PORT_IN_SANDBOX, 3600);

  return { previewUrl: preview.url, sandboxId: sandbox.id };
}

export async function deleteSandbox(sandboxId: string): Promise<void> {
  const sandbox = await daytona.get(sandboxId);
  await sandbox.delete();
}
