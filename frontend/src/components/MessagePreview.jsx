import { Box, IconButton, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { memo } from "react";

const MessagePreview = memo(({ message, onCancel, type, api }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: '#e0f7fa',
        marginX: 'auto',
    }}>
        <Box sx={{ flexGrow: 1 }}>
            {message.mediaUrl ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    {message.mediaType === "gif" ? (
                        <img src={message.mediaUrl} alt="Media preview" style={{ width: 50, height: 50, borderRadius: 4 }}/>
                    ) : message.mediaType === "file" ? (
                        <Typography sx={{ fontSize: "14px" }}>File Message:</Typography>
                    ) : (
                        <img src={`${api}/${message.mediaUrl}`} alt="Media preview" style={{ width: 50, height: 50, borderRadius: 4 }}/>
                    )}
                    <Box>
                        <Typography sx={{ fontSize: "14px", fontWeight: "600", color: "#000" }}>
                            {message.sender}
                        </Typography>
                        <Typography variant="body2" noWrap>
                            {message.mediaType === 'image' ? 'Photo Message' : message.mediaType === 'gif' ? 'Gif Message' : ''}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <Box>
                    <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#000" }}>
                        {message.sender}:
                    </Typography>
                    <Box>{message.textContent}</Box>
                </Box>
            )}
        </Box>
        <IconButton onClick={onCancel}>
            <CloseIcon fontSize="small" />
        </IconButton>
    </Box>
));

export default MessagePreview;