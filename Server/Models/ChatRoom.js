import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorName: {
        type: String,
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        senderName: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        encryptedContent: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        default: null
    }
}, { 
    timestamps: true 
});

// Add a method to clear old messages
ChatRoomSchema.methods.clearOldMessages = function(maxMessages = 50) {
    if (this.messages.length > maxMessages) {
        this.messages = this.messages.slice(-maxMessages);
    }
    return this.save();
};

// Method to add a participant
ChatRoomSchema.methods.addParticipant = async function(userId, name) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
        await this.save();
    }
    return this;
};

// Method to remove a participant
ChatRoomSchema.methods.removeParticipant = async function(userId) {
    const index = this.participants.indexOf(userId);
    if (index > -1) {
        this.participants.splice(index, 1);
    }
    await this.save();
    return this;
};

export default mongoose.model('ChatRoom', ChatRoomSchema);
