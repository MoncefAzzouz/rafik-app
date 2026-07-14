// Launch coverage: Sétif wilaya. Keep in sync with backend/src/lib/locations.ts.
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

export const WILAYA_NAMES = Object.keys(WILAYAS);
export const DEFAULT_WILAYA = 'Sétif';
