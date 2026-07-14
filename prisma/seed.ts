import prisma from '../src/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Clearing database...');
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
