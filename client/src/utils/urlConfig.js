// URL configuration utility
const getServerUrl = () => {
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    if (!serverUrl) {
        console.warn('REACT_APP_SERVER_URL is not set, using fallback URL');
        return 'http://localhost:5000';
    }
    return serverUrl.replace(/\/$/, ''); // Remove trailing slash if present
};

export const getVideoUrl = (videoPath) => {
    if (!videoPath) return '';
    if (videoPath.startsWith('http')) return videoPath;
    
    // Remove any leading or trailing slashes
    const cleanPath = videoPath.replace(/^\/+|\/+$/g, '');
    
    // Get server URL and ensure proper formatting
    const baseUrl = getServerUrl();
    
    // Construct the full URL
    return `${baseUrl}/${cleanPath}`;
};

// Helper to check if we're in development mode
export const isDevelopment = () => {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
};

// Helper to check if server is available
export const checkServerConnection = async () => {
    try {
        const response = await fetch(getServerUrl() + '/health');
        return response.ok;
    } catch (error) {
        console.error('Server connection check failed:', error);
        return false;
    }
};

export default {
    getServerUrl,
    getVideoUrl,
    isDevelopment,
    checkServerConnection
};
