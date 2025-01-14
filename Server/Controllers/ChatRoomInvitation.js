import ChatRoom from '../models/ChatRoom.js';
import ChatRoomInvitation from '../models/ChatRoomInvitation.js';
import User from '../models/Auth.js';

export const inviteUserToChatRoom = async (req, res) => {
    try {
        const { chatRoomId, invitedUserEmail } = req.body;
        const invitedBy = req.userId; // From auth middleware

        // Find the chat room
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Check if the user initiating the invite is a participant
        if (!chatRoom.participants.includes(invitedBy)) {
            return res.status(403).json({ message: 'You are not a participant of this chat room' });
        }

        // Find the user to invite
        const invitedUser = await User.findOne({ email: invitedUserEmail });
        if (!invitedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already a participant
        if (chatRoom.participants.includes(invitedUser._id)) {
            return res.status(400).json({ message: 'User is already a participant' });
        }

        // Check for existing pending invitation
        const existingInvitation = await ChatRoomInvitation.findOne({
            chatRoom: chatRoomId,
            invitedUser: invitedUser._id,
            status: 'PENDING'
        });

        if (existingInvitation) {
            return res.status(400).json({ message: 'An invitation is already pending' });
        }

        // Create invitation
        const invitation = new ChatRoomInvitation({
            chatRoom: chatRoomId,
            invitedBy,
            invitedUser: invitedUser._id
        });

        await invitation.save();

        res.status(201).json({ 
            message: 'Invitation sent successfully',
            invitationId: invitation._id
        });
    } catch (error) {
        console.error('Invite to chat room error:', error);
        res.status(500).json({ message: 'Error inviting user to chat room', error: error.message });
    }
};

export const respondToInvitation = async (req, res) => {
    try {
        const { invitationId, response } = req.body;
        const userId = req.userId; // From auth middleware

        console.log('Responding to invitation:', {
            invitationId,
            response,
            userId,
            userIdType: typeof userId,
            userIdString: userId.toString()
        });

        // Find the invitation with full population
        const invitation = await ChatRoomInvitation.findById(invitationId)
            .populate({
                path: 'invitedUser',
                select: '_id email name'
            })
            .populate({
                path: 'chatRoom',
                select: '_id name participants isPrivate'
            });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Normalize user ID comparison
        const invitedUserIdString = invitation.invitedUser._id.toString();
        const currentUserIdString = userId.toString();

        // Validate the user responding to the invitation
        if (invitedUserIdString !== currentUserIdString) {
            console.error('Authorization FAILED:', {
                expectedUserId: invitedUserIdString,
                actualUserId: currentUserIdString
            });
            return res.status(403).json({ 
                message: 'You are not authorized to respond to this invitation',
            });
        }

        // Check if invitation is still valid
        if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invitation is no longer valid' });
        }

        // Update invitation status
        invitation.status = response.toUpperCase(); // 'ACCEPTED' or 'REJECTED'
        await invitation.save();

        // If accepted, add user to chat room
        if (response.toUpperCase() === 'ACCEPTED') {
            const chatRoom = invitation.chatRoom;
            
            // Ensure room is marked as private
            if (!chatRoom.isPrivate) {
                chatRoom.isPrivate = true;
                await chatRoom.save();
            }
            
            // Check if user is already a participant
            if (!chatRoom.participants.some(p => p.toString() === currentUserIdString)) {
                chatRoom.participants.push(userId);
                await chatRoom.save();
            }

            return res.status(200).json({ 
                message: 'Invitation accepted', 
                chatRoomId: chatRoom._id,
                isPrivate: chatRoom.isPrivate  
            });
        }

        res.status(200).json({ message: 'Invitation rejected' });
    } catch (error) {
        console.error('Respond to invitation error:', error);
        res.status(500).json({ message: 'Error responding to invitation', error: error.message });
    }
};

export const getPendingInvitations = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        const pendingInvitations = await ChatRoomInvitation.find({
            invitedUser: userId,
            status: 'PENDING'
        })
        .populate('chatRoom', 'name')
        .populate('invitedBy', 'name email');

        res.status(200).json({ 
            pendingInvitations,
            count: pendingInvitations.length
        });
    } catch (error) {
        console.error('Get pending invitations error:', error);
        res.status(500).json({ message: 'Error fetching pending invitations', error: error.message });
    }
};

export const findUserByEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email }).select('_id name email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Find user by email error:', error);
        res.status(500).json({ 
            message: 'Error finding user', 
            error: error.message 
        });
    }
};
