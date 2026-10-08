require('dotenv').config();
const { sequelize, User, Report, Conversation, Message } = require('../models');

const ETHIOPIAN_NAMES = [
  'Abebe Kebede', 'Tigist Alemu', 'Dawit Haile', 'Selam Tesfaye',
  'Yohannes Bekele', 'Marta Girma', 'Kalkidan Assefa', 'Bereket Tadesse',
  'Hiwot Mekonnen', 'Nathan Haile', 'Liya Solomon', 'Yonas Desta',
  'Meseret Alemayehu', 'Samuel Girma', 'Bethlehem Tesfaye', 'Ermias Abera',
  'Tsedale Wolde', 'Fikremariam Haile', 'Bezawit Alemu', 'Milkias Tadesse',
];

const OFFICERS = [
  { name: 'Officer Tesfaye', email: 'tesfaye@cms.com' },
  { name: 'Officer Alemu', email: 'alemu@cms.com' },
  { name: 'Officer Mengistu', email: 'mengistu@cms.com' },
  { name: 'Officer Haile', email: 'haile@cms.com' },
];

const DETECTIVES = [
  { name: 'Detective Bekele', email: 'bekele@cms.com' },
  { name: 'Detective Girma', email: 'girma@cms.com' },
];

const CITIES = [
  'Addis Ababa', 'Adama', 'Bahir Dar', 'Mekelle', 'Hawassa',
  'Dire Dawa', 'Gondar', 'Jimma', 'Dessie', 'Shashamane',
];

const LOCATIONS = [
  'Bole Road', 'Meskel Square', 'Piassa', 'Merkato', 'Kazanchis',
  'CMC', 'Sarbet', 'Gerji', 'Summit', 'Ayat',
];

const CRIME_TYPES = [
  'Theft', 'Assault', 'Vandalism', 'Fraud', 'Drug-related',
  'Suspicious Activity', 'Robbery', 'Burglary', 'Harassment', 'Other',
];

const URGENCIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['pending', 'under_review', 'escalated', 'resolved', 'rejected'];

const DESCRIPTIONS = [
  'Witnessed someone breaking into a parked car near the market.',
  'Suspicious person loitering around the school area after hours.',
  'Group of individuals causing disturbance at the local park.',
  'Item was stolen from my bag while in the market.',
  'I saw someone selling what appeared to be stolen goods.',
  'Verbal altercation turned physical outside a restaurant.',
  'My neighbor\'s house was broken into last night.',
  'Stranger approached my children near the bus stop.',
  'Saw someone damaging public property on the main road.',
  'Received threatening messages from an unknown number.',
  'Suspicious vehicle parked outside the building for hours.',
  'Fake online account asking for money pretending to be a bank.',
  'Missing items from my shop after a customer visit.',
  'Graffiti sprayed on the wall of our community center.',
  'Someone attempted to scam elderly residents in our area.',
];

const MESSAGE_BODIES = [
  'Hello, I wanted to follow up on my report.',
  'Thank you for your response. Do you need more information?',
  'Yes, I can send the photos you requested.',
  'Is there any update on the investigation?',
  'The incident happened around 8pm.',
  'I appreciate your help with this matter.',
  'Please let me know if you need me to come in.',
  'Understood. I will wait for your response.',
  'Another witness has come forward.',
  'The location has changed since my last report.',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack = 30) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24));
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

