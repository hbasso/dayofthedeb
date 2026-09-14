import 'server-only';
import { readRequiredEnv } from '@/lib/env';

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

export interface RecordUpdate {
  id: string;
  fields: Record<string, unknown>;
}

export interface AirtableClient {
  listAllRecords(tableId: string, fieldIds: readonly string[]): Promise<AirtableRecord[]>;
  updateRecords(tableId: string, updates: readonly RecordUpdate[]): Promise<void>;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const API_ROOT = 'https://api.airtable.com/v0';
const PAGE_SIZE = 100; // Airtable maximum
export const UPDATE_BATCH_SIZE = 10; // Airtable maximum per PATCH

interface ListPage {
  records: AirtableRecord[];
  offset?: string;
}

export function createAirtableClient(options: { token: string; baseId: string; fetch?: FetchLike }): AirtableClient {
  const doFetch = options.fetch ?? fetch;
  const headers = { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' };

  async function request<T>(tablePath: string, init: RequestInit = {}): Promise<T> {
    const response = await doFetch(`${API_ROOT}/${options.baseId}/${tablePath}`, { ...init, headers });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      const table = tablePath.split('?')[0];
      throw new Error(`Airtable ${init.method ?? 'GET'} ${table} failed with ${response.status}: ${detail}`);
    }
    return (await response.json()) as T;
  }

  return {
    async listAllRecords(tableId, fieldIds) {
      const records: AirtableRecord[] = [];
      let offset: string | undefined;
      do {
        const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), returnFieldsByFieldId: 'true' });
        for (const fieldId of fieldIds) params.append('fields[]', fieldId);
        if (offset) params.set('offset', offset);
        const page = await request<ListPage>(`${tableId}?${params}`);
        records.push(...page.records);
        offset = page.offset;
      } while (offset);
      return records;
    },

    async updateRecords(tableId, updates) {
      for (let start = 0; start < updates.length; start += UPDATE_BATCH_SIZE) {
        const records = updates.slice(start, start + UPDATE_BATCH_SIZE);
        await request(tableId, { method: 'PATCH', body: JSON.stringify({ records, returnFieldsByFieldId: true }) });
      }
    },
  };
}

export function getAirtableClient(): AirtableClient {
  return createAirtableClient({
    token: readRequiredEnv('AIRTABLE_TOKEN'),
    baseId: readRequiredEnv('AIRTABLE_BASE_ID'),
  });
}
