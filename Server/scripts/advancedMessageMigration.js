import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatRoom from '../Models/ChatRoom.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, 'advanced_migration.log');

// Logging setup with file and console output
const logger = {
    log: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        // Write to log file
        try {
            fs.appendFileSync(logFile, logMessage);
        } catch (fileError) {
            console.error('Failed to write to log file:', fileError);
        }
        
        // Log to console
        console.log(message);
    }
};

dotenv.config({ path: path.join(__dirname, '../.env') });

// Encryption function with error handling
const encrypt = (text, key) => {
    const IV_LENGTH = 16;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        logger.log(`Encryption Error: ${error.message}`);
        return text;
    }
};

async function advancedMessageMigration() {
    try {
        // Validate encryption key
        const ENCRYPTION_KEY = Buffer.from(process.env.CHAT_ENCRYPTION_KEY, 'hex');
        if (ENCRYPTION_KEY.length !== 32) {
            throw new Error('Invalid encryption key length');
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        logger.log('Connected to MongoDB');

        // Find all chat rooms
        const chatRooms = await ChatRoom.find({});
        logger.log(`Found ${chatRooms.length} chat rooms`);

        let totalMessagesProcessed = 0;
        let messagesCleared = 0;

        for (const room of chatRooms) {
            let roomModified = false;

            // Clear existing messages and re-encrypt
            const newMessages = [];
            for (const message of room.messages) {
                // Skip messages without content
                if (!message.content) continue;

                // Re-encrypt message
                const encryptedContent = encrypt(message.content, ENCRYPTION_KEY);
                
                newMessages.push({
                    sender: message.sender,
                    content: message.content,
                    encryptedContent: encryptedContent,
                    timestamp: message.timestamp || new Date()
                });

                totalMessagesProcessed++;
            }

            // Replace messages with newly encrypted ones
            room.messages = newMessages;
            
            // Limit to last 50 messages
            if (room.messages.length > 50) {
                room.messages = room.messages.slice(-50);
                messagesCleared += room.messages.length - 50;
            }

            // Save room if modified
            await room.save();
            logger.log(`Updated room: ${room._id}`);
        }

        logger.log(`Migration complete.`);
        logger.log(`Total messages processed: ${totalMessagesProcessed}`);
        logger.log(`Messages cleared beyond limit: ${messagesCleared}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        logger.log(`Migration Error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

advancedMessageMigration();
