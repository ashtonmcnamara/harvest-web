export const DEMO_AUTH = {
  id: 'user_99',
  role: 'consumer',
  ownedFarmId: 'farm_123' 
};


// Shared profile data so we don't have to rewrite it 4 times for the demo
const defaultInfoCards = [
  { id: 'hours', title: 'Hours', icon: 'Clock', preview: 'Mon-Sat: 8am - 6pm\nSun: Closed', details: 'Extended hours during harvest season.' },
  { id: 'delivery', title: 'Delivery & Pickup', icon: 'Truck', preview: 'On-farm Pickup • Local Delivery ($5)', details: 'Delivery cut-off is Thursday at 5pm.' }
];

export const HARVEST_PRODUCT_CATEGORIES = [
  'Fruits & Veggies',
  'Dairy & Eggs',
  'Meat & Poultry',
  'Wine & Beer',
  'Jams & Jellies',
  'Grain & Legumes'
];

export const HARVEST_WEIGHT_UNITS = ['lb', 'g', 'kg', 'btl', 'dozen', 'piece', 'jar'];

export const MOCK_FARMS = [
  {
    id: 'farm_123',
    name: 'Valley View Organics',
    handle: '@valleyview',
    location: 'Annapolis Valley, NS',
    distance: '12 km away',
    isVerified: true,
    coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=200&q=80',
    tags: ['Organic', 'Fruits & Veggies', 'Dairy & Eggs'],
    saved: true,
    about: 'Family-owned organic farm providing the freshest seasonal produce since 1998.',
    infoCards: [
      { id: 'hours', title: 'Hours', icon: 'Clock', preview: 'Mon-Sat: 8am - 6pm\nSun: Closed', details: 'Extended hours during harvest season.' },
      { id: 'delivery', title: 'Delivery & Pickup', icon: 'Truck', preview: 'On-farm Pickup • Local Delivery ($5)', details: 'Delivery cut-off is Thursday at 5pm.' },
      { id: 'tours', title: 'Farm Tours', icon: 'Map', preview: 'Saturdays at 10am', details: 'Join us for a guided tour of the orchards and dairy facility.' },
      { id: 'certs', title: 'Certifications', icon: 'Award', preview: 'Certified Organic', details: 'Certified by the Nova Scotia Organic Growers Association since 2012.' }
    ],    products: [
      { id: 'p1', name: 'Honeycrisp Apples', category: 'Fruits & Veggies', price: '$6.00/lb', image: '🍎' },
      { id: 'p2', name: 'Organic Carrots', category: 'Fruits & Veggies', price: '$4.00/bunch', image: '🥕' },
      { id: 'p3', name: 'Free-range Eggs', category: 'Dairy & Eggs', price: '$7.00/dozen', image: '🥚' }
    ]
  },
  {
    id: 'farm_456',
    name: 'Tidal Waves Vineyard',
    // ... keep existing Tidal Waves data
    tags: ['Wine', 'Tours', 'Events'],
    saved: true,
    infoCards: [
      { id: 'hours', title: 'Hours', icon: 'Clock', preview: 'Mon-Sat: 8am - 6pm\nSun: Closed', details: 'Extended hours during harvest season.' },
      { id: 'delivery', title: 'Delivery & Pickup', icon: 'Truck', preview: 'On-farm Pickup • Local Delivery ($5)', details: 'Delivery cut-off is Thursday at 5pm.' },
      { id: 'tours', title: 'Farm Tours', icon: 'Map', preview: 'Saturdays at 10am', details: 'Join us for a guided tour of the orchards and dairy facility.' },
      { id: 'certs', title: 'Certifications', icon: 'Award', preview: 'Certified Organic', details: 'Certified by the Nova Scotia Organic Growers Association since 2012.' }
    ],
    products: [{ id: 'w1', name: 'Tidal Bay White', category: 'Wine & Beer', price: '$22.00/btl', image: '🍷' }]
  },
  {
    id: 'farm_234',
    name: 'Ocean Breeze Dairy',
    infoCards: [
      { id: 'hours', title: 'Hours', icon: 'Clock', preview: 'Mon-Sat: 8am - 6pm\nSun: Closed', details: 'Extended hours during harvest season.' },
      { id: 'delivery', title: 'Delivery & Pickup', icon: 'Truck', preview: 'On-farm Pickup • Local Delivery ($5)', details: 'Delivery cut-off is Thursday at 5pm.' },
      { id: 'tours', title: 'Farm Tours', icon: 'Map', preview: 'Saturdays at 10am', details: 'Join us for a guided tour of the orchards and dairy facility.' },
      { id: 'certs', title: 'Certifications', icon: 'Award', preview: 'Certified Organic', details: 'Certified by the Nova Scotia Organic Growers Association since 2012.' }
    ],    tags: ['Dairy & Eggs', 'Beef'],
    saved: false,
    products: [
      { id: 'd1', name: 'Aged Cheddar', category: 'Dairy & Eggs', price: '$12.00/block', image: '🧀' },
      { id: 'd2', name: 'Whole Milk', category: 'Dairy & Eggs', price: '$5.00/jug', image: '🥛' }
    ]
  },
  {
    id: 'farm_256',
    name: 'Test 4',
    infoCards: [
      { id: 'hours', title: 'Hours', icon: 'Clock', preview: 'Mon-Sat: 8am - 6pm\nSun: Closed', details: 'Extended hours during harvest season.' },
      { id: 'delivery', title: 'Delivery & Pickup', icon: 'Truck', preview: 'On-farm Pickup • Local Delivery ($5)', details: 'Delivery cut-off is Thursday at 5pm.' },
      { id: 'tours', title: 'Farm Tours', icon: 'Map', preview: 'Saturdays at 10am', details: 'Join us for a guided tour of the orchards and dairy facility.' },
      { id: 'certs', title: 'Certifications', icon: 'Award', preview: 'Certified Organic', details: 'Certified by the Nova Scotia Organic Growers Association since 2012.' }
    ],    tags: ['Dairy & Eggs', 'Beef'],
    saved: false,
    products: [
      { id: 'd1', name: 'Aged Cheddar', category: 'Dairy & Eggs', price: '$12.00/block', image: '🧀' },
      { id: 'd2', name: 'Whole Milk', category: 'Dairy & Eggs', price: '$5.00/jug', image: '🥛' }
    ]
  },
    {
    id: 'farm_202',
    name: 'Test 5',
    infoCards: [
      { id: 'hours', title: 'Hours', icon: 'Clock', preview: 'Mon-Sat: 8am - 6pm\nSun: Closed', details: 'Extended hours during harvest season.' },
      { id: 'delivery', title: 'Delivery & Pickup', icon: 'Truck', preview: 'On-farm Pickup • Local Delivery ($5)', details: 'Delivery cut-off is Thursday at 5pm.' },
      { id: 'tours', title: 'Farm Tours', icon: 'Map', preview: 'Saturdays at 10am', details: 'Join us for a guided tour of the orchards and dairy facility.' },
      { id: 'certs', title: 'Certifications', icon: 'Award', preview: 'Certified Organic', details: 'Certified by the Nova Scotia Organic Growers Association since 2012.' }
    ],    tags: ['Dairy & Eggs', 'Beef'],
    saved: false,
    products: [
      { id: 'd1', name: 'Aged Cheddar', category: 'Dairy & Eggs', price: '$12.00/block', image: '🧀' },
      { id: 'd2', name: 'Whole Milk', category: 'Dairy & Eggs', price: '$5.00/jug', image: '🥛' }
    ]
  }
];

