import mongoose from 'mongoose';
import ChatRoom from '../models/ChatRoom.js';
import ChatRoomInvitation from '../models/ChatRoomInvitation.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/Auth.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import winston from 'winston';

// Configure dotenv
dotenv.config();

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'chatroom.log' })
    ]
});

// Consistent encryption key generation with enhanced validation
const ENCRYPTION_KEY = (() => {
    const key = process.env.CHAT_ENCRYPTION_KEY;
    if (!key) {
        logger.error('CRITICAL: No CHAT_ENCRYPTION_KEY found in .env');
        throw new Error('Encryption key is not configured');
    }
    
    try {
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== 32) {
            throw new Error('Invalid key length');
        }
        return keyBuffer;
    } catch (error) {
        logger.error('Encryption Key Validation Failed', { error: error.message });
        throw error;
    }
})();

const IV_LENGTH = 16;

// Enhanced Encryption function with comprehensive logging
const encrypt = (text) => {
    if (!text) {
        logger.warn('Attempted to encrypt empty text');
        return null;
    }

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const encryptedMessage = iv.toString('hex') + ':' + encrypted;
        
        logger.info('Message Encrypted Successfully', { 
            textLength: text.length, 
            encryptedLength: encryptedMessage.length 
        });
        
        return encryptedMessage;
    } catch (error) {
        logger.error('Encryption Failed', { 
            error: error.message, 
            errorCode: error.code 
        });
        return text; // Fallback to original text
    }
};

// Enhanced Decryption function with comprehensive logging and error handling
const decrypt = (text) => {
    if (!text) {
        logger.warn('Attempted to decrypt empty text');
        return null;
    }

    try {
        // Validate encryption key
        if (!ENCRYPTION_KEY) {
            throw new Error('Encryption key is not defined');
        }

        const textParts = text.split(':');
        if (textParts.length < 2) {
            throw new Error('Invalid encrypted text format');
        }

        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = textParts.join(':');
        
        // Validate inputs
        if (!iv || iv.length === 0) {
            throw new Error('Invalid initialization vector');
        }
        if (!encryptedText) {
            throw new Error('No encrypted text to decrypt');
        }

        // Ensure encryption key is the correct length for AES-256
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        logger.info('Message Decrypted Successfully', { 
            encryptedLength: text.length, 
            decryptedLength: decrypted.length 
        });
        
        return decrypted;
    } catch (error) {
        // Log detailed error information
        logger.error('Decryption Failed', { 
            error: error.message, 
            errorCode: error.code,
            errorName: error.name,
            partialText: text.substring(0, 50) + '...',
            encryptionKeyDefined: !!ENCRYPTION_KEY,
            encryptionKeyLength: ENCRYPTION_KEY ? ENCRYPTION_KEY.length : 'N/A'
        });

        // More informative fallback
        return text; // Fallback to original text
    }
};

export const createChatRoom = async (req, res) => {
    try {
        const { name, isPrivate } = req.body;
        const createdBy = req.userId;

        // Detailed logging of room creation request
        console.log('Create Chat Room Request:', {
            name,
            isPrivate,
            createdBy
        });

        // Find the user to get their name
        const user = await User.findById(createdBy);
        if (!user) {
            logger.error(`User not found: ${createdBy}`);
            return res.status(404).json({ message: "User not found" });
        }

        // Check if a chat room with the same name already exists
        const existingRoom = await ChatRoom.findOne({ 
            name, 
            participants: createdBy 
        });

        if (existingRoom) {
            logger.warn(`Chat room already exists: ${name}`);
            return res.status(400).json({ 
                message: "A chat room with this name already exists",
                room: existingRoom 
            });
        }

        const newChatRoom = new ChatRoom({
            name,
            participants: [createdBy],
            createdBy: createdBy,
            // Use the original creator's name, not modified
            creatorName: user.name,
            isPrivate: isPrivate === true // Explicitly convert to boolean
        });

        await newChatRoom.save();

        // Log the created room details
        logger.info(`Chat room created: ${newChatRoom._id} by ${user.name}`, {
            roomId: newChatRoom._id,
            name: newChatRoom.name,
            isPrivate: newChatRoom.isPrivate
        });

        res.status(201).json({
            room: {
                ...newChatRoom.toObject(),
                creatorName: user.name
            }
        });
    } catch (error) {
        logger.error('Create Chat Room Error:', error);
        res.status(500).json({ message: 'Error creating chat room', error: error.message });
    }
};

