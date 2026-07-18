/**
 * Parses a chat completion's raw text into { serverJs }. response_format: json_object
 * isn't always respected verbatim by every provider, so this falls back to stripping
 * a markdown code fence before giving up, rather than debugging that live on stage.
 */
export function parseServerJsResponse(raw: string): { serverJs: string } {
  const attempt = (text: string): { serverJs: string } => {
    const parsed = JSON.parse(text);
    if (typeof parsed?.serverJs !== 'string' || !parsed.serverJs.trim()) {
      throw new Error('Response JSON did not contain a non-empty "serverJs" string field');
    }
    return parsed as { serverJs: string };
  };

  try {
    return attempt(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return attempt(fenced[1]);
      } catch {
        // fall through to the error below
      }
    }
    throw new Error(`Response was not valid JSON with a "serverJs" field. Raw response:\n${raw}`);
  }
}

export const SERVER_JS_SYSTEM_PROMPT = `You generate a single self-contained Node.js website for a hackathon demo.
Respond with ONLY a JSON object of the shape {"serverJs": "<file contents>"} - no prose, no markdown fences.
The "serverJs" value must be the full contents of a single Node.js file that:
- uses ONLY Node's built-in "http" module (no require of any third-party package, no package.json, no npm install)
- listens on process.env.PORT (fallback 3000)
- serves a single inline HTML page (inline <style>, no external assets) representing the requested website idea
- responds to any request path with that same page (a simple single-page site is fine)
Keep the HTML tasteful and on-topic for the prompt, but keep the whole file compact.

CRITICAL syntax rule: the HTML (including any inline <script> for client-side behavior like
search/filter) is embedded in ONE JS template literal (backtick string) at the top of the Node
file. If that inline <script> itself needs a template literal (e.g. \`<div>${'$'}{item.name}</div>\`),
escaping only the backticks is NOT enough - the outer literal will still evaluate any unescaped
${'$'}{...} at Node parse time (in the Node scope, where the client-side variable doesn't exist),
crashing the server with "ReferenceError: x is not defined" before it ever starts listening.
Either escape both the backticks AND the dollar-brace (\\\` ... \\\${...}\\\`) in the inner client-side
template literal, or avoid nested template literals entirely by building client-side strings with
string concatenation (+) instead. Double-check this before answering - a crashed server is worse
than a plainer page.`;
