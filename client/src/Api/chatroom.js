import axios from 'axios';

const API = axios.create({ 
    baseURL: process.env.REACT_APP_SERVER_URL || 'http://localhost:5000' 
});

// Add token to every request
API.interceptors.request.use((req) => {
    const profile = localStorage.getItem('Profile');
    if (profile) {
        const parsedProfile = JSON.parse(profile);
        console.log('Parsed Profile:', parsedProfile);
        
        if (parsedProfile.token) {
            req.headers.Authorization = `Bearer ${parsedProfile.token}`;
            console.log('Token added to request headers');
        }
    }
    return req;
}, (error) => {
    return Promise.reject(error);
});

export const getUserChatRooms = async () => {
    console.log('Attempting to get user chat rooms');
    try {
        const response = await API.get('/chatroom/user-rooms');
        console.log('Chat Rooms Response:', response.data);
        return { data: response.data };
    } catch (error) {
        console.error('Error fetching user chat rooms:', error);
        throw error;
    }
};

export const createChatRoom = async (roomData) => {
    try {
        const response = await API.post('/chatroom/create', roomData);
        console.log('Create Chat Room Response:', response.data);
        return { data: response.data };
    } catch (error) {
        console.error('Error creating chat room:', error);
        throw error;
    }
};

export const getChatRoomMessages = async (roomId) => {
    try {
        const response = await API.get(`/chatroom/messages/${roomId}`);
        console.log('Chat Room Messages Response:', response.data);
        return { data: response.data };
    } catch (error) {
        console.error('Error fetching chat room messages:', error);
        throw error;
    }
};
