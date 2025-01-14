// URL configuration utility
const getServerUrl = () => {
    return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
};

export const getVideoUrl = (videoPath) => {
    if (!videoPath) return '';
    if (videoPath.startsWith('http')) return videoPath;
    return `${getServerUrl()}/${videoPath}`;
};

export default {
    getServerUrl,
    getVideoUrl
};
