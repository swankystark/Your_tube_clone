import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createSocketConnection } from '../../utils/socketConfig';
import { getChatRoomMessages, sendChatMessage } from '../../api/index';
import { useAuth } from '../../Context/AuthContext';

const ChatRoom = () => {
    const { roomId } = useParams();
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Socket setup and message handling
    useEffect(() => {
        // Establish socket connection
        socketRef.current = createSocketConnection();

        // Listen for incoming messages
        socketRef.current.on('receive_message', (messageData) => {
            setMessages((prevMessages) => [...prevMessages, messageData]);
        });

        // Handle connection errors
        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            toast.error('Chat connection error. Trying to reconnect...');
        });

        // Handle reconnection
        socketRef.current.on('reconnect', (attempt) => {
            console.log('Reconnected to chat on attempt:', attempt);
            toast.success('Chat reconnected!');
            // Reload messages after reconnection
            fetchMessages();
        });

        // Handle disconnection
        socketRef.current.on('disconnect', (reason) => {
            console.log('Disconnected from chat:', reason);
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                socketRef.current.connect();
            }
        });

        // Clean up on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Fetch messages when room changes
    const fetchMessages = useCallback(async () => {
        try {
            const response = await getChatRoomMessages(roomId);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load chat messages');
        }
    }, [roomId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle sending messages
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendChatMessage(roomId, {
                content: newMessage,
                sender: currentUser.id
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="chat-room">
            <div className="messages-container">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${
                            msg.sender === currentUser.id ? 'sent' : 'received'
                        }`}
                    >
                        <p>{msg.content}</p>
                        <small>{new Date(msg.timestamp).toLocaleString()}</small>
                    </div>
                ))}
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
