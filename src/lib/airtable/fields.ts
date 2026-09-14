// Table and field IDs for the "Deb Party 2026" base. IDs survive renames in the Airtable UI.
// If the base is ever rebuilt, update these from the Airtable API or MCP schema.
export const AIRTABLE = {
  invitations: {
    tableId: 'tblw0nsKF2scJRMAP',
    fields: {
      household: 'fldkiVYYRyX3FKU8Z',
      email: 'fldW2GJkEKK343mJj',
      guests: 'fld6B3KxjlVDGjMbC',
    },
  },
  guests: {
    tableId: 'tblZAKY7pnmaq7ZfO',
    fields: {
      name: 'fldMOgGzV24ZqOHgB',
      altNames: 'fldwDaBCmyEnnRWmO',
      hasPlusOne: 'fldpvqItoM49Roi4s',
      attending: 'fldyYDBE9nAaLCPMP',
      plusOneName: 'fldoKigO1sGobrbof',
      respondedAt: 'fldHgJkNQsT2C1uuc',
      invitation: 'fldygUHX9dIeIp7sJ',
    },
  },
} as const;
