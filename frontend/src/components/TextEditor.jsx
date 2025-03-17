import {
    Box,
    IconButton,
    TextField,
    Typography,
    Tooltip,
    useMediaQuery,
    Popper,
    Autocomplete,
    Chip,
    ListItem,
    ListItemText,
    Paper
} from "@mui/material"

import {
    EmojiEmotions as EmojiEmotionsIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Close as CloseIcon,
} from "@mui/icons-material"
import EmojiSelector from "./EmojiSelector"
import { useState, useEffect, useRef, memo } from "react";
import GiphyPicker from "./GiphyPicker";
import TenorPicker from "./TenorPicker";
import RedditPicker from "./RedditPicker";
import { useAuth } from "../providers/AuthProvider";
import MessagePreview from "./MessagePreview";
import MentionSuggestions from "./MentionSuggestions";

const styles = {
    container: (isMobile, isChatInfo) => ({
        position: "fixed",
        bottom: 0,
        padding: "20px 23px",
        width: isMobile ? "100%" : isChatInfo ? "30vw" : "60vw",
        zIndex: 1000,
        backgroundColor: "white",
    }),
    // ... other styles
};

const TextEditor = memo(({ sendMessage, textContentRef, setMediaType, setMediaUrl, mediaType, mediaUrl, closePicker, setSelectedFile, selectedFile, setFileName, setMediaGif, repliedMessage, setRepliedMessage, onCancelReply, onCancelEdit, editedMessage, copiedToClipboard, setCopiedToClipboard, editMessage, recipient, isChatInfoOpen, isSharedFileOpen, isMediaOpen, isAddParticipantOpen, isAddGroupOpen, chat, currentUserId, setCurrentChatId, currentChatId, setCurrentUserId, fetchChat, user}) => {

    const fileInputRef = useRef(null);
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const { authUser } = useAuth();

    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


    const [mentionAnchor, setMentionAnchor] = useState(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [participants, setParticipants] = useState([]);
   const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const loadParticipants = () => {
            if (!chat?.is_group_chat) {
                setParticipants([]);
                return;
            }

            const safeParticipants = Array.isArray(chat?.participants) 
                ? chat.participants 
                : [];
           
            console.log("safeParticipants", safeParticipants)

            const filtered = safeParticipants
                .filter(p => p?.usercode !== authUser?.user_code)
                .map(p => ({
                    ...p,
                    label: `@${p.username}`,
                    type: 'user'
                }));

            setParticipants(filtered);
        };

        loadParticipants();
    }, [chat, authUser]);

    


    // useEffect(() => {
    //     if (chat?.participants) {
    //         const filteredParticipants = chat.participants
    //             ?.filter(p => p.employeeId !== authUser?.staff_code)
    //             .map(p => ({
    //                 ...p,
    //                 label: `@${p.userfullname}`
    //             }));
    //         setParticipants(filteredParticipants);
    //     }
    // }, [chat, authUser]);




    
    const handleGifSelect = (url, type) => {
        setMediaUrl(url);
        setMediaGif(url);
        setMediaType(type);
      };

    const handleFileChange = async (e) => {
        if (e.target.files) {
            const file = e.target.files[0];
            setSelectedFile(file); // Update state if needed elsewhere
            setMediaType(file.type.startsWith('image/') ? 'image' : 'file');

            console.log("RecipientTextEditor", recipient)
    
            // Use the file directly here
            const formData = new FormData();
            formData.append('file', file); // Use `file` directly instead of `selectedFile`
            if(chat) {
                formData.append('chat_id', chat.id);
                formData.append('isGroupChat', chat.isGroupChat);
            }
            if( (currentChatId && chat.isGroupChat === false) || currentUserId) {
                formData.append('recipient_id', recipient ? recipient.employeeId : user.employeeId);
            }
    
            
            formData.append('file_name', file.name);
            if(repliedMessage) {
                formData.append('reply_to', repliedMessage.id);
            }
    


            for (let [key, value] of formData.entries()) {
                console.log(`FormData ${key}:`, value);
            }
    
            try {
                const api = import.meta.env.VITE_API_URL;
                const response = await fetch(`${api}/api/uploadFileMessage`, {
                    method: 'POST',
                    headers: {
                        // 'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                });
                
                if(response) {
                    
                    console.log('Emitting newMessage event with:', response);
                    // socket.emit('newMessage', response);
    
                   
                    setMediaType(null);
                    setMediaUrl(null);
                    setSelectedFile(null); // Clear the file after sending the message
                    
                    if(repliedMessage) {
                        setRepliedMessage(null)
                    }

                    console.log("RepliedMessage", repliedMessage);
    
                   
                        if(currentUserId) {
                            setCurrentChatId(response.chat_id);
                            fetchChat();
                            setCurrentUserId(null);
                        }
    
                    
                      
                    
    
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file); 
        });
    };

      const triggerFileInput = () => {
        fileInputRef.current.click();
      }

    const handleMentionTrigger = (e) => {
    if (!textContentRef.current) return;
    
    const value = textContentRef.current.value;
    const caretPos = textContentRef.current.selectionStart;
    const lastAt = value.lastIndexOf('@', caretPos - 1);
    
    if (lastAt > -1 && (caretPos === lastAt + 1 || /@\w*$/.test(value.slice(lastAt, caretPos)))) {
        setMentionQuery(value.slice(lastAt + 1, caretPos));
        setMentionIndex(lastAt);
        setMentionAnchor(textContentRef.current);
        
        // Force the TextField to maintain focus
        requestAnimationFrame(() => {
            if (textContentRef.current) {
                textContentRef.current.focus();
            }
        });
    } else {
        setMentionAnchor(null);
    }
};

const handleMentionSelect = (username) => {
    if (!textContentRef.current) return;
    
    const currentValue = textContentRef.current.value;
    const mentionText = `@${username}, `;
    
    const newValue = 
        currentValue.slice(0, mentionIndex) +
        mentionText +
        currentValue.slice(textContentRef.current.selectionStart);
    
    // Update the TextField value
    textContentRef.current.value = newValue;
    
    // Trigger an input event to ensure React's state is updated
    const event = new Event('input', { bubbles: true });
    textContentRef.current.dispatchEvent(event);
    
    setMentionAnchor(null);
    
    // Use requestAnimationFrame for more reliable timing in production
    requestAnimationFrame(() => {
        if (textContentRef.current) {
            const newPosition = mentionIndex + mentionText.length;
            textContentRef.current.setSelectionRange(newPosition, newPosition);
            textContentRef.current.focus();
        }
    });
};

    const MentionSuggestions = () => (
        <Popper
            open={!!mentionAnchor}
            anchorEl={mentionAnchor}
            placement="top-start"
            sx={{ zIndex: 9999 }}
        >
            <Paper sx={{ width: 300, maxHeight: 200, overflow: 'auto',  '& .mention-item': {
                    color: '#1976d2',
                    fontWeight: 500
                } }}>
                <Autocomplete
                    options={[
                        { type: 'all', label: '@All - Notify everyone', userfullname: 'all' },
                        ...participants
                    ]}
                    filterOptions={(options, state) => 
                        options.filter(opt => 
                            opt.label.toLowerCase().includes(state.inputValue.toLowerCase())
                        )
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            autoFocus
                            placeholder="Search participants..."
                            variant="outlined"
                            size="small"
                            sx={{ p: 1 }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <ListItem 
                            {...props}
                            className="mention-item"
                            onClick={() => handleMentionSelect(option.type === 'all' ? 'all' : option.userfullname)}
                        >
                            <ListItemText
                                primary={option.label}
                                // secondary={option.type === 'user' ? option.position : 'Notify all chat participants'}
                                primaryTypographyProps={{
                                    sx: {
                                        color: option.type === 'all' ? '#d84315' : 'inherit',
                                        fontWeight: option.type === 'all' ? 600 : 'normal'
                                    }
                                }}
                            />
                        </ListItem>
                    )}
                />
            </Paper>
        </Popper>
    );

    
      useEffect(() => {
        // Only call sendMessage if both mediaUrl and mediaType are set (indicating a GIF has been selected)
        if ((!editedMessage || !selectedFile ) && ( textContentRef.current.value || (mediaUrl && (mediaType === "gif")) ) ) {
          sendMessage();
          closePicker();
        }
      }, [mediaUrl, mediaType]); // Trigger on mediaUrl or mediaType change

      useEffect(() => {
        let timer;
        if (copiedToClipboard) {
            timer = setTimeout(() => {
                setCopiedToClipboard(false);
                
            }, 5000); 
        }
        return () => clearTimeout(timer);

        

    }, [copiedToClipboard])

    useEffect(() => {
        if (editedMessage) {
            console.log("EditedMessage", editedMessage);
            textContentRef.current.value = editedMessage.textContent;
        }
    }, [editedMessage]);
    

    const addEmoji = (emoji) => {
        if (textContentRef.current) {
            // Get the current value of the TextField
            const currentValue = textContentRef.current.value;

            // Insert the emoji at the current cursor position
            const selectionStart = textContentRef.current.selectionStart || currentValue.length;
            const newValue = currentValue.slice(0, selectionStart) + emoji + currentValue.slice(selectionStart);

            // Update the TextField's value
            textContentRef.current.value = newValue;

            // Move the cursor position after the inserted emoji
            textContentRef.current.setSelectionRange(selectionStart + emoji.length, selectionStart + emoji.length);

            // Focus back on the input field after inserting the emoji
            textContentRef.current.focus();
        }
    };

    console.log("repliedMessage", repliedMessage)

    return (
        
            
        <Box
            sx={styles.container(isMobileOrTablet, isChatInfoOpen)}
        >
            {(repliedMessage || editedMessage) && (
                <MessagePreview 
                    message={repliedMessage || editedMessage}
                    onCancel={repliedMessage ? onCancelReply : onCancelEdit}
                    type={repliedMessage ? 'reply' : 'edit'}
                    api={api}
                />
            )}
            
                {copiedToClipboard && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '-30px', // Position it above the TextEditor
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '5px',
                            backgroundColor: '#808080',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '14px',
                            textAlign: 'center',
                            // zIndex: 1000,
                        }}
                    >
                        Copied to clipboard
                    </Box>
                )}
               
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",

                        // border: "1px solid",
                        // width: "800px",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        // border: "1px solid",

                        }}
                    >   
                       <Tooltip title="Attach File">
                            <IconButton
                                onClick={triggerFileInput}
                                sx={{
                                    "&:hover": {
                                        background: "transparent",
                                    }
                                }}
                            >
                                <AttachFileIcon />
                            </IconButton>
                       </Tooltip>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            style={{ display: 'none'}}
                            onChange={handleFileChange}
                        
                        />
                        {/* <GiphyPicker onSelectGif={handleGifSelect} closePicker={closePicker} /> */}
                        <RedditPicker onSelectGif={handleGifSelect} closePicker={closePicker}/>
                        {/* <TenorPicker onSelectGif={handleGifSelect} closePicker={closePicker}/> */}
                        <EmojiSelector onSelect={addEmoji}/>
                    </Box>

                    <Box
                        sx={{
                            width: (isMobileOrTablet && (isChatInfoOpen || isSharedFileOpen || isMediaOpen || isAddParticipantOpen || isAddGroupOpen)) ? "60%" : (!isMobileOrTablet && ( (isChatInfoOpen || isSharedFileOpen || isMediaOpen || isAddParticipantOpen || isAddGroupOpen))) ? "30vw" : isMobileOrTablet ? "100%" : "60vw",
                            borderRadius: "8px",
                            padding: "16px",
                            // border: "1px solid",
                            
                        }}
                    >
                        <TextField   
                            fullWidth
                            type="text"
                            placeholder="Type @ to mention someone"
                            inputRef={textContentRef}
                            onKeyUp={handleMentionTrigger}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if(editedMessage) {
                                        editMessage();
                                    } else {
                                        sendMessage();
                                    }
                                }
                            }}
                            sx={{                             
                                display: "flex",                            
                                // backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            border: "0.5px solid #C6C6C8",
                                        },
                                        // width: "600px"
                                    },
                                }}
                                                                                    
                            />
                    </Box>

                    <Tooltip title="Send">
                        <IconButton
                            onClick={editedMessage ? editMessage : sendMessage}
                            sx={{
                                "&:hover": {
                                    background: "transparent",
                                }
                            }}
                            
                        
                        >
                            <SendIcon 
                                sx={{ 
                                    fontSize: "23px", 
                                    color: "#121660",
                                    transform: 'rotate(-20deg)'
                                }}
                            
                            />
                        </IconButton>
                    </Tooltip>
                    <MentionSuggestions />
                </Box>
        </Box>

        
    )
});

export default TextEditor;