export const addParticipantToChatRoom = async (req, res) => {
    try {
        const { roomId, participantId } = req.body;
        const currentUserId = req.userId;

        const chatRoom = await ChatRoom.findById(roomId);
        const participantToAdd = await User.findById(participantId);

        if (!chatRoom) {
            logger.error(`Chat room not found: ${roomId}`);
            return res.status(404).json({ message: "Chat room not found" });
        }

        if (!participantToAdd) {
            logger.error(`Participant not found: ${participantId}`);
            return res.status(404).json({ message: "Participant not found" });
        }

        // Check if the current user is already in the room
        if (!chatRoom.participants.includes(currentUserId)) {
            logger.warn(`Unauthorized access to chat room: ${roomId}`);
            return res.status(403).json({ message: "You are not a member of this chat room" });
        }

        // Add participant
        chatRoom.addParticipant(participantId, participantToAdd.name);
        await chatRoom.save();

        logger.info(`Participant added to chat room: ${participantToAdd.name} in ${roomId}`);

        res.status(200).json({
            message: "Participant added successfully",
            chatRoom: {
                ...chatRoom.toObject()
            }
        });
    } catch (error) {
        logger.error('Add Participant Error:', error);
        res.status(500).json({ message: 'Error adding participant', error: error.message });
    }
};

export const getChatRooms = async (req, res) => {
    try {
        const userId = req.userId;

        // Find chat rooms where the user is a participant
        const chatRooms = await ChatRoom.find({
            participants: userId
        }).populate('lastMessage');

        logger.info(`Retrieved chat rooms for user: ${userId}`);

        res.status(200).json({
            chatRooms: chatRooms.map(room => ({
                ...room.toObject(),
                createdBy: room.createdBy,
                creatorName: room.creatorName
            }))
        });
    } catch (error) {
        logger.error('Get Chat Rooms Error:', error);
        res.status(500).json({ message: 'Error fetching chat rooms', error: error.message });
    }
};

