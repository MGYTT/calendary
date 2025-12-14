// Typy dla kuponów
export interface Coupon {
  id: number;
  day: number;
  title: string;
  description: string;
  validUntil: string;
  emoji: string;
  color: string;
  category: CouponCategory;
  difficulty: 'easy' | 'medium' | 'special';
  tags: string[];
  redeemInstructions?: string;
}

// Kategorie kuponów
export enum CouponCategory {
  ROMANTIC = 'romantic',
  RELAXATION = 'relaxation',
  ADVENTURE = 'adventure',
  HOME = 'home',
  CREATIVE = 'creative',
  SURPRISE = 'surprise',
}

// Konfiguracja kolorów według kategorii
export const categoryColors: Record<CouponCategory, string> = {
  [CouponCategory.ROMANTIC]: 'bg-gradient-to-br from-pink-500 to-rose-600',
  [CouponCategory.RELAXATION]: 'bg-gradient-to-br from-purple-500 to-indigo-600',
  [CouponCategory.ADVENTURE]: 'bg-gradient-to-br from-orange-500 to-red-600',
  [CouponCategory.HOME]: 'bg-gradient-to-br from-blue-500 to-cyan-600',
  [CouponCategory.CREATIVE]: 'bg-gradient-to-br from-yellow-500 to-amber-600',
  [CouponCategory.SURPRISE]: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
};

