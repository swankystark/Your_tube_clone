import { io } from 'socket.io-client';
import { getServerUrl } from './urlConfig';

export const createSocketConnection = (options = {}) => {
    const serverUrl = getServerUrl();
    console.log('Creating socket connection to:', serverUrl);

    return io(serverUrl, {
        auth: {
            token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        ...options
    });
};

export default createSocketConnection;
