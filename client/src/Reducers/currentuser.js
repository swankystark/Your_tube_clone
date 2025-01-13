const currentuserreducer = (state = { result: null }, action) => {
    switch (action.type) {
        case 'AUTH':
            // Clear previous profile before setting new one
            localStorage.removeItem('Profile');
            
            // Store the entire profile data with a unique session
            const sessionProfile = {
                ...action.data,
                token: action.data.token,
                sessionTimestamp: Date.now()
            };
            localStorage.setItem('Profile', JSON.stringify(sessionProfile));
            
            // Broadcast login event across tabs with more details
            localStorage.setItem('authChange', JSON.stringify({
                email: action.data.result.email,
                name: action.data.result.name,
                timestamp: Date.now(),
                action: 'LOGIN',
                sessionId: Math.random().toString(36).substr(2, 9) // Unique session identifier
            }));
            
            return { 
                ...state, 
                result: action.data.result 
            };
        
        case 'LOGOUT':
            // Clear local storage and broadcast logout
            localStorage.removeItem('Profile');
            localStorage.setItem('authChange', JSON.stringify({
                action: 'LOGOUT',
                timestamp: Date.now(),
                sessionId: Math.random().toString(36).substr(2, 9)
            }));
            return { 
                ...state, 
                result: null 
            };
        
        case 'SET_CURRENT_USER':
            // Ensure we're not keeping stale data
            if (!action.payload?.result) {
                localStorage.removeItem('Profile');
                localStorage.removeItem('authChange');
            }
            return { 
                ...state, 
                result: action.payload?.result || null 
            };
        
        default:
            return state;
    }
};

// Add a listener for storage events to handle multi-tab login/logout
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'authChange') {
            try {
                const authChange = JSON.parse(event.newValue);
                console.log('Auth change detected in another tab:', authChange);
                
                // Instead of reloading, dispatch a notification
                const customEvent = new CustomEvent('auth-change', { 
                    detail: authChange 
                });
                window.dispatchEvent(customEvent);
            } catch (error) {
                console.error('Error parsing auth change', error);
            }
        }
    });
}

export default currentuserreducer;