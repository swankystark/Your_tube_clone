import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import bodyParser from 'body-parser'
import videoRoutes from './routes/video.js'
import userRoutes from './routes/user.js'
import commentRoutes from './routes/comments.js'
import chatRoomRoutes from './routes/chatRoom.js'
import chatRoomInvitationRoutes from './routes/ChatRoomInvitation.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io'
import http from 'http'
import ChatMessage from './Models/ChatMessage.js'
import User from './Models/Auth.js'
import ChatRoom from './Models/ChatRoom.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// Resolve the current file's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables with a specific path
dotenv.config({ 
    path: path.resolve(__dirname, '.env') 
});

// Comprehensive environment variable validation
const validateEnvVariables = () => {
    const requiredEnvVars = ['DB_URL', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => 
        !process.env[varName]
    );
    
    if (missingVars.length > 0) {
        console.error('CRITICAL: Missing environment variables:', missingVars);
        console.log('Current environment variables:', {
            DB_URL: !!process.env.DB_URL,
            JWT_SECRET: !!process.env.JWT_SECRET,
            JWT_SECRET_VALUE: process.env.JWT_SECRET ? 'PRESENT' : 'MISSING'
        });
        
        // Throw an error to prevent server startup
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Ensure PORT is set
    process.env.PORT = process.env.PORT || '5000';
};

// Call validation function
validateEnvVariables();

const app = express()
const server = http.createServer(app)

app.use(bodyParser.json({limit:"30mb",extended:true}))
app.use(bodyParser.urlencoded({limit:"30mb",extended:true}))

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'https://your-tube-project.netlify.app',
            'http://localhost:3000'
        ].filter(Boolean); // Remove any undefined values
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json({limit:"30mb",extended:true}))
app.use(express.urlencoded({limit:"30mb",extended:true}))
app.use('/uploads',express.static(path.join('uploads')))

app.get('/',(req,res)=>{
    res.send("Your tube is working")
})

// Add health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Socket.io Configuration
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:5000", "https://your-tube-clone-1-7fms.onrender.com", "https://your-tube-project.netlify.app"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
    }
});

// Track active rooms and users
const activeRooms = new Map();

