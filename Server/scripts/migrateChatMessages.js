import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatRoom from '../Models/ChatRoom.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Logging setup
const logFile = path.join(__dirname, 'migration.log');
const logger = {
    log: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(logFile, logMessage);
        console.log(message);
    }
};

// Encryption function (same as in ChatRoom.js)
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

async function migrateChatMessages() {
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
        let messagesReencrypted = 0;

        for (const room of chatRooms) {
            let roomModified = false;

            for (let i = 0; i < room.messages.length; i++) {
                totalMessagesProcessed++;

                // Check if message needs re-encryption
                if (!room.messages[i].encryptedContent) {
                    const originalContent = room.messages[i].content;
                    room.messages[i].encryptedContent = encrypt(originalContent, ENCRYPTION_KEY);
                    roomModified = true;
                    messagesReencrypted++;
                }
            }

            // Save room if modified
            if (roomModified) {
                await room.save();
                logger.log(`Updated room: ${room._id}`);
            }
        }

        logger.log(`Migration complete. Total messages processed: ${totalMessagesProcessed}`);
        logger.log(`Messages re-encrypted: ${messagesReencrypted}`);

        await mongoose.connection.close();
    } catch (error) {
        logger.log(`Migration Error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

migrateChatMessages();
