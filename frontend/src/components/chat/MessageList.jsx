import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Box, CircularProgress, Typography, Fade, Alert } from '@mui/material';
import Message from './Message';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import PropTypes from 'prop-types';
import { useUIState } from '../../providers/UIStateProvider';

const OVERSCAN_COUNT = 5;
const LOADING_TIMEOUT = 10000; // 10 seconds timeout for loading

const MessageList = ({
    messages,
    isLoading,
    hasNextPage,
    loadMoreMessages,
    onMessageAction,
    authUser,
}) => {
    const listRef = useRef();
    const prevMessagesLength = useRef(messages.length);
    const loadingTimeoutRef = useRef();
    const [error, setError] = useState(null);
    const { theme } = useUIState();

    // Scroll handling
    const scrollToBottom = useCallback(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(messages.length - 1, 'end');
        }
    }, [messages.length]);

    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            // New message received, scroll to bottom
            scrollToBottom();
        }
        prevMessagesLength.current = messages.length;
    }, [messages.length, scrollToBottom]);

    // Loading timeout handling
    useEffect(() => {
        if (isLoading) {
            loadingTimeoutRef.current = setTimeout(() => {
                setError('Loading messages is taking longer than expected. Please check your connection.');
            }, LOADING_TIMEOUT);
        }

        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [isLoading]);

    // Error handling
    useEffect(() => {
        if (!isLoading && error) {
            setError(null);
        }
    }, [isLoading]);

    const isItemLoaded = useCallback((index) => 
        !hasNextPage || index < messages.length, 
        [hasNextPage, messages.length]
    );

    const itemCount = hasNextPage ? messages.length + 1 : messages.length;

    const renderMessage = useCallback(({ index, style }) => {
        if (!isItemLoaded(index)) {
            return (
                <Box
                    style={style}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 1,
                    }}
                >
                    <CircularProgress size={20} />
                </Box>
            );
        }

        const message = messages[index];
        if (!message) return null;

        const isOwnMessage = message.sender_id === authUser?.id;
        const isLastMessage = index === messages.length - 1;
        const showTimestamp = isLastMessage || 
            messages[index + 1]?.sender_id !== message.sender_id ||
            new Date(messages[index + 1]?.timestamp) - new Date(message.timestamp) > 300000; // 5 minutes

        return (
            <Fade in={true} timeout={300}>
                <Box style={style}>
                    <Message
                        message={message}
                        isOwnMessage={isOwnMessage}
                        showTimestamp={showTimestamp}
                        onReply={(msg) => onMessageAction('reply', msg)}
                        onEdit={(msg) => onMessageAction('edit', msg)}
                        onDelete={(msg) => onMessageAction('delete', msg)}
                        onCopy={(msg) => onMessageAction('copy', msg)}
                        onReact={(msg, type) => onMessageAction('react', msg, type)}
                        authUser={authUser}
                    />
                </Box>
            </Fade>
        );
    }, [messages, authUser, onMessageAction, isItemLoaded]);

    if (error) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    p: 2,
                }}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (isLoading && !messages.length) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!messages.length) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    bgcolor: theme === 'dark' ? 'grey.900' : 'grey.100',
                }}
            >
                <Typography color="textSecondary">
                    No messages yet. Start the conversation!
                </Typography>
            </Box>
        );
    }

    return (
        <Box 
            sx={{ 
                height: '100%', 
                width: '100%',
                bgcolor: theme === 'dark' ? 'grey.900' : 'grey.100',
            }}
        >
            <AutoSizer>
                {({ height, width }) => (
                    <InfiniteLoader
                        isItemLoaded={isItemLoaded}
                        itemCount={itemCount}
                        loadMoreItems={loadMoreMessages}
                    >
                        {({ onItemsRendered, ref }) => (
                            <List
                                ref={(list) => {
                                    ref(list);
                                    listRef.current = list;
                                }}
                                height={height}
                                width={width}
                                itemCount={itemCount}
                                itemSize={80}
                                onItemsRendered={onItemsRendered}
                                overscanCount={OVERSCAN_COUNT}
                            >
                                {renderMessage}
                            </List>
                        )}
                    </InfiniteLoader>
                )}
            </AutoSizer>
        </Box>
    );
};

MessageList.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        sender_id: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired,
    })).isRequired,
    isLoading: PropTypes.bool.isRequired,
    hasNextPage: PropTypes.bool.isRequired,
    loadMoreMessages: PropTypes.func.isRequired,
    onMessageAction: PropTypes.func.isRequired,
    authUser: PropTypes.shape({
        id: PropTypes.string.isRequired,
    }).isRequired,
};

export default React.memo(MessageList);
