import { describe, expect, it, vi } from 'vitest';
import { createAirtableClient, UPDATE_BATCH_SIZE } from '@/lib/airtable/client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function setup(responses: Response[] = []) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => responses.shift() ?? json({ records: [] }));
  const client = createAirtableClient({ token: 'pat-test-token', baseId: 'appTEST', fetch });
  return { client, fetch };
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
