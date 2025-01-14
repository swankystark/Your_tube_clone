import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { getChatRoomMessages, sendChatMessage } from '../../Api/index';
import { useAuth } from '../../Context/AuthContext';

const ChatRoom = () => {
    const { roomId } = useParams();
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomDetails, setRoomDetails] = useState(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Socket setup and message handling
    useEffect(() => {
        // Establish socket connection
        socketRef.current = io('https://your-tube-clone-1-7fms.onrender.com', {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        // Listen for incoming messages
        socketRef.current.on('receive_message', (messageData) => {
            console.log('Received Socket Message:', messageData);
            
            // Only add the message if it's for the current room
            if (messageData.roomId === roomId) {
                setMessages(prevMessages => {
                    // Prevent duplicate messages
                    const isDuplicate = prevMessages.some(
                        msg => msg._id === messageData._id || 
                               (msg.content === messageData.content && 
                                msg.sender === messageData.sender)
                    );
                    
                    if (!isDuplicate) {
                        return [...prevMessages, {
                            _id: messageData._id || Date.now().toString(),
                            content: messageData.content,
                            sender: {
                                _id: messageData.sender,
                                name: messageData.senderName
                            },
                            createdAt: messageData.createdAt || new Date().toISOString()
                        }];
                    }
                    return prevMessages;
                });
            }
        });

        // Cleanup socket on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    // Fetch messages when room changes
    const fetchMessages = useCallback(async () => {
        try {
            console.group('Fetch Messages Debug');
            console.log('Fetching messages for Room ID:', roomId);
            console.log('Current User:', currentUser);

            // Log detailed room ID information
            console.log('Room ID Type:', typeof roomId);
            console.log('Room ID Details:', JSON.stringify(roomId, null, 2));

            // Fetch messages with detailed logging
            const response = await getChatRoomMessages(roomId);
            
            console.log('Full Response:', JSON.stringify(response, null, 2));
            console.log('Fetched Room:', response.room);
            console.log('Fetched Messages:', response.messages);

            // Ensure room details are set with fallback
            const safeRoomDetails = {
                _id: response.room._id,
                name: response.room.name,
                creatorName: response.room.creatorName,
                isPrivate: response.room.isPrivate
            };

            setRoomDetails(safeRoomDetails);
            setMessages(response.messages || []);

            console.groupEnd();
        } catch (error) {
            console.error('Error fetching room data:', error);
            
            // Log full error details
            console.log('Error Details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                response: error.response
            });

            // Set default room details on error
            setRoomDetails({
                _id: roomId,
                name: 'Chat Room',
                creatorName: 'Unknown',
                isPrivate: false
            });
            setMessages([]);

            // Optional: Show user-friendly toast
            toast.error('Failed to load chat room. Please try again later.');

            console.groupEnd();
        }
    }, [roomId, currentUser]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Initial message fetch
    useEffect(() => {
        if (roomId) {
            fetchMessages();
        }
    }, [roomId, fetchMessages]);

    // Send message handler
    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        
        // Extensive logging
        console.group('🚀 Send Message Debug');
        console.log('Current User:', currentUser);
        console.log('Room ID:', roomId);
        console.log('New Message:', newMessage);

        // Robust message trimming and validation
        const trimmedMessage = typeof newMessage === 'string' 
            ? newMessage.trim() 
            : (newMessage ? String(newMessage).trim() : '');

        console.log('Trimmed Message:', trimmedMessage);

        // Comprehensive input checks
        if (!currentUser) {
            toast.error('Please log in to send messages');
            console.error('Cannot send message: No current user');
            console.groupEnd();
            return;
        }

        if (!roomId) {
            toast.error('Invalid chat room');
            console.error('Cannot send message: No room ID');
            console.groupEnd();
            return;
        }

        if (!trimmedMessage) {
            toast.error('Message cannot be empty');
            console.warn('Attempted to send empty message');
            console.groupEnd();
            return;
        }

        // Determine room ID string
        const roomIdString = typeof roomId === 'object' 
            ? (roomId._id || roomId.id || roomId.roomId || 
               (roomId.participants ? roomId.participants[0] : null) || 
               JSON.stringify(roomId)) 
            : roomId;

        console.log('Room ID String:', roomIdString);

        // Multiple ways to extract sender name
        const senderName = 
            currentUser.name || 
            currentUser.username || 
            (currentUser.user && (currentUser.user.name || currentUser.user.username)) || 
            'Anonymous';

        console.log('Extracted Sender Name:', senderName);

        try {
            // Send via API first
            const apiResponse = await sendChatMessage({
                roomId: roomIdString,
                content: trimmedMessage,
                senderName: senderName,
                sender: {
                    name: senderName,
                    _id: currentUser._id
                }
            });
            console.log('API Send Message Response:', apiResponse);

            // Emit message via Socket.IO
            socketRef.current.emit('send_message', {
                roomId: roomIdString,
                content: trimmedMessage,
                sender: currentUser._id,
                senderName: senderName
            });

            // Optimistically add message to local state
            setMessages(prevMessages => [...prevMessages, {
                _id: apiResponse.data._id || Date.now().toString(),
                content: trimmedMessage,
                sender: { 
                    _id: currentUser._id, 
                    name: senderName 
                },
                createdAt: new Date().toISOString()
            }]);

            // Clear input
            setNewMessage('');
            console.log('Message sent successfully');
            console.groupEnd();
        } catch (error) {
            console.error('Message Send Error:', {
                error,
                roomId,
                currentUser
            });
            toast.error(error.message || 'Failed to send message');
            console.groupEnd();
        }
    }, [roomId, newMessage, currentUser, socketRef]);

    // Render messages
    const renderMessages = () => {
        return messages.map((message, index) => (
            <div 
                key={message._id || index} 
                className={`message ${message.sender._id === currentUser._id ? 'sent' : 'received'}`}
            >
                <span className="sender-name">{message.sender.name}</span>
                <p>{message.content}</p>
                <small>{new Date(message.createdAt).toLocaleString()}</small>
            </div>
        ));
    };

    // Refresh messages manually
    const handleRefreshMessages = () => {
        fetchMessages();
    };

    // Render
    return (
        <div className="chat-room">
            {roomDetails && (
                <div className="room-header">
                    <h2>{roomDetails.name}</h2>
                    <button onClick={handleRefreshMessages}>Refresh Messages</button>
                </div>
            )}
            
            <div className="messages-container">
                {renderMessages()}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="message-input">
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatRoom;
