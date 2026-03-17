const menu = {
  categories: {
    cocktails: 'Cocktails',
    food: 'Food',
    wine: 'Wine',
    hookah: 'Hookah',
  },
  items: {
    c1: {
      name: 'Esco Sunset',
      description:
        'Passion fruit, rum, lime, topped with prosecco & edible flowers',
      tag: 'Signature',
    },
    c2: {
      name: 'Tokyo Drift',
      description: 'Japanese whisky, yuzu, shiso leaf, ginger foam',
    },
    c3: {
      name: 'Velvet Rose',
      description: 'Gin, rose water, lychee, elderflower tonic',
      tag: 'Popular',
    },
    c4: {
      name: 'Smoky Old Fashioned',
      description:
        'Bourbon, demerara, angostura, orange peel, smoked tableside',
    },
    f1: {
      name: 'Truffle Wagyu Sliders',
      description: 'A5 wagyu, truffle aioli, brioche bun, micro greens',
      tag: "Chef's Pick",
    },
    f2: {
      name: 'Tuna Tartare',
      description: 'Bluefin tuna, avocado mousse, sesame crisp, ponzu',
    },
    f3: {
      name: 'Lobster Tempura',
      description: 'Crispy lobster tail, wasabi mayo, pickled ginger',
    },
    f4: {
      name: 'Mezze Platter',
      description: "Hummus, baba ganoush, falafel, warm pita, za'atar",
    },
    w1: {
      name: 'Dom Pérignon 2013',
      description: 'Champagne, France — Elegant with notes of almond & citrus',
      tag: 'Premium',
    },
    w2: {
      name: 'Cloudy Bay Sauvignon',
      description: 'Marlborough, NZ — Crisp, tropical, refreshing',
    },
    w3: {
      name: 'Barolo Riserva 2016',
      description: 'Piedmont, Italy — Full-bodied, cherry, leather notes',
    },
    h1: {
      name: 'Double Apple Classic',
      description: 'Traditional blend with a sweet anise finish',
    },
    h2: {
      name: 'Esco Cloud Mix',
      description: 'Blueberry, mint & grape — our house special',
      tag: 'House Special',
    },
    h3: {
      name: 'Tropical Paradise',
      description: 'Mango, passion fruit & coconut with ice base',
    },
  },
} as const;

export default menu;
