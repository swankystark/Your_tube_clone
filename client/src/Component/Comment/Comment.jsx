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
    const [currentTranslation, setCurrentTranslation] = useState(null);
    const currentuser = useSelector(state => state.currentuserreducer);

    // List of languages supported by Google Translate
    const languages = [
        { code: 'auto', name: 'Detect Language' },
        { code: 'af', name: 'Afrikaans' },
        { code: 'sq', name: 'Albanian' },
        { code: 'am', name: 'Amharic' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hy', name: 'Armenian' },
        { code: 'az', name: 'Azerbaijani' },
        { code: 'eu', name: 'Basque' },
        { code: 'be', name: 'Belarusian' },
        { code: 'bn', name: 'Bengali' },
        { code: 'bs', name: 'Bosnian' },
        { code: 'bg', name: 'Bulgarian' },
        { code: 'ca', name: 'Catalan' },
        { code: 'ceb', name: 'Cebuano' },
        { code: 'zh-CN', name: 'Chinese (Simplified)' },
        { code: 'zh-TW', name: 'Chinese (Traditional)' },
        { code: 'co', name: 'Corsican' },
        { code: 'hr', name: 'Croatian' },
        { code: 'cs', name: 'Czech' },
        { code: 'da', name: 'Danish' },
        { code: 'nl', name: 'Dutch' },
        { code: 'en', name: 'English' },
        { code: 'eo', name: 'Esperanto' },
        { code: 'et', name: 'Estonian' },
        { code: 'fi', name: 'Finnish' },
        { code: 'fr', name: 'French' },
        { code: 'fy', name: 'Frisian' },
        { code: 'gl', name: 'Galician' },
        { code: 'ka', name: 'Georgian' },
        { code: 'de', name: 'German' },
        { code: 'el', name: 'Greek' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'ht', name: 'Haitian Creole' },
        { code: 'ha', name: 'Hausa' },
        { code: 'haw', name: 'Hawaiian' },
        { code: 'he', name: 'Hebrew' },
        { code: 'hi', name: 'Hindi' },
        { code: 'hmn', name: 'Hmong' },
        { code: 'hu', name: 'Hungarian' },
        { code: 'is', name: 'Icelandic' },
        { code: 'ig', name: 'Igbo' },
        { code: 'id', name: 'Indonesian' },
        { code: 'ga', name: 'Irish' },
        { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'jv', name: 'Javanese' },
        { code: 'kn', name: 'Kannada' },
        { code: 'kk', name: 'Kazakh' },
        { code: 'km', name: 'Khmer' },
        { code: 'rw', name: 'Kinyarwanda' },
        { code: 'ko', name: 'Korean' },
        { code: 'ku', name: 'Kurdish' },
        { code: 'ky', name: 'Kyrgyz' },
        { code: 'lo', name: 'Lao' },
        { code: 'la', name: 'Latin' },
        { code: 'lv', name: 'Latvian' },
        { code: 'lt', name: 'Lithuanian' },
        { code: 'lb', name: 'Luxembourgish' },
        { code: 'mk', name: 'Macedonian' },
        { code: 'mg', name: 'Malagasy' },
        { code: 'ms', name: 'Malay' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'mt', name: 'Maltese' },
        { code: 'mi', name: 'Maori' },
        { code: 'mr', name: 'Marathi' },
        { code: 'mn', name: 'Mongolian' },
        { code: 'my', name: 'Myanmar (Burmese)' },
        { code: 'ne', name: 'Nepali' },
        { code: 'no', name: 'Norwegian' },
        { code: 'ny', name: 'Nyanja (Chichewa)' },
        { code: 'or', name: 'Odia (Oriya)' },
        { code: 'ps', name: 'Pashto' },
        { code: 'fa', name: 'Persian' },
        { code: 'pl', name: 'Polish' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'ro', name: 'Romanian' },
        { code: 'ru', name: 'Russian' },
        { code: 'sm', name: 'Samoan' },
        { code: 'gd', name: 'Scots Gaelic' },
        { code: 'sr', name: 'Serbian' },
        { code: 'st', name: 'Sesotho' },
        { code: 'sn', name: 'Shona' },
        { code: 'sd', name: 'Sindhi' },
        { code: 'si', name: 'Sinhala (Sinhalese)' },
        { code: 'sk', name: 'Slovak' },
        { code: 'sl', name: 'Slovenian' },
        { code: 'so', name: 'Somali' },
        { code: 'es', name: 'Spanish' },
        { code: 'su', name: 'Sundanese' },
        { code: 'sw', name: 'Swahili' },
        { code: 'sv', name: 'Swedish' },
        { code: 'tl', name: 'Tagalog (Filipino)' },
        { code: 'tg', name: 'Tajik' },
        { code: 'ta', name: 'Tamil' },
        { code: 'tt', name: 'Tatar' },
        { code: 'te', name: 'Telugu' },
        { code: 'th', name: 'Thai' },
        { code: 'tr', name: 'Turkish' },
        { code: 'tk', name: 'Turkmen' },
        { code: 'uk', name: 'Ukrainian' },
        { code: 'ur', name: 'Urdu' },
        { code: 'ug', name: 'Uyghur' },
        { code: 'uz', name: 'Uzbek' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'cy', name: 'Welsh' },
        { code: 'xh', name: 'Xhosa' },
        { code: 'yi', name: 'Yiddish' },
        { code: 'yo', name: 'Yoruba' },
        { code: 'zu', name: 'Zulu' }
    ];

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
        // Open translation modal
        setShowTranslationModal(true);
    };

    const performTranslation = (targetLanguage) => {
        dispatch(translatecomment(comment._id, targetLanguage))
            .then((translatedText) => {
                // Update current translation
                setCurrentTranslation({
                    language: targetLanguage,
                    text: translatedText
                });
                console.log('Comment translated successfully:', translatedText);
            })
            .catch((error) => {
                console.error('Translation failed:', error);
                alert('Failed to translate comment. Please try again.');
            });
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

    const toggleOriginalTranslation = () => {
        // Toggle between original and translated comment
        setCurrentTranslation(prev => prev ? null : currentTranslation);
    };

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
            
            {isEditing ? (
                <textarea 
                    className="comment-edit-input"
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                />
            ) : (
                <div className="comment-body">
                    {currentTranslation ? currentTranslation.text : comment.commentbody}
                </div>
            )}

            <div className="comment-footer">
                <div className="comment-interaction-buttons">
                    <button 
                        className="translate-btn" 
                        onClick={handleTranslate}
                    >
                        <FaLanguage /> Translate
                    </button>

                    {currentTranslation && (
                        <button 
                            className="toggle-translation-btn"
                            onClick={toggleOriginalTranslation}
                        >
                            {currentTranslation ? 'Original' : 'Translated'}
                        </button>
                    )}

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
                        <h3>Translate Comment</h3>
                        <div className="language-grid">
                            {languages.map((lang) => (
                                <button 
                                    key={lang.code}
                                    onClick={() => {
                                        performTranslation(lang.code);
                                        setShowTranslationModal(false);
                                    }}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                        <button 
                            className="close-modal-btn"
                            onClick={() => setShowTranslationModal(false)}
                        >
                            Cancel
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
    
    // Fetch comments when component mounts or video changes
    useEffect(() => {
        if (videoid) {
            dispatch(getallcomment(videoid));
        }
    }, [dispatch, videoid]);

    const handleonsubmit = (e) => {
        e.preventDefault();
        
        // Validate comment input
        if (!commenttext.trim()) {
            alert("Please enter a comment");
            return;
        }

        // Get current user from Redux store
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

    // Filter comments for the specific video
    const videoComments = videoid 
        ? (commentlist?.data?.filter((q) => videoid === q?.videoid) || []) 
        : [];

    return (
        <div className="comment-section">
            {/* Comment Input */}
            <form onSubmit={handleonsubmit} className="comment-input-form">
                <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={commenttext}
                    onChange={(e) => setcommentext(e.target.value)}
                />
                <button type="submit">Comment</button>
            </form>

            {/* Comment List */}
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