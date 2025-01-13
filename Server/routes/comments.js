import express from 'express';
import { 
    postcomment, 
    getcomment, 
    editcomment, 
    deletecomment, 
    likeComment, 
    dislikeComment, 
    translateComment 
} from '../Controllers/Comment.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Logging middleware for debugging
router.use((req, res, next) => {
    console.log(`Comment Route Accessed: ${req.method} ${req.path}`);
    next();
});

// Add a new comment
router.post('/post', auth, postcomment);

// Get comments for a specific video
router.get('/get/:videoid', getcomment);

// Edit a comment
router.patch('/edit/:id', auth, editcomment);

// Delete a comment
router.delete('/:commentId', auth, deletecomment);

// Like a comment
router.post('/like', auth, (req, res) => {
    console.log('Like Comment Request:', req.body);
    likeComment(req, res);
});

// Dislike a comment
router.post('/dislike', auth, (req, res) => {
    console.log('Dislike Comment Request:', req.body);
    dislikeComment(req, res);
});

// Translate a comment
router.post('/translate', auth, translateComment);

export default router;
