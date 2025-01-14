import jwt from "jsonwebtoken"
import users from "../Models/Auth.js";

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extracted with Bearer prefix');
        console.log('Token:', token);

        // Use environment variable for secret key
        const secretKey = process.env.JWT_SECRET;
        console.log('Using secret key:', secretKey);

        // Verify and decode the token
        const decodedData = jwt.verify(token, secretKey);
        console.log('Decoded token data:', decodedData);

        // Additional validation
        if (!decodedData.email || !decodedData.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Find the user to ensure they still exist and the token is valid
        const user = await users.findOne({ 
            _id: decodedData.id
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Validate email consistency
        if (user.email !== decodedData.email) {
            return res.status(401).json({ 
                message: "Token email does not match user's email",
                tokenEmail: decodedData.email,
                userEmail: user.email
            });
        }

        // Attach user information to the request
        req.userId = user._id;
        req.userEmail = user.email;

        console.log('Authentication successful for user:', user._id);
        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        
        res.status(500).json({ message: "Authentication failed" });
    }
};

export default auth;