export const MOCK_EVENTS = [
  { 
    id: 'e1', 
    title: 'Halifax Seaport Farmers Market', 
    location: 'Halifax, NS', 
    date: 'Saturday, 8am - 2pm', 
    saved: true, 
    pinned: true,
    creatorId: 'farm_123', // Valley View Organics created this one!
    description: 'The longest continuously running farmers market in North America. Come grab fresh local produce!',
    likes: 173,
    liked: false,
    attendeeCount: 520,
    rsvped: false,
    attendingProducers: [
      { id: 'f2', name: 'Ocean Breeze Dairy' },
      { id: 'f3', name: 'Sweet Summer Preserves' },
      { id: 'f4', name: 'Test 4' },
      { id: 'f5', name: 'Test 5' }

    ]
  },
  { 
    id: 'e2', 
    title: 'Cheese Tasting Weekend', 
    location: 'Truro, NS', 
    date: 'Aug 12-13, 11am - 3pm', 
    saved: false, 
    pinned: false,
    creatorId: 'admin',
    description: 'Sample award-winning cheeses from across the province. Family friendly event!',
    likes: 45,
    liked: false,
    attendeeCount: 112,
    rsvped: false,
    attendingProducers: []
  },
  { 
    id: 'e3', 
    title: 'BBQ Basics Workshop', 
    location: 'Antigonish, NS', 
    date: 'Jul 10, 1pm - 4pm', 
    saved: false, 
    pinned: false,
    creatorId: 'farm_789',
    description: 'Learn the basics of smoking and grilling heritage meats.',
    likes: 89,
    liked: false,
    attendeeCount: 45,
    rsvped: false,
    attendingProducers: []
  }
];

