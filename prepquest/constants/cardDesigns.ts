export const cardDesigns = [
  {
    background: require('@/assets/images/deckCover1.png'),
    pressed: require('@/assets/images/deckCover1Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover2.png'),
    pressed: require('@/assets/images/deckCover2Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover3.png'),
    pressed: require('@/assets/images/deckCover3Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover4.png'),
    pressed: require('@/assets/images/deckCover4Pressed.png'),
  },
];

export const AICardDesigns = [
  {
    background: require('@/assets/images/AIDeckCover1.png'),
    pressed: require('@/assets/images/AIDeckCover1Pressed.png'),
  },
  {
    background: require('@/assets/images/AIDeckCover2.png'),
    pressed: require('@/assets/images/AIDeckCover2Pressed.png'),
  },
  {
    background: require('@/assets/images/AIDeckCover3.png'),
    pressed: require('@/assets/images/AIDeckCover3Pressed.png'),
  },
];

export const deckDetailsCardDesigns = [
  require('@/assets/images/DeckDetailsBg1.png'),
  require('@/assets/images/DeckDetailsBg2.png'),
  require('@/assets/images/DeckDetailsBg3.png'),
  require('@/assets/images/DeckDetailsBg4.png'),
];

export const deckDetailsAICardDesigns = [
  require('@/assets/images/AIDeckDetailsBg1.png'),
  require('@/assets/images/AIDeckDetailsBg2.png'),
  require('@/assets/images/AIDeckDetailsBg3.png'),
]

// Helper function to get a specific card design by index
export const getCardDesign = (index: number) => {
  return cardDesigns[index] || cardDesigns[0]; // Default to first design if index is out of bounds
};

// Type definition for card design
export interface CardDesign {
  background: any;
  pressed: any;
} 