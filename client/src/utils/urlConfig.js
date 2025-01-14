// URL configuration utility
const getServerUrl = () => {
    return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
};

export const getVideoUrl = (videoPath) => {
    if (!videoPath) return '';
    if (videoPath.startsWith('http')) return videoPath;
    
    // Remove any leading slashes to avoid double slashes
    const cleanPath = videoPath.replace(/^\/+/, '');
    return `${getServerUrl()}/${cleanPath}`;
};

// Helper to check if we're in development mode
export const isDevelopment = () => {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
};

export default {
    getServerUrl,
    getVideoUrl,
    isDevelopment
};