export const MOCK_UPDATES = [
  {
    id: 'u2',
    author: 'Highland Heritage Meats',
    isAdmin: false,
    avatar: null,
    time: '5h ago',
    content: 'Stock up for the long weekend! We have a special bundle on heritage pork sausages running until Friday. Reserve yours through our website or send us a message.',
    likes: 89,
    comments: 3,
    shares: 12,
    saved: true 
  },
  {
    id: 'u1',
    author: 'Valley View Organics',
    isAdmin: false,
    avatar: null,
    time: '2h ago',
    content: 'We just picked our first batch of Honeycrisp apples for the season! 🍎 Available at the farm stand starting tomorrow at 8am. They are incredibly crisp this year!',
    likes: 45,
    comments: 12,
    shares: 4,
    saved: false
  },
  {
    id: 'u0',
    author: 'HarvestNS',
    isAdmin: true, 
    avatar: 'https://images.unsplash.com/photo-1595858603621-c30c7ae1fc35?w=200&q=80',
    time: 'Just now',
    content: 'Welcome to HarvestNS! We are thrilled to launch our community feed. Make sure to save your favorite local producers to get notified when they post new stock.',
    likes: 312,
    comments: 45,
    shares: 18,
    saved: false
  }
];

export const MOCK_PANTRY = [
  { id: 'pan_1', farmId: 'farm_123', farmName: 'Valley View Organics', farmLogo: null, productName: 'Honeycrisp Apples', productImage: '🍎', category: 'Fruits & Veggies' },
  { id: 'pan_2', farmId: 'farm_123', farmName: 'Valley View Organics', farmLogo: null, productName: 'Organic Carrots', productImage: '🥕', category: 'Fruits & Veggies' },
  { id: 'pan_3', farmId: 'farm_202', farmName: 'Ocean Breeze Dairy', farmLogo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=200&q=80', productName: 'Aged Cheddar', productImage: '🧀', category: 'Dairy & Eggs' },
  { id: 'pan_4', farmId: 'farm_456', farmName: 'Tidal Waves Vineyard', farmLogo: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&q=80', productName: 'Tidal Bay', productImage: '🍷', category: 'Wine & Beer' }
];

export const MOCK_ARTICLES = [
  { id: 'art_1', title: 'Sustainable Farming in NS', url: 'https://google.com' }
];