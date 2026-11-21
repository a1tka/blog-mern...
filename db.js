const mongoose = require('mongoose');

// Cache the connection so serverless invocations (Vercel) reuse it.
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

module.exports = async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
};
