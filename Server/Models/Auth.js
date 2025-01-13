import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: {
        type: String
    },
    desc: {
        type: String
    },
    joinedOn: { 
        type: String, 
        default: new Date().toISOString() 
    },
    subscribers: {
        type: Number,
        default: 0
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true  // Allows multiple null values
    }
});

export default mongoose.model("User", userSchema)