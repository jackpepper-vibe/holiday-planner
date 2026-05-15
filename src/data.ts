export interface Day {
  date: string;       // YYYY-MM-DD
  overnight: string | null;
  tbd?: boolean;
}

export const TRIP_NAME = 'France 2026';

export const TRIP: Day[] = [
  { date: '2026-06-28', overnight: 'Ferry – Irish Ferries' },
  { date: '2026-06-29', overnight: 'Anse Du Brick' },
  { date: '2026-06-30', overnight: 'Anse Du Brick' },
  { date: '2026-07-01', overnight: 'Anse Du Brick' },
  { date: '2026-07-02', overnight: 'Anse Du Brick' },
  { date: '2026-07-03', overnight: 'Anse Du Brick' },
  { date: '2026-07-04', overnight: 'Mané Guernéhué' },
  { date: '2026-07-05', overnight: 'Mané Guernéhué' },
  { date: '2026-07-06', overnight: 'Mané Guernéhué' },
  { date: '2026-07-07', overnight: 'Mané Guernéhué' },
  { date: '2026-07-08', overnight: 'Mané Guernéhué' },
  { date: '2026-07-09', overnight: 'Mané Guernéhué' },
  { date: '2026-07-10', overnight: 'Mané Guernéhué' },
  { date: '2026-07-11', overnight: 'Mané Guernéhué' },
  { date: '2026-07-12', overnight: 'Puy du Fou' },
  { date: '2026-07-13', overnight: 'Puy du Fou' },
  { date: '2026-07-14', overnight: null, tbd: true },
  { date: '2026-07-15', overnight: 'Granville' },
  { date: '2026-07-16', overnight: 'Granville' },
  { date: '2026-07-17', overnight: 'Ferry – Irish Ferries' },
];

interface LocStyle { text: string; border: string }

const PALETTE: Array<{ keys: string[] } & LocStyle> = [
  { keys: ['Ferry'],   text: '#22d3ee', border: '#0e7490' },
  { keys: ['Anse'],    text: '#4ade80', border: '#15803d' },
  { keys: ['Guern'],   text: '#c084fc', border: '#7e22ce' },
  { keys: ['Puy'],     text: '#fb923c', border: '#c2410c' },
  { keys: ['Granv'],   text: '#f43f5e', border: '#be123c' },
];

export function locStyle(name: string): LocStyle {
  const entry = PALETTE.find(e => e.keys.some(k => name.includes(k)));
  return entry ?? { text: '#94a3b8', border: '#475569' };
}

export const LOCATION_ADDRESSES: Record<string, string> = {
  'Anse Du Brick':   '71 rue de la Carrière, 50330 Maupertus-sur-Mer, France',
  'Mané Guernéhué': '52 rue Mané er Groez, 56870 Baden, France',
  'Puy du Fou':      'Le Puy du Fou, 85590 Les Epesses, France',
  'Granville':       'ibis Granville, Rue des Isles, Port de Plaisance, 50400 Granville, France',
};
