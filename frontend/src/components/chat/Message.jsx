import React, { useState, useCallback, useMemo } from 'react';
import {
    Avatar,
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    Zoom,
    Badge,
    Chip,
    Fade,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon,
    AccessTime as PendingIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import TimeAgo from '../TimeAgo';
import ReactionBar from './ReactionBar';
import PropTypes from 'prop-types';
import { useUIState } from '../../providers/UIStateProvider';

const MessageStatus = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    ERROR: 'error',
    PENDING: 'pending',
};

const getStatusIcon = (status) => {
    switch (status) {
        case MessageStatus.READ:
            return <CheckIcon sx={{ color: '#34B7F1' }} />;
        case MessageStatus.DELIVERED:
            return <CheckIcon />;
        case MessageStatus.ERROR:
            return <ErrorIcon color="error" />;
        case MessageStatus.PENDING:
            return <PendingIcon />;
        default:
            return <CheckIcon />;
    }
};

const Message = ({
    message,
    isOwnMessage,
    showTimestamp,
    onReply,
    onEdit,
    onDelete,
    onCopy,
    onReact,
    authUser,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showReactions, setShowReactions] = useState(false);
    const [copied, setCopied] = useState(false);
    const { theme } = useUIState();

    const handleMenuOpen = useCallback((event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleAction = useCallback((action) => {
        handleMenuClose();
        switch (action) {
            case 'reply':
                onReply(message);
                break;
            case 'edit':
                onEdit(message);
                break;
            case 'delete':
                onDelete(message);
                break;
            case 'copy':
                navigator.clipboard.writeText(message.content)
                    .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        onCopy(message);
                    })
                    .catch(console.error);
                break;
            default:
                break;
        }
    }, [message, onReply, onEdit, onDelete, onCopy]);

    const messageStyle = useMemo(() => ({
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: showTimestamp ? 2 : 1,
        position: 'relative',
        '&:hover': {
            '& .message-actions': {
                opacity: 1,
            },
        },
    }), [isOwnMessage, showTimestamp]);

    const bubbleStyle = useMemo(() => ({
        maxWidth: '70%',
        backgroundColor: isOwnMessage 
            ? theme === 'dark' ? '#005C4B' : '#DCF8C6'
            : theme === 'dark' ? '#202C33' : '#FFFFFF',
        color: theme === 'dark' ? '#E9EDEF' : 'inherit',
        borderRadius: 2,
        p: 1.5,
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            [isOwnMessage ? 'right' : 'left']: -8,
            borderStyle: 'solid',
            borderWidth: '8px 8px 0 0',
            borderColor: `${isOwnMessage 
                ? theme === 'dark' ? '#005C4B' : '#DCF8C6'
                : theme === 'dark' ? '#202C33' : '#FFFFFF'} transparent transparent transparent`,
        },
    }), [isOwnMessage, theme]);

    return (
        <Box sx={messageStyle}>
            {!isOwnMessage && (
                <Tooltip title={message.sender_name}>
                    <Avatar
                        src={message.sender_photo}
                        sx={{ width: 40, height: 40 }}
                    />
                </Tooltip>
            )}
            
            <Box sx={{ flex: 1, maxWidth: '70%' }}>
                <Box sx={bubbleStyle}>
                    {!isOwnMessage && (
                        <Typography 
                            variant="subtitle2" 
                            color={theme === 'dark' ? '#00A884' : 'primary'}
                            sx={{ mb: 0.5 }}
                        >
                            {message.sender_name}
                        </Typography>
                    )}
                    
                    {message.reply_to && (
                        <Fade in timeout={200}>
                            <Box
                                sx={{
                                    borderLeft: '4px solid',
                                    borderColor: theme === 'dark' ? '#00A884' : 'primary.main',
                                    pl: 1,
                                    my: 1,
                                    opacity: 0.7,
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="caption" color="textSecondary">
                                    {message.reply_to.sender_name}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                    {message.reply_to.content}
                                </Typography>
                            </Box>
                        </Fade>
                    )}

                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {message.content}
                    </Typography>

                    {message.edited && (
                        <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ ml: 1, opacity: 0.7 }}
                        >
                            (edited)
                        </Typography>
                    )}

                    <Box
                        className="message-actions"
                        sx={{
                            position: 'absolute',
                            top: -20,
                            [isOwnMessage ? 'left' : 'right']: 0,
                            display: 'flex',
                            gap: 0.5,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
                            borderRadius: 2,
                            boxShadow: 2,
                            p: 0.5,
                        }}
                    >
                        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                            <IconButton size="small" onClick={() => handleAction('copy')}>
                                <CopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reply">
                            <IconButton size="small" onClick={() => handleAction('reply')}>
                                <ReplyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {isOwnMessage && (
                            <>
                                <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => handleAction('edit')}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton size="small" onClick={() => handleAction('delete')}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-start' : 'flex-end',
                            alignItems: 'center',
                            mt: 0.5,
                            gap: 0.5,
                        }}
                    >
                        <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ opacity: 0.7 }}
                        >
                            <TimeAgo date={message.timestamp} />
                        </Typography>
                        {isOwnMessage && (
                            <Tooltip title={message.status}>
                                {getStatusIcon(message.status)}
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {showReactions && (
                    <Zoom in>
                        <Box sx={{ mt: 1 }}>
                            <ReactionBar
                                messageId={message.id}
                                reactions={message.reactions}
                                onReact={onReact}
                                authUser={authUser}
                            />
                        </Box>
                    </Zoom>
                )}
            </Box>
        </Box>
    );
};

Message.propTypes = {
    message: PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        sender_id: PropTypes.string.isRequired,
        sender_name: PropTypes.string.isRequired,
        sender_photo: PropTypes.string,
        timestamp: PropTypes.string.isRequired,
        status: PropTypes.oneOf(Object.values(MessageStatus)),
        edited: PropTypes.bool,
        reactions: PropTypes.array,
        reply_to: PropTypes.shape({
            sender_name: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
        }),
    }).isRequired,
    isOwnMessage: PropTypes.bool.isRequired,
    showTimestamp: PropTypes.bool,
    onReply: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onReact: PropTypes.func.isRequired,
    authUser: PropTypes.shape({
        id: PropTypes.string.isRequired,
    }).isRequired,
};

Message.defaultProps = {
    showTimestamp: true,
};

export default React.memo(Message);
