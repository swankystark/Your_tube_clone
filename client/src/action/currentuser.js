export const setcurrentuser = (data) => {
    // Ensure data is not null and has the expected structure
    if (data && data.result) {
        // Preserve email if name is not available
        if (!data.result.name && data.result.email) {
            data.result.name = data.result.email;
        }
        
        // Store in localStorage with comprehensive data
        localStorage.setItem('Profile', JSON.stringify({
            ...data,
            token: data.token || data.result.token
        }));
    }

    return {
        type: 'FETCH_CURRENT_USER',
        payload: data
    };
};