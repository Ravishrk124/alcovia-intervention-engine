import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase, { testConnection } from './config/database.js';
import studentRoutes, { setSocketIO } from './routes/student.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Pass Socket.IO instance to routes
setSocketIO(io);

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Alcovia Intervention Engine API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            studentStatus: '/api/student-status/:studentId',
            dailyCheckin: '/api/daily-checkin',
            assignIntervention: '/api/assign-intervention',
            completeIntervention: '/api/complete-intervention',
            studentByEmail: '/api/student-by-email/:email'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

app.use('/api', studentRoutes);

// Error handler (must be last)
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Student joins their personal room
    socket.on('join_student_room', (studentId) => {
        socket.join(studentId);
        console.log(`👤 Student ${studentId} joined their room`);

        socket.emit('joined', {
            message: 'Connected to real-time updates',
            studentId
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        server.listen(PORT, () => {
            console.log('');
            console.log('🚀 ===================================');
            console.log('   Alcovia Intervention Engine API');
            console.log('   ===================================');
            console.log(`   Server: http://localhost:${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Database: ${process.env.SUPABASE_URL ? 'Supabase' : 'Not configured'}`);
            console.log(`   WebSockets: Enabled`);
            console.log('🚀 ===================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export { app, io };
