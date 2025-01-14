import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import moment from 'moment'
import ReactPlayer from 'react-player'
import Likewatchlatersavebtns from './Likewatchlatersavebtns'
import { viewvideo } from '../../action/video'
import { addtohistory } from '../../action/history'
import Comment from '../../Component/Comment/Comment'
import CustomVideoPlayer from '../../Component/CustomVideoPlayer/CustomVideoPlayer'
import CloseWindowModal from '../../Component/CloseWindowModal/CloseWindowModal'
import { createSocketConnection } from '../../utils/socketConfig';
import { getVideoUrl } from '../../utils/urlConfig';
import { addView, likeVideo } from '../../api/index';
import "./Videopage.css"

const Videopage = () => {
    const { vid } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const vids = useSelector((state) => state.videoreducer);
    const currentuser = useSelector(state => state.currentuserreducer);

    // Video player state
    const [playing, setPlaying] = useState(true);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const playerRef = useRef(null);
    
    // Gesture tracking
    const tapCountRef = useRef(0);
    const lastTapTimeRef = useRef(0);

    // Video list and current video
    const videoList = vids?.data || [];
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const vv = videoList.find((q) => q._id === vid);

    // Gesture handling
    const handleTapGesture = (event) => {
        const now = Date.now();
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;

        // Reset tap count if too much time has passed
        if (now - lastTapTimeRef.current > 1000) {
            tapCountRef.current = 0;
        }

        tapCountRef.current++;
        lastTapTimeRef.current = now;

        // Determine tap area
        const isLeftSide = x < width / 3;
        const isRightSide = x > (width * 2 / 3);
        const isMiddle = !isLeftSide && !isRightSide;

        // Single tap in middle - pause/play
        if (tapCountRef.current === 1 && isMiddle) {
            setPlaying(prev => !prev);
        }
        
        // Double tap handlers
        if (tapCountRef.current === 2) {
            // Use the custom video player's method to seek
            const videoElement = document.querySelector('.custom-video-player video');
            if (videoElement) {
                if (isRightSide) {
                    // Double tap right - forward 10 seconds
                    videoElement.currentTime = Math.min(
                        videoElement.duration, 
                        videoElement.currentTime + 10
                    );
                } else if (isLeftSide) {
                    // Double tap left - backward 10 seconds
                    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
                }
            }
        }

        // Triple tap handlers
        if (tapCountRef.current === 3) {
            if (isMiddle) {
                // Three taps in middle - next video
                const nextIndex = (currentVideoIndex + 1) % videoList.length;
                setCurrentVideoIndex(nextIndex);
                navigate(`/videopage/${videoList[nextIndex]._id}`);
            } else if (isRightSide) {
                // Three taps on right - show close modal
                setShowCloseModal(true);
            } else if (isLeftSide) {
                // Three taps on left - show comment section
                const commentSection = document.getElementById('comments_VideoPage');
                if (commentSection) {
                    commentSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }

        // Reset tap count after a short delay
        setTimeout(() => {
            tapCountRef.current = 0;
        }, 1000);
    };

    // Video view and history tracking
    const handleViews = () => {
        dispatch(viewvideo({ id: vid }));
    };

    const handleHistory = () => {
        if (currentuser?.result?._id) {
            dispatch(addtohistory({
                videoid: vid,
                viewer: currentuser.result._id,
            }));
        }
    };

    // Effects for view and history tracking
    useEffect(() => {
        if (currentuser) {
            handleHistory();
        }
        handleViews();
    }, [vid]);

    const socketRef = useRef(null);
    
    useEffect(() => {
        // Establish socket connection
        socketRef.current = createSocketConnection();

        // Clean up on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Handle next video
    const handleNextVideo = () => {
        const nextIndex = (currentVideoIndex + 1) % videoList.length;
        setCurrentVideoIndex(nextIndex);
        navigate(`/videopage/${videoList[nextIndex]._id}`);
    }

    // Render video player and details
    if (!vv) return <div>Loading...</div>;

    return (
        <>
            {showCloseModal && (
                <CloseWindowModal 
                    onClose={() => setShowCloseModal(false)} 
                />
            )}
            <div className="container_videoPage">
                <div className="container2_videoPage">
                    <div className="video_display_screen_videoPage">
                        <div 
                            className="video_ShowVideo_videoPage"
                            onClick={handleTapGesture}
                        >
                            <CustomVideoPlayer 
                                src={`http://localhost:5000/${vv?.filepath}`} 
                                videoList={videoList}
                                currentVideoIndex={currentVideoIndex}
                                onNextVideo={handleNextVideo}
                            />
                        </div>
                        <div className="video_details_videoPage">
                            <div className="video_btns_title_VideoPage_cont">
                                <p className="video_title_VideoPage">{vv?.title}</p>
                                <div className="views_date_btns_VideoPage">
                                    <div className="views_videoPage">
                                        {vv?.views} views <div className="dot"></div>{" "}
                                        {moment(vv?.createdat).fromNow()}
                                    </div>
                                    <Likewatchlatersavebtns vv={vv} vid={vid} />
                                </div>
                            </div>
                            <Link to={'/'} className='chanel_details_videoPage'>
                                <b className="chanel_logo_videoPage">
                                    <p>{vv?.uploader.charAt(0).toUpperCase()}</p>
                                </b>
                                <p className="chanel_name_videoPage">{vv.uploader}</p>
                            </Link>
                            <div className="channel_description">
                                {/* You can add channel description here if available */}
                            </div>

                            <div id="comments_VideoPage" className="comments_VideoPage">
                                <h2>
                                    <u>Comments</u>
                                </h2>
                                <Comment videoid={vid}/>
                            </div>
                        </div>
                    </div>
                    <div className="moreVideoBar">More videos</div>
                </div>
            </div>
        </>
    )
}

export default Videopage;
