import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { parseJsonBody } from './json-body-middleware';

interface FakeRequest extends EventEmitter {
  headers: Record<string, string>;
  body?: unknown;
  destroy: () => void;
}

/** Minimal fake request/response satisfying only what parseJsonBody actually uses. */
type FakeJsonRequest = IncomingMessage & { body?: unknown };
type FakeJsonResponse = ServerResponse;

const asRequest = (req: FakeRequest): FakeJsonRequest => req as unknown as FakeJsonRequest;
const asResponse = (res: ReturnType<typeof createResponse>): FakeJsonResponse =>
  res as unknown as FakeJsonResponse;

function createRequest(headers: Record<string, string> = {}): FakeRequest {
  const req = new EventEmitter() as FakeRequest;
  req.headers = headers;
  req.destroy = vi.fn();
  return req;
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    ended: false,
    body: undefined as string | undefined,
    end(data?: string) {
      this.ended = true;
      this.body = data;
    },
  };
}

function emitBody(req: FakeRequest, body: string): void {
  if (body) {
    req.emit('data', Buffer.from(body, 'utf8'));
  }
  req.emit('end');
}

describe('parseJsonBody', () => {
  it('parses a valid JSON body when Content-Type is application/json', () => {
    const req = createRequest({ 'content-type': 'application/json' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);
    emitBody(req, JSON.stringify({ name: 'Test' }));

    expect(req.body).toEqual({ name: 'Test' });
    expect(next).toHaveBeenCalledWith();
  });

  it('handles application/json with a charset suffix', () => {
    const req = createRequest({ 'content-type': 'application/json; charset=utf-8' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);
    emitBody(req, JSON.stringify({ ok: true }));

    expect(req.body).toEqual({ ok: true });
    expect(next).toHaveBeenCalledWith();
  });

  it('sets body to undefined and calls next for empty body', () => {
    const req = createRequest({ 'content-type': 'application/json' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);
    emitBody(req, '');

    expect(req.body).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('skips parsing and calls next when Content-Type is not JSON', () => {
    const req = createRequest({ 'content-type': 'text/plain' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toBeUndefined();
  });

  it('skips parsing and calls next when Content-Type header is missing', () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('does not re-read the stream if body is already set', () => {
    const req = createRequest({ 'content-type': 'application/json' });
    req.body = { alreadyParsed: true };
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ alreadyParsed: true });
  });

  it('responds with 400 and does not call next on invalid JSON', () => {
    const req = createRequest({ 'content-type': 'application/json' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);
    emitBody(req, 'not valid json{{{');

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.ended).toBe(true);
    expect(JSON.parse(res.body ?? '{}')).toEqual({ error: 'Invalid JSON in request body' });
  });

  it('responds with 413 and destroys the request when the body is too large', () => {
    const req = createRequest({ 'content-type': 'application/json' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);
    // Emit a chunk larger than the 5MB limit
    req.emit('data', Buffer.alloc(6 * 1024 * 1024, 'a'));

    expect(res.statusCode).toBe(413);
    expect(res.ended).toBe(true);
    expect(req.destroy).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with the error when the request stream errors', () => {
    const req = createRequest({ 'content-type': 'application/json' });
    const res = createResponse();
    const next = vi.fn();

    parseJsonBody(asRequest(req), asResponse(res), next);
    const error = new Error('stream error');
    req.emit('error', error);

    expect(next).toHaveBeenCalledWith(error);
  });
});
