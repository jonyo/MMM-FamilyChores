import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Request shape this middleware populates. Kept minimal (rather than importing
 * express's types) since express is not a dependency of this module - it is
 * provided at runtime by MagicMirror core's `expressApp`.
 */
interface JsonBodyRequest extends IncomingMessage {
  body?: unknown;
}

/** Reject bodies larger than this to avoid unbounded memory use from a bad/malicious request. */
const MAX_BODY_BYTES = 5 * 1024 * 1024;

/**
 * Minimal stand-in for `express.json()`, implemented without adding express/body-parser
 * as a dependency (keeps the compiled node_helper.js small and avoids relying on whatever
 * body-parsing middleware, if any, other installed modules happen to register on the shared
 * MagicMirror core `expressApp`).
 *
 * Parses the raw request body into `req.body` when the `Content-Type` is `application/json`.
 * Leaves `req.body` as `undefined` for other content types or empty bodies, matching
 * `express.json()` behavior for GET/DELETE requests with no body.
 */
export function parseJsonBody(
  req: JsonBodyRequest,
  res: ServerResponse,
  next: (error?: unknown) => void
): void {
  // Body was already parsed by other middleware (e.g. another module's express.json())
  // - the request stream has likely already been consumed, so don't try to read it again.
  if (req.body !== undefined) {
    next();
    return;
  }

  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    next();
    return;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  let settled = false;

  const fail = (statusCode: number, message: string): void => {
    if (settled) return;
    settled = true;
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  };

  req.on('data', (chunk: Buffer) => {
    if (settled) return;
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      fail(413, 'Request body too large');
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (settled) return;
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw) {
      req.body = undefined;
      settled = true;
      next();
      return;
    }
    try {
      req.body = JSON.parse(raw);
    } catch {
      fail(400, 'Invalid JSON in request body');
      return;
    }
    settled = true;
    next();
  });

  req.on('error', (error) => {
    if (settled) return;
    settled = true;
    next(error);
  });
}
