import prisma from '../src/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Clearing database...');
  // Truck module
  await prisma.truckOrder.deleteMany();
  await prisma.truckCategoryType.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.truckCategory.deleteMany();
  await prisma.truckType.deleteMany();
  // Promo codes
  await prisma.promoRedemption.deleteMany();
  await prisma.promoCode.deleteMany();
  // Taxi module tables
  await prisma.fraudAlert.deleteMany();
  await prisma.taxiRideOffer.deleteMany();
  await prisma.taxiRide.deleteMany();
  // Food module tables
  await prisma.foodOrderItemAddition.deleteMany();
  await prisma.foodOrderItem.deleteMany();
  await prisma.foodOrderStatusHistory.deleteMany();
  await prisma.foodOrder.deleteMany();
  await prisma.restaurantSubscriptionPayment.deleteMany();
  await prisma.addition.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.foodMenuCategory.deleteMany();
  await prisma.cashier.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.restaurant.deleteMany();
  // Services module tables
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.portfolioPost.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();

  console.log('Seeding platform settings...');
  // Global defaults: admin-mediated flow, 15% commission, 3000 DZD/month subscription
  await prisma.platformSettings.create({
    data: {
      id: 'global',
      mediationMode: 'MEDIATED',
      commissionMode: 'PERCENTAGE',
      commissionPercent: 15,
      subscriptionFee: 3000,
    },
  });

  console.log('Seeding users...');

  // 1. Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rafik.app',
      phone: '+213 555 00 00 00',
      passwordHash: adminPasswordHash,
      fullName: 'Rafik Administrator',
      role: Role.ADMIN,
    },
  });

  // 2. Categories
  const categoriesData = [
    { name: 'Plumber', image: '/uploads/categories/plumber.png', pros: 68, bookings: 342 },
    { name: 'Electrician', image: '/uploads/categories/electrician.png', pros: 54, bookings: 298 },
    { name: 'Painter', image: '/uploads/categories/painter.png', pros: 42, bookings: 186 },
    { name: 'Carpenter', image: '/uploads/categories/carpenter.png', pros: 38, bookings: 164 },
    { name: 'Cleaner', image: '/uploads/categories/cleaner.png', pros: 76, bookings: 428 },
    { name: 'AC Repair', image: '/uploads/categories/acrepair.png', pros: 32, bookings: 142 },
    { name: 'Locksmith', image: '/uploads/categories/locksmith.png', pros: 24, bookings: 98 },
    { name: 'Gardener', image: '/uploads/categories/gardener.png', pros: 18, bookings: 72 },
    { name: 'Mover', image: '/uploads/categories/mover.png', pros: 28, bookings: 116 },
  ];

  console.log('Seeding categories...');
  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }

  // 3. Professionals (Workers)
  const defaultWorkerPassword = await bcrypt.hash('worker123', 10);

  const workers = [
    {
      id: 'PRO-1',
      name: 'Lyes K.',
      category: 'Electrician',
      phone: '+213 555 12 34 56',
      email: 'lyes@rafik.app',
      status: 'online',
      verified: true,
      jobs: 164,
      rating: 4.9,
      joined: 'Feb 2024',
      rate: '1,800 DZD / Hour',
      experience: '7 Years of residential and industrial electrical work. Specialist in panel boards and short circuit repairs.',
      bio: 'Certified technician with hands-on expertise in domestic wiring, lighting fixtures, and power issue diagnostics.',
      portfolio: [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80',
        'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80'
      ],
      availableTimes: ['08:00', '10:30', '14:00', '16:30'],
      reviews: [
        { clientName: 'Fodil B.', rating: 5.0, comment: 'Very professional, fixed my distribution board in 30 minutes.', date: '1 week ago' },
        { clientName: 'Amine S.', rating: 4.8, comment: 'Punctual and clean work. Strongly recommended.', date: '3 weeks ago' }
      ]
    },
    {
      id: 'PRO-2',
      name: 'Karim M.',
      category: 'Plumber',
      phone: '+213 555 98 76 54',
      email: 'karim@rafik.app',
      status: 'online',
      verified: true,
      jobs: 186,
      rating: 4.8,
      joined: 'Jan 2024',
      rate: '2,000 DZD / Hour',
      experience: '10 Years of experience. Specialist in water pumps, leaking pipes, bathroom installations, and emergency clogging.',
      bio: 'Pipes installation specialist. Dedicated to responsive home maintenance and using durable Algerian-standard plumbing fittings.',
      portfolio: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
        'https://images.unsplash.com/photo-1542013936693-8848e5740a7b?w=400&q=80'
      ],
      availableTimes: ['09:00', '11:30', '15:00', '17:30'],
      reviews: [
        { clientName: 'Mourad L.', rating: 5.0, comment: 'Excellent work, resolved pressure issues with the water tank perfectly.', date: '2 days ago' }
      ]
    },
    {
      id: 'PRO-3',
      name: 'Hassan F.',
      category: 'AC Repair',
      phone: '+213 555 45 67 89',
      email: 'hassan@rafik.app',
      status: 'busy',
      verified: true,
      jobs: 142,
      rating: 4.9,
      joined: 'Mar 2024',
      rate: '2,500 DZD fixed diagnose fee',
      experience: '5 Years specializing in split AC installations, gas recharge, and compressor maintenance.',
      bio: 'Prompt air conditioning expert. Highly efficient in repairing condenser units and heat pump cycles before hot summers.',
      portfolio: [
        'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&q=80',
        'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=400&q=80'
      ],
      availableTimes: ['08:30', '13:00', '16:00'],
      reviews: [
        { clientName: 'Yasmina R.', rating: 5.0, comment: 'Clean diagnostic. Recharged the cooling gas quickly.', date: '5 days ago' }
      ]
    },
    {
      id: 'PRO-4',
      name: 'Rachid B.',
      category: 'Cleaner',
      phone: '+213 555 33 44 55',
      email: 'rachid@rafik.app',
      status: 'online',
      verified: false,
      jobs: 128,
      rating: 4.7,
      joined: 'Mar 2024',
      rate: '1,200 DZD / Hour',
      experience: '4 Years in deep home cleaning, carpet shampooing, post-renovation disinfection, and window washing.',
      bio: 'Detailed cleaner focusing on eco-friendly cleaning supplies and thorough sanitization.',
      portfolio: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
        'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80'
      ],
      availableTimes: ['08:00', '11:00', '14:00', '17:00'],
      reviews: [
        { clientName: 'Imane H.', rating: 4.0, comment: 'Nice cleaning job, missed a spot behind the couch but came back and fixed it.', date: '2 weeks ago' }
      ]
    },
    {
      id: 'PRO-5',
      name: 'Said L.',
      category: 'Painter',
      phone: '+213 555 66 77 88',
      email: 'said@rafik.app',
      status: 'offline',
      verified: false,
      jobs: 56,
      rating: 4.5,
      joined: 'May 2024',
      rate: '3,000 DZD / Room',
      experience: '6 Years of expertise in wall preparations, decorative coating, wood painting, and wallpaper installation.',
      bio: 'Creative painter dedicated to smooth finishes, custom color mixes, and protecting furniture.',
      portfolio: [
        'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
        'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80'
      ],
      availableTimes: ['09:00', '13:30', '16:00'],
      reviews: [
        { clientName: 'Omar D.', rating: 4.5, comment: 'Did a beautiful modern design in the living room wall.', date: '1 month ago' }
      ]
    },
    {
      id: 'PRO-6',
      name: 'Mourad T.',
      category: 'Carpenter',
      phone: '+213 555 11 22 33',
      email: 'mourad@rafik.app',
      status: 'online',
      verified: true,
      jobs: 98,
      rating: 4.8,
      joined: 'Apr 2024',
      rate: '2,200 DZD / Hour',
      experience: '12 Years in wooden furniture repair, custom cupboard fittings, door locks, and laminate floor installations.',
      bio: 'Veteran artisan focusing on solid wood structural modifications and fine cabinet detailing.',
      portfolio: [
        'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'
      ],
      availableTimes: ['08:00', '10:00', '13:00', '15:30'],
      reviews: [
        { clientName: 'Chafik Y.', rating: 5.0, comment: 'Customized our kitchen counters perfectly. Outstanding wood craftsmanship.', date: '3 weeks ago' }
      ]
    },
    {
      id: 'PRO-7',
      name: 'Sofiane D.',
      category: 'Electrician',
      phone: '+213 555 44 88 99',
      email: 'sofiane@rafik.app',
      status: 'online',
      verified: true,
      jobs: 45,
      rating: 4.7,
      joined: 'May 2024',
      rate: '1,500 DZD / Hour',
      experience: '3 Years in general home cabling, breaker replacement, and home appliance hookups.',
      bio: 'Energetic junior technician offering friendly service and safety compliance checks.',
      portfolio: [
        'https://images.unsplash.com/photo-1558224494-ef3b3b4036f6?w=400&q=80'
      ],
      availableTimes: ['09:30', '12:00', '15:00', '17:00'],
      reviews: [
        { clientName: 'Tarek B.', rating: 5.0, comment: 'Very quick in replacing the bathroom switches.', date: '1 month ago' }
      ]
    }
  ];

  // Demo profile pictures + portfolio post captions
  const workerAvatars: Record<string, string> = {
    'PRO-1': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80',
    'PRO-2': 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&q=80',
    'PRO-3': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
    'PRO-4': 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80',
    'PRO-5': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    'PRO-6': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    'PRO-7': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80',
  };
  const portfolioCaptions: Record<string, string[]> = {
    'PRO-1': ['Panel board rewiring — villa in Sétif', 'New lighting installation for a shop', 'Short circuit diagnostics and repair'],
    'PRO-2': ['Bathroom pipe replacement, finished today', 'Water pump installation for a 3-floor building'],
    'PRO-3': ['Split AC install + gas recharge', 'Compressor maintenance before summer'],
    'PRO-4': ['Post-renovation deep clean', 'Full apartment cleaning before move-in'],
    'PRO-5': ['Matte accent wall for a living room', 'Exterior facade repaint'],
    'PRO-6': ['Custom kitchen counters in solid wood', 'Wardrobe fitting and door adjustment'],
    'PRO-7': ['Breaker replacement and safety check'],
  };

  // Launch coverage: Sétif wilaya
  const workerLocations: Record<string, { wilaya: string; commune: string; address: string }> = {
    'PRO-1': { wilaya: 'Sétif', commune: 'Sétif', address: 'Cité El Hidhab' },
    'PRO-2': { wilaya: 'Sétif', commune: 'Sétif', address: 'Avenue de l\'ALN, centre-ville' },
    'PRO-3': { wilaya: 'Sétif', commune: 'El Eulma', address: 'Cité Dubai' },
    'PRO-4': { wilaya: 'Sétif', commune: 'Sétif', address: 'Cité Yahiaoui' },
    'PRO-5': { wilaya: 'Sétif', commune: 'Aïn Arnat', address: 'Route de l\'aéroport' },
    'PRO-6': { wilaya: 'Sétif', commune: 'Sétif', address: 'Cité Bel Air' },
    'PRO-7': { wilaya: 'Sétif', commune: 'El Eulma', address: 'Rue des frères Khelfaoui' },
  };

  console.log('Seeding workers and reviews...');
  for (const w of workers) {
    // Create linked user account first
    const u = await prisma.user.create({
      data: {
        email: w.email,
        phone: w.phone,
        passwordHash: defaultWorkerPassword,
        fullName: w.name,
        role: Role.WORKER,
      }
    });

    const pro = await prisma.professional.create({
      data: {
        id: w.id,
        name: w.name,
        category: w.category,
        phone: w.phone,
        status: w.status,
        verified: w.verified,
        jobs: w.jobs,
        rating: w.rating,
        joined: w.joined,
        rate: w.rate,
        experience: w.experience,
        bio: w.bio,
        portfolio: w.portfolio,
        profileImage: workerAvatars[w.id],
        availableTimes: w.availableTimes,
        ...workerLocations[w.id],
        userId: u.id,
      }
    });

    // Portfolio posts: one post per image, with a caption
    const captions = portfolioCaptions[w.id] || [];
    for (let i = 0; i < w.portfolio.length; i++) {
      await prisma.portfolioPost.create({
        data: {
          professionalId: pro.id,
          image: w.portfolio[i],
          caption: captions[i] || null,
        }
      });
    }

    // Create reviews
    for (const rev of w.reviews) {
      await prisma.review.create({
        data: {
          clientName: rev.clientName,
          rating: rev.rating,
          comment: rev.comment,
          date: rev.date,
          professionalId: pro.id,
        }
      });
    }
  }

  // 4. Bookings
  const bookingsData = [
    {
      id: "SV-3421",
      clientName: "Ahmed Belkacem",
      clientPhone: "+213 661 22 33 44",
      clientAddress: "12 Rue Didouche Mourad, Algiers",
      serviceCategory: "Plumber",
      workerId: "PRO-2",
      status: "in_progress",
      price: "4,000 DZD",
      description: "Bathroom water pipe leak repair. Water is dripping continuously from the main sink joint.",
      time: "1 hour ago",
      bookingDate: "2026-07-12",
      bookingTime: "11:30",
      clientPhotos: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&q=80"
      ],
      workerQuote: 4000,
      quoteStatus: "approved",
      history: [
        { status: "pending_review", timestamp: "3 hours ago" },
        { status: "contacting_worker", timestamp: "2.5 hours ago" },
        { status: "quote_sent", timestamp: "2 hours ago" },
        { status: "quote_approved", timestamp: "1.8 hours ago" },
        { status: "both_confirmed", timestamp: "1.5 hours ago" },
        { status: "dispatched", timestamp: "1.2 hours ago" },
        { status: "in_progress", timestamp: "1 hour ago" }
      ]
    },
    {
      id: "SV-3420",
      clientName: "Fatima Zohra",
      clientPhone: "+213 672 55 66 77",
      clientAddress: "Cité 5 Juillet, Bab Ezzouar",
      serviceCategory: "Electrician",
      workerId: "PRO-1",
      status: "completed",
      price: "3,600 DZD",
      description: "Installation of 3 new ceiling lights and testing the kitchen stove power socket.",
      time: "2 hours ago",
      bookingDate: "2026-07-11",
      bookingTime: "14:00",
      clientPhotos: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&q=80"
      ],
      workerQuote: 3600,
      quoteStatus: "approved",
      history: [
        { status: "pending_review", timestamp: "5 hours ago" },
        { status: "both_confirmed", timestamp: "4 hours ago" },
        { status: "in_progress", timestamp: "3 hours ago" },
        { status: "completed", timestamp: "2 hours ago" }
      ]
    },
    {
      id: "SV-3419",
      clientName: "Sara Kouadri",
      clientPhone: "+213 659 99 88 77",
      clientAddress: "Villa 45, Hydra, Algiers",
      serviceCategory: "Painter",
      workerId: "PRO-5",
      status: "pending_review",
      price: "Contact for Quote",
      description: "Living room accent wall painting. Selected paint type is matte off-white.",
      time: "3 hours ago",
      bookingDate: "2026-07-15",
      clientPhotos: [
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&q=80",
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&q=80",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80"
      ],
      workerQuote: null,
      quoteStatus: "none",
      history: [
        { status: "pending_review", timestamp: "3 hours ago" }
      ]
    },
    {
      id: "SV-3418",
      clientName: "Amine Touati",
      clientPhone: "+213 770 12 34 56",
      clientAddress: "88 Boulevard Colonel Bougara, El Biar",
      serviceCategory: "AC Repair",
      workerId: "PRO-3",
      status: "both_confirmed",
      price: "5,000 DZD",
      description: "AC is turning on but blowing warm air. Gas leakage verification and refill needed.",
      time: "4 hours ago",
      bookingDate: "2026-07-13",
      bookingTime: "09:30",
      clientPhotos: [
        "https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=300&q=80"
      ],
      workerQuote: 5000,
      quoteStatus: "approved",
      history: [
        { status: "pending_review", timestamp: "6 hours ago" },
        { status: "contacting_worker", timestamp: "5.5 hours ago" },
        { status: "quote_sent", timestamp: "5 hours ago" },
        { status: "quote_approved", timestamp: "4.5 hours ago" },
        { status: "both_confirmed", timestamp: "4 hours ago" }
      ]
    },
    {
      id: "SV-3417",
      clientName: "Nadia Mansouri",
      clientPhone: "+213 665 44 33 22",
      clientAddress: "Résidence El-Firdaous, Bir Mourad Raïs",
      serviceCategory: "Cleaner",
      workerId: "PRO-4",
      status: "quote_sent",
      price: "Contact for Quote",
      description: "Full apartment deep clean before moving in. 3 bedrooms, 2 bathrooms, kitchen and balcony.",
      time: "5 hours ago",
      bookingDate: "2026-07-14",
      clientPhotos: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80",
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&q=80"
      ],
      workerQuote: 6000,
      quoteStatus: "sent",
      history: [
        { status: "pending_review", timestamp: "5 hours ago" },
        { status: "contacting_worker", timestamp: "4.5 hours ago" },
        { status: "quote_sent", timestamp: "4 hours ago" }
      ]
    }
  ];

  // Client locations for the demo bookings (Sétif launch area)
  const bookingLocations: Record<string, { clientWilaya: string; clientCommune: string }> = {
    'SV-3421': { clientWilaya: 'Sétif', clientCommune: 'Sétif' },
    'SV-3420': { clientWilaya: 'Sétif', clientCommune: 'Sétif' },
    'SV-3419': { clientWilaya: 'Sétif', clientCommune: 'El Eulma' },
    'SV-3418': { clientWilaya: 'Sétif', clientCommune: 'Sétif' },
    'SV-3417': { clientWilaya: 'Sétif', clientCommune: 'Aïn Arnat' },
  };

  console.log('Seeding bookings and history...');
  for (const b of bookingsData) {
    const isCompleted = b.status === 'completed';
    const booking = await prisma.booking.create({
      data: {
        id: b.id,
        clientName: b.clientName,
        clientPhone: b.clientPhone,
        clientAddress: b.clientAddress,
        ...bookingLocations[b.id],
        serviceCategory: b.serviceCategory,
        workerId: b.workerId,
        status: b.status,
        price: b.price,
        description: b.description,
        time: b.time,
        bookingDate: b.bookingDate,
        bookingTime: b.bookingTime,
        clientPhotos: b.clientPhotos,
        workerQuote: b.workerQuote,
        quoteStatus: b.quoteStatus,
        mediationModeSnapshot: 'MEDIATED',
        // Completed bookings carry the frozen money snapshot (15% commission at completion)
        ...(isCompleted && b.workerQuote && {
          finalPrice: b.workerQuote,
          commissionModeSnapshot: 'PERCENTAGE' as const,
          commissionPercentSnapshot: 15,
          commissionAmount: Math.round((b.workerQuote * 15) / 100),
        }),
      }
    });

    for (const hist of b.history) {
      await prisma.statusHistory.create({
        data: {
          status: hist.status,
          timestamp: hist.timestamp,
          bookingId: booking.id,
        }
      });
    }
  }

  // ═══════════ FOOD DELIVERY MODULE (Tawsil-style) ═══════════
  console.log('Seeding restaurants, menus, drivers, food orders...');

  const restoPassword = await bcrypt.hash('resto123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);

  const restaurantsData = [
    {
      name: 'Pizzeria El Bahdja',
      description: 'Pizzas au feu de bois et cuisine italienne',
      phone: '+213 555 20 10 10',
      email: 'elbahdja@rafik.app',
      address: 'Avenue de l\'ALN, centre-ville',
      commune: 'Sétif',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      status: 'APPROVED' as const,
      isPremium: true,
      lat: 36.1911, lng: 5.4137,
      categories: [
        {
          name: 'Pizzas',
          items: [
            { name: 'Pizza Margherita', price: 650, prepTime: 15, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', additions: [{ name: 'Extra fromage', price: 100 }, { name: 'Olives', price: 50 }] },
            { name: 'Pizza 4 Saisons', price: 900, prepTime: 20, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', additions: [{ name: 'Extra fromage', price: 100 }] },
            { name: 'Pizza Thon', price: 800, prepTime: 18, image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&q=80', additions: [] },
          ],
        },
        {
          name: 'Boissons',
          items: [
            { name: 'Soda 33cl', price: 100, prepTime: 1, image: null, additions: [] },
            { name: 'Eau minérale 50cl', price: 50, prepTime: 1, image: null, additions: [] },
          ],
        },
      ],
    },
    {
      name: 'Tacos King Sétif',
      description: 'Tacos, burgers et sandwichs',
      phone: '+213 555 20 20 20',
      email: 'tacosking@rafik.app',
      address: 'Cité Yahiaoui',
      commune: 'Sétif',
      image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80',
      status: 'APPROVED' as const,
      isPremium: false,
      lat: 36.1998, lng: 5.4090,
      categories: [
        {
          name: 'Tacos',
          items: [
            { name: 'Tacos Poulet', price: 450, prepTime: 12, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80', additions: [{ name: 'Sauce fromagère', price: 50 }, { name: 'Frites incluses', price: 0 }, { name: 'Double viande', price: 200 }] },
            { name: 'Tacos Viande Hachée', price: 550, prepTime: 12, image: null, additions: [{ name: 'Sauce fromagère', price: 50 }, { name: 'Double viande', price: 200 }] },
          ],
        },
        {
          name: 'Burgers',
          items: [
            { name: 'Burger Classique', price: 400, prepTime: 10, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', additions: [{ name: 'Cheddar', price: 80 }, { name: 'Bacon de dinde', price: 120 }] },
            { name: 'Double Burger', price: 650, prepTime: 14, image: null, additions: [{ name: 'Cheddar', price: 80 }] },
          ],
        },
      ],
    },
    {
      name: 'Dar El Couscous',
      description: 'Cuisine traditionnelle algérienne',
      phone: '+213 555 20 30 30',
      email: 'darelcouscous@rafik.app',
      address: 'El Eulma centre',
      commune: 'El Eulma',
      image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400&q=80',
      status: 'PENDING' as const,
      isPremium: false,
      lat: 36.1526, lng: 5.6900,
      categories: [
        {
          name: 'Plats traditionnels',
          items: [
            { name: 'Couscous Poulet', price: 700, prepTime: 25, image: null, additions: [] },
            { name: 'Chakhchoukha', price: 650, prepTime: 25, image: null, additions: [] },
          ],
        },
      ],
    },
  ];

  const menuItemIds: Record<string, { id: string; price: number; additionIds: { id: string; price: number }[] }[]> = {};
  const restaurantIds: string[] = [];

  for (const r of restaurantsData) {
    const owner = await prisma.user.create({
      data: { email: r.email, phone: r.phone, passwordHash: restoPassword, fullName: r.name, role: Role.RESTAURANT },
    });
    const restaurant = await prisma.restaurant.create({
      data: {
        userId: owner.id,
        name: r.name,
        description: r.description,
        address: r.address,
        phone: r.phone,
        email: r.email,
        image: r.image,
        status: r.status,
        isPremium: r.isPremium,
        wilaya: 'Sétif',
        commune: r.commune,
        lat: r.lat,
        lng: r.lng,
        openingHours: { mon: '11:00-23:00', tue: '11:00-23:00', wed: '11:00-23:00', thu: '11:00-23:00', fri: '13:00-23:00', sat: '11:00-23:00', sun: '11:00-23:00' },
      },
    });
    restaurantIds.push(restaurant.id);
    menuItemIds[restaurant.id] = [];

    for (const cat of r.categories) {
      const category = await prisma.foodMenuCategory.create({
        data: { restaurantId: restaurant.id, name: cat.name },
      });
      for (const item of cat.items) {
        const menuItem = await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: item.name,
            price: item.price,
            prepTime: item.prepTime,
            image: item.image,
          },
        });
        const additionRecords: { id: string; price: number }[] = [];
        for (const add of item.additions) {
          const addition = await prisma.addition.create({
            data: { menuItemId: menuItem.id, name: add.name, price: add.price },
          });
          additionRecords.push({ id: addition.id, price: add.price });
        }
        menuItemIds[restaurant.id].push({ id: menuItem.id, price: item.price, additionIds: additionRecords });
      }
    }
  }

  // Cashier for the first restaurant
  const cashierUser = await prisma.user.create({
    data: { email: 'cashier1@rafik.app', phone: '+213 555 20 40 40', passwordHash: restoPassword, fullName: 'Walid B.', role: Role.CASHIER },
  });
  await prisma.cashier.create({
    data: { userId: cashierUser.id, restaurantId: restaurantIds[0], cashierCode: 'CSH-0001', name: 'Walid B.', phone: '+213 555 20 40 40', email: 'cashier1@rafik.app' },
  });

  // Drivers
  const driversData = [
    { code: 'DRV-0001', name: 'Bilal H.', phone: '+213 661 30 10 10', vehicleType: 'MOTORCYCLE' as const, status: 'AVAILABLE' as const, isVerified: true, rating: 4.8, totalDeliveries: 210, commune: 'Sétif' },
    { code: 'DRV-0002', name: 'Yacine M.', phone: '+213 661 30 20 20', vehicleType: 'SCOOTER' as const, status: 'AVAILABLE' as const, isVerified: true, rating: 4.6, totalDeliveries: 134, commune: 'Sétif' },
    { code: 'DRV-0003', name: 'Islam K.', phone: '+213 661 30 30 30', vehicleType: 'MOTORCYCLE' as const, status: 'OFFLINE' as const, isVerified: true, rating: 4.9, totalDeliveries: 301, commune: 'El Eulma' },
    { code: 'DRV-0004', name: 'Ahmed Z.', phone: '+213 661 30 40 40', vehicleType: 'BICYCLE' as const, status: 'OFFLINE' as const, isVerified: false, rating: 0, totalDeliveries: 0, commune: 'Sétif' },
  ];
  const driverIds: string[] = [];
  for (const d of driversData) {
    const du = await prisma.user.create({
      data: { email: `${d.code.toLowerCase()}@rafik.app`, phone: d.phone, passwordHash: driverPassword, fullName: d.name, role: Role.DRIVER },
    });
    const driver = await prisma.driver.create({
      data: {
        userId: du.id, driverCode: d.code, name: d.name, phone: d.phone, email: `${d.code.toLowerCase()}@rafik.app`,
        vehicleType: d.vehicleType, status: d.status, isVerified: d.isVerified, rating: d.rating,
        totalDeliveries: d.totalDeliveries, wilaya: 'Sétif', commune: d.commune,
      },
    });
    driverIds.push(driver.id);
  }

  // Sample food orders across the lifecycle
  const pizzeria = restaurantIds[0];
  const tacos = restaurantIds[1];
  const pizzaItems = menuItemIds[pizzeria];
  const tacosItems = menuItemIds[tacos];

  async function seedOrder(opts: {
    num: string; restaurantId: string; items: { id: string; price: number; additionIds: { id: string; price: number }[] }[];
    qty: number[]; status: string; driverId?: string; clientName: string; clientPhone: string; commune: string;
    history: string[]; deliveredDaysAgo?: number;
  }) {
    const subtotal = opts.items.reduce((s, it, i) => s + it.price * opts.qty[i], 0);
    const deliveryFee = 200;
    const deliveredAt = opts.status === 'delivered'
      ? new Date(Date.now() - (opts.deliveredDaysAgo ?? 0) * 86400000)
      : null;
    const order = await prisma.foodOrder.create({
      data: {
        orderNumber: opts.num,
        restaurantId: opts.restaurantId,
        driverId: opts.driverId ?? null,
        clientName: opts.clientName,
        clientPhone: opts.clientPhone,
        deliveryAddress: 'Cité El Hidhab, Bt 4',
        deliveryWilaya: 'Sétif',
        deliveryCommune: opts.commune,
        status: opts.status,
        subtotal,
        deliveryFee,
        totalAmount: subtotal + deliveryFee,
        ...(opts.status === 'delivered' && { deliveredAt, restaurantRating: 4.5, driverRating: 5 }),
        items: {
          create: opts.items.map((it, i) => ({
            menuItemId: it.id,
            quantity: opts.qty[i],
            unitPrice: it.price,
            totalPrice: it.price * opts.qty[i],
          })),
        },
        statusHistory: { create: opts.history.map(s => ({ status: s })) },
      },
    });
    return order;
  }

  await seedOrder({
    num: 'DEL-20260714-0001', restaurantId: pizzeria, items: [pizzaItems[0], pizzaItems[3]], qty: [2, 2],
    status: 'delivered', driverId: driverIds[0], clientName: 'Amine Touati', clientPhone: '+213 770 12 34 56', commune: 'Sétif',
    history: ['pending', 'accepted', 'preparing', 'assigned', 'arrived', 'delivering', 'delivered'], deliveredDaysAgo: 1,
  });
  await seedOrder({
    num: 'DEL-20260714-0002', restaurantId: tacos, items: [tacosItems[0]], qty: [3],
    status: 'delivered', driverId: driverIds[1], clientName: 'Sara Kouadri', clientPhone: '+213 659 99 88 77', commune: 'Sétif',
    history: ['pending', 'accepted', 'preparing', 'assigned', 'arrived', 'delivering', 'delivered'], deliveredDaysAgo: 0,
  });
  await seedOrder({
    num: 'DEL-20260715-0001', restaurantId: pizzeria, items: [pizzaItems[1]], qty: [1],
    status: 'delivering', driverId: driverIds[0], clientName: 'Nadia Mansouri', clientPhone: '+213 665 44 33 22', commune: 'Sétif',
    history: ['pending', 'accepted', 'preparing', 'assigned', 'arrived', 'delivering'],
  });
  await seedOrder({
    num: 'DEL-20260715-0002', restaurantId: tacos, items: [tacosItems[2], tacosItems[0]], qty: [2, 1],
    status: 'preparing', clientName: 'Fodil B.', clientPhone: '+213 661 22 33 44', commune: 'Sétif',
    history: ['pending', 'accepted', 'preparing'],
  });
  await seedOrder({
    num: 'DEL-20260715-0003', restaurantId: pizzeria, items: [pizzaItems[2]], qty: [1],
    status: 'pending', clientName: 'Meriem Cherif', clientPhone: '+213 672 55 66 77', commune: 'Aïn Arnat',
    history: ['pending'],
  });

  // Driver 1 is carrying an active order
  await prisma.driver.update({ where: { id: driverIds[0] }, data: { status: 'BUSY' } });

  // ────────────────────────────────────────────
  // TAXI MODULE (inDrive/Yassir-style)
  // ────────────────────────────────────────────
  console.log('Seeding taxi drivers, rides, and fraud scenario...');

  const taxiDriversData = [
    { code: 'DRV-1001', name: 'Walid B.', phone: '+213 550 10 10 10', model: 'Hyundai i10', color: 'White', plate: '01234-119-19' },
    { code: 'DRV-1002', name: 'Samir K.', phone: '+213 550 20 20 20', model: 'Renault Symbol', color: 'Silver', plate: '04567-119-19' },
    { code: 'DRV-1003', name: 'Adel M.', phone: '+213 550 30 30 30', model: 'Dacia Logan', color: 'Black', plate: '07890-119-19' },
  ];
  const taxiDriverIds: string[] = [];
  for (const d of taxiDriversData) {
    const du = await prisma.user.create({
      data: { email: `${d.code.toLowerCase()}@rafik.app`, phone: d.phone, passwordHash: driverPassword, fullName: d.name, role: Role.DRIVER },
    });
    const driver = await prisma.driver.create({
      data: {
        userId: du.id, driverCode: d.code, name: d.name, phone: d.phone,
        email: `${d.code.toLowerCase()}@rafik.app`,
        vehicleType: 'CAR', vehicleModel: d.model, vehicleColor: d.color, vehiclePlate: d.plate,
        service: 'TAXI', status: 'AVAILABLE', isVerified: true,
        wilaya: 'Sétif', commune: 'Sétif', rating: 4.8,
      },
    });
    taxiDriverIds.push(driver.id);
  }

  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  let rideSeq = 0;
  const rideNum = () => `TX-${ymd}-${String(++rideSeq).padStart(4, '0')}`;

  const mkRide = (opts: {
    client: string; phone: string; from: string; to: string; km: number;
    status: string; driverIdx?: number; fare?: number; proposed?: number;
    cancelledBy?: 'CLIENT' | 'DRIVER'; arrived?: boolean;
  }) => {
    const estimated = Math.max(150, Math.round((100 + opts.km * 30) / 10) * 10);
    const fare = opts.fare ?? estimated;
    const done = opts.status === 'completed';
    const cancelled = opts.status.startsWith('cancelled');
    const matched = opts.driverIdx !== undefined;
    return prisma.taxiRide.create({
      data: {
        rideNumber: rideNum(),
        clientName: opts.client, clientPhone: opts.phone,
        pickupAddress: opts.from, pickupWilaya: 'Sétif', pickupCommune: 'Sétif',
        destinationAddress: opts.to, distanceKm: opts.km,
        estimatedFare: estimated,
        proposedFare: opts.proposed ?? null,
        agreedFare: matched ? fare : null,
        status: opts.status,
        driverId: matched ? taxiDriverIds[opts.driverIdx!] : null,
        ...(matched && { acceptedAt: new Date(Date.now() - 3600e3) }),
        ...(opts.arrived && { arrivedAt: new Date(Date.now() - 3000e3) }),
        ...(done && {
          startedAt: new Date(Date.now() - 2400e3),
          completedAt: new Date(Date.now() - 1800e3),
          commissionPercentSnapshot: 10,
          commissionAmount: Math.round(fare * 0.1),
          driverEarnings: fare - Math.round(fare * 0.1),
          clientRating: 5, driverRating: 4.8,
        }),
        ...(cancelled && {
          cancelledBy: opts.cancelledBy,
          cancelStage: opts.arrived ? 'driver_arrived' : 'accepted',
          cancelReason: opts.cancelledBy === 'DRIVER' ? 'Changed my mind' : 'Found another taxi',
          cancelledAt: new Date(Date.now() - 1200e3),
        }),
      },
    });
  };

  // Completed rides (money flows) + one active + one open request with offers
  await mkRide({ client: 'Ahmed Belkacem', phone: '+213 661 22 33 44', from: 'Cité El Hidhab', to: 'Gare routière Sétif', km: 4.2, status: 'completed', driverIdx: 0, fare: 250 });
  await mkRide({ client: 'Fatima Zohra', phone: '+213 672 55 66 77', from: 'Parc Mall Sétif', to: 'El Eulma centre', km: 27, status: 'completed', driverIdx: 1, fare: 900 });
  await mkRide({ client: 'Sara Kouadri', phone: '+213 659 99 88 77', from: 'Université Ferhat Abbas', to: 'Cité Yahiaoui', km: 6.5, status: 'completed', driverIdx: 0, fare: 300 });
  await mkRide({ client: 'Mourad L.', phone: '+213 555 44 22 11', from: 'Hôpital CHU Sétif', to: 'Aïn Arnat', km: 9, status: 'in_ride', driverIdx: 1, fare: 380 });
  const openRide = await mkRide({ client: 'Nadia Mansouri', phone: '+213 665 44 33 22', from: 'Centre-ville Sétif', to: 'Parc d\'attractions', km: 3.5, status: 'requested', proposed: 180 });
  await prisma.taxiRideOffer.create({ data: { rideId: openRide.id, driverId: taxiDriverIds[0], amount: 220 } });
  await prisma.taxiRideOffer.create({ data: { rideId: openRide.id, driverId: taxiDriverIds[2], amount: 200 } });

  // ⚠ Fraud scenario: driver DRV-1003 (Adel) + client Bilal repeatedly match then cancel
  // (the off-app cash deal pattern) + one late cancel after arrival
  await mkRide({ client: 'Bilal S.', phone: '+213 699 00 11 22', from: 'Cité Bel Air', to: 'Zone industrielle', km: 7, status: 'cancelled_by_driver', driverIdx: 2, cancelledBy: 'DRIVER' });
  await mkRide({ client: 'Bilal S.', phone: '+213 699 00 11 22', from: 'Cité Bel Air', to: 'El Eulma', km: 26, status: 'cancelled_by_driver', driverIdx: 2, cancelledBy: 'DRIVER', arrived: true });
  await mkRide({ client: 'Bilal S.', phone: '+213 699 00 11 22', from: 'Cité Bel Air', to: 'Guedjel', km: 12, status: 'cancelled_by_client', driverIdx: 2, cancelledBy: 'CLIENT', arrived: true });
  await prisma.driver.update({ where: { id: taxiDriverIds[2] }, data: { cancellationCount: 2 } });
  await prisma.fraudAlert.create({
    data: {
      type: 'PAIR_COLLUSION', severity: 'HIGH',
      driverId: taxiDriverIds[2], clientPhone: '+213 699 00 11 22', clientName: 'Bilal S.',
      message: 'Driver Adel M. and client Bilal S. (+213 699 00 11 22) matched and cancelled 3 times — they are probably completing rides in cash outside the app.',
      details: { pairCancels: 3 },
    },
  });
  await prisma.fraudAlert.create({
    data: {
      type: 'LATE_CANCEL_PATTERN', severity: 'HIGH',
      driverId: taxiDriverIds[2],
      message: '2 rides of driver Adel M. were cancelled AFTER the driver arrived at pickup — classic off-app cash deal pattern.',
      details: { lateCancels: 2 },
    },
  });
  // Driver 2 (Samir) is on an active ride
  await prisma.driver.update({ where: { id: taxiDriverIds[1] }, data: { status: 'BUSY' } });

  // ────────────────────────────────────────────
  // TRUCK FREIGHT MODULE
  // ────────────────────────────────────────────
  console.log('Seeding truck types, categories, trucks, orders...');

  // Truck types (with price multipliers — heavier/specialized = pricier)
  const truckTypesData = [
    { name: 'Small Van', capacityLabel: 'up to 1 ton', priceMultiplier: 1.0, description: 'Light parcels and small moves' },
    { name: 'Pickup Truck', capacityLabel: 'up to 2 tons', priceMultiplier: 1.2, description: 'Appliances and medium loads' },
    { name: 'Flatbed 5T', capacityLabel: 'up to 5 tons', priceMultiplier: 1.6, description: 'Furniture, construction materials' },
    { name: 'Box Truck 10T', capacityLabel: 'up to 10 tons', priceMultiplier: 2.0, description: 'Full house moves, merchandise' },
    { name: 'Refrigerated Truck', capacityLabel: 'up to 8 tons', priceMultiplier: 2.4, description: 'Cold-chain / perishable goods' },
    { name: 'Tow Truck', capacityLabel: '1 vehicle', priceMultiplier: 1.8, description: 'Vehicle towing / breakdown' },
    { name: 'Tanker', capacityLabel: 'up to 12,000 L', priceMultiplier: 2.8, description: 'Water, fuels and chemicals' },
    { name: 'Heavy Lowboy', capacityLabel: 'up to 30 tons', priceMultiplier: 3.5, description: 'Heavy equipment and machinery' },
  ];
  const truckTypeIds: Record<string, string> = {};
  for (const t of truckTypesData) {
    const tt = await prisma.truckType.create({ data: t });
    truckTypeIds[t.name] = tt.id;
  }

  // Categories, each allowing a curated set of truck types + a surcharge
  const truckCategoriesData: { name: string; description: string; types: string[] }[] = [
    { name: 'House Moving', description: 'Moving homes and furniture', types: ['Pickup Truck', 'Flatbed 5T', 'Box Truck 10T'] },
    { name: 'Commercial Merchandise', description: 'Store and warehouse goods', types: ['Small Van', 'Pickup Truck', 'Box Truck 10T'] },
    { name: 'Appliances', description: 'Fridges, washers, ovens…', types: ['Small Van', 'Pickup Truck'] },
    { name: 'Towing', description: 'Vehicle breakdown & towing', types: ['Tow Truck'] },
    { name: 'Construction Materials', description: 'Cement, bricks, steel…', types: ['Flatbed 5T', 'Box Truck 10T', 'Heavy Lowboy'] },
    { name: 'Heavy Equipment', description: 'Machinery and heavy gear', types: ['Flatbed 5T', 'Heavy Lowboy'] },
    { name: 'Refrigerated Merchandise', description: 'Cold-chain perishable goods', types: ['Refrigerated Truck'] },
    { name: 'Water', description: 'Potable / construction water', types: ['Tanker'] },
    { name: 'Fuels & Chemicals', description: 'Regulated liquids', types: ['Tanker'] },
  ];
  const truckCategoryIds: Record<string, string> = {};
  for (const c of truckCategoriesData) {
    const cat = await prisma.truckCategory.create({
      data: {
        name: c.name, description: c.description,
        allowedTypes: { create: c.types.map(tn => ({ truckTypeId: truckTypeIds[tn] })) },
      },
    });
    truckCategoryIds[c.name] = cat.id;
  }

  // Trucks (each is a driver account)
  const truckerPassword = await bcrypt.hash('trucker123', 10);
  const trucksData = [
    { code: 'TRK-0001', name: 'Rabah Z.', phone: '+213 551 10 10 10', type: 'Box Truck 10T', plate: '00111-119-19' },
    { code: 'TRK-0002', name: 'Slimane B.', phone: '+213 551 20 20 20', type: 'Flatbed 5T', plate: '00222-119-19' },
    { code: 'TRK-0003', name: 'Nadir F.', phone: '+213 551 30 30 30', type: 'Refrigerated Truck', plate: '00333-119-19' },
    { code: 'TRK-0004', name: 'Kamel T.', phone: '+213 551 40 40 40', type: 'Tow Truck', plate: '00444-119-19' },
    { code: 'TRK-0005', name: 'Yacine H.', phone: '+213 551 50 50 50', type: 'Tanker', plate: '00555-119-19' },
  ];
  const truckIds: string[] = [];
  for (const t of trucksData) {
    const tu = await prisma.user.create({
      data: { email: `${t.code.toLowerCase()}@rafik.app`, phone: t.phone, passwordHash: truckerPassword, fullName: t.name, role: Role.TRUCKER },
    });
    const truck = await prisma.truck.create({
      data: {
        userId: tu.id, truckCode: t.code, driverName: t.name, phone: t.phone, email: `${t.code.toLowerCase()}@rafik.app`,
        plate: t.plate, truckTypeId: truckTypeIds[t.type], status: 'available', isVerified: true,
        wilaya: 'Sétif', commune: 'Sétif', rating: 4.7,
      },
    });
    truckIds.push(truck.id);
  }

  // Sample orders across the lifecycle
  const tday = new Date();
  const tymd = `${tday.getFullYear()}${String(tday.getMonth() + 1).padStart(2, '0')}${String(tday.getDate()).padStart(2, '0')}`;
  let tSeq = 0;
  const tNum = () => `TRK-${tymd}-${String(++tSeq).padStart(4, '0')}`;
  const mkTruckOrder = async (o: {
    client: string; phone: string; category: string; type: string; from: string; to: string; km: number;
    desc: string; invoice: 'HAS_INVOICE' | 'NO_INVOICE' | 'NOT_REQUIRED'; status: string; truckIdx?: number; scheduled?: string;
  }) => {
    const mult = truckTypesData.find(t => t.name === o.type)!.priceMultiplier;
    const price = Math.max(800, Math.round(((500 + o.km * 60) * mult) / 10) * 10);
    const done = o.status === 'delivered';
    return prisma.truckOrder.create({
      data: {
        orderNumber: tNum(), clientName: o.client, clientPhone: o.phone,
        categoryId: truckCategoryIds[o.category], truckTypeId: truckTypeIds[o.type],
        pickupAddress: o.from, pickupWilaya: 'Sétif', pickupCommune: 'Sétif', destinationAddress: o.to, distanceKm: o.km,
        description: o.desc, invoiceStatus: o.invoice,
        scheduledType: o.scheduled ? 'scheduled' : 'now', scheduledDate: o.scheduled ?? null,
        estimatedPrice: price, agreedPrice: price, status: o.status,
        truckId: o.truckIdx != null ? truckIds[o.truckIdx] : null,
        ...(o.truckIdx != null && { acceptedAt: new Date(Date.now() - 3600e3) }),
        ...(done && {
          deliveredAt: new Date(Date.now() - 1800e3),
          commissionPercentSnapshot: 12, commissionAmount: Math.round(price * 0.12), driverEarnings: price - Math.round(price * 0.12),
        }),
      },
    });
  };

  await mkTruckOrder({ client: 'Farid Meziane', phone: '+213 661 11 22 33', category: 'House Moving', type: 'Box Truck 10T', from: 'Cité El Hidhab', to: 'El Eulma centre', km: 27, desc: 'Full 3-room apartment move', invoice: 'NOT_REQUIRED', status: 'delivered', truckIdx: 0 });
  await mkTruckOrder({ client: 'Nabil Cherfaoui', phone: '+213 662 44 55 66', category: 'Construction Materials', type: 'Flatbed 5T', from: 'Dépôt Sétif', to: 'Chantier Aïn Arnat', km: 12, desc: '2 tons of cement bags', invoice: 'HAS_INVOICE', status: 'delivered', truckIdx: 1 });
  await mkTruckOrder({ client: 'Souad Belkadi', phone: '+213 663 77 88 99', category: 'Refrigerated Merchandise', type: 'Refrigerated Truck', from: 'Marché de gros', to: 'Supérette Guedjel', km: 18, desc: 'Frozen goods delivery', invoice: 'HAS_INVOICE', status: 'in_transit', truckIdx: 2 });
  await mkTruckOrder({ client: 'Amine Rahmani', phone: '+213 664 00 11 22', category: 'Towing', type: 'Tow Truck', from: 'Route nationale RN5', to: 'Garage centre-ville', km: 8, desc: 'Broken-down car towing', invoice: 'NOT_REQUIRED', status: 'requested' });
  await mkTruckOrder({ client: 'Hakim Ould', phone: '+213 665 33 44 55', category: 'Appliances', type: 'Pickup Truck', from: 'Magasin électro', to: 'Cité Yahiaoui', km: 5, desc: 'Fridge + washing machine', invoice: 'NO_INVOICE', status: 'requested', scheduled: '2026-07-30' });

  // Truck 2 is on an active job
  await prisma.truck.update({ where: { id: truckIds[2] }, data: { status: 'busy' } });

  // ────────────────────────────────────────────
  // PROMO CODES (shared across taxi, food, services, truck)
  // ────────────────────────────────────────────
  console.log('Seeding promo codes...');
  const in30days = new Date(Date.now() + 30 * 24 * 3600e3);
  const yesterday = new Date(Date.now() - 24 * 3600e3);
  await prisma.promoCode.createMany({
    data: [
      { code: 'WELCOME20', description: '20% off your first order (max 300 DZD)', scope: 'ALL', discountType: 'PERCENTAGE', discountValue: 20, maxDiscount: 300, maxUses: 1000, maxUsesPerUser: 1, expiresAt: in30days, isActive: true },
      { code: 'TAXI50', description: '50 DZD off any ride', scope: 'TAXI', discountType: 'FIXED', discountValue: 50, maxUsesPerUser: 3, expiresAt: in30days, isActive: true },
      { code: 'FOOD15', description: '15% off food orders over 1000 DZD', scope: 'FOOD', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 1000, maxUses: 500, maxUsesPerUser: 5, expiresAt: in30days, isActive: true },
      { code: 'SERVICE100', description: '100 DZD off a service booking', scope: 'SERVICES', discountType: 'FIXED', discountValue: 100, maxUsesPerUser: 2, isActive: true },
      { code: 'TRUCK10', description: '10% off freight (max 1000 DZD)', scope: 'TRUCK', discountType: 'PERCENTAGE', discountValue: 10, maxDiscount: 1000, maxUsesPerUser: 3, expiresAt: in30days, isActive: true },
      { code: 'RAMADAN', description: 'Ramadan promo (expired demo)', scope: 'ALL', discountType: 'PERCENTAGE', discountValue: 25, expiresAt: yesterday, isActive: true },
      { code: 'PAUSED10', description: '10% — currently disabled', scope: 'ALL', discountType: 'PERCENTAGE', discountValue: 10, isActive: false },
    ],
  });

  console.log('Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
