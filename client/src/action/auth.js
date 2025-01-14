import axios from 'axios';
import * as API from '../api';

const API_URL = 'https://your-tube-clone-1-7fms.onrender.com';

export const login = (userData) => async (dispatch) => {
    try {
        // Ensure unique session for this login
        const sessionTimestamp = Date.now();
        
        // Make API call to login
        const response = await axios.post(`${API_URL}/user/login`, {
            ...userData,
            sessionTimestamp
        });

        // Dispatch login action with session information
        dispatch({
            type: 'AUTH',
            data: {
                ...response.data,
                sessionTimestamp
            }
        });

        // Return the user data for potential further use
        return response.data;
    } catch (error) {
        console.error('Login Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Re-throw the error for the component to handle
        throw error;
    }
};

export const setcurrentuser = (userData) => ({
    type: 'SET_CURRENT_USER',
    payload: userData
});