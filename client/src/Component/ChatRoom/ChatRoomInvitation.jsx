import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
    getUserChatRooms, 
    getPendingInvitations, 
    inviteUserToChatRoom, 
    respondToInvitation,
    findUserByEmail 
} from '../../Api';

const ChatRoomInvitation = () => {
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedChatRoom, setSelectedChatRoom] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [foundUser, setFoundUser] = useState(null);

    const currentUser = useSelector(state => state.currentuserreducer?.result);

    useEffect(() => {
        console.log('Current User Details:', {
            id: currentUser?._id,
            email: currentUser?.email,
            name: currentUser?.name
        });
    }, [currentUser]);

    // Fetch user's chat rooms
    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                const response = await getUserChatRooms();
                console.log('Chat Rooms:', response.data);

                // Ensure data is an array
                const roomsArray = Array.isArray(response.data) ? response.data : 
                    (response.data.chatRooms && Array.isArray(response.data.chatRooms) ? response.data.chatRooms : 
                    (response.data.rooms && Array.isArray(response.data.rooms) ? response.data.rooms : []));

                setChatRooms(roomsArray);
            } catch (error) {
                console.error('Error fetching chat rooms:', error);
                toast.error('Failed to fetch chat rooms');
            }
        };

        if (currentUser) {
            fetchChatRooms();
        }
    }, [currentUser]);

    // Fetch pending invitations
    useEffect(() => {
        const fetchPendingInvitations = async () => {
            try {
                const response = await getPendingInvitations();
                setPendingInvitations(response.data.pendingInvitations || []);
            } catch (error) {
                console.error('Error fetching pending invitations:', error);
                toast.error('Failed to fetch invitations');
            }
        };

        if (currentUser) {
            fetchPendingInvitations();
        }
    }, [currentUser]);

    // Find user by email when email changes
    useEffect(() => {
        const searchUser = async () => {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(inviteEmail)) {
                setFoundUser(null);
                return;
            }

            try {
                const user = await findUserByEmail(inviteEmail);
                setFoundUser(user);
            } catch (error) {
                console.error('Error finding user:', error);
                setFoundUser(null);
            }
        };

        // Only search if email is not empty
        if (inviteEmail) {
            searchUser();
        }
    }, [inviteEmail]);

    const handleInviteUser = async (e) => {
        e.preventDefault();
        
        if (!selectedChatRoom) {
            toast.error('Please select a chat room');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Ensure user exists
        if (!foundUser) {
            toast.error('User not found. Please check the email address.');
            return;
        }

        try {
            const response = await inviteUserToChatRoom({ 
                chatRoomId: selectedChatRoom, 
                invitedUserEmail: inviteEmail 
            });
            
            toast.success(response.data.message || 'Invitation sent successfully!');
            setInviteEmail('');
            setSelectedChatRoom('');
            setFoundUser(null);
        } catch (error) {
            console.error('Error sending invitation:', error);
            
            // More detailed error handling
            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        toast.error('User not found. Please check the email address.');
                        break;
                    case 400:
                        toast.error(error.response.data.message || 'Invitation could not be sent');
                        break;
                    case 403:
                        toast.error('You are not authorized to invite users to this chat room');
                        break;
                    default:
                        toast.error('Failed to send invitation');
                }
            } else if (error.request) {
                toast.error('No response received from server');
            } else {
                toast.error('Error setting up invitation request');
            }
        }
    };

    const handleInvitationResponse = async (invitationId, response) => {
        console.log('Attempting to respond to invitation:', {
            invitationId, 
            response,
            currentUser: {
                id: currentUser?._id,
                email: currentUser?.email,
                name: currentUser?.name,
                idType: typeof currentUser?._id
            }
        });

        try {
            const result = await respondToInvitation({ 
                invitationId, 
                response 
            });
            
            if (response === 'accepted') {
                // Navigate to the new chat room or refresh chat rooms
                toast.success(`Joined chat room: ${result.data.chatRoomId}`);
                
                // Remove the invitation from the list
                setPendingInvitations(prev => 
                    prev.filter(inv => inv._id !== invitationId)
                );

                // Optional: Trigger a refresh of chat rooms
                // You might want to dispatch an action to update chat rooms
            } else {
                toast.info('Invitation rejected');
                
                // Remove the invitation from the list
                setPendingInvitations(prev => 
                    prev.filter(inv => inv._id !== invitationId)
                );
            }
        } catch (error) {
            console.error('Error responding to invitation:', {
                error: {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                },
                invitationId,
                response,
                currentUser: {
                    id: currentUser?._id,
                    email: currentUser?.email,
                    name: currentUser?.name,
                    idType: typeof currentUser?._id
                }
            });
            
            // Detailed error handling
            if (error.response) {
                console.error('Full error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
                
                switch (error.response.status) {
                    case 404:
                        toast.error('Invitation not found');
                        break;
                    case 403:
                        toast.error('You are not authorized to respond to this invitation');
                        console.error('Authorization details:', {
                            expectedUserId: error.response.data.expectedUserId,
                            actualUserId: error.response.data.actualUserId
                        });
                        break;
                    case 400:
                        toast.error(error.response.data.message || 'Invitation is no longer valid');
                        break;
                    default:
                        toast.error('Failed to respond to invitation');
                }
            } else if (error.request) {
                toast.error('No response received from server');
            } else {
                toast.error('Error processing invitation response');
            }
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        <div className="chat-room-invitation-container">
            <section className="invite-section">
                <h2>Invite to Chat Room</h2>
                <form onSubmit={handleInviteUser}>
                    <select 
                        value={selectedChatRoom}
                        onChange={(e) => setSelectedChatRoom(e.target.value)}
                        required
                    >
                        <option value="">Select Chat Room</option>
                        {chatRooms.map(room => (
                            <option key={room._id} value={room._id}>
                                {room.name}
                            </option>
                        ))}
                    </select>
                    <input 
                        type="email" 
                        placeholder="Enter user's email" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required 
                    />
                    {foundUser && (
                        <div className="user-found">
                            <p>User found: {foundUser.name}</p>
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={!foundUser}
                    >
                        Send Invitation
                    </button>
                </form>
            </section>

            <section className="pending-invitations">
                <h2>Pending Invitations</h2>
                {pendingInvitations.length === 0 ? (
                    <p>No pending invitations</p>
                ) : (
                    <ul>
                        {pendingInvitations.map(invitation => (
                            <li key={invitation._id}>
                                <div>
                                    <strong>Chat Room:</strong> {invitation.chatRoom?.name}
                                    <br />
                                    <strong>Invited By:</strong> {invitation.invitedBy?.name}
                                </div>
                                <div>
                                    <button 
                                        onClick={() => handleInvitationResponse(invitation._id, 'accepted')}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleInvitationResponse(invitation._id, 'rejected')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default ChatRoomInvitation;
