import React, { useState, useEffect } from 'react';
import { getUserChatRooms, createChatRoom, deleteChatRoom } from '../../api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatRoomInvitation from '../../Component/ChatRoom/ChatRoomInvitation';
import './ChatRoomList.css';

const ChatRoomList = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showInvitations, setShowInvitations] = useState(false);
    const currentUser = useSelector(state => state.currentuserreducer?.result);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChatRooms = async () => {
            setIsLoading(true);
            try {
                const response = await getUserChatRooms();
                console.log('Chat Rooms Response:', response.data);

                // Extract chat rooms from the new response structure
                const roomsArray = response.data?.chatRooms || 
                    (Array.isArray(response.data) ? response.data : []);

                setChatRooms(roomsArray);
                setIsLoading(false);
            } catch (error) {
                setIsLoading(false);
                console.error('Error fetching chat rooms', error);
                
                const errorMessage = error.response?.data?.message || 
                                     error.response?.data?.error || 
                                     'Failed to fetch chat rooms';
                
                toast.error(errorMessage, {
                    description: error.response?.data?.stack || 'Unknown error occurred'
                });
            }
        };

        if (currentUser) {
            fetchChatRooms();
        }
    }, [currentUser]);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        
        // Validate room name
        if (!newRoomName.trim()) {
            toast.error('Please enter a room name');
            return;
        }

        // Ensure user is logged in
        if (!currentUser) {
            toast.error('Please log in to create a chat room');
            navigate('/auth');
            return;
        }

        try {
            const { data } = await createChatRoom({ 
                name: newRoomName.trim(), 
                isPrivate: false 
            });

            // Add the new room to the list
            setChatRooms(prev => [...prev, data.room]);
            
            // Clear the input and show success message
            setNewRoomName('');
            toast.success('Chat room created successfully!');
        } catch (error) {
            console.error('Error creating chat room:', error);
            toast.error(error.response?.data?.message || 'Failed to create chat room');
        }
    };

    const handleJoinRoom = (roomId) => {
        navigate(`/chatroom/${roomId}`);
    };

    const toggleInvitations = () => {
        setShowInvitations(!showInvitations);
    };

    const handleDeleteRoom = async (roomId, e) => {
        // Prevent room join when clicking delete
        e.stopPropagation();

        // Confirm deletion
        const confirmDelete = window.confirm('Are you sure you want to delete this chat room? This action cannot be undone.');
        
        if (!confirmDelete) return;

        try {
            // Call API to delete room
            const response = await deleteChatRoom(roomId);

            // Remove room from local state
            setChatRooms(prev => prev.filter(room => room._id !== roomId));
            
            toast.success('Chat room deleted successfully', {
                description: `Deleted room: ${roomId}`
            });
        } catch (error) {
            console.error('Error deleting chat room:', error);
            
            // More detailed error handling
            const errorMessage = error.response?.data?.message || 
                                 error.response?.data?.error || 
                                 'Failed to delete chat room';
            
            toast.error(errorMessage, {
                description: error.response?.data?.stack || 'Unknown error occurred'
            });
        }
    };

    if (!currentUser) {
        return (
            <div className="chat-room-list">
                <h2>Please Log In to Access Chat Rooms</h2>
                <button onClick={() => navigate('/auth')}>Go to Login</button>
            </div>
        );
    }

    return (
        <div className="chat-room-list-container">
            <div className="chat-room-header">
                <h2>Chat Rooms</h2>
                <button 
                    className="invite-toggle-btn" 
                    onClick={toggleInvitations}
                >
                    {showInvitations ? 'Hide Invitations' : 'Show Invitations'}
                </button>
            </div>

            {showInvitations && <ChatRoomInvitation />}

            <div className="create-room-section">
                <h2>Create New Chat Room</h2>
                <form onSubmit={handleCreateRoom} className="create-room-input">
                    <input 
                        type="text" 
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name"
                        required
                    />
                    <button type="submit">Create Room</button>
                </form>
            </div>

            {isLoading ? (
                <p>Loading chat rooms...</p>
            ) : chatRooms.length === 0 ? (
                <p>No chat rooms found. Create one!</p>
            ) : (
                <div className="chat-room-grid">
                    {chatRooms.map(room => (
                        <div 
                            key={room._id} 
                            className="chat-room-item"
                            onClick={() => handleJoinRoom(room._id)}
                        >
                            <div className="chat-room-header">
                                <h3>{room.name}</h3>
                                {room.createdBy === currentUser?._id && (
                                    <button 
                                        className="delete-room-btn"
                                        onClick={(e) => handleDeleteRoom(room._id, e)}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            <p>
                                {room.isPrivate ? 'Private Room' : 'Public Room'}
                                {' | '}
                                {room.participants?.length || 0} Members
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatRoomList;
