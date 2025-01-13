import React, { useState, useEffect } from 'react'
import "./Comment.css"
import { useSelector, useDispatch } from 'react-redux'
import { editcomment, deletecomment } from '../../action/comment'

// Utility function to format relative time
const formatRelativeTime = (dateString) => {
    // Handle potential invalid date scenarios
    if (!dateString) return 'Unknown date';

    // Try multiple parsing methods
    let date;
    try {
        // Try parsing as ISO string, timestamp, or Date object
        date = dateString instanceof Date 
            ? dateString 
            : new Date(dateString);
    } catch (error) {
        console.error('Date parsing error:', {
            dateString, 
            error: error.message
        });
        return 'Invalid date';
    }

    // Validate date
    if (!date || isNaN(date.getTime())) {
        console.error('Invalid date object:', dateString);
        return 'Invalid date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Fallback to standard date if more than a month old
    return date.toLocaleDateString();
};

const Displaycommment = ({ 
    cid, 
    userid, 
    commentbody, 
    commentedon,  
    usercommented, 
    originalLanguage, 
    translations,
    videoid  
}) => {
    const [edit, setedit] = useState(false)
    const [cmtnody, setcommentbdy] = useState("")
    const [cmtid, setcmntid] = useState("")
    const dispatch = useDispatch()
    const currentuser = useSelector(state => state.currentuserreducer);

    // State to manage displayed comment and translation
    const [displayedComment, setDisplayedComment] = useState(commentbody);
    const [currentLanguage, setCurrentLanguage] = useState('original');

    // Sort translations by most recent first
    const sortedTranslations = translations 
        ? [...translations].sort((a, b) => 
            new Date(b.translatedAt) - new Date(a.translatedAt)
        ) 
        : [];

    // Debugging log for date
    useEffect(() => {
        console.log('Comment Date:', {
            commentedon,
            type: typeof commentedon,
            isValid: commentedon ? !isNaN(new Date(commentedon).getTime()) : false
        });
    }, [commentedon]);

    const handleedit = (ctid, ctbdy) => {
        setedit(true)
        setcmntid(ctid)
        setcommentbdy(ctbdy)
    }

    const haneleonsubmit = (e) => {
        e.preventDefault();
        if (!cmtnody) {
            alert("type your comment");
        } else {
            dispatch(editcomment({ id: cmtid, commentbody: cmtnody }))
            setcommentbdy("")
        }
        setedit(false)
    }

    const handledel = (commentId) => {
        // Confirm deletion
        const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
        
        if (confirmDelete) {
            dispatch(deletecomment(commentId));
        }
    };

    const toggleTranslation = () => {
        // Cycle through translations and original
        const translationOptions = [
            'original', 
            ...sortedTranslations.map(t => t.language)
        ];

        const currentIndex = translationOptions.indexOf(currentLanguage);
        const nextIndex = (currentIndex + 1) % translationOptions.length;
        const nextLanguage = translationOptions[nextIndex];

        // Set displayed comment based on selected language
        if (nextLanguage === 'original') {
            setDisplayedComment(commentbody);
            setCurrentLanguage('original');
        } else {
            const selectedTranslation = sortedTranslations.find(
                t => t.language === nextLanguage
            );
            setDisplayedComment(selectedTranslation.translatedText);
            setCurrentLanguage(nextLanguage);
        }
    }

    // Determine button text based on current state
    const getToggleButtonText = () => {
        if (currentLanguage === 'original') {
            return sortedTranslations.length > 0 
                ? `View ${sortedTranslations[0].language.toUpperCase()} Translation` 
                : 'No Translations Available';
        }
        
        const currentTranslation = sortedTranslations.find(
            t => t.language === currentLanguage
        );
        
        return currentTranslation 
            ? `Back to Original (${currentLanguage.toUpperCase()})` 
            : 'Back to Original';
    }

    return (
        <div className='display_comment_container_inner'>
            {edit ? (
                <form className="comments_sub_form_commments" onSubmit={haneleonsubmit}>
                    <input 
                        type="text" 
                        onChange={(e) => setcommentbdy(e.target.value)} 
                        placeholder='Edit comments..' 
                        value={cmtnody} 
                        className="comment_ibox" 
                    />
                    <input 
                        type="submit" 
                        value="change" 
                        className="comment_add_btn_comments" 
                    />
                </form>
            ) : (
                <div className="comment_body">
                    {displayedComment}
                    
                    {(sortedTranslations.length > 0 || originalLanguage !== 'en') && (
                        <button 
                            onClick={toggleTranslation} 
                            className="toggle-translation-btn"
                        >
                            {getToggleButtonText()}
                        </button>
                    )}
                </div>
            )}
            <div className="comment_user_details">
                <div className="comment_username">{usercommented}</div>
                <div className="comment_time">{formatRelativeTime(commentedon)}</div>
            </div>
            {currentuser?.result?._id === userid && (
                <p className="EditDel_DisplayCommendt">
                    <i onClick={() => handleedit(cid, commentbody)}>Edit</i>
                    <i onClick={() => handledel(cid)}>Delete</i>
                </p>
            )}
        </div>
    )
}

export default Displaycommment