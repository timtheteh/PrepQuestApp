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

// Helper function to get a specific card design by index
export const getCardDesign = (index: number) => {
  return cardDesigns[index] || cardDesigns[0]; // Default to first design if index is out of bounds
};

// Type definition for card design
export interface CardDesign {
  background: any;
  pressed: any;
} 