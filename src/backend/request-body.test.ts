import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type { AdminRequest } from './request-body';
import { getRequestBody, RequestBodyError } from './request-body';

interface FakeRequest extends EventEmitter {
  headers: Record<string, string>;
  body?: unknown;
  destroy: () => void;
}

const asRequest = (req: FakeRequest): AdminRequest => req as unknown as AdminRequest;

function createRequest(headers: Record<string, string> = {}): FakeRequest {
  const req = new EventEmitter() as FakeRequest;
  req.headers = headers;
  req.destroy = vi.fn();
  return req;
}

function emitBody(req: FakeRequest, body: string): void {
  if (body) {
    req.emit('data', Buffer.from(body, 'utf8'));
  }
  req.emit('end');
}

describe('getRequestBody', () => {
  it('parses a valid JSON body when Content-Type is application/json', async () => {
    const req = createRequest({ 'content-type': 'application/json' });

    const promise = getRequestBody(asRequest(req));
    emitBody(req, JSON.stringify({ name: 'Test' }));

    await expect(promise).resolves.toEqual({ name: 'Test' });
    expect(req.body).toEqual({ name: 'Test' });
  });

  it('handles application/json with a charset suffix', async () => {
    const req = createRequest({ 'content-type': 'application/json; charset=utf-8' });

    const promise = getRequestBody(asRequest(req));
    emitBody(req, JSON.stringify({ ok: true }));

    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('resolves undefined for an empty body', async () => {
    const req = createRequest({ 'content-type': 'application/json' });

    const promise = getRequestBody(asRequest(req));
    emitBody(req, '');

    await expect(promise).resolves.toBeUndefined();
    expect(req.body).toBeUndefined();
  });

  it('resolves undefined without reading the stream when Content-Type is not JSON', async () => {
    const req = createRequest({ 'content-type': 'text/plain' });

    await expect(getRequestBody(asRequest(req))).resolves.toBeUndefined();
    expect(req.body).toBeUndefined();
  });

  it('resolves undefined when Content-Type header is missing', async () => {
    const req = createRequest();

    await expect(getRequestBody(asRequest(req))).resolves.toBeUndefined();
  });

  it('does not re-read the stream if body is already set', async () => {
    const req = createRequest({ 'content-type': 'application/json' });
    req.body = { alreadyParsed: true };

    await expect(getRequestBody(asRequest(req))).resolves.toEqual({ alreadyParsed: true });
  });

  it('memoizes the result so the stream is only read once per request', async () => {
    const req = createRequest({ 'content-type': 'application/json' });

    const first = getRequestBody(asRequest(req));
    const second = getRequestBody(asRequest(req));
    emitBody(req, JSON.stringify({ once: true }));

    await expect(first).resolves.toEqual({ once: true });
    await expect(second).resolves.toEqual({ once: true });
    expect(first).toBe(second);
  });

  it('rejects with a 400 RequestBodyError on invalid JSON', async () => {
    const req = createRequest({ 'content-type': 'application/json' });

    const promise = getRequestBody(asRequest(req));
    emitBody(req, 'not valid json{{{');

    await expect(promise).rejects.toMatchObject(
      new RequestBodyError(400, 'Invalid JSON in request body')
    );
  });

  it('rejects with a 413 RequestBodyError and destroys the request when the body is too large', async () => {
    const req = createRequest({ 'content-type': 'application/json' });

    const promise = getRequestBody(asRequest(req));
    // Emit a chunk larger than the 5MB limit
    req.emit('data', Buffer.alloc(6 * 1024 * 1024, 'a'));

    await expect(promise).rejects.toMatchObject(
      new RequestBodyError(413, 'Request body too large')
    );
    expect(req.destroy).toHaveBeenCalled();
  });

  it('rejects with the error when the request stream errors', async () => {
    const req = createRequest({ 'content-type': 'application/json' });

    const promise = getRequestBody(asRequest(req));
    const error = new Error('stream error');
    req.emit('error', error);

    await expect(promise).rejects.toBe(error);
  });
});