// Główna lista kuponów - 24 unikalne pomysły
export const coupons: Coupon[] = [
  // Tydzień 1 - Relaks i Romansy
  {
    id: 1,
    day: 1,
    title: 'Profesjonalny Masaż',
    description: 'Pełny masaż ciała (oczywiście wykonany przezemnie) (15 min)',
    validUntil: '31.01.2026',
    emoji: '💆‍♀️',
    color: categoryColors[CouponCategory.RELAXATION],
    category: CouponCategory.RELAXATION,
    difficulty: 'easy',
    tags: ['relaks', 'spa', 'masaż'],
    redeemInstructions: 'Wybierz wieczór, przygotuj muzykę i świece.',
  },
  {
    id: 2,
    day: 2,
    title: 'Kolacja przy Świecach',
    description: 'Romantyczna kolacja oczywiście w domu',
    validUntil: '14.02.2026',
    emoji: '🕯️',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'medium',
    tags: ['romantyczne', 'kolacja', 'wino'],
    redeemInstructions: 'Rezerwacja 1 dzień wcześniej.',
  },
  {
    id: 3,
    day: 3,
    title: 'Kino Domowe Premium',
    description: 'Film do wyboru + popcorn, nachos i Twoje ulubione słodycze',
    validUntil: '31.01.2026',
    emoji: '🎬',
    color: categoryColors[CouponCategory.HOME],
    category: CouponCategory.HOME,
    difficulty: 'easy',
    tags: ['film', 'relaks', 'przekąski'],
    redeemInstructions: 'Ty wybierasz film, ja przygotowuję wszystko inne!',
  },
  {
    id: 4,
    day: 4,
    title: 'Śniadanie Marzeń',
    description: 'Śniadanie do łóżka z wszystkim czego zapragniesz',
    validUntil: '15.02.2026',
    emoji: '🥐',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'easy',
    tags: ['śniadanie', 'łóżko', 'pampering'],
    redeemInstructions: 'Powiedz mi wieczorem czego chcesz na śniadanie!',
  },
  {
    id: 5,
    day: 5,
    title: 'Nocny Spacer pod Gwiazdami',
    description: 'Romantyczny spacer',
    validUntil: '28.02.2026',
    emoji: '✨',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'easy',
    tags: ['spacer', 'romantyczne', 'gwiazdy'],
    redeemInstructions: 'Najlepiej w bezchmurną noc. Ubierz się ciepło!',
  },
  {
    id: 6,
    day: 6,
    title: 'Shopping Spree',
    description: 'Wspólne zakupy + bon prezentowy 200 zł',
    validUntil: '31.03.2026',
    emoji: '🛍️',
    color: categoryColors[CouponCategory.SURPRISE],
    category: CouponCategory.SURPRISE,
    difficulty: 'special',
    tags: ['zakupy', 'prezent', 'shopping'],
    redeemInstructions: 'Wybierz sklep i dzień, reszta na mnie!',
  },
  {
    id: 7,
    day: 7,
    title: 'Dzień Królowej',
    description: 'Robię WSZYSTKIE rzeczy co tylko mi powiesz i sobie zażyczysz',
    validUntil: '31.01.2026',
    emoji: '👑',
    color: categoryColors[CouponCategory.HOME],
    category: CouponCategory.HOME,
    difficulty: 'easy',
    tags: ['relaks', 'domowe', 'pomoc'],
    redeemInstructions: 'Ty odpoczniesz, ja zajmę się wszystkim!',
  },

  // Tydzień 2 - Kreatywność i Przygody
  {
    id: 8,
    day: 8,
    title: 'Czas dla Siebie',
    description: '4 godziny tylko dla Ciebie - zero pytań, zero przeszkadzania',
    validUntil: '28.02.2026',
    emoji: '🎨',
    color: categoryColors[CouponCategory.RELAXATION],
    category: CouponCategory.RELAXATION,
    difficulty: 'easy',
    tags: ['hobby', 'czas', 'wolność'],
    redeemInstructions: 'Rób co chcesz, kiedy chcesz. Nawet nie zapytam "co robisz?" 😊',
  },
  {
    id: 9,
    day: 9,
    title: 'Wieczór Gier',
    description: 'Planszówki, gry karciane lub gry video - Ty wybierasz!',
    validUntil: '31.01.2026',
    emoji: '🎮',
    color: categoryColors[CouponCategory.HOME],
    category: CouponCategory.HOME,
    difficulty: 'easy',
    tags: ['gry', 'zabawa', 'razem'],
    redeemInstructions: 'Przygotowuję przekąski i napoje!',
  },
  {
    id: 10,
    day: 10,
    title: 'Domowe SPA Day',
    description: 'Kąpiel z bombami, maseczki, paznokcie, relaks total oczywiście do zrealizowania gdy będziemy razem mieszkać',
    validUntil: '31.01.2030',
    emoji: '🛁',
    color: categoryColors[CouponCategory.RELAXATION],
    category: CouponCategory.RELAXATION,
    difficulty: 'medium',
    tags: ['spa', 'relaks', 'pampering'],
    redeemInstructions: 'Mam bomby do kąpieli, świece i maseczki. Przygotowuję wszystko!',
  },
  {
    id: 11,
    day: 11,
    title: 'Wycieczka Niespodzianka',
    description: 'Jednodniowa wycieczka w tajemnicze miejsce (tylko dla Ciebie!)',
    validUntil: '30.04.2026',
    emoji: '🚗',
    color: categoryColors[CouponCategory.ADVENTURE],
    category: CouponCategory.ADVENTURE,
    difficulty: 'special',
    tags: ['wycieczka', 'przygoda', 'niespodzianka'],
    redeemInstructions: 'Rezerwuj weekend wcześniej. Wszystko już zaplanowane!',
  },
  {
    id: 12,
    day: 12,
    title: 'Twoja Osobista Playlista',
    description: 'Stworzona specjalnie dla Ciebie playlista z 50 utworami',
    validUntil: '31.12.2026',
    emoji: '🎵',
    color: categoryColors[CouponCategory.CREATIVE],
    category: CouponCategory.CREATIVE,
    difficulty: 'easy',
    tags: ['muzyka', 'playlist', 'osobiste'],
    redeemInstructions: 'Playlist będzie zawierać utwory które Ci się kojarzą z nami!',
  },
  {
    id: 13,
    day: 13,
    title: 'Masaż Stóp',
    description: 'Relaksujący masaż stóp',
    validUntil: '28.02.2026',
    emoji: '👣',
    color: categoryColors[CouponCategory.RELAXATION],
    category: CouponCategory.RELAXATION,
    difficulty: 'easy',
    tags: ['masaż', 'stopy', 'pedicure'],
    redeemInstructions: 'reszta na mnie!',
  },
  {
    id: 14,
    day: 14,
    title: 'Sesja Zdjęciowa',
    description: 'Profesjonalna sesja zdjęciowa w miejscu do wyboru + obróbka',
    validUntil: '31.05.2026',
    emoji: '📸',
    color: categoryColors[CouponCategory.CREATIVE],
    category: CouponCategory.CREATIVE,
    difficulty: 'special',
    tags: ['zdjęcia', 'wspomnienia', 'sesja'],
    redeemInstructions: 'Wybierz miejsce (park, miasto,). Zdjęcia dostajesz w formie cyfrowej!',
  },

  // Tydzień 3 - Wspólne Chwile
  {
    id: 15,
    day: 15,
    title: 'Maraton Serialowy',
    description: 'Cały dzień oglądania Twojego ulubionego serialu + pizza',
    validUntil: '31.01.2026',
    emoji: '🍿',
    color: categoryColors[CouponCategory.HOME],
    category: CouponCategory.HOME,
    difficulty: 'easy',
    tags: ['serial', 'netflix', 'relaks'],
    redeemInstructions: 'Ty wybierasz serial, ja zamawiam pizzę!',
  },
  {
    id: 16,
    day: 16,
    title: 'Ciasto od Podstaw',
    description: 'Upiekę Twoje ulubione ciasto według Twojej ulubionej receptury (JAK SIĘ NAUCZĘ PIEC)',
    validUntil: '31.01.2028',
    emoji: '🎂',
    color: categoryColors[CouponCategory.HOME],
    category: CouponCategory.HOME,
    difficulty: 'medium',
    tags: ['ciasto', 'pieczenie', 'słodkości'],
    redeemInstructions: 'Powiedz jakie ciasto, ja zajmę się resztą!',
  },
  {
    id: 17,
    day: 17,
    title: 'Nieograniczony Poranek',
    description: 'Śpij ile chcesz - zero budzenia, zero obowiązków',
    validUntil: '28.02.2026',
    emoji: '😴',
    color: categoryColors[CouponCategory.RELAXATION],
    category: CouponCategory.RELAXATION,
    difficulty: 'easy',
    tags: ['sen', 'odpoczynek', 'poranek'],
    redeemInstructions: 'Idealny na leniwą sobotę lub niedzielę!',
  },
  {
    id: 18,
    day: 18,
    title: 'Piknik Romantyczny',
    description: 'Piknik w parku z koszem pełnym przysmaków (gdy będzie cieplej)',
    validUntil: '30.07.2026',
    emoji: '🧺',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'medium',
    tags: ['piknik', 'natura', 'romantyczne'],
    redeemInstructions: 'Idealny na wiosnę/lato. Koc i kosz przygotuję ja!',
  },
  {
    id: 19,
    day: 19,
    title: 'Kupon na "nieograniczone przytulanie"',
    description: 'Cały wieczór poświęcony tylko na przytulanie – bez limitu czasu, bez przerwy na telefon czy obowiązki. Koc, poduszki, ciepła herbata i my dwoje wtuleni w siebie. Idealny na zimny wieczór, kiedy chcesz czuć bliskość i bezpieczeństwo w moich ramionach. Trzymam Cię tak długo, jak zechcesz... ♾️❤️',
    validUntil: '28.02.2026',
    emoji: '💕',
    color: categoryColors[CouponCategory.CREATIVE],
    category: CouponCategory.CREATIVE,
    difficulty: 'medium',
    tags: ['wieczór', 'przytulanie', 'czas'],
    redeemInstructions: 'Wieczorne przytulanie kiedy chcesz',
  },
  {
    id: 20,
    day: 20,
    title: 'List Miłosny',
    description: 'Odręcznie napisany list opisujący dlaczego Cię kocham',
    validUntil: '14.02.2026',
    emoji: '💌',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'easy',
    tags: ['list', 'romantyczne', 'słowa'],
    redeemInstructions: 'List dostajesz w eleganciej kopercie!',
  },
  {
    id: 21,
    day: 21,
    title: 'Nagrane voice message playlist',
    description: '10 krótkich nagrań z komplementami (do słuchania kiedy chce).',
    validUntil: '28.02.2026',
    emoji: '🔊',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'medium',
    tags: ['voice', 'nagrania', 'message'],
    redeemInstructions: '10 krótkich nagrań z komplementami!',
  },

  // Tydzień 4 - Wielki Finał
  {
    id: 22,
    day: 22,
    title: 'Kolacja w Restauracji',
    description: 'Romantyczna kolacja w restauracji',
    validUntil: '31.03.2026',
    emoji: '🍽️',
    color: categoryColors[CouponCategory.SURPRISE],
    category: CouponCategory.SURPRISE,
    difficulty: 'special',
    tags: ['restauracja', 'kolacja', 'wyjście'],
    redeemInstructions: 'Wybierz restaurację o której marzyłaś!',
  },
  {
    id: 23,
    day: 23,
    title: 'Dzień Tylko dla Ciebie',
    description: 'Cały dzień poświęcony Tobie - robimy to co Ty chcesz',
    validUntil: '28.02.2026',
    emoji: '💝',
    color: categoryColors[CouponCategory.ROMANTIC],
    category: CouponCategory.ROMANTIC,
    difficulty: 'special',
    tags: ['dzień', 'pampering', 'królowa'],
    redeemInstructions: 'Planujesz wszystko, ja wykonuję. Twoje życzenie to rozkaz!',
  },
  {
    id: 24,
    day: 24,
    title: '🎁 NIESPODZIANKA FINAŁOWA 🎁',
    description: 'Specjalny prezent który zmieni wszystko... Szczegóły 24 grudnia!',
    validUntil: '31.12.2026',
    emoji: '🎁',
    color: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x',
    category: CouponCategory.SURPRISE,
    difficulty: 'special',
    tags: ['niespodzianka', 'prezent', 'specjalne'],
    redeemInstructions: '✨ To będzie coś wyjątkowego... Zaufaj mi! ✨',
  },
];

