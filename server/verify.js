import 'dotenv/config';
import mongoose from 'mongoose';
import { geminiService } from './src/services/geminiService.js';

async function runSelfCheck() {
  console.log('\n======================================================');
  console.log('🔍  ReLife-Spark Backend Self-Diagnostic Tool');
  console.log('======================================================\n');

  let passed = 0;
  let total = 3;

  // 1. Environment Check
  console.log('1️⃣  Checking Environment Variables:');
  const hasMongo = Boolean(process.env.MONGODB_URI);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (hasMongo && hasGemini) {
    console.log('   ✅ MONGODB_URI is loaded');
    console.log('   ✅ GEMINI_API_KEY is loaded');
    passed++;
  } else {
    if (!hasMongo) console.log('   ❌ MONGODB_URI is missing in server/.env');
    if (!hasGemini) console.log('   ❌ GEMINI_API_KEY is missing in server/.env');
  }

  // 2. MongoDB Atlas Connection Check
  console.log('\n2️⃣  Checking MongoDB Atlas Connection:');
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`   ✅ Connected to Atlas cluster: ${conn.connection.host}`);
    console.log(`   ✅ Active Database name: ${conn.connection.name}`);
    await mongoose.disconnect();
    passed++;
  } catch (err) {
    console.log(`   ❌ MongoDB connection failed: ${err.message}`);
  }

  // 3. Google Gemini AI Check
  console.log('\n3️⃣  Checking Google Gemini AI Integration:');
  if (geminiService.isConfigured()) {
    try {
      const res = await geminiService.generateText('Respond with exactly: "AI connection confirmed!"');
      if (res.success) {
        console.log(`   ✅ Model: ${geminiService.defaultModel}`);
        console.log(`   ✅ Live AI Response: "${res.text}"`);
        passed++;
      } else {
        console.log(`   ❌ Gemini call failed: ${res.error}`);
      }
    } catch (err) {
      console.log(`   ❌ Gemini error: ${err.message}`);
    }
  } else {
    console.log('   ❌ Gemini service is not configured with an API key.');
  }

  // Summary
  console.log('\n======================================================');
  if (passed === total) {
    console.log(`🎉 ALL CHECKS PASSED (${passed}/${total})! Your backend is ready.`);
  } else {
    console.log(`⚠️  ${passed}/${total} checks passed. Please review the errors above.`);
  }
  console.log('======================================================\n');
  process.exit(passed === total ? 0 : 1);
}

runSelfCheck();
