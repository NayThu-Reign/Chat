import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import { useUIState } from '../providers/UIStateProvider';
import { useChatSocket } from '../hooks/useChatSocket';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import TextEditor from '../components/TextEditor';

const ImprovedConversation = () => {
    const { authUser, socket } = useAuth();
    const { currentChatId, setCurrentChatId } = useUIState();
    const containerRef = useRef(null);
    
    // Chat state
    const [chatState, setChatState] = useState({
        chat: null,
        messages: [],
        isLoading: true,
        error: null,
        hasNextPage: true,
        recipient: null,
        page: 1,
        pageSize: 50
    });

    // UI state
    const [uiState, setUiState] = useState({
        isChatInfoOpen: false,
        isForwardOpen: false,
        snackbar: { open: false, message: '', severity: 'info' },
        replyingTo: null,
        editingMessage: null,
        isTyping: false
    });

    // Snackbar helpers
    const showSnackbar = useCallback((message, severity = 'info') => {
        setUiState(prev => ({
            ...prev,
            snackbar: { open: true, message, severity },
        }));
    }, []);
            
    // Fetch chat data
    const fetchChat = useCallback(async () => {
        if (!currentChatId) return;

        try {
            const api = import.meta.env.VITE_API_URL;
            const token = localStorage.getItem('token');
            const { page, pageSize } = chatState;
            
            const response = await fetch(
                `${api}/api/chats/${currentChatId}?page=${page}&pageSize=${pageSize}`, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch chat');

            const data = await response.json();
            
            // Update participants with online status
            const updatedParticipants = data.participants.map(participant => ({
                ...participant,
                active: false,
                lastSeen: null,
            }));

            setChatState(prev => ({
                ...prev,
                chat: { ...data, participants: updatedParticipants },
                messages: [...prev.messages, ...data.messages].sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                ),
                recipient: data.participants.find(p => p.employeeId !== authUser.staff_code),
                isLoading: false,
                hasNextPage: data.messages.length === pageSize,
            }));
        } catch (error) {
            setChatState(prev => ({
                ...prev,
                error: error.message,
                isLoading: false,
            }));
            showSnackbar('Failed to load chat', 'error');
        }
    }, [currentChatId, authUser.staff_code, chatState.page, chatState.pageSize, showSnackbar]);

    // Load more messages
    const loadMoreMessages = useCallback(() => {
        if (!chatState.hasNextPage || chatState.isLoading) return;
        
        setChatState(prev => ({
            ...prev,
            page: prev.page + 1,
            isLoading: true
        }));
    }, [chatState.hasNextPage, chatState.isLoading]);

    // Socket event handlers
    const socketHandlers = {
        onNewMessage: useCallback((message) => {
            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, message],
            }));
            // Auto scroll to bottom for new messages
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        }, []),

        onReadMessage: useCallback(({ messageId, userId }) => {
            setChatState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                    msg.id === messageId
                        ? { 
                            ...msg, 
                            viewedBy: Array.from(new Set([...(msg.viewedBy || []), userId]))
                        }
                        : msg
                ),
            }));
        }, []),

        onDeleteMessage: useCallback((messageId) => {
            setChatState(prev => ({
                ...prev,
                messages: prev.messages.filter(msg => msg.id !== messageId),
            }));
            showSnackbar('Message was deleted', 'info');
        }, [showSnackbar]),

        onEditMessage: useCallback((updatedMessage) => {
            setChatState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                ),
            }));
        }, []),

        onNewReaction: useCallback((reaction) => {
            setChatState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                    msg.id === reaction.messageId
                        ? {
                            ...msg,
                            reactions: [...(msg.reactions || []), reaction],
                        }
                        : msg
                ),
            }));
        }, []),

        onUserConnected: useCallback((userId) => {
            setChatState(prev => ({
                ...prev,
                chat: prev.chat ? {
                    ...prev.chat,
                    participants: prev.chat.participants.map(p =>
                        p.employeeId === userId ? { ...p, active: true } : p
                    ),
                } : null,
            }));
        }, []),

        onUserDisconnected: useCallback((userId) => {
            setChatState(prev => ({
                ...prev,
                chat: prev.chat ? {
                    ...prev.chat,
                    participants: prev.chat.participants.map(p =>
                        p.employeeId === userId ? { ...p, active: false, lastSeen: new Date() } : p
                    ),
                } : null,
            }));
        }, []),

        onUserTyping: useCallback((userId) => {
            if (chatState.recipient?.employeeId === userId) {
                setUiState(prev => ({ ...prev, isTyping: true }));
                // Clear typing indicator after 3 seconds
                setTimeout(() => {
                    setUiState(prev => ({ ...prev, isTyping: false }));
                }, 3000);
            }
        }, [chatState.recipient]),
    };

    // Use custom socket hook
    useChatSocket(socket, currentChatId, socketHandlers);

    // Initial fetch
    useEffect(() => {
        if (currentChatId) {
            setChatState(prev => ({
                ...prev,
                messages: [],
                page: 1,
                isLoading: true
            }));
            fetchChat();
        }
        
        return () => {
            setChatState(prev => ({
                ...prev,
                chat: null,
                messages: [],
                isLoading: true,
                page: 1
            }));
        };
    }, [currentChatId, fetchChat]);

    // Message actions
    const handleMessageAction = async (action, message, additionalData) => {
        switch (action) {
            case 'reply':
                setUiState(prev => ({ ...prev, replyingTo: message }));
                break;
            case 'edit':
                setUiState(prev => ({ ...prev, editingMessage: message }));
                break;
            case 'delete':
                try {
                    const api = import.meta.env.VITE_API_URL;
                    const token = localStorage.getItem('token');
                    
                    const response = await fetch(`${api}/api/messages/${message.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) throw new Error('Failed to delete message');
                    
                    showSnackbar('Message deleted successfully', 'success');
                } catch (error) {
                    showSnackbar('Failed to delete message', 'error');
                }
                break;
            case 'react':
                try {
                    const api = import.meta.env.VITE_API_URL;
                    const token = localStorage.getItem('token');
                    
                    const response = await fetch(`${api}/api/messages/${message.id}/reactions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ type: additionalData }),
                    });

                    if (!response.ok) throw new Error('Failed to add reaction');
                } catch (error) {
                    showSnackbar('Failed to add reaction', 'error');
                }
                break;
            default:
                break;
        }
    };

    // Send message
    const handleSendMessage = async (content, mediaUrl, mediaType) => {
        try {
            const api = import.meta.env.VITE_API_URL;
            const token = localStorage.getItem('token');
            
            const messageData = {
                chatId: currentChatId,
                content,
                mediaUrl,
                mediaType,
                replyTo: uiState.replyingTo?.id,
            };

            const response = await fetch(`${api}/api/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) throw new Error('Failed to send message');

            // Clear reply state
            setUiState(prev => ({ ...prev, replyingTo: null }));
        } catch (error) {
            showSnackbar('Failed to send message', 'error');
        }
    };

    const handleCloseSnackbar = () => {
        setUiState(prev => ({
            ...prev,
            snackbar: { ...prev.snackbar, open: false },
        }));
    };

    if (chatState.error) {
        return (
            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Alert severity="error">{chatState.error}</Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
            }}
        >
            <ChatHeader
                chat={chatState.chat}
                recipient={chatState.recipient}
                onInfoClick={() => setUiState(prev => ({ ...prev, isChatInfoOpen: true }))}
                isTyping={uiState.isTyping}
            />

            <Box 
                ref={containerRef}
                sx={{ 
                    flexGrow: 1, 
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {chatState.isLoading && !chatState.messages.length ? (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <MessageList
                        messages={chatState.messages}
                        isLoading={chatState.isLoading}
                        hasNextPage={chatState.hasNextPage}
                        loadMoreMessages={loadMoreMessages}
                        onMessageAction={handleMessageAction}
                        authUser={authUser}
                    />
                )}
            </Box>

            <TextEditor
                onSendMessage={handleSendMessage}
                replyingTo={uiState.replyingTo}
                onCancelReply={() => setUiState(prev => ({ ...prev, replyingTo: null }))}
                editingMessage={uiState.editingMessage}
                onCancelEdit={() => setUiState(prev => ({ ...prev, editingMessage: null }))}
                socket={socket}
                currentChatId={currentChatId}
            />

            <Snackbar
                open={uiState.snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={uiState.snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {uiState.snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ImprovedConversation;
