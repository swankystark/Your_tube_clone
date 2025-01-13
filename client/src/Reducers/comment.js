export default function commentReducer(state = { data: [] }, action) {
    switch (action.type) {
        case "POST_COMMENT":
            // Ensure we don't add duplicate comments
            const isDuplicate = state.data.some(
                comment => comment._id === action.payload._id
            );
            
            if (isDuplicate) {
                console.warn('Attempted to add duplicate comment:', action.payload);
                return state;
            }

            return {
                ...state,
                data: [action.payload, ...state.data]
            };
        
        case "EDIT_COMMENT":
            return {
                ...state,
                data: state.data.map(comment => 
                    comment._id === action.payload._id ? action.payload : comment
                )
            };
        
        case "LIKE_COMMENT":
            return {
                ...state,
                data: state.data.map(comment => 
                    comment._id === action.payload.commentId 
                        ? { 
                            ...comment, 
                            likes: action.payload.likes,
                            isLiked: action.payload.isLiked
                        } 
                        : comment
                )
            };
        
        case "DISLIKE_COMMENT":
            return {
                ...state,
                data: state.data.map(comment => 
                    comment._id === action.payload.commentId 
                        ? { 
                            ...comment, 
                            dislikes: action.payload.dislikes,
                            isDisliked: action.payload.isDisliked
                        } 
                        : comment
                )
            };
        
        case "TRANSLATE_COMMENT":
            return {
                ...state,
                data: state.data.map(comment => 
                    comment._id === action.payload._id 
                        ? { ...comment, translations: action.payload.translations } 
                        : comment
                )
            };
        
        case "FETCH_ALL_COMMENTS":
            return { ...state, data: action.payload };
        
        case "DELETE_COMMENT":
            return {
                ...state,
                data: state.data.filter(comment => comment._id !== action.payload)
            };
        
        default:
            return state;
    }
};