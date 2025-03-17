import React, { useMemo } from 'react';
import { Box, IconButton, Tooltip, Badge, Zoom } from '@mui/material';
import {
    ThumbUp,
    Favorite,
    EmojiEmotions,
    SentimentVeryDissatisfied,
    Celebration,
    AddReaction,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useUIState } from '../../providers/UIStateProvider';

const reactions = [
    { type: 'like', icon: ThumbUp, color: '#1976d2', tooltip: 'Like 👍' },
    { type: 'love', icon: Favorite, color: '#e91e63', tooltip: 'Love ❤️' },
    { type: 'haha', icon: EmojiEmotions, color: '#ffd700', tooltip: 'Haha 😄' },
    { type: 'sad', icon: SentimentVeryDissatisfied, color: '#ff9800', tooltip: 'Sad 😢' },
    { type: 'celebrate', icon: Celebration, color: '#4caf50', tooltip: 'Celebrate 🎉' },
];

const ReactionBar = ({ messageId, reactions: messageReactions = [], onReact, authUser }) => {
    const { theme } = useUIState();

    const reactionCounts = useMemo(() => {
        return messageReactions.reduce((acc, reaction) => {
            acc[reaction.type] = (acc[reaction.type] || 0) + 1;
            return acc;
        }, {});
    }, [messageReactions]);

    const userReactions = useMemo(() => {
        return messageReactions
            .filter(reaction => reaction.userId === authUser.id)
            .map(reaction => reaction.type);
    }, [messageReactions, authUser.id]);

    const handleReaction = (type) => {
        const hasReacted = userReactions.includes(type);
        onReact(messageId, type, !hasReacted);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
                borderRadius: 2,
                boxShadow: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'scale(1.02)',
                },
            }}
        >
            {reactions.map(({ type, icon: Icon, color, tooltip }) => {
                const count = reactionCounts[type] || 0;
                const hasReacted = userReactions.includes(type);

                return (
                    <Zoom key={type} in={true} style={{ transitionDelay: `${reactions.indexOf({ type }) * 50}ms` }}>
                        <Box>
                            <Tooltip 
                                title={`${tooltip} (${count})`} 
                                arrow 
                                placement="top"
                            >
                                <Badge 
                                    badgeContent={count} 
                                    color="primary"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            bgcolor: hasReacted ? color : undefined,
                                        },
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => handleReaction(type)}
                                        sx={{
                                            transition: 'all 0.2s ease-in-out',
                                            transform: hasReacted ? 'scale(1.1)' : 'scale(1)',
                                            '&:hover': {
                                                bgcolor: `${color}20`,
                                                transform: 'scale(1.1)',
                                            },
                                        }}
                                    >
                                        <Icon
                                            sx={{
                                                fontSize: 20,
                                                color: hasReacted ? color : theme === 'dark' ? 'grey.400' : 'grey.700',
                                                transition: 'all 0.2s ease-in-out',
                                            }}
                                        />
                                    </IconButton>
                                </Badge>
                            </Tooltip>
                        </Box>
                    </Zoom>
                );
            })}
            
            <Tooltip title="Custom Reaction" arrow placement="top">
                <IconButton
                    size="small"
                    onClick={() => {/* TODO: Implement custom reaction picker */}}
                    sx={{
                        '&:hover': {
                            bgcolor: theme === 'dark' ? 'grey.800' : 'grey.200',
                        },
                    }}
                >
                    <AddReaction
                        sx={{
                            fontSize: 20,
                            color: theme === 'dark' ? 'grey.400' : 'grey.700',
                        }}
                    />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

ReactionBar.propTypes = {
    messageId: PropTypes.string.isRequired,
    reactions: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        userId: PropTypes.string.isRequired,
    })),
    onReact: PropTypes.func.isRequired,
    authUser: PropTypes.shape({
        id: PropTypes.string.isRequired,
    }).isRequired,
};

ReactionBar.defaultProps = {
    reactions: [],
};

export default React.memo(ReactionBar);
