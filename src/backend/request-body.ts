/**
 * Request shape this module reads from. Kept minimal (rather than importing express's or
 * node:http's types) since express is not a dependency of this module - it is provided at
 * runtime by MagicMirror core's `expressApp`. The streaming members (`headers`/`on`/`destroy`)
 * are only needed when a body hasn't already been parsed and must be read off the raw request;
 * they're optional here so plain request objects (e.g. in tests, where `body` is always
 * pre-populated) satisfy this type without needing a real `IncomingMessage`.
 */
export interface AdminRequest {
  params: Record<string, string>;
  body: unknown;
  query?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  on?(event: 'data', listener: (chunk: Buffer) => void): unknown;
  on?(event: 'end', listener: () => void): unknown;
  on?(event: 'error', listener: (error: Error) => void): unknown;
  destroy?(): void;
  /** Memoized body-parsing promise, cached per-request so the raw stream is only ever read once. */
  _bodyPromise?: Promise<unknown>;
}

/** Error thrown by `getRequestBody` for malformed/oversized bodies, carrying the HTTP status to respond with. */
export class RequestBodyError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'RequestBodyError';
    this.statusCode = statusCode;
  }
}

/** Reject bodies larger than this to avoid unbounded memory use from a bad/malicious request. */
const MAX_BODY_BYTES = 5 * 1024 * 1024;

/**
 * Lazily read and parse a request's JSON body, without registering any Express middleware.
 *
 * Each route handler calls this directly (rather than reading `req.body`), so the raw request
 * stream is only ever consumed by our own route handlers - never by an `app.use()` middleware
 * that could also run for (and interfere with) other modules' routes on the shared MagicMirror
 * core `expressApp`. The result is memoized per-request so multiple calls (e.g. from a PIN check
 * and the handler itself) share a single read of the stream.
 *
 * If some other module's middleware already parsed the body (e.g. it registered its own
 * `express.json()` earlier in the shared app), `req.body` will already be set and is used as-is.
 */
export function getRequestBody(req: AdminRequest): Promise<unknown> {
  if (req._bodyPromise) return req._bodyPromise;

  if (req.body !== undefined) {
    req._bodyPromise = Promise.resolve(req.body);
    return req._bodyPromise;
  }

  req._bodyPromise = new Promise((resolve, reject) => {
    // `headers`/`on` are only absent on the plain objects used in tests, where `body` is
    // always pre-populated and this branch is never reached in practice - but guard anyway
    // rather than assume.
    if (!req.on || !req.headers) {
      resolve(undefined);
      return;
    }

    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      resolve(undefined);
      return;
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        settled = true;
        req.destroy?.();
        reject(new RequestBodyError(413, 'Request body too large'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        req.body = undefined;
        resolve(undefined);
        return;
      }
      try {
        req.body = JSON.parse(raw);
      } catch {
        reject(new RequestBodyError(400, 'Invalid JSON in request body'));
        return;
      }
      resolve(req.body);
    });

    req.on('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });

  return req._bodyPromise;
}