// Pomocnicze funkcje
export const getCouponsByCategory = (category: CouponCategory): Coupon[] => {
  return coupons.filter((coupon) => coupon.category === category);
};

export const getCouponById = (id: number): Coupon | undefined => {
  return coupons.find((coupon) => coupon.id === id);
};

export const getCouponsByDifficulty = (difficulty: 'easy' | 'medium' | 'special'): Coupon[] => {
  return coupons.filter((coupon) => coupon.difficulty === difficulty);
};

export const getRedeemedCoupons = (redeemedIds: number[]): Coupon[] => {
  return coupons.filter((coupon) => redeemedIds.includes(coupon.id));
};

export const getCouponStats = (redeemedIds: number[]) => {
  const total = coupons.length;
  const redeemed = redeemedIds.length;
  const remaining = total - redeemed;
  
  const categoryCounts = coupons.reduce((acc, coupon) => {
    acc[coupon.category] = (acc[coupon.category] || 0) + 1;
    return acc;
  }, {} as Record<CouponCategory, number>);

  const redeemedByCategory = getRedeemedCoupons(redeemedIds).reduce((acc, coupon) => {
    acc[coupon.category] = (acc[coupon.category] || 0) + 1;
    return acc;
  }, {} as Record<CouponCategory, number>);

  return {
    total,
    redeemed,
    remaining,
    percentage: Math.round((redeemed / total) * 100),
    categoryCounts,
    redeemedByCategory,
  };
};

// Export default
export default coupons;
