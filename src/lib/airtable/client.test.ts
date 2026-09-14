import { describe, expect, it, vi } from 'vitest';
import { createAirtableClient, UPDATE_BATCH_SIZE } from '@/lib/airtable/client';

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

function setup(responses: Response[] = [], extra: { sleep?: (ms: number) => Promise<void>; random?: () => number } = {}) {
  const fetch = vi.fn<FetchLike>(async () => responses.shift() ?? json({ records: [] }));
  const sleep = extra.sleep ?? vi.fn(async () => {});
  const client = createAirtableClient({ token: 'pat-test-token', baseId: 'appTEST', fetch, sleep, random: extra.random });
  return { client, fetch, sleep };
}

describe('listAllRecords', () => {
  it('follows offsets until the last page and returns every record', async () => {
    const { client, fetch } = setup([
      json({ records: [{ id: 'rec1', fields: {} }], offset: 'page2' }),
      json({ records: [{ id: 'rec2', fields: {} }] }),
    ]);

    const records = await client.listAllRecords('tblGuests', ['fldA', 'fldB']);

    expect(records.map((record) => record.id)).toEqual(['rec1', 'rec2']);
    expect(fetch).toHaveBeenCalledTimes(2);
    const first = new URL(fetch.mock.calls[0][0]);
    expect(first.origin + first.pathname).toBe('https://api.airtable.com/v0/appTEST/tblGuests');
    expect(first.searchParams.get('pageSize')).toBe('100');
    expect(first.searchParams.get('returnFieldsByFieldId')).toBe('true');
    expect(first.searchParams.getAll('fields[]')).toEqual(['fldA', 'fldB']);
    expect(first.searchParams.has('offset')).toBe(false);
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get('offset')).toBe('page2');
  });

  it('sends the token as a bearer header', async () => {
    const { client, fetch } = setup();
    await client.listAllRecords('tblGuests', []);
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer pat-test-token');
  });

  it('throws with the status on a failed request without leaking the token', async () => {
    const { client } = setup([json({ error: { type: 'INVALID_PERMISSIONS' } }, 403)]);
    const error = await client.listAllRecords('tblGuests', []).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('403');
    expect((error as Error).message).not.toContain('pat-test-token');
  });
});

describe('updateRecords', () => {
  it('PATCHes updates in batches of 10', async () => {
    const { client, fetch } = setup();
    const updates = Array.from({ length: 23 }, (_, index) => ({ id: `rec${index}`, fields: { fldX: 'Yes' } }));

    await client.updateRecords('tblGuests', updates);

    expect(UPDATE_BATCH_SIZE).toBe(10);
    expect(fetch).toHaveBeenCalledTimes(3);
    const bodies = fetch.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
    expect(bodies.map((body) => body.records.length)).toEqual([10, 10, 3]);
    expect(bodies[2].records[2]).toEqual({ id: 'rec22', fields: { fldX: 'Yes' } });
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH');
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/v0/appTEST/tblGuests');
  });

  it('makes no request when there is nothing to update', async () => {
    const { client, fetch } = setup();
    await client.updateRecords('tblGuests', []);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('retries', () => {
  it('retries a 429 and succeeds on the second attempt', async () => {
    const { client, fetch, sleep } = setup([json({ error: { type: 'RATE_LIMITED' } }, 429), json({ records: [] })]);
    await client.listAllRecords('tblGuests', []);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('honors a numeric Retry-After header (capped, no jitter added)', async () => {
    const { client, sleep } = setup([
      json({ error: { type: 'RATE_LIMITED' } }, 429, { 'Retry-After': '2' }),
      json({ records: [] }),
    ]);
    await client.listAllRecords('tblGuests', []);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('throws after MAX_RETRIES exhausted on repeated 500s, including the status in the message', async () => {
    const { client, fetch } = setup([
      json({}, 500),
      json({}, 500),
      json({}, 500),
      json({}, 500),
      json({ records: [] }),
    ]);
    const error = await client.listAllRecords('tblGuests', []).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('500');
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('does not retry a non-retryable 4xx and does not sleep', async () => {
    const { client, fetch, sleep } = setup([json({ error: { type: 'INVALID' } }, 422)]);
    const error = await client.listAllRecords('tblGuests', []).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('422');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries a thrown network error and succeeds', async () => {
    const responses = [json({ records: [] })];
    const fetch = vi.fn<FetchLike>(async () => {
      if (fetch.mock.calls.length === 1) throw new TypeError('network error');
      return responses.shift() ?? json({ records: [] });
    });
    const sleep = vi.fn(async () => {});
    const client = createAirtableClient({ token: 'pat-test-token', baseId: 'appTEST', fetch, sleep });
    await client.listAllRecords('tblGuests', []);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('gives every request attempt an abort signal', async () => {
    const { client, fetch } = setup([json({ records: [] })]);
    await client.listAllRecords('tblGuests', []);
    expect(fetch.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
