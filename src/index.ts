import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import professionalsRoutes from './routes/professionals';
import bookingsRoutes from './routes/bookings';
import reviewsRoutes from './routes/reviews';
import uploadRoutes, { UPLOADS_DIR } from './routes/upload';
import settingsRoutes from './routes/settings';
import earningsRoutes from './routes/earnings';
import chatRoutes from './routes/chat';
import restaurantsRoutes from './routes/restaurants';
import driversRoutes from './routes/drivers';
import foodOrdersRoutes from './routes/foodOrders';
import foodAdminRoutes from './routes/foodAdmin';
import { initSocket } from './lib/socket';

dotenv.config();

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Basic health check endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'Rafik Services Backend API is running!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/chat', chatRoutes);
// Food delivery module (Tawsil-style)
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/food-orders', foodOrdersRoutes);
app.use('/api/food', foodAdminRoutes);

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initSocket(server, corsOrigins);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (REST + Socket.IO)`);
});
