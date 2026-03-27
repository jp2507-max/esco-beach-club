const menu = {
  categories: {
    cocktails: 'Cocktail',
    food: 'Thức ăn',
    wine: 'Rượu vang',
    hookah: 'Shisha',
  },
  items: {
    c1: {
      name: 'Esco Sunset',
      description:
        'Chanh dây, rum, chanh, phủ prosecco & hoa ăn được',
      tag: 'Đặc trưng',
    },
    c2: {
      name: 'Tokyo Drift',
      description: 'Whisky Nhật, yuzu, lá tía tô, bọt gừng',
    },
    c3: {
      name: 'Velvet Rose',
      description: 'Gin, nước hoa hồng, vải, tonic elderflower',
      tag: 'Phổ biến',
    },
    c4: {
      name: 'Smoky Old Fashioned',
      description:
        'Bourbon, demerara, angostura, vỏ cam, hun khói tại bàn',
    },
    f1: {
      name: 'Truffle Wagyu Sliders',
      description: 'Wagyu A5, sốt truffle aioli, bánh brioche, rau micro',
      tag: 'Lựa chọn của Đầu bếp',
    },
    f2: {
      name: 'Tuna Tartare',
      description: 'Cá ngừ vây xanh, mousse bơ, giòn mè, ponzu',
    },
    f3: {
      name: 'Lobster Tempura',
      description: 'Đuôi tôm hùm giòn, sốt wasabi mayo, gừng ngâm',
    },
    f4: {
      name: 'Mezze Platter',
      description: 'Hummus, baba ganoush, falafel, bánh pita ấm, za\'atar',
    },
    w1: {
      name: 'Dom Pérignon 2013',
      description: 'Champagne, Pháp — Thanh lịch với hương hạnh nhân & cam quýt',
      tag: 'Cao cấp',
    },
    w2: {
      name: 'Cloudy Bay Sauvignon',
      description: 'Marlborough, NZ — Thanh mát, nhiệt đới, sảng khoái',
    },
    w3: {
      name: 'Barolo Riserva 2016',
      description: 'Piedmont, Ý — Đậm đà, anh đào, hương da thuộc',
    },
    h1: {
      name: 'Double Apple Classic',
      description: 'Pha truyền thống với hậu vị hồi ngọt',
    },
    h2: {
      name: 'Esco Cloud Mix',
      description: 'Việt quất, bạc hà & nho — đặc sản nhà của chúng tôi',
      tag: 'Đặc sản Nhà',
    },
    h3: {
      name: 'Tropical Paradise',
      description: 'Xoài, chanh dây & dừa với đế đá',
    },
  },
} as const;

export default menu;
