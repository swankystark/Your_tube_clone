import mongoose from 'mongoose';

const ChatRoomInvitationSchema = new mongoose.Schema({
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING'
    },
    invitedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 days from now
    }
}, { 
    timestamps: true 
});

// Method to check if invitation is still valid
ChatRoomInvitationSchema.methods.isValid = function() {
    return this.status === 'PENDING' && this.expiresAt > new Date();
};

export default mongoose.model('ChatRoomInvitation', ChatRoomInvitationSchema);
