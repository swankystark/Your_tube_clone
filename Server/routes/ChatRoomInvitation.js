import express from 'express';
import { 
    inviteUserToChatRoom, 
    respondToInvitation, 
    getPendingInvitations,
    findUserByEmail 
} from '../Controllers/ChatRoomInvitation.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Invite a user to a chat room
router.post('/invite', auth, inviteUserToChatRoom);

// Respond to a chat room invitation
router.post('/respond', auth, respondToInvitation);

// Get pending invitations for the current user
router.get('/pending', auth, getPendingInvitations);

// Find user by email
router.get('/find-user', auth, findUserByEmail);

export default router;
