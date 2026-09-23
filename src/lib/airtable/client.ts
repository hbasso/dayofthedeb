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

export const MAX_RETRIES = 3;
export const BASE_RETRY_DELAY_MS = 500;
export const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRY_AFTER_MS = 30_000;
const MAX_JITTER_MS = 250;

interface ListPage {
  records: AirtableRecord[];
  offset?: string;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Delay before retry attempt n (1-based). Retry-After (seconds) wins when present, capped; otherwise exponential backoff plus jitter. */
function retryDelayMs(attempt: number, retryAfterHeader: string | null, random: () => number): number {
  const retryAfterSeconds = retryAfterHeader === null ? NaN : Number(retryAfterHeader);
  // Only a positive delay is worth honoring. Number('') is 0, so a present-but-empty header --
  // like a literal "0" or a negative one -- would otherwise mean "retry immediately" against an
  // endpoint that just asked us to wait, burning every retry in milliseconds. Fall back to backoff.
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, MAX_RETRY_AFTER_MS);
  }
  const backoff = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
  return backoff + random() * MAX_JITTER_MS;
}

export function createAirtableClient(options: {
  token: string;
  baseId: string;
  fetch?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}): AirtableClient {
  const doFetch = options.fetch ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const headers = { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' };

  async function request<T>(tablePath: string, init: RequestInit = {}): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let response: Response;
      try {
        response = await doFetch(`${API_ROOT}/${options.baseId}/${tablePath}`, {
          ...init,
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        lastError = error;
        if (attempt >= MAX_RETRIES) throw error;
        await sleep(retryDelayMs(attempt + 1, null, random));
        continue;
      }

      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          await sleep(retryDelayMs(attempt + 1, response.headers.get('Retry-After'), random));
          continue;
        }
        const detail = (await response.text()).slice(0, 300);
        const table = tablePath.split('?')[0];
        throw new Error(`Airtable ${init.method ?? 'GET'} ${table} failed with ${response.status}: ${detail}`);
      }

      return (await response.json()) as T;
    }
    throw lastError;
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
