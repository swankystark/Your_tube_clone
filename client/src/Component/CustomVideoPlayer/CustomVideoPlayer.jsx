import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import './CustomVideoPlayer.css';

const CustomVideoPlayer = ({ 
    src, 
    videoList, 
    currentVideoIndex, 
    onNextVideo 
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(true);
    const videoRef = useRef(null);

    // Handle play/pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
            setShowPlayOverlay(false);
        }
    };

    // Handle video end
    const handleVideoEnd = () => {
        setIsPlaying(false);
        setShowPlayOverlay(true);
        
        // Optional: Auto-play next video
        if (onNextVideo) {
            onNextVideo();
        }
    };

    // Reset play state when source changes
    useEffect(() => {
        if (videoRef.current) {
            setIsPlaying(false);
            setShowPlayOverlay(true);
        }
    }, [src]);

    return (
        <div 
            className="custom-video-player" 
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                onEnded={handleVideoEnd}
                style={{ 
                    transform: videoRef.current && 
                        videoRef.current.videoWidth > videoRef.current.videoHeight 
                        ? 'none' 
                        : 'rotate(0deg)' 
                }}
            />
            {showPlayOverlay && (
                <div className="play-overlay">
                    {isPlaying ? (
                        <FaPause className="play-icon" />
                    ) : (
                        <FaPlay className="play-icon" />
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomVideoPlayer;
