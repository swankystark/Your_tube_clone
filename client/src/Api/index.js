import axios from 'axios';
import { getServerUrl } from '../utils/urlConfig';

// Create Axios instance with base configuration
const API = axios.create({ 
    baseURL: getServerUrl(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Dynamically set headers based on request type
API.interceptors.request.use((config) => {
    // Check if it's a file upload
    if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
    }

    // Add authentication token
    const profile = localStorage.getItem('Profile');
    if (profile) {
        try {
            const parsedProfile = JSON.parse(profile);
            if (parsedProfile && parsedProfile.token) {
                config.headers.Authorization = `Bearer ${parsedProfile.token}`;
            }
        } catch (error) {
            console.error('Error parsing profile:', error);
        }
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add response interceptor for better error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        if (error.response) {
            return Promise.reject(error.response.data);
        } else if (error.request) {
            return Promise.reject({
                message: 'No response received from server. Please check your connection.',
                error: error.request
            });
        } else {
            return Promise.reject({
                message: 'Error setting up request',
                error: error.message
            });
        }
    }
);

// Error handling wrapper
const handleApiError = (error) => {
    console.error('API Request Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
    });
    throw error;
};

// Authentication endpoints
export const login = async (authdata) => {
    console.log('Login attempt with data:', authdata);
    try {
        const response = await API.post('/user/login', authdata);
        if (response.data) {
            localStorage.setItem('Profile', JSON.stringify(response.data));
        }
        return response;
    } catch (error) {
        console.error('Login API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

export const updatechaneldata=(id,updatedata)=>API.patch(`/user/update/${id}`,updatedata).catch(handleApiError);
export const fetchallchannel=()=>API.get("/user/getallchannel").catch(handleApiError);

export const uploadvideo=(filedata,fileoption)=>API.post("/video/uploadvideo",filedata,fileoption).catch(handleApiError);
export const getvideos=()=>API.get("/video/getvideos").catch(handleApiError);
export const likevideo=(id,Like)=>API.patch(`/video/like/${id}`,{Like}).catch(handleApiError);
export const viewsvideo=(id)=>API.patch(`/video/view/${id}`).catch(handleApiError);

export const postcomment = (commentData) => {
    // Normalize comment data fields
    const normalizedData = {
        videoid: commentData.videoid,
        userid: commentData.userid,
        commentbody: commentData.commentbody,
        usercommented: commentData.usercommented || 'Anonymous',
        commentedon: new Date().toISOString()  // Add consistent timestamp
    };

    return API.post('/comments/post', normalizedData)
        .then(response => {
            console.log('Comment posted:', response.data);
            return response;
        })
        .catch(handleApiError);
};

export const deletecomment = (deleteData) => {
    // Validate input
    if (!deleteData.commentId || !deleteData.videoId) {
        console.error('Invalid delete parameters', deleteData);
        return Promise.reject(new Error('Comment ID and Video ID are required'));
    }

    // Make API call to delete comment
    return API.delete(`/comments/${deleteData.commentId}`, { 
        params: { 
            videoId: deleteData.videoId 
        } 
    }).catch(handleApiError);
};

export const editcomment = (id, commentbody) => {
    // Validate input
    if (!id || !commentbody) {
        console.error('Invalid edit comment parameters', { id, commentbody });
        return Promise.reject(new Error('Comment ID and body are required'));
    }

    // Make API call with error handling
    return API.patch(`/comments/edit/${id}`, { commentbody })
        .then(response => {
            console.log('Comment edited:', response.data);
            return response;
        })
        .catch(handleApiError);
};

export const getallcomment=(videoid)=>{
    // Validate video ID
    if (!videoid) {
        console.warn('No video ID provided for comment fetch');
        return Promise.reject(new Error('Video ID is required'));
    }
    
    return API.get(`/comments/get/${videoid}`).catch(handleApiError);
};

export const addtohistory=(historydata)=>API.post("/video/history",historydata).catch(handleApiError);
export const getallhistory=()=>API.get('/video/getallhistory').catch(handleApiError);
export const deletehistory=(userid)=>API.delete(`/video/deletehistory/${userid}`).catch(handleApiError);

export const addtolikevideo=(likedvideodata)=>API.post('/video/likevideo',likedvideodata).catch(handleApiError);
export const getalllikedvideo=()=>API.get('/video/getalllikevide').catch(handleApiError);
export const deletelikedvideo=(videoid,viewer)=>API.delete(`/video/deletelikevideo/${videoid}/${viewer}`).catch(handleApiError);

export const addtowatchlater=(watchlaterdata)=>API.post('/video/watchlater',watchlaterdata).catch(handleApiError);
export const getallwatchlater=()=>API.get('/video/getallwatchlater').catch(handleApiError);
export const deletewatchlater=(videoid,viewer)=>API.delete(`/video/deletewatchlater/${videoid}/${viewer}`).catch(handleApiError);

// Chat Room specific API methods with error handling
export const getUserChatRooms = () => {
    return API.get('/chatroom')
        .catch(handleApiError);
};

export const createChatRoom = (roomData) => {
    console.log('Attempting to create chat room');
    return API.post('/chatroom/create', roomData).catch(handleApiError);
};

export const getChatRoomMessages = (roomId) => {
    return API.get(`/chatroom/${roomId}/messages`)
        .catch(handleApiError);
};

export const sendChatMessage = async (roomId, message) => {
    // Comprehensive input validation and logging
    console.group('sendChatMessage Debug');
    
    // Handle case where first argument is an object with message details
    if (typeof roomId === 'object' && roomId !== null) {
        // Extract values from the object with multiple fallback strategies
        message = roomId.content || 
                  roomId.message || 
                  (typeof roomId.text === 'string' ? roomId.text : undefined);
        
        // Multiple strategies to extract sender name
        const senderName = roomId.senderName || 
                           roomId.sender?.name || 
                           roomId.sender?.username ||
                           roomId.currentUser?.name || 
                           roomId.currentUser?.username ||
                           (typeof roomId.sender === 'object' && roomId.sender.name) ||
                           'Anonymous';
        
        roomId = roomId.roomId || roomId._id || roomId.id;
    }

    console.log('Full Inputs:', {
        roomId: roomId,
        roomIdType: typeof roomId,
        message: message,
        messageType: typeof message,
        messageValue: message,
        messageLength: message ? message.length : 'N/A'
    });

    // Validate roomId
    if (!roomId) {
        console.error('sendChatMessage: roomId is required');
        throw new Error('Room ID is required');
    }

    // Extract room ID string with multiple fallback strategies
    let roomIdString;
    if (typeof roomId === 'object') {
        roomIdString = roomId._id || 
                       roomId.id || 
                       roomId.roomId || 
                       (roomId.participants && roomId.participants[0]) || 
                       JSON.stringify(roomId);
    } else {
        roomIdString = roomId;
    }

    if (!roomIdString) {
        console.error('Could not extract room ID', { roomId });
        throw new Error('Invalid Room ID');
    }

    // Ensure message is a valid string
    const processedMessage = message === null || message === undefined 
        ? '' 
        : (typeof message === 'object' 
            ? JSON.stringify(message) 
            : String(message).trim());

    console.log('Processed Message Details:', {
        processedMessage,
        processedMessageType: typeof processedMessage,
        processedMessageLength: processedMessage.length
    });

    if (processedMessage === '') {
        console.error('sendChatMessage: message is empty after processing', {
            originalMessage: message,
            originalType: typeof message,
            roomIdString
        });
        throw new Error('Message cannot be empty');
    }

    try {
        const response = await API.post(`/chatroom/${roomIdString}/send`, { 
            content: processedMessage
        });
        
        console.log('Send Message Response:', response);
        console.groupEnd();
        return response;
    } catch (error) {
        console.error('Error sending chat message:', {
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorStack: error.stack,
            networkError: error.isAxiosError,
            responseStatus: error.response ? error.response.status : 'N/A',
            responseData: error.response ? error.response.data : 'N/A'
        });

        console.groupEnd();
        throw error;
    }
};

export const clearChatRoomMessages = (roomId) => {
    return API.delete(`/chatroom/${roomId}/messages`)
        .catch(handleApiError);
};

export const deleteChatRoom = (roomId) => {
    return API.delete(`/chatroom/${roomId}`)
        .catch(handleApiError);
};

export const translateComment = (translationData) => {
    // Validate input
    if (!translationData.commentId || !translationData.targetLanguage) {
        console.error('Invalid translation parameters', translationData);
        return Promise.reject(new Error('Missing translation parameters'));
    }

    // Make API call
    return API.post('/comments/translate', translationData)
        .then(response => {
            // Return the entire response data
            return response.data;
        })
        .catch(handleApiError);
};

export const likeComment = (likeData) => API.post('/comments/like', likeData).catch(handleApiError);
export const dislikeComment = (dislikeData) => API.post('/comments/dislike', dislikeData).catch(handleApiError);

// Chat Room Invitation methods
export const getPendingInvitations = () => {
    console.log('Attempting to get pending chat room invitations');
    return API.get('/chatroom-invitation/pending').catch(handleApiError);
};

export const inviteUserToChatRoom = (invitationData) => {
    console.log('Attempting to invite user to chat room', invitationData);
    return API.post('/chatroom-invitation/invite', invitationData).catch(handleApiError);
};

export const respondToInvitation = (responseData) => {
    console.log('Attempting to respond to chat room invitation', responseData);
    return API.post('/chatroom-invitation/respond', responseData).catch(handleApiError);
};

// Find user by email for chat room invitation
export const findUserByEmail = (email) => {
    console.log(`Attempting to find user with email: ${email}`);
    return API.get(`/chatroom-invitation/find-user?email=${encodeURIComponent(email)}`)
        .then(response => {
            console.log('User found:', response.data.user);
            return response.data.user;
        })
        .catch(handleApiError);
};