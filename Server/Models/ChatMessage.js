import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderUsername: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    readByUsernames: [{
        type: String
    }]
}, {
    timestamps: true
});

// Method to mark message as read
ChatMessageSchema.methods.markAsRead = function(userId, username) {
    if (!this.readBy.includes(userId)) {
        this.readBy.push(userId);
        this.readByUsernames.push(username);
    }
    return this;
};

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

export default ChatMessage;
