import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastfoodudea';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log(`[MongoDB] Conectado exitosamente a: ${MONGODB_URI}`);
      return m;
    }).catch((err) => {
      cached.promise = null;
      console.error('[MongoDB Error] No se pudo conectar a MongoDB:', err.message);
      throw new Error(`Error de conexión a MongoDB (${MONGODB_URI}): ${err.message}. Asegúrate de que el servicio de MongoDB esté iniciado o configura MONGODB_URI en .env.local.`);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
