// Launch coverage: Sétif wilaya. Add more wilayas/communes as the service expands.
export const WILAYAS: Record<string, string[]> = {
  'Sétif': [
    'Sétif',
    'El Eulma',
    'Aïn Arnat',
    'Aïn Oulmène',
    'Aïn Azel',
    'Aïn El Kebira',
    'Bougaa',
    'Djemila',
    'El Hamma',
    'Guedjel',
    'Mezloug',
    'Ouled Saber',
    'Salah Bey',
    'Bir El Arch',
    'Beni Aziz',
    'Amoucha',
    'Babor',
    'Hammam Guergour',
    'Maoklane',
    'Tala Ifacene',
  ],
};

export function isValidLocation(wilaya?: string | null, commune?: string | null): boolean {
  if (!wilaya) return false;
  const communes = WILAYAS[wilaya];
  if (!communes) return false;
  if (!commune) return true;
  return communes.includes(commune);
}
