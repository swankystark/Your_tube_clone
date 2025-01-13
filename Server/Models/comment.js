import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
    commentbody: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                // Prevent potentially harmful special characters and scripts
                const dangerousSpecialCharsRegex = /[<>&'"{}[\]()]/;
                return !dangerousSpecialCharsRegex.test(v);
            },
            message: props => `Comment contains potentially harmful special characters!`
        },
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    userid: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    usercommented: { 
        type: String, 
        required: true 
    },
    videoid: { 
        type: String, 
        required: true 
    },
    commentedon: { 
        type: Date, 
        default: Date.now 
    },
    likes: { 
        type: Number, 
        default: 0 
    },
    dislikes: { 
        type: Number, 
        default: 0 
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    location: {
        city: { type: String, default: 'Unknown' },
        country: { type: String, default: 'Unknown' },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    originalLanguage: { 
        type: String, 
        default: 'auto',
        validate: {
            validator: function(v) {
                // Ensure language code is valid (2 lowercase letters or 'auto')
                return v === 'auto' || /^[a-z]{2}$/.test(v);
            },
            message: 'Invalid language code'
        }
    },
    translations: [{
        language: { 
            type: String, 
            validate: {
                validator: function(v) {
                    return /^[a-z]{2}$/.test(v);
                },
                message: 'Invalid translation language code'
            }
        },
        text: { 
            type: String, 
            validate: {
                validator: function(v) {
                    return v && v.trim().length > 0;
                },
                message: 'Translated text must contain at least one non-whitespace character'
            }
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true 
});

// Add a pre-save hook for additional validation
commentSchema.pre('save', function(next) {
    // Trim whitespace
    this.commentbody = this.commentbody.trim();

    // Prevent completely empty comments
    if (this.commentbody.length === 0) {
        return next(new Error('Comment cannot be empty'));
    }

    next();
});

// Add a query middleware to exclude deleted comments by default
commentSchema.pre('find', function() {
    this.where({ isDeleted: { $ne: true } });
});

export default mongoose.model("Comments", commentSchema);