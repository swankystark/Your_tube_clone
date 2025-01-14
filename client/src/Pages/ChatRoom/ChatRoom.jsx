import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    getUserChatRooms, 
    getChatRoomMessages, 
    sendChatMessage,
    clearChatRoomMessages 
} from '../../api';
import './ChatRoom.css';

const ChatRoom = ({ currentUser }) => {
    const { roomId } = useParams();
    const [roomDetails, setRoomDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);

    // Fetch room details and messages
    const fetchRoomDetails = useCallback(async () => {
        try {
            const roomResponse = await getUserChatRooms();
            const currentRoom = roomResponse.data?.chatRooms?.find(room => room._id === roomId);
            setRoomDetails(currentRoom);

            const messagesResponse = await getChatRoomMessages(roomId);
            setMessages(messagesResponse.data?.messages || []);
        } catch (error) {
            toast.error('Failed to fetch room details', {
                position: "bottom-right",
                autoClose: 3000,
            });
        }
    }, [roomId]);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Refresh messages
    const handleRefresh = useCallback(async () => {
        try {
            const messagesResponse = await getChatRoomMessages(roomId);
            setMessages(messagesResponse.data?.messages || []);
            toast.success('Messages refreshed', {
                position: "bottom-right",
                autoClose: 2000,
            });
            scrollToBottom();
        } catch (error) {
            toast.error('Failed to refresh messages', {
                position: "bottom-right",
                autoClose: 3000,
            });
        }
    }, [roomId]);

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await sendChatMessage(roomId, newMessage);
            setNewMessage('');
            chatInputRef.current?.focus();
            
            // Optimistically update messages without a full refresh
            if (response.data?.chatMessage) {
                setMessages(prevMessages => [...prevMessages, response.data.chatMessage]);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', {
                errorName: error.name,
                errorMessage: error.message,
                errorCode: error.code,
                errorStack: error.stack
            });
            
            toast.error('Failed to send message', {
                position: "bottom-right",
                autoClose: 3000,
            });
        }
    };

    // Clear chat history
    const handleClearChat = async () => {
        try {
            await clearChatRoomMessages(roomId);
            setMessages([]);
            toast.success('Chat cleared', {
                position: "bottom-right",
                autoClose: 2000,
            });
        } catch (error) {
            toast.error('Failed to clear chat', {
                position: "bottom-right",
                autoClose: 3000,
            });
        }
    };

    // Render individual message
    const renderMessage = (msg) => {
        const isCurrentUser = msg.sender?._id === currentUser?._id;
        return (
            <div 
                key={msg._id} 
                className={`chat-message ${isCurrentUser ? 'sent-message' : 'received-message'}`}
            >
                <div className="message-sender">
                    {!isCurrentUser && msg.sender?.name}
                </div>
                <div className="message-content">
                    {msg.content}
                </div>
                <div className="message-timestamp">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
            </div>
        );
    };

    // Initial fetch and periodic refresh
    useEffect(() => {
        fetchRoomDetails();
        
        // Reduce refresh frequency and add some randomness to prevent synchronized requests
        const refreshInterval = setInterval(
            handleRefresh, 
            30000 + Math.random() * 5000  // Every 30-35 seconds
        );
        
        return () => clearInterval(refreshInterval);
    }, [fetchRoomDetails]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="chat-room-container">
            {/* Chat Room Header */}
            <div className="chat-room-header">
                <h2>{roomDetails?.name || 'Chat Room'}</h2>
                <button 
                    className="refresh-button" 
                    onClick={handleRefresh}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Chat Messages Area */}
            <div className="chat-messages-container">
                <div className="chat-messages">
                    {(messages || []).map((msg) => renderMessage(msg))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Room Members Section */}
                <div className="room-members-section">
                    <h3>Room Members</h3>
                    <ul>
                        {roomDetails?.participants?.map(participant => (
                            <li key={participant._id}>
                                {participant.name}
                                {participant._id === roomDetails.createdBy && ' (Creator)'}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Chat Input Area */}
            <form className="chat-input-container" onSubmit={handleSendMessage}>
                <input 
                    ref={chatInputRef}
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                />
                <div className="chat-buttons">
                    <button 
                        type="submit" 
                        className="send-button"
                    >
                        Send
                    </button>
                    <button 
                        type="button" 
                        className="clear-chat-button"
                        onClick={handleClearChat}
                    >
                        Clear Chat
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatRoom;
