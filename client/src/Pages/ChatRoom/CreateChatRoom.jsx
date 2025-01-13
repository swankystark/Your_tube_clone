import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createChatRoom } from '../../Api';
import { toast } from 'react-toastify';
import './ChatRoomList.css';

const CreateChatRoom = () => {
    const [roomName, setRoomName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const currentUser = useSelector(state => state.currentuserreducer?.result);

    const handleCreateRoom = async (e) => {
        e.preventDefault();

        // Validate room name
        if (!roomName.trim()) {
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
            setIsLoading(true);

            // Prepare room data
            const roomData = {
                name: roomName.trim(),
                isPrivate
            };

            // Log room creation details
            console.log('Creating Chat Room:', {
                roomName: roomData.name,
                isPrivate: roomData.isPrivate,
                currentUser: currentUser._id
            });

            // Create chat room
            const response = await createChatRoom(roomData);

            // Log response details
            console.log('Create Chat Room Response:', {
                room: response?.data?.room,
                isPrivate: response?.data?.room?.isPrivate
            });

            // Check response
            if (response?.data?.room) {
                toast.success(`Chat room "${roomName}" created successfully!`);
                
                // Navigate to the newly created chat room
                navigate(`/chatroom/${response.data.room._id}`);
            } else {
                toast.error('Failed to create chat room. Please try again.');
            }
        } catch (error) {
            console.error('Create Chat Room Error:', error);

            // Handle specific error cases
            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        toast.error('A chat room with this name already exists');
                        break;
                    case 401:
                        toast.error('Please log in to create a chat room');
                        navigate('/auth');
                        break;
                    default:
                        toast.error('Failed to create chat room. Please try again.');
                }
            } else {
                toast.error('Network error. Please check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // If user is not logged in, redirect to auth
    if (!currentUser) {
        navigate('/auth');
        return null;
    }

    return (
        <div className="create-chat-room-container">
            <div className="create-chat-room-form">
                <h2>Create New Chat Room</h2>
                <form onSubmit={handleCreateRoom}>
                    <div className="form-group">
                        <label htmlFor="roomName">Room Name</label>
                        <input 
                            type="text" 
                            id="roomName"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Enter room name"
                            required
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <input 
                            type="checkbox" 
                            id="isPrivate"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                        />
                        <label htmlFor="isPrivate">Make Room Private</label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="create-room-btn"
                    >
                        {isLoading ? 'Creating...' : 'Create Chat Room'}
                    </button>
                </form>

                <div className="create-room-info">
                    <p>
                        <strong>Note:</strong> 
                        {' '}You'll be automatically added as the room creator and first participant.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateChatRoom;
