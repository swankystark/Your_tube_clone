import * as api from '../api';

export const login = (userData) => async (dispatch) => {
    try {
        // Ensure unique session for this login
        const sessionTimestamp = Date.now();
        
        // Make API call to login
        const { data } = await api.login({
            ...userData,
            sessionTimestamp
        });

        // Dispatch login action with session information
        dispatch({
            type: 'AUTH',
            data: {
                ...data,
                sessionTimestamp
            }
        });

        // Return the user data for potential further use
        return data;
    } catch (error) {
        console.error('Login Error:', error);
        // Handle login error
        throw error;
    }
};

export const setcurrentuser = (userData) => ({
    type: 'SET_CURRENT_USER',
    payload: userData
});