// URL configuration utility
export const getServerUrl = () => {
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    if (!serverUrl) {
        console.warn('REACT_APP_SERVER_URL is not set, using fallback URL');
        return 'https://your-tube-clone-1-7fms.onrender.com';
    }
    return serverUrl.replace(/\/$/, ''); // Remove trailing slash if present
};

export const getVideoUrl = (videoPath) => {
    if (!videoPath) return '';
    if (videoPath.startsWith('http')) return videoPath;
    
    // Remove any leading or trailing slashes
    const cleanPath = videoPath.replace(/^\/+|\/+$|$/g, '');
    
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
        const data = await response.json();
        console.log('Server health check:', data);
        return response.ok;
    } catch (error) {
        console.error('Server connection check failed:', error);
        return false;
    }
};

// Helper to validate server URL
export const validateServerUrl = (url) => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
};

export default {
    getServerUrl,
    getVideoUrl,
    isDevelopment,
    checkServerConnection,
    validateServerUrl
};
