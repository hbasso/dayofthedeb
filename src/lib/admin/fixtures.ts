import type { Invitation } from '@/types/domain';

const id = (label: string) => `rec${label}`.padEnd(17, '0');

/** Four households covering every counting case. "Today" for these fixtures is 2026-09-14. */
export const TODAY = '2026-09-14';

export const INVITATIONS: Invitation[] = [
  {
    id: id('Biggs'),
    household: 'The Biggs Family',
    email: 'biggs@example.com',
    guests: [
      { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman', respondedAt: '2026-09-10' },
      { id: id('Truman'), name: 'Truman Biggs', hasPlusOne: true, attending: null },
      { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: 'no', respondedAt: '2026-09-12' },
    ],
  },
  {
    id: id('Musgrove'),
    household: 'The Musgroves',
    guests: [
      { id: id('Sue'), name: 'Sue Musgrove', hasPlusOne: false, attending: 'yes', respondedAt: '2026-09-14' },
      { id: id('Emma'), name: 'Emma Musgrove', hasPlusOne: true, attending: 'yes', plusOneName: '   ', respondedAt: '2026-09-14' },
    ],
  },
  {
    id: id('Reyes'),
    household: 'Daniel & Sofía Reyes',
    guests: [
      { id: id('Daniel'), name: 'Daniel Reyes', hasPlusOne: false, attending: null },
      { id: id('Sofia'), name: 'Sofía Reyes', hasPlusOne: false, attending: null },
    ],
  },
  {
    id: id('Hunter'),
    household: 'Bill & Traci Hunter',
    guests: [
      { id: id('Bill'), name: 'Bill Hunter', hasPlusOne: true, attending: 'no', plusOneName: 'Host Prefilled', respondedAt: '2026-09-01' },
    ],
  },
];
