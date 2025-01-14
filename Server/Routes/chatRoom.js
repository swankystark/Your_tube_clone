import express from 'express';
import { 
    createChatRoom, 
    getUserChatRooms, 
    getChatRoomMessages,
    sendChatMessage,
    deleteChatRoom
} from '../Controllers/ChatRoom.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create a new chat room
router.post('/create', auth, createChatRoom);

// Get user's chat rooms
router.get('/', auth, getUserChatRooms);

// Get messages for a specific chat room
router.get('/:roomId/messages', auth, getChatRoomMessages);

// Send a message to a chat room
router.post('/:roomId/send', auth, sendChatMessage);

// Delete a chat room (only by creator)
router.delete('/:roomId', auth, deleteChatRoom);

export default router;
