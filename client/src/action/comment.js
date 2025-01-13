import { 
    editcomment as apiEditComment, 
    getallcomment as apiGetAllComments, 
    postcomment as apiPostComment, 
    deletecomment as apiDeleteComment, 
    likeComment as apiLikeComment, 
    dislikeComment as apiDislikeComment, 
    translateComment as apiTranslateComment 
} from '../Api/index'

export const editcomment = (commentdata) => async (dispatch, getState) => {
    try {
        const { id, commentbody } = commentdata;
        
        // Validate input
        if (!id || !commentbody) {
            throw new Error('Comment ID and body are required');
        }

        // Make API call to edit comment
        const { data } = await apiEditComment(id, commentbody);
        
        // Dispatch edit action
        dispatch({
            type: 'EDIT_COMMENT',
            payload: data
        });

        return data;
    } catch (error) {
        console.error('Edit Comment Error:', error);
        throw error;
    }
};

export const getallcomment = (videoid) => async (dispatch, getState) => {
    try {
        // If no videoid is provided, try to get it from the current video in the state
        if (!videoid) {
            // Safely access currentVideo, providing a fallback
            const videoState = getState().video || {};
            const currentVideo = videoState.currentVideo || {};
            videoid = currentVideo._id;
        }

        // Validate video ID
        if (!videoid) {
            console.warn('No video ID available for comment fetch');
            dispatch({ 
                type: 'FETCH_ALL_COMMENTS', 
                payload: [] 
            });
            return [];
        }

        const { data } = await apiGetAllComments(videoid);
        
        // Filter out deleted comments and sensitive user data
        const filteredComments = data.filter(comment => !comment.isDeleted)
            .map(comment => {
                // Remove sensitive user-specific data
                const { likedBy, dislikedBy, ...safeComment } = comment;
                return {
                    ...safeComment,
                    likes: comment.likes || 0,
                    dislikes: comment.dislikes || 0
                };
            });

        dispatch({ 
            type: 'FETCH_ALL_COMMENTS', 
            payload: filteredComments 
        });

        return filteredComments;
    } catch (error) {
        console.error('Get Comments Error:', {
            message: error.message,
            stack: error.stack,
            state: getState()
        });
        
        // Dispatch an empty array to prevent UI errors
        dispatch({ 
            type: 'FETCH_ALL_COMMENTS', 
            payload: [] 
        });

        // Re-throw the error for any additional error handling
        throw error;
    }
};

export const postcomment = (commentData) => async (dispatch) => {
    try {
        const { data } = await apiPostComment(commentData);
        
        // Ensure only safe comment data is dispatched
        const { likedBy, dislikedBy, ...safeComment } = data.comment;
        
        dispatch({ 
            type: 'POST_COMMENT', 
            payload: {
                ...safeComment,
                likes: 0,
                dislikes: 0
            }
        });
        
        return data;
    } catch (error) {
        console.error('Post Comment Error:', error);
        throw error;
    }
};

export const deletecomment = (commentId) => async (dispatch, getState) => {
    try {
        // Get current video ID from state
        const { currentVideo } = getState().video;
        const currentVideoId = currentVideo?._id;

        if (!commentId || !currentVideoId) {
            throw new Error('Comment ID and Video ID are required');
        }

        // Call API to delete comment
        const response = await apiDeleteComment({
            commentId, 
            videoId: currentVideoId
        });

        // Dispatch delete action
        dispatch({
            type: 'DELETE_COMMENT',
            payload: commentId
        });

        return response;
    } catch (error) {
        console.error('Delete Comment Error:', error);
        throw error;
    }
};

export const likeComment = (likeData) => async (dispatch) => {
    try {
        const { data } = await apiLikeComment(likeData);
        
        // Dispatch action to update comment in state
        dispatch({
            type: 'LIKE_COMMENT',
            payload: {
                commentId: likeData.commentId,
                likes: data.comment.likes,
                isLiked: data.comment.isLiked
            }
        });

        return data.comment;
    } catch (error) {
        console.error('Like Comment Error:', error);
        throw error;
    }
};

export const dislikeComment = (dislikeData) => async (dispatch) => {
    try {
        const { data } = await apiDislikeComment(dislikeData);
        
        // Dispatch action to update comment in state
        dispatch({
            type: 'DISLIKE_COMMENT',
            payload: {
                commentId: dislikeData.commentId,
                dislikes: data.comment.dislikes,
                isDisliked: data.comment.isDisliked
            }
        });

        return data.comment;
    } catch (error) {
        console.error('Dislike Comment Error:', error);
        throw error;
    }
};

export const translatecomment = (commentId, targetLanguage) => async (dispatch) => {
    try {
        // Validate inputs
        if (!commentId || !targetLanguage) {
            throw new Error('Missing translation parameters');
        }

        // Make API call
        const translationData = {
            commentId,
            targetLanguage
        };

        const response = await apiTranslateComment(translationData);

        // Dispatch translation update
        dispatch({
            type: 'TRANSLATE_COMMENT',
            payload: {
                _id: commentId,
                translations: response.translations || []
            }
        });

        // Return the translated text
        return response.translatedText || response.translations[0]?.text;
    } catch (error) {
        console.error('Translate Comment Error:', error);
        throw error;
    }
};