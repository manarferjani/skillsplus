// migrateQuestions.js
import mongoose from 'mongoose';
import Test from "./models/test.js";

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/yourdb');

  await Test.updateMany(
    { 'questions.type': 'code', $or: [
      { 'questions.language': { $exists: false } },
      { 'questions.language': '' }
    ]},
    { $set: { 'questions.$[elem].language': 'javascript' } },
    { arrayFilters: [{ 'elem.type': 'code' }] }
  );

  console.log('Migration completed');
  process.exit(0);
}

migrate().catch(console.error);