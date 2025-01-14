import React, { useState, useEffect } from 'react'
import "./Comment.css"
import { AiFillDislike, AiFillLike, AiOutlineDislike, AiOutlineLike } from "react-icons/ai"
import { FaEdit, FaTrash, FaLanguage, FaMapMarkerAlt } from "react-icons/fa"
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { postcomment, getallcomment, translatecomment, editcomment, deletecomment, likeComment, dislikeComment } from '../../action/comment'

const CommentItem = ({ comment, videoid }) => {
    const dispatch = useDispatch();
    const [likebtn, setLikebtn] = useState(false);
    const [dislikebtn, setDislikebtn] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedComment, setEditedComment] = useState(comment.commentbody);
    const [showTranslationModal, setShowTranslationModal] = useState(false);
    const [currentTranslation, setCurrentTranslation] = useState({
        language: 'original',
        text: comment.commentbody
    });
    const [availableTranslations, setAvailableTranslations] = useState([
        { language: 'original', text: comment.commentbody },
        ...(comment.translations || [])
    ]);
    const currentuser = useSelector(state => state.currentuserreducer);

    useEffect(() => {
        if (currentuser?.result?._id) {
            const isLiked = comment.likedBy?.some(
                (userId) => userId === currentuser.result._id
            );
            
            const isDisliked = comment.dislikedBy?.some(
                (userId) => userId === currentuser.result._id
            );
            
            setLikebtn(isLiked);
            setDislikebtn(isDisliked);
        }
    }, [currentuser, comment]);

    useEffect(() => {
        setAvailableTranslations([
            { language: 'original', text: comment.commentbody },
            ...(comment.translations || [])
        ]);
    }, [comment.translations, comment.commentbody]);

    const toggleLikeComment = () => {
        if (!currentuser) {
            alert("Please login to like comment");
            return;
        }

        if (likebtn) {
            // Unlike the comment
            setLikebtn(false);
            dispatch(likeComment({ 
                commentId: comment._id, 
                userId: currentuser.result._id,
                action: 'unlike'
            }));
        } else {
            // Like the comment
            setLikebtn(true);
            dispatch(likeComment({ 
                commentId: comment._id, 
                userId: currentuser.result._id,
                action: 'like'
            }));
            setDislikebtn(false);
        }
    };

    const toggleDislikeComment = () => {
        if (!currentuser) {
            alert("Please login to dislike comment");
            return;
        }

        if (dislikebtn) {
            // Un-dislike the comment
            setDislikebtn(false);
            dispatch(dislikeComment({ 
                commentId: comment._id, 
                userId: currentuser.result._id,
                action: 'undislike'
            }));
        } else {
            // Dislike the comment
            setDislikebtn(true);
            dispatch(dislikeComment({ 
                commentId: comment._id, 
                userId: currentuser.result._id,
                action: 'dislike'
            }));
            setLikebtn(false);
        }
    };

    const handleTranslate = () => {
        setShowTranslationModal(true);
    };

    const performTranslation = async (targetLanguage) => {
        try {
            const response = await dispatch(translatecomment(comment._id, targetLanguage));
            
            if (response && response.translatedText) {
                // Update current translation
                setCurrentTranslation({
                    language: targetLanguage,
                    text: response.translatedText
                });

                // Update available translations if this is a new translation
                if (!availableTranslations.find(t => t.language === targetLanguage)) {
                    setAvailableTranslations(prev => [
                        ...prev,
                        { language: targetLanguage, text: response.translatedText }
                    ]);
                }

                console.log('Comment translated successfully:', response.translatedText);
            }
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Failed to translate comment. Please try again.');
        }
    };

    const switchTranslation = (language) => {
        const translation = availableTranslations.find(t => t.language === language);
        if (translation) {
            setCurrentTranslation(translation);
        }
    };

    const handleEdit = () => {
        if (isEditing) {
            // Save edited comment
            dispatch(editcomment({
                commentId: comment._id,
                commentbody: editedComment
            }));
            setIsEditing(false);
        } else {
            // Enter edit mode
            setIsEditing(true);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            dispatch(deletecomment(comment._id));
        }
    };

    const languageOptions = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'kn', name: 'Kannada' },
        { code: 'bn', name: 'Bengali' }
    ];

    return (
        <div className="comment-item">
            <div className="comment-header">
                <div className="comment-user-info">
                    <span className="comment-username">{comment.usercommented}</span>
                    <span className="comment-date">
                        {new Date(comment.commentedon).toLocaleDateString()}
                    </span>
                    {comment.location && (
                        <span className="comment-location" title="User Location">
                            <FaMapMarkerAlt /> {comment.location.city}, {comment.location.country}
                        </span>
                    )}
                </div>
                {currentuser?.result?._id === comment.userid && (
                    <div className="comment-actions-buttons">
                        <button 
                            className="edit-btn" 
                            onClick={handleEdit}
                            title={isEditing ? "Save" : "Edit"}
                        >
                            <FaEdit />
                        </button>
                        <button 
                            className="delete-btn" 
                            onClick={handleDelete}
                            title="Delete"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>
            
            <div className="comment-content">
                {isEditing ? (
                    <textarea
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                    />
                ) : (
                    <>
                        <p className="comment-text">{currentTranslation.text}</p>
                        {availableTranslations.length > 1 && (
                            <div className="translation-controls">
                                <select 
                                    value={currentTranslation.language}
                                    onChange={(e) => switchTranslation(e.target.value)}
                                    className="translation-selector"
                                >
                                    <option value="original">Original</option>
                                    {availableTranslations
                                        .filter(t => t.language !== 'original')
                                        .map(t => (
                                            <option key={t.language} value={t.language}>
                                                {languageOptions.find(l => l.code === t.language)?.name || t.language}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="comment-footer">
                <div className="comment-interaction-buttons">
                    <button 
                        className="translate-btn" 
                        onClick={handleTranslate}
                    >
                        <FaLanguage /> Translate
                    </button>

                    <div className="like-dislike-buttons">
                        <div 
                            className="like-action" 
                            onClick={toggleLikeComment}
                        >
                            {likebtn ? (
                                <AiFillLike size={22} className='comment-btn' />
                            ) : (
                                <AiOutlineLike size={22} className='comment-btn' />
                            )}
                            <span>{comment.likes || 0}</span>
                        </div>
                        <div 
                            className="dislike-action" 
                            onClick={toggleDislikeComment}
                        >
                            {dislikebtn ? (
                                <AiFillDislike size={22} className='comment-btn' />
                            ) : (
                                <AiOutlineDislike size={22} className='comment-btn' />
                            )}
                            <span>{comment.dislikes || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Translation Modal */}
            {showTranslationModal && (
                <div className="translation-modal">
                    <div className="translation-modal-content">
                        <h3>Translate to:</h3>
                        <div className="language-grid">
                            {languageOptions.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        performTranslation(lang.code);
                                        setShowTranslationModal(false);
                                    }}
                                    className="language-button"
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setShowTranslationModal(false)}
                            className="close-modal-button"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Comment = ({ videoid }) => {
    const dispatch = useDispatch()
    const [commenttext, setcommentext] = useState("")
    const currentuser = useSelector(state => state.currentuserreducer);
    const commentlist = useSelector(state => state.commentreducer)
    
    useEffect(() => {
        if (videoid) {
            dispatch(getallcomment(videoid));
        }
    }, [dispatch, videoid]);

    const handleonsubmit = (e) => {
        e.preventDefault();
        
        if (!commenttext.trim()) {
            alert("Please enter a comment");
            return;
        }

        const userId = currentuser?.result?._id;
        const username = currentuser?.result?.name || 'Anonymous';

        if (!userId) {
            alert('Please log in to comment');
            return;
        }

        const commentData = {
            commentbody: commenttext,
            userid: userId,
            usercommented: username,
            videoid: videoid
        };

        dispatch(postcomment(commentData));
        setcommentext("");
    };

    const videoComments = videoid 
        ? (commentlist?.data?.filter((q) => videoid === q?.videoid) || []) 
        : [];

    return (
        <div className="comment-section">
            <form onSubmit={handleonsubmit} className="comment-input-form">
                <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={commenttext}
                    onChange={(e) => setcommentext(e.target.value)}
                />
                <button type="submit">Comment</button>
            </form>

            <div className="comment-list">
                {videoComments.map((comment) => (
                    <CommentItem 
                        key={comment._id} 
                        comment={comment} 
                        videoid={videoid} 
                    />
                ))}
            </div>
        </div>
    );
};

export default Comment;