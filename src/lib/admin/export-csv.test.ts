import { describe, expect, it } from 'vitest';
import {
  GUEST_LIST_COLUMNS,
  HEADCOUNT_COLUMNS,
  neutralizeCell,
  toCsv,
  toGuestListRows,
  toHeadcountRows,
} from '@/lib/admin/export-csv';
import { INVITATIONS, TODAY } from '@/lib/admin/fixtures';
import { toGuestRows } from '@/lib/admin/guest-rows';
import { computeStats } from '@/lib/admin/stats';

const CRLF = String.fromCharCode(13, 10);

describe('toHeadcountRows', () => {
  const rows = toHeadcountRows(INVITATIONS);

  it('has one row per person coming, with plus-ones on their own row', () => {
    expect(rows).toEqual([
      ['Grant Biggs', 'The Biggs Family', 'Guest', '', '2026-09-10'],
      ['Priya Raman', 'The Biggs Family', 'Plus-one', 'Grant Biggs', '2026-09-10'],
      ['Sue Musgrove', 'The Musgroves', 'Guest', '', '2026-09-14'],
      ['Emma Musgrove', 'The Musgroves', 'Guest', '', '2026-09-14'],
    ]);
  });

  it('always matches the headcount in the stats', () => {
    expect(rows).toHaveLength(computeStats(INVITATIONS, TODAY).headcount);
  });
});

describe('toGuestListRows', () => {
  it('lists every guest with a readable status', () => {
    const rows = toGuestListRows(toGuestRows(INVITATIONS));
    expect(rows).toHaveLength(8);
    expect(rows[1]).toEqual(['Truman Biggs', 'The Biggs Family', 'Awaiting', '', '']);
    expect(rows[0]).toEqual(['Grant Biggs', 'The Biggs Family', 'Attending', 'Priya Raman', '2026-09-10']);
  });
});

describe('neutralizeCell', () => {
  it('prefixes a leading = with a single quote', () => {
    expect(neutralizeCell('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
  });

  it('neutralizes a formula-looking value that carries a line break', () => {
    const value = '=1+1' + String.fromCharCode(10) + 'x';
    expect(neutralizeCell(value)).toBe(`'${value}`);
  });

  it('neutralizes when the first non-space character is a formula trigger', () => {
    expect(neutralizeCell('  =1')).toBe(`'  =1`);
  });

  it('neutralizes -, +, and @ triggers', () => {
    expect(neutralizeCell('-5')).toBe("'-5");
    expect(neutralizeCell('+1')).toBe("'+1");
    expect(neutralizeCell('@x')).toBe("'@x");
  });

  it('leaves ordinary names unchanged', () => {
    expect(neutralizeCell('Sofía Reyes')).toBe('Sofía Reyes');
    expect(neutralizeCell("O'Brien")).toBe("O'Brien");
  });

  it('neutralizes a leading tab', () => {
    expect(neutralizeCell(String.fromCharCode(9) + 'x')).toBe(`'${String.fromCharCode(9)}x`);
  });
});

describe('toCsv', () => {
  it('writes a header row and CRLF line endings', () => {
    const lines = toCsv(HEADCOUNT_COLUMNS, [['Sue Musgrove', 'The Musgroves', 'Guest', '', '2026-09-14']]).split(CRLF);
    expect(lines).toEqual(['Name,Household,Type,Guest Of,Responded', 'Sue Musgrove,The Musgroves,Guest,,2026-09-14']);
  });

  it('quotes commas and keeps accents', () => {
    const csv = toCsv(GUEST_LIST_COLUMNS, [['Sofía Reyes', 'Reyes, Daniel & Sofía', 'Awaiting', '', '']]);
    expect(csv).toContain('Sofía Reyes,"Reyes, Daniel & Sofía",Awaiting,,');
  });

  it('neutralizes guest-typed spreadsheet formulas', () => {
    const csv = toCsv(HEADCOUNT_COLUMNS, [['=HYPERLINK("x")', 'H', 'Plus-one', 'Grant Biggs', '']]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toContain(`,=HYPERLINK`);
  });

  it('neutralizes a formula value that carries a line break', () => {
    const value = '=1+1' + String.fromCharCode(10) + 'x';
    const csv = toCsv(HEADCOUNT_COLUMNS, [[value, 'H', 'Plus-one', 'Grant Biggs', '']]);
    // The neutralized, still-multiline cell survives quoted, with its embedded LF intact.
    expect(csv).toContain(`"'=1+1${String.fromCharCode(10)}x"`);
  });
});
