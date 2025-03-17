import React from 'react';
import PropTypes from 'prop-types';
import {
    AppBar,
    Avatar,
    Box,
    IconButton,
    Tooltip,
    Typography,
    Badge,
} from '@mui/material';
import {
    Info as InfoIcon,
    Phone as PhoneIcon,
    VideoCall as VideoCallIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const ChatHeader = ({
    chat,
    recipient,
    onInfoClick,
    onCallClick,
    onVideoClick,
    onSearchClick,
    onMoreClick,
    isTyping = false,
}) => {
    const isOnline = recipient?.active;
    const lastSeen = recipient?.last_seen;
    const displayName = chat?.isGroupChat ? chat.name : recipient?.userfullname || 'Unknown User';
    const avatarSrc = chat?.isGroupChat ? chat.photo : recipient?.photo;

    const getStatusText = () => {
        if (isTyping) return 'Typing...';
        if (isOnline) return 'Online';
        if (lastSeen) {
            try {
                return `Last seen ${new Date(lastSeen).toLocaleString()}`;
            } catch (error) {
                console.error('Invalid date format:', lastSeen);
                return 'Last seen recently';
            }
        }
        return 'Offline';
    };

    return (
        <AppBar
            position="static"
            color="inherit"
            elevation={1}
            sx={{
                px: 2,
                py: 1,
                bgcolor: 'background.paper',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        variant="dot"
                        sx={{
                            '& .MuiBadge-badge': {
                                backgroundColor: isOnline ? '#44b700' : '#ccc',
                                color: isOnline ? '#44b700' : '#ccc',
                                boxShadow: `0 0 0 2px ${isOnline ? '#44b700' : '#ccc'}`,
                                '&::after': {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    animation: isOnline ? 'ripple 1.2s infinite ease-in-out' : 'none',
                                    border: '1px solid currentColor',
                                    content: '""',
                                },
                            },
                            '@keyframes ripple': {
                                '0%': {
                                    transform: 'scale(.8)',
                                    opacity: 1,
                                },
                                '100%': {
                                    transform: 'scale(2.4)',
                                    opacity: 0,
                                },
                            },
                        }}
                    >
                        <Avatar
                            src={avatarSrc}
                            alt={displayName}
                            sx={{ 
                                width: 40, 
                                height: 40,
                                bgcolor: !avatarSrc ? 'primary.main' : undefined 
                            }}
                        >
                            {!avatarSrc && displayName.charAt(0)}
                        </Avatar>
                    </Badge>
                    <Box>
                        <Typography variant="h6" noWrap sx={{ maxWidth: 200 }}>
                            {displayName}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ 
                                color: isTyping ? 'primary.main' : 'text.secondary',
                                fontWeight: isTyping ? 500 : 400
                            }}
                        >
                            {getStatusText()}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    {onCallClick && (
                        <Tooltip title="Voice Call">
                            <IconButton onClick={onCallClick}>
                                <PhoneIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onVideoClick && (
                        <Tooltip title="Video Call">
                            <IconButton onClick={onVideoClick}>
                                <VideoCallIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onSearchClick && (
                        <Tooltip title="Search">
                            <IconButton onClick={onSearchClick}>
                                <SearchIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onInfoClick && (
                        <Tooltip title="Chat Info">
                            <IconButton onClick={onInfoClick}>
                                <InfoIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onMoreClick && (
                        <Tooltip title="More">
                            <IconButton onClick={onMoreClick}>
                                <MoreVertIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </AppBar>
    );
};

ChatHeader.propTypes = {
    chat: PropTypes.shape({
        isGroupChat: PropTypes.bool,
        name: PropTypes.string,
        photo: PropTypes.string,
    }),
    recipient: PropTypes.shape({
        active: PropTypes.bool,
        last_seen: PropTypes.string,
        userfullname: PropTypes.string,
        photo: PropTypes.string,
        employeeId: PropTypes.string,
    }),
    onInfoClick: PropTypes.func,
    onCallClick: PropTypes.func,
    onVideoClick: PropTypes.func,
    onSearchClick: PropTypes.func,
    onMoreClick: PropTypes.func,
    isTyping: PropTypes.bool,
};

export default React.memo(ChatHeader);