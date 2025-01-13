import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CloseWindowModal.css';

const CloseWindowModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [tapCount, setTapCount] = useState(0);
    const [lastTap, setLastTap] = useState(0);

    useEffect(() => {
        const handleTap = (event) => {
            const videoElement = document.querySelector('video');
            const videoRect = videoElement?.getBoundingClientRect();

            if (
                videoElement &&
                event.clientX > videoRect.right - 100 && // Right side of video
                event.clientX <= videoRect.right &&
                event.clientY >= videoRect.top &&
                event.clientY <= videoRect.bottom
            ) {
                const now = Date.now();
                if (now - lastTap < 300) {
                    setTapCount((prev) => prev + 1);
                } else {
                    setTapCount(1);
                }
                setLastTap(now);

                if (tapCount + 1 >= 3) {
                    handleClose();
                }
            }
        };

        document.addEventListener('click', handleTap);
        return () => {
            document.removeEventListener('click', handleTap);
        };
    }, [tapCount, lastTap]);

    const handleClose = () => {
        if (window.opener) {
            window.opener.focus();
            window.close();
        }
        navigate('/'); // Fallback navigation
    };

    return (
        <div className="close-window-modal-overlay">
            <div className="close-window-modal-content">
                <h2>Close Window</h2>
                <p>Your browser prevents automatic window closing. Please choose an option:</p>
                <div className="close-window-modal-buttons">
                    <button 
                        onClick={() => navigate('/')} 
                        className="go-home-btn"
                    >
                        Go to Home Page
                    </button>
                    <button 
                        onClick={onClose} 
                        className="cancel-btn"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloseWindowModal;
