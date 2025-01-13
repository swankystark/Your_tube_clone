import Comments from '../Models/comment.js';
import Videofiles from '../Models/videofile.js';  // Add import for Videofiles model
import axios from 'axios';
import geoip from 'geoip-lite';
import mongoose from 'mongoose';

// Language detection and translation using Google Cloud Translation API
const detectLanguage = async (text) => {
    try {
        // If no API key, return early
        if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
            console.warn('No Google Translate API key found. Defaulting to language detection.');
            return detectLanguageWithFallback(text);
        }

        // Attempt Google Cloud Translation language detection
        const response = await axios.post(`https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
            q: text
        });

        // Extract detected language
        const detectedLanguage = response.data.data.detections[0][0].language;
        
        console.log('Detected language:', {
            text,
            language: detectedLanguage
        });

        return detectedLanguage;
    } catch (error) {
        console.warn('Google language detection failed, falling back to manual detection', error);
        return detectLanguageWithFallback(text);
    }
};

// Fallback language detection for non-Latin scripts
const detectLanguageWithFallback = (text) => {
    // Mapping of Unicode block ranges to languages
    const languageRanges = [
        { range: /[\u0B80-\u0BFF]/, language: 'ta' },  // Tamil
        { range: /[\u0D00-\u0D7F]/, language: 'ml' },  // Malayalam
        { range: /[\u0B00-\u0B7F]/, language: 'bn' },  // Bengali
        { range: /[\u0A80-\u0AFF]/, language: 'gu' },  // Gujarati
        { range: /[\u0900-\u097F]/, language: 'hi' },  // Hindi
        { range: /[\u0C00-\u0C7F]/, language: 'kn' },  // Kannada
        { range: /[\u0C80-\u0CFF]/, language: 'te' },  // Telugu
    ];

    // Find matching language based on script
    const matchedLanguage = languageRanges.find(
        ({ range }) => range.test(text)
    );

    return matchedLanguage ? matchedLanguage.language : 'en';
};

const translateText = async (text, targetLanguage = 'en') => {
    try {
        // Validate input
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            console.warn('Invalid text for translation:', text);
            return text;
        }

        // Detect source language if not provided
        const sourceLanguage = await detectLanguage(text);

        // If source and target languages are the same, return original text
        if (sourceLanguage === targetLanguage) {
            return text;
        }

        // Attempt translation
        const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
            q: text,
            source: sourceLanguage,
            target: targetLanguage
        });

        // Extract translated text
        const translatedText = response.data.data.translations[0].translatedText;
        
        console.log('Translation result:', {
            original: text,
            sourceLanguage,
            targetLanguage,
            translatedText
        });

        // Validate translation
        if (!translatedText || translatedText.trim() === text.trim()) {
            console.warn('Translation returned identical text', {
                original: text,
                translated: translatedText
            });
            return text;
        }

        return translatedText;
    } catch (error) {
        console.error('Comprehensive translation error:', {
            message: error.message,
            text,
            targetLanguage,
            fullError: error
        });

        // Fallback mechanism
        return text;
    }
};

const getallcomment = async (req, res) => {
    try {
        const { videoid } = req.params;

        // Fetch comments for specific video, excluding deleted comments
        const comments = await Comments.find({ 
            videoid: videoid,
            isDeleted: { $ne: true } // Exclude deleted comments
        })
        .sort({ commentedon: -1 }) // Sort by most recent first
        .select('-dislikedBy -likedBy'); // Exclude sensitive user-specific arrays

        res.status(200).json(comments);
    } catch (error) {
        console.error('Get Comments Error:', error);
        res.status(500).json({ 
            message: 'Error fetching comments', 
            error: error.message 
        });
    }
};

const postcomment = async (req, res) => {
    try {
        const { commentbody, userid, usercommented, videoid } = req.body;
        
        // Validate comment body
        if (!commentbody || commentbody.trim() === '') {
            return res.status(400).json({ 
                message: 'Comment cannot be empty' 
            });
        }

        // Get user's location using IP geolocation
        let location = { city: 'Unknown', country: 'Unknown' };
        try {
            const ipResponse = await axios.get('https://ipapi.co/json/');
            if (ipResponse.data) {
                location = {
                    city: ipResponse.data.city || 'Unknown',
                    country: ipResponse.data.country_name || 'Unknown',
                    latitude: ipResponse.data.latitude,
                    longitude: ipResponse.data.longitude
                };
            }
        } catch (locationError) {
            console.warn('Failed to fetch location:', locationError);
        }

        // Create new comment with location
        const newComment = new Comments({
            commentbody,
            userid: mongoose.Types.ObjectId(userid),
            usercommented,
            videoid,
            location,
            originalLanguage: 'auto',
            translations: [],
            likes: 0,
            dislikes: 0,
            isDeleted: false, // Explicitly set as not deleted
            likedBy: [],
            dislikedBy: []
        });

        await newComment.save();

        // Increment comment count for the video
        await Videofiles.findByIdAndUpdate(videoid, {
            $inc: { commentCount: 1 }
        });

        // Prepare response without sensitive user-specific data
        const responseComment = {
            ...newComment.toObject(),
            likes: 0,
            dislikes: 0
        };
        delete responseComment.likedBy;
        delete responseComment.dislikedBy;

        res.status(201).json({
            message: 'Comment added successfully',
            comment: responseComment
        });
    } catch (error) {
        console.error('Post Comment Error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Invalid comment. Potentially harmful special characters are not allowed.',
                error: error.message 
            });
        }

        res.status(500).json({ 
            message: 'Error posting comment', 
            error: error.message 
        });
    }
};

const getcomment = async (req, res) => {
    try {
        const { videoid } = req.params;
        console.log('Fetching comments for video:', videoid);
        
        const comments = await Comments.find({ videoid });
        console.log('Found comments:', comments.length);
        
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

const editcomment = async (req, res) => {
    try {
        const { id } = req.params;
        const { commentbody } = req.body;

        // Validate input
        if (!id || !commentbody) {
            return res.status(400).json({ 
                message: 'Comment ID and body are required' 
            });
        }

        // Find and update comment
        const updatedComment = await Comments.findByIdAndUpdate(
            id, 
            { 
                commentbody, 
                editedAt: new Date().toISOString() 
            }, 
            { 
                new: true,  // Return updated document
                runValidators: true  // Run model validations
            }
        );

        // Check if comment exists
        if (!updatedComment) {
            return res.status(404).json({ 
                message: 'Comment not found' 
            });
        }

        // Populate user details for response
        await updatedComment.populate('userid', 'name');

        // Send updated comment
        res.status(200).json({
            message: 'Comment updated successfully',
            comment: updatedComment
        });
    } catch (error) {
        console.error('Edit comment error:', {
            message: error.message,
            commentId: req.params.id,
            fullError: error
        });

        res.status(500).json({ 
            message: 'Failed to edit comment', 
            error: error.message 
        });
    }
};

const deletecomment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { videoId } = req.query;
        
        // Validate input
        if (!commentId || !videoId) {
            return res.status(400).json({ 
                message: 'Comment ID and Video ID are required' 
            });
        }

        // Find and delete comment
        const deletedComment = await Comments.findOneAndDelete({ 
            _id: commentId, 
            videoid: videoId 
        });

        // Check if comment was found and deleted
        if (!deletedComment) {
            return res.status(404).json({ 
                message: 'Comment not found or already deleted' 
            });
        }

        // Update video's comment count
        await Videofiles.findByIdAndUpdate(videoId, {
            $inc: { commentCount: -1 }
        });

        // Send success response
        res.status(200).json({ 
            message: 'Comment deleted successfully',
            deletedComment 
        });
    } catch (error) {
        console.error('Delete comment error:', {
            message: error.message,
            commentId: req.params.commentId,
            videoId: req.query.videoId,
            fullError: error
        });

        res.status(500).json({ 
            message: 'Failed to delete comment', 
            error: error.message 
        });
    }
};

const translateComment = async (req, res) => {
    try {
        const { commentId, targetLanguage = 'en' } = req.body;

        // Validate input
        if (!commentId) {
            return res.status(400).json({ 
                message: 'Comment ID is required' 
            });
        }

        // Find the comment
        const comment = await Comments.findById(commentId);

        if (!comment) {
            return res.status(404).json({ 
                message: 'Comment not found' 
            });
        }

        // Check if translation already exists
        const existingTranslation = comment.translations.find(
            t => t.language === targetLanguage
        );

        let translatedText;
        if (existingTranslation) {
            // Use existing translation
            translatedText = existingTranslation.text;
        } else {
            // Translate the comment body
            translatedText = await translateText(comment.commentbody, targetLanguage);

            // Add new translation to the comment
            comment.translations.push({
                language: targetLanguage,
                text: translatedText
            });

            await comment.save();
        }

        res.status(200).json({
            message: 'Comment translated successfully',
            originalText: comment.commentbody,
            translatedText,
            targetLanguage,
            translations: comment.translations
        });
    } catch (error) {
        console.error('Translate Comment Error:', error);
        res.status(500).json({ 
            message: 'Failed to translate comment', 
            error: error.message 
        });
    }
};

export const likeComment = async (req, res) => {
    try {
        const { commentId, userId } = req.body;

        // Validate input
        if (!commentId || !userId) {
            return res.status(400).json({ message: 'Comment ID and User ID are required' });
        }

        const comment = await Comments.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Prevent actions on deleted comments
        if (comment.isDeleted) {
            return res.status(400).json({ message: 'Cannot interact with deleted comment' });
        }

        // Convert ObjectIds to strings for comparison
        const userIdString = userId.toString();
        const likedByStrings = (comment.likedBy || []).map(id => id.toString());

        // Check if user already liked the comment
        const isLiked = likedByStrings.includes(userIdString);

        if (isLiked) {
            // Remove like
            comment.likedBy = comment.likedBy.filter(id => id.toString() !== userIdString);
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            // Add like
            comment.likedBy.push(userId);
            comment.likes += 1;
        }

        // Save updated comment
        await comment.save();

        // Prepare response
        const responseComment = {
            ...comment.toObject(),
            likes: comment.likes,
            isLiked: !isLiked
        };

        res.status(200).json({
            message: isLiked ? 'Comment unliked successfully' : 'Comment liked successfully',
            comment: responseComment
        });
    } catch (error) {
        console.error('Like Comment Error:', error);
        res.status(500).json({ 
            message: 'Like operation failed', 
            error: error.message 
        });
    }
};

export const dislikeComment = async (req, res) => {
    try {
        const { commentId, userId } = req.body;

        // Validate input
        if (!commentId || !userId) {
            return res.status(400).json({ message: 'Comment ID and User ID are required' });
        }

        const comment = await Comments.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Prevent actions on deleted comments
        if (comment.isDeleted) {
            return res.status(400).json({ message: 'Cannot interact with deleted comment' });
        }

        // Convert ObjectIds to strings for comparison
        const userIdString = userId.toString();
        const dislikedByStrings = (comment.dislikedBy || []).map(id => id.toString());

        // Check if user already disliked the comment
        const isDisliked = dislikedByStrings.includes(userIdString);

        if (isDisliked) {
            // Remove dislike
            comment.dislikedBy = comment.dislikedBy.filter(id => id.toString() !== userIdString);
            comment.dislikes = Math.max(0, comment.dislikes - 1);
        } else {
            // Add dislike
            comment.dislikedBy.push(userId);
            comment.dislikes += 1;
        }

        // Save updated comment
        await comment.save();

        // Prepare response
        const responseComment = {
            ...comment.toObject(),
            dislikes: comment.dislikes,
            isDisliked: !isDisliked
        };

        res.status(200).json({
            message: isDisliked ? 'Comment undisliked successfully' : 'Comment disliked successfully',
            comment: responseComment
        });
    } catch (error) {
        console.error('Dislike Comment Error:', error);
        res.status(500).json({ 
            message: 'Dislike operation failed', 
            error: error.message 
        });
    }
};

export {
    getallcomment,
    postcomment,
    getcomment,
    editcomment,
    deletecomment,
    translateText,
    translateComment
};