import { mkdirSync } from 'node:fs';
import mongoose from 'mongoose';

let memory = null;

/**
 * Connect to MongoDB. With no MONGODB_URI (development) a private mongod is started
 * and its data is kept in .data/mongo, so no database install is needed.
 */
export async function connect(uri, { persist = true } = {}) {
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = persist ? '.data/mongo' : undefined;
    if (dbPath) mkdirSync(dbPath, { recursive: true });
    const instance = { dbPath, storageEngine: 'wiredTiger' };
    try {
      memory = await MongoMemoryServer.create({ instance: { ...instance, port: persist ? 27018 : undefined } });
    } catch {
      memory = await MongoMemoryServer.create({ instance });
    }
    uri = memory.getUri('shortener');
    console.log(`[db] started local mongod at ${uri}`);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
}

export async function disconnect() {
  await mongoose.disconnect();
  if (memory) await memory.stop();
  memory = null;
}