const seedDemo = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    // ==================== USERS ====================
    console.log('\n👥 Creating users...');

    // Officers
    const officerUsers = [];
    for (const o of OFFICERS) {
      const [user] = await User.findOrCreate({
        where: { email: o.email },
        defaults: {
          email: o.email,
          password_hash: 'officer123',
          full_name: o.name,
          role: 'officer',
          is_verified: true,
        },
      });
      officerUsers.push(user);
    }
    console.log(`   ✅ ${officerUsers.length} officers`);

    // Detectives
    const detectiveUsers = [];
    for (const d of DETECTIVES) {
      const [user] = await User.findOrCreate({
        where: { email: d.email },
        defaults: {
          email: d.email,
          password_hash: 'detective123',
          full_name: d.name,
          role: 'detective',
          is_verified: true,
        },
      });
      detectiveUsers.push(user);
    }
    console.log(`   ✅ ${detectiveUsers.length} detectives`);

    // Citizens
    const citizenUsers = [];
    for (let i = 0; i < ETHIOPIAN_NAMES.length; i++) {
      const name = ETHIOPIAN_NAMES[i];
      const email = `citizen${i + 1}@cms.com`;
      const [user] = await User.findOrCreate({
        where: { email },
        defaults: {
          email,
          password_hash: 'citizen123',
          full_name: name,
          role: 'citizen',
          is_verified: true,
        },
      });
      citizenUsers.push(user);
    }
    console.log(`   ✅ ${citizenUsers.length} citizens`);

    const allStaff = [...officerUsers, ...detectiveUsers];

    // ==================== REPORTS ====================
    console.log('\n📝 Creating reports...');

    let reportCount = 0;
    for (let i = 0; i < 40; i++) {
      const reporter = randomItem(citizenUsers);
      const isAnon = Math.random() < 0.15;
      const createdAt = randomDate(30);

      const report = await Report.create({
        crime_type: randomItem(CRIME_TYPES),
        description: randomItem(DESCRIPTIONS),
        location: `${randomItem(LOCATIONS)}, ${randomItem(CITIES)}`,
        urgency: randomItem(URGENCIES),
        status: randomItem(STATUSES),
        is_anonymous: isAnon,
        user_id: isAnon ? null : reporter.id,
      });

      // Force createdAt via raw update (Sequelize overrides)
      await sequelize.query(
        `UPDATE reports SET created_at = :createdAt WHERE id = :id`,
        {
          replacements: { createdAt, id: report.id },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      reportCount++;
    }
    console.log(`   ✅ ${reportCount} reports`);

    // ==================== CONVERSATIONS + MESSAGES ====================
    console.log('\n💬 Creating conversations & messages...');

    let convCount = 0;
    let msgCount = 0;

    // Mix of citizen ↔ officer and staff ↔ staff conversations
    const pairs = [];

    // Citizen ↔ Officer/Detective
    for (let i = 0; i < 12; i++) {
      const citizen = randomItem(citizenUsers);
      const staff = randomItem(allStaff);
      if (citizen.id !== staff.id) pairs.push([citizen, staff]);
    }

    // Staff ↔ Staff
    for (let i = 0; i < 3; i++) {
      const s1 = randomItem(officerUsers);
      const s2 = randomItem(detectiveUsers);
      if (s1.id !== s2.id) pairs.push([s1, s2]);
    }

    for (const [u1, u2] of pairs) {
      const [a, b] = u1.id < u2.id ? [u1.id, u2.id] : [u2.id, u1.id];

      let conversation = await Conversation.findOne({
        where: { user1_id: a, user2_id: b },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          user1_id: a,
          user2_id: b,
        });
        convCount++;
      }

      // Create 3-8 messages
      const count = 3 + Math.floor(Math.random() * 6);
      let lastDate = randomDate(10);

      for (let m = 0; m < count; m++) {
        const sender = Math.random() < 0.5 ? u1 : u2;
        const msgDate = new Date(lastDate.getTime() + m * 1000 * 60 * 30);
        lastDate = msgDate;

        const msg = await Message.create({
          conversation_id: conversation.id,
          sender_id: sender.id,
          body: randomItem(MESSAGE_BODIES),
          is_read: Math.random() < 0.7,
        });

        await sequelize.query(
          `UPDATE messages SET created_at = :createdAt WHERE id = :id`,
          {
            replacements: { createdAt: msgDate, id: msg.id },
            type: sequelize.QueryTypes.UPDATE,
          }
        );

        msgCount++;
      }

      conversation.last_message_at = lastDate;
      await conversation.save();
    }

    console.log(`   ✅ ${convCount} conversations`);
    console.log(`   ✅ ${msgCount} messages`);

    // ==================== SUMMARY ====================
    console.log('\n🎉 Demo data seeded!\n');
    console.log('Test credentials:');
    console.log('   Admin:      admin@cms.com        / admin123 (or whatever you set)');
    console.log('   Officers:   tesfaye@cms.com      / officer123');
    console.log('               alemu@cms.com        / officer123');
    console.log('               mengistu@cms.com     / officer123');
    console.log('               haile@cms.com        / officer123');
    console.log('   Detectives: bekele@cms.com       / detective123');
    console.log('               girma@cms.com        / detective123');
    console.log('   Citizens:   citizen1@cms.com     / citizen123');
    console.log('               citizen2@cms.com     / citizen123');
    console.log('               ... up to citizen20@cms.com\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedDemo();