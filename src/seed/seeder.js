require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Cause = require('../models/Cause');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany();
    await Cause.deleteMany();
    await Campaign.deleteMany();
    await Donation.deleteMany();
    await Notification.deleteMany();

    console.log('👤 Creating Users...');
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@giveeasy.org',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98765 43210',
      panNumber: 'AAAPA0001A',
    });

    const ngoUser = await User.create({
      name: 'CareIndia Representative',
      email: 'ngo@careindia.org',
      password: 'ngo123',
      role: 'ngo_admin',
      phone: '+91 98111 22334',
      panNumber: 'AAATC5555C',
    });

    const donor1 = await User.create({
      name: 'Priya Verma',
      email: 'priya@example.com',
      password: 'donor123',
      role: 'donor',
      phone: '+91 99999 88888',
      panNumber: 'ABCDE1234F',
    });

    const donor2 = await User.create({
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      password: 'donor123',
      role: 'donor',
      phone: '+91 98888 77777',
      panNumber: 'XYZDE5678G',
    });

    console.log('🏢 Creating Causes...');
    const cause1 = await Cause.create({
      title: 'Clean Drinking Water in Rural Schools',
      description: 'Ensuring safe, filtered drinking water access across rural primary schools to prevent waterborne diseases.',
      category: 'Education',
      ngoName: 'Care India Foundation',
      ngoRegistrationNumber: '12A/80G/DEL/2019/CARE99',
      contactEmail: 'contact@careindia.org',
      proofUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80',
      status: 'verified',
      verifiedBy: admin._id,
      verifiedAt: new Date(),
      verificationNotes: 'All 80G tax exemption certificates and 12A documentation verified.',
      submittedBy: ngoUser._id,
    });

    const cause2 = await Cause.create({
      title: 'Pediatric Cardiac Care for Underprivileged Children',
      description: 'Funding life-saving congenital heart defect surgeries for children from low-income families.',
      category: 'Healthcare',
      ngoName: 'Aarogya Seva Trust',
      ngoRegistrationNumber: '12A/80G/MUM/2020/AAROGYA12',
      contactEmail: 'support@aarogyaseva.org',
      proofUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
      status: 'verified',
      verifiedBy: admin._id,
      verifiedAt: new Date(),
      verificationNotes: 'Hospital tie-up agreements and government registry verified.',
      submittedBy: admin._id,
    });

    const cause3 = await Cause.create({
      title: 'Shelter & Medical Support for Stray Animals',
      description: 'Emergency ambulance rescue and veterinary clinic care for injured stray animals.',
      category: 'Animal Welfare',
      ngoName: 'Paws & Tails Welfare Society',
      ngoRegistrationNumber: 'REG/BLR/2023/PAWS44',
      contactEmail: 'contact@pawstails.org',
      proofUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80',
      status: 'pending', // Pending so admin can verify during viva demo!
      verificationNotes: 'Awaiting submission of audited balance sheet for FY 2024-25.',
      submittedBy: ngoUser._id,
    });

    console.log('🎯 Creating Campaigns...');
    const campaign1 = await Campaign.create({
      title: 'RO Water Purifiers for 25 Primary Schools',
      description: 'Install heavy-duty solar-powered RO water purification units across 25 remote village schools.',
      causeId: cause1._id,
      targetAmount: 300000,
      raisedAmount: 185000,
      donorCount: 28,
      category: 'Education',
      imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      featured: true,
      impactMetric: {
        metricName: 'Students Provided Safe Water',
        targetCount: 2500,
        currentCount: 1650,
      },
      createdBy: admin._id,
    });

    const campaign2 = await Campaign.create({
      title: 'Fund Life-Saving Heart Surgeries for 10 Little Warriors',
      description: 'Support critical pediatric congenital heart surgeries at partner charitable hospitals.',
      causeId: cause2._id,
      targetAmount: 800000,
      raisedAmount: 540000,
      donorCount: 52,
      category: 'Healthcare',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      featured: true,
      impactMetric: {
        metricName: 'Surgeries Funded',
        targetCount: 10,
        currentCount: 6,
      },
      createdBy: admin._id,
    });

    const campaign3 = await Campaign.create({
      title: 'Flood Relief Emergency Food & Medical Kits',
      description: 'Immediate dry rations, clean drinking water, and first aid kits for 500 displaced families.',
      causeId: cause1._id,
      targetAmount: 200000,
      raisedAmount: 75000,
      donorCount: 16,
      category: 'Disaster Relief',
      imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      impactMetric: {
        metricName: 'Family Kits Delivered',
        targetCount: 500,
        currentCount: 180,
      },
      createdBy: ngoUser._id,
    });

    console.log('💳 Creating Donations...');
    const donation1 = await Donation.create({
      donorId: donor1._id,
      donorName: donor1.name,
      donorEmail: donor1.email,
      campaignId: campaign1._id,
      causeId: cause1._id,
      amount: 5000,
      currency: 'INR',
      paymentMethod: 'UPI',
      paymentStatus: 'success',
      transactionId: 'TXN_SEED_001_A9B',
      receiptNumber: 'GE-2026-100234',
      isRecurring: false,
      taxReceipt: {
        eligible: true,
        panNumber: donor1.panNumber,
        receiptGenerated: true,
      },
    });

    const donation2 = await Donation.create({
      donorId: donor2._id,
      donorName: donor2.name,
      donorEmail: donor2.email,
      campaignId: campaign2._id,
      causeId: cause2._id,
      amount: 15000,
      currency: 'INR',
      paymentMethod: 'CreditCard',
      paymentStatus: 'success',
      transactionId: 'TXN_SEED_002_C8D',
      receiptNumber: 'GE-2026-100235',
      isRecurring: true,
      recurringFrequency: 'monthly',
      recurringStatus: 'active',
      taxReceipt: {
        eligible: true,
        panNumber: donor2.panNumber,
        receiptGenerated: true,
      },
    });

    console.log('🔔 Creating Notifications...');
    await Notification.create({
      userId: donor1._id,
      recipientEmail: donor1.email,
      title: '🎉 Donation Successful - ₹5,000',
      body: `Thank you ${donor1.name}! Your donation to "${campaign1.title}" has been recorded. 80G tax receipt is ready.`,
      type: 'donation_receipt',
      dataPayload: {
        receiptNumber: donation1.receiptNumber,
        amount: '5000',
      },
      provider: 'firebase',
      readStatus: false,
    });

    console.log('\n=============================================');
    console.log('🎉 Sample Seed Data Generated Successfully!');
    console.log('=============================================');
    console.log('Test Accounts for Viva Presentation:');
    console.log('  1. Super Admin:');
    console.log('     Email:    admin@giveeasy.org');
    console.log('     Password: admin123');
    console.log('  2. NGO Representative:');
    console.log('     Email:    ngo@careindia.org');
    console.log('     Password: ngo123');
    console.log('  3. Donor:');
    console.log('     Email:    priya@example.com');
    console.log('     Password: donor123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  }
};

seedData();
