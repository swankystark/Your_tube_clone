import users from "../Models/Auth.js"
import jwt from "jsonwebtoken"

export const login = async (req, res) => {
    try {
        const { email, name, googleId, sessionTimestamp } = req.body;
        console.log("Login Request Received:", { email, name, googleId, sessionTimestamp });
        
        // Find existing user
        let existingUser = await users.findOne({ email });

        if (!existingUser) {
            // Create new user if not exists
            existingUser = await users.create({ 
                email, 
                name: name || email.split('@')[0],
                googleId,
                username: email.split('@')[0],
                joinedOn: new Date().toISOString() 
            });
            console.log("New User Created:", existingUser);
        } else if (existingUser.googleId && existingUser.googleId !== googleId) {
            existingUser.googleId = googleId;
            await existingUser.save();
            console.log("Updated Google ID for User:", existingUser);
        } else {
            // Update existing user's information
            existingUser.name = name || existingUser.name;
            existingUser.googleId = googleId;
            await existingUser.save();
            console.log("Existing User Updated:", existingUser);
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                email: existingUser.email, 
                id: existingUser._id,
                name: existingUser.name,
                sessionTimestamp
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );

        // Prepare response
        const result = {
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            joinedOn: existingUser.joinedOn,
            sessionTimestamp,
            token
        };

        console.log("User Logged In:", existingUser);
        res.status(200).json(result);
        
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Something went wrong..." });
    }
};