// Socket authentication middleware
io.use(async (socket, next) => {
    try {
        console.group('Socket Authentication');
        console.log('Authentication Attempt');
        console.log('Socket Handshake Query:', socket.handshake.query);
        console.log('Socket Handshake Auth:', socket.handshake.auth);

        const token = socket.handshake.auth.token;
        const roomId = socket.handshake.query.roomId;
        const userId = socket.handshake.query.userId;

        console.log('Received Token:', token ? 'Present' : 'Missing');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        if (!token) {
            console.error('No authentication token provided');
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded User:', {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name
            });

            // Additional verification
            if (decoded.id !== userId) {
                console.error('User ID mismatch', {
                    tokenUserId: decoded.id,
                    providedUserId: userId
                });
                return next(new Error('Authentication error: User ID mismatch'));
            }

            // Verify user exists in database
            const user = await User.findById(decoded.id);
            if (!user) {
                console.error('User not found in database');
                return next(new Error('Authentication error: User not found'));
            }

            // Optional: Check room access if room ID is provided
            if (roomId) {
                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    console.error('Room not found:', roomId);
                    return next(new Error('Authentication error: Room not found'));
                }

                // Check if user is a participant
                const isMember = room.participants.some(
                    p => p.toString() === decoded.id.toString()
                );

                if (!isMember) {
                    console.error('User not a member of the room', {
                        userId: decoded.id,
                        roomId: roomId
                    });
                    return next(new Error('Authentication error: Not a room member'));
                }
            }

            // Attach user to socket
            socket.user = user;
            console.log('Socket Authentication Successful');
            console.groupEnd();
            next();
        } catch (tokenError) {
            console.error('Token Verification Error:', tokenError.message);
            console.groupEnd();
            return next(new Error(`Authentication error: ${tokenError.message}`));
        }
    } catch (error) {
        console.error('Socket Authentication Critical Error:', error);
        console.groupEnd();
        return next(new Error('Authentication failed'));
    }
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Room joining logic with comprehensive checks
    socket.on('join_room', async (roomId) => {
        try {
            console.log(`User ${socket.user._id} attempting to join room: ${roomId}`);
            
            // Validate room access with detailed logging
            const room = await ChatRoom.findById(roomId)
                .populate('participants', 'name email');
            
            if (!room) {
                console.warn(`Room not found: ${roomId}`);
                socket.emit('join_room_error', { 
                    message: 'Room not found', 
                    roomId 
                });
                return;
            }

            // Enhanced participant verification
            const isMember = room.participants.some(
                participant => participant._id.toString() === socket.user._id.toString()
            );

            if (!isMember) {
                console.warn(`User ${socket.user._id} not a member of room ${roomId}`);
                socket.emit('join_room_error', { 
                    message: 'Not authorized to join this room', 
                    roomId 
                });
                return;
            }

            // Join room and track membership
            socket.join(roomId);
            socket.currentRoom = roomId;

            // Track room members with more details
            if (!activeRooms.has(roomId)) {
                activeRooms.set(roomId, new Set());
            }
            activeRooms.get(roomId).add(socket.id);

            // Broadcast comprehensive room update
            io.to(roomId).emit('room_members_update', {
                roomId,
                memberCount: activeRooms.get(roomId).size,
                members: room.participants.map(p => ({
                    _id: p._id,
                    name: p.name,
                    email: p.email
                }))
            });

            // Fetch and emit recent messages
            const recentMessages = await ChatMessage.find({ room: roomId })
                .sort({ timestamp: -1 })
                .limit(50)
                .populate('sender', 'name email');

            socket.emit('recent_messages', {
                roomId,
                messages: recentMessages.map(msg => ({
                    _id: msg._id,
                    content: msg.content,
                    sender: {
                        _id: msg.sender._id,
                        name: msg.sender.name,
                        email: msg.sender.email
                    },
                    timestamp: msg.timestamp
                }))
            });

        } catch (error) {
            console.error('Room join error:', error);
            socket.emit('join_room_error', { 
                message: 'Failed to join room', 
                error: error.message 
            });
        }
    });

    // Enhanced message sending logic
    socket.on('send_message', async (messageData) => {
        try {
            console.log('Received socket message:', JSON.stringify(messageData, null, 2));
            
            // Comprehensive input validation
            if (!messageData.roomId || !messageData.content || !messageData.sender) {
                console.warn('Invalid message data:', messageData);
                socket.emit('message_error', { 
                    message: 'Invalid message data',
                    details: messageData 
                });
                return;
            }

            // Verify room and sender with population
            const room = await ChatRoom.findById(messageData.roomId)
                .populate('participants', '_id name email');
            const sender = await User.findById(messageData.sender);

            if (!room || !sender) {
                console.warn('Room or sender not found:', { 
                    roomId: messageData.roomId, 
                    senderId: messageData.sender 
                });
                socket.emit('message_error', { 
                    message: 'Invalid room or sender',
                    roomId: messageData.roomId,
                    senderId: messageData.sender
                });
                return;
            }

            // Verify sender is in the room
            const isMember = room.participants.some(
                p => p._id.toString() === sender._id.toString()
            );

            if (!isMember) {
                console.warn(`Sender ${sender._id} not in room ${room._id}`);
                socket.emit('message_error', { 
                    message: 'Not authorized to send message in this room',
                    roomId: room._id
                });
                return;
            }

            // Create new chat message
            const newMessage = new ChatMessage({
                chatRoom: room._id,
                sender: sender._id,
                senderUsername: sender.name,  // Use sender's name as username
                content: messageData.content
            });

            await newMessage.save();

            // Prepare broadcast message with sender details
            const broadcastMessage = {
                _id: newMessage._id,
                roomId: room._id,
                sender: {
                    _id: sender._id,
                    name: sender.name,
                    email: sender.email
                },
                content: messageData.content,
                timestamp: newMessage.timestamp
            };

            // Broadcast to ALL participants in the room
            io.to(messageData.roomId).emit('receive_message', broadcastMessage);

            console.log('Message broadcast successfully:', {
                messageId: newMessage._id,
                roomId: messageData.roomId,
                participants: room.participants.length
            });

        } catch (error) {
            console.error('Message sending critical error:', {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            });

            socket.emit('message_error', {
                message: 'Failed to send message',
                error: error.message
            });
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove user from active rooms
        for (const [roomId, members] of activeRooms.entries()) {
            if (members.has(socket.id)) {
                members.delete(socket.id);
                
                // Broadcast updated member count
                io.to(roomId).emit('room_members_update', {
                    roomId,
                    memberCount: members.size
                });
            }
        }
    });
});

// Routes
app.use("/user", userRoutes)
app.use("/video", videoRoutes)
app.use("/comments", commentRoutes)
app.use("/chatroom", chatRoomRoutes)
app.use("/chatroom-invitation", chatRoomInvitationRoutes)

// Database connection
const PORT = process.env.PORT || 5000;
const CONNECTION_URL = process.env.DB_URL;

console.log('Environment Variables:', {
    PORT,
    MONGODB_URL: CONNECTION_URL ? '[REDACTED]' : 'NOT SET'
});

mongoose.connect(CONNECTION_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
})
.then(() => {
    console.log('MongoDB Atlas connected successfully');
    console.log(`Connected to database: ${CONNECTION_URL.split('@')[1]}`); // Only log the non-sensitive part
    
    // Start the server
    server.listen(PORT, () => {
        console.log(`Server running on port: ${PORT}`);
        console.log(`Server accessible at: http://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.error('MongoDB connection error:', {
        message: error.message,
        stack: error.stack,
        connectionUrl: CONNECTION_URL
    });
    process.exit(1);
});

export { io };