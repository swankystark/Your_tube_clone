import users from "../Models/Auth.js"
import jwt from "jsonwebtoken"

export const login = async (req, res) => {
    try {
        const { email, name, googleId, sessionTimestamp } = req.body;
        console.log("Login Request Received:", { email, name, googleId, sessionTimestamp });
        
        // Find existing user or create new one
        let existingUser = await users.findOne({ email });

        if (!existingUser) {
            // Check if email is already used by another account
            const emailInUse = await users.findOne({ email: { $ne: email } });
            if (emailInUse) {
                return res.status(400).json({ 
                    message: "Email is already associated with another account" 
                });
            }

            // Create new user if not exists
            existingUser = await users.create({ 
                email, 
                name: name || email.split('@')[0],
                googleId,
                username: email.split('@')[0],
                joinedOn: new Date().toISOString() 
            });
            console.log("New User Created:", existingUser);
        } else {
            // Update user's name if different
            if (existingUser.name !== name) {
                existingUser.name = name;
                await existingUser.save();
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                email: existingUser.email, 
                id: existingUser._id,
                name: existingUser.name,
                sessionTimestamp // Include session timestamp
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
            sessionTimestamp // Include session timestamp in response
        };

        console.log("User Logged In:", existingUser);
        res.status(200).json({ 
            result, 
            token 
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            message: "Something went wrong during login", 
            error: error.message 
        });
    }
};