export const getChatRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.userId; // From auth middleware

        console.group('Get Chat Room Messages');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        // Find the chat room and verify user's membership
        const chatRoom = await ChatRoom.findById(roomId)
            .populate({
                path: 'participants',
                select: 'name email'
            });

        // Check if room exists
        if (!chatRoom) {
            console.error('Chat room not found');
            return res.status(404).json({ 
                message: 'Chat room not found',
                error: 'Invalid room ID'
            });
        }

        // Check if user is a participant
        const isMember = chatRoom.participants.some(
            p => p._id.toString() === userId.toString()
        );

        if (!isMember && chatRoom.isPrivate) {
            console.error('User not authorized to access this room');
            return res.status(403).json({ 
                message: 'Not authorized to access this chat room',
                error: 'Not a room member'
            });
        }

        // Fetch messages with sender details
        const messages = await ChatMessage.find({ chatRoom: roomId })
            .populate({
                path: 'sender',
                select: 'name email _id'
            })
            .sort({ timestamp: 1 }) // Sort messages chronologically
            .limit(100); // Limit to last 100 messages

        // Transform messages to ensure sender name is always present
        const transformedMessages = messages.map(msg => ({
            ...msg.toObject(),
            senderName: msg.sender?.name || 'Unknown',
            senderId: msg.sender?._id || null
        }));

        console.log('Found Messages:', transformedMessages.length);
        console.groupEnd();

        res.status(200).json({
            message: 'Chat room messages retrieved successfully',
            room: {
                _id: chatRoom._id,
                name: chatRoom.name,
                isPrivate: chatRoom.isPrivate,
                participants: chatRoom.participants
            },
            messages: transformedMessages
        });
    } catch (error) {
        console.group('Get Chat Room Messages Error');
        console.error('Detailed Error:', error);
        console.groupEnd();

        res.status(500).json({ 
            message: 'Error retrieving chat room messages', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const sendChatMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;
        const senderId = req.userId; // From auth middleware

        console.group('Send Chat Message');
        console.log('Room ID:', roomId);
        console.log('Sender ID:', senderId);

        // Find the chat room
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
            console.error('Chat room not found');
            return res.status(404).json({ 
                message: 'Chat room not found',
                error: 'Invalid room ID'
            });
        }

        // Find the sender
        const sender = await User.findById(senderId);
        if (!sender) {
            console.error('Sender not found');
            return res.status(404).json({ 
                message: 'Sender not found',
                error: 'Invalid sender ID'
            });
        }

        // Check if user is a participant
        const isMember = chatRoom.participants.some(
            p => p.toString() === senderId.toString()
        );

        if (!isMember && chatRoom.isPrivate) {
            console.error('User not authorized to send message to this room');
            return res.status(403).json({ 
                message: 'Not authorized to send message to this chat room',
                error: 'Not a room member'
            });
        }

        // Create new chat message
        const newMessage = new ChatMessage({
            chatRoom: roomId,
            sender: senderId,
            senderUsername: sender.name,
            content: content,
            encryptedContent: encrypt(content), // Assuming you have an encryption method
            timestamp: new Date()
        });

        // Save the message
        await newMessage.save();

        // Populate sender details for response
        await newMessage.populate({
            path: 'sender',
            select: 'name email _id'
        });

        console.log('Message Sent:', {
            roomId,
            senderId,
            senderName: sender.name,
            contentLength: content.length
        });
        console.groupEnd();

        // Broadcast message via socket (assuming you have socket.io set up)
        // This part depends on your socket.io implementation
        // You might want to emit to the specific room
        // io.to(roomId).emit('new_message', newMessage);

        res.status(201).json({
            message: 'Message sent successfully',
            chatMessage: {
                ...newMessage.toObject(),
                senderName: sender.name,
                senderId: sender._id
            }
        });
    } catch (error) {
        console.group('Send Chat Message Error');
        console.error('Detailed Error:', error);
        console.groupEnd();

        res.status(500).json({ 
            message: 'Error sending chat message', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getUserChatRooms = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        console.group('Get User Chat Rooms');
        console.log('User ID:', userId);

        // Find chat rooms where the user is a participant
        const chatRooms = await ChatRoom.find({ 
            participants: userId 
        }).populate({
            path: 'participants',
            select: 'name email' // Only select necessary user details
        }).lean(); // Use lean for better performance

        console.log('Found Chat Rooms:', chatRooms.length);
        console.groupEnd();

        // Transform rooms to include additional details
        const transformedRooms = chatRooms.map(room => ({
            _id: room._id,
            name: room.name,
            isPrivate: room.isPrivate,
            createdBy: room.createdBy,
            creatorName: room.creatorName,
            participants: room.participants,
            participantCount: room.participants.length
        }));

        res.status(200).json({
            message: 'Chat rooms retrieved successfully',
            chatRooms: transformedRooms
        });
    } catch (error) {
        console.group('Get User Chat Rooms Error');
        console.error('Detailed Error:', error);
        console.groupEnd();

        res.status(500).json({ 
            message: 'Error retrieving chat rooms', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const clearChatRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Validate room exists and user is a participant
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Check if user is a participant
        if (!chatRoom.participants.includes(req.userId)) {
            return res.status(403).json({ message: 'Not authorized to clear messages in this chat room' });
        }

        // Delete all messages for this room
        const deleteResult = await ChatMessage.deleteMany({ roomId });

        res.status(200).json({ 
            message: 'Chat messages cleared successfully', 
            deletedCount: deleteResult.deletedCount 
        });
    } catch (error) {
        console.error('Error clearing chat room messages:', error);
        res.status(500).json({ message: 'Error clearing messages', error: error.message });
    }
};

export const deleteChatRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.userId; // From auth middleware

        console.group('Delete Chat Room');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        // Find the chat room
        const chatRoom = await ChatRoom.findById(roomId);

        // Check if room exists
        if (!chatRoom) {
            console.error('Chat room not found');
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Verify the user is the creator of the room
        if (chatRoom.createdBy.toString() !== userId.toString()) {
            console.error('Unauthorized deletion attempt', {
                expectedCreator: chatRoom.createdBy.toString(),
                actualUser: userId.toString()
            });
            return res.status(403).json({ 
                message: 'You are not authorized to delete this chat room' 
            });
        }

        // Delete associated invitations
        const invitationDeleteResult = await ChatRoomInvitation.deleteMany({ 
            chatRoom: roomId 
        });
        console.log('Deleted Invitations:', invitationDeleteResult.deletedCount);

        // Delete the chat room
        const roomDeleteResult = await ChatRoom.findByIdAndDelete(roomId);
        console.log('Deleted Room:', roomDeleteResult);

        console.groupEnd();

        res.status(200).json({ 
            message: 'Chat room deleted successfully',
            deletedRoomId: roomId,
            deletedInvitationsCount: invitationDeleteResult.deletedCount
        });
    } catch (error) {
        console.group('Delete Chat Room Error');
        console.error('Detailed Error:', error);
        console.groupEnd();

        res.status(500).json({ 
            message: 'Error deleting chat room', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
