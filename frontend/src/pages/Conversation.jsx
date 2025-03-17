import {
    Avatar,
    Box,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Alert,
    Grid2,
    Tooltip,
    useMediaQuery,
    Divider,
    Popover,

} from "@mui/material"

import { 
    InsertDriveFile as InsertDriveFileIcon,
    Edit as EditIcon,
    PushPin as PushPinIcon,
    Delete as DeleteIcon,
    DeleteOutline as DeleteOutlineIcon,
    Reply as ReplyIcon,
    ContentCopy as ContentCopyIcon,
    MoreHoriz as MoreHorizIcon,
    Close as CloseIcon,
    VolumeOff as VolumeOffIcon,
    VolumeUp as VolumeUpIcon,
    GroupAdd as GroupAddIcon,
    FileDownload as FileDownloadIcon,
    ArrowBackIos as ArrowBackIosIcon,
    Clear as ClearIcon,
    FileOpen as FileOpenIcon,
    Chat as ChatIcon,
    EmojiEmotionsOutlined as EmojiEmotionsOutlinedIcon,
    ThumbUp as LikeIcon,
    Favorite as LoveIcon,
    SentimentVerySatisfied as HahaIcon,
    SentimentDissatisfied as SadIcon,
    SentimentVeryDissatisfied as AngryIcon
} from "@mui/icons-material"

import React,{ useState, useEffect, useRef } from "react";
import { motion }  from "framer-motion"
import { useUIState } from "../providers/UIStateProvider";
import { useAuth } from "../providers/AuthProvider";
import { io } from 'socket.io-client';
import TextEditor from "../components/TextEditor";

import { format, isToday, isYesterday } from 'date-fns'
import TimeAgo from "../components/TimeAgo";
import { json, useLocation, useNavigate } from "react-router-dom";
import VisibilityMessages from "../components/VisibilityMessages";
import ProfileDrawer from "../components/ProfileDrawer";
import AddParticipantDrawer from "../components/AddParticipantDrawer";
import AddGroupDrawer from "../components/AddGroupDrawer";
import ForwardMessageDrawer from "../components/ForwardMessageDrawer";
import { Helmet } from 'react-helmet-async';
import ReactionsDrawer from "../components/ReactionsDrawer";
import { useQuery } from '@tanstack/react-query';







export default function Conversation() {

    const { authUser, setAuthUser, users, setUsers, socket} = useAuth();
    

    // const socket = io(import.meta.env.VITE_API_URL, {
    //     withCredentials: true,
    //     query: {
    //       user: JSON.stringify({
    //         staff_code: authUser.staff_code,
    //       }),
    //     },
    //   });
    
    
    // socket.on('connect', () => {
    //     console.log('Connected to server with ID:', socket.id);
    // });
    
    // socket.on('disconnect', (reason) => {
    //     console.log('Disconnected from server:', reason);
    // });
    


   
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    // const token = Cookies.get('auth_tokens')


  const isMobileOrTablet = useMediaQuery("(max-width: 950px)");



    const messageRefs = useRef({});
    const [isAtBottom, setIsAtBottom] = useState(true);
    // const [ user, setUser ] = useState([]);
    const [ menuOpen, setMenuOpen ] = useState(false);

    // const [hasFetched, setHasFetched] = useState(false);


    const [ showIcon, setShowIcon ] = useState(false);
    const [ isHovering, setIsHovering ] = useState(false);
    const [ isHoveringFile, setIsHoveringFile ] = useState(false);
    const [ isChatInfoOpen, setIsChatInfoOpen ] = useState(false);
    const [ isSharedFileOpen, setIsSharedFileOpen ] = useState(false);
    const [ isMediaOpen, setIsMediaOpen ] = useState(false);
    const [ isAddParticipantOpen, setIsAddParticipantOpen ] = useState(false);
    const [ isAddGroupOpen, setIsAddGroupOpen ] = useState(false);
    const [ files, setFiles ] = useState([]);
    const [ medias, setMedias ] = useState([]);
    const [ dialogOpen, setDialogOpen ] = useState(false);
    const [ leaveDialogOpen, setLeaveDialogOpen ] = useState(false);
    const [ selectedParticipantId, setSelectedParticipantId ] = useState(null);
    const [downloadedMessages, setDownloadedMessages] = React.useState([]);

    const location = useLocation();

    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [ anchorElS1, setAnchorElS1 ] = useState(null);
    const [ pinnedMessage, setPinnedMessage ] = useState(null);
    const [ hoveredMessageId, setHoveredMessageId ] = useState(null);
    const [ hoveredFileId, setHoveredFileId ] = useState(null);
    const [ open, setOpen ] = useState(false);
    const [ pinnedMessageId, setPinnedMessageId] = useState(null);
    const [ repliedMessage, setRepliedMessage ] = useState(null);
    const [ copiedMessage, setCopiedMessage ] = useState(null);
    const [ copiedToClipboard, setCopiedToClipboard ] = useState(false);
    const [ sharedFiles, setSharedFiles ] = useState([]);
    const [ sharedMedias, setSharedMedias ] = useState([]);
    // const [hasAutoScrolled, setHasAutoScrolled] = useState(false); // Track auto-scroll status
    const [isUserScrolling, setIsUserScrolling] = useState(false); // Track if the user is manually scrolling


    const openFullscreen = (url) => {
        setFullscreenImage(url);
    };

    const closeFullscreen = () => {
        setFullscreenImage(null);
    };


    const [ chat, setChat ] = useState(null);
    const { currentChatId, currentUserId, setCurrentChatId, setCurrentUserId } = useUIState();

    console.log("currentUserId", currentUserId);

    const textContentRef = useRef();
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const [ recipient, setRecipient ] = useState(null);
    const [ selectedFile, setSelectedFile ] = useState(null);
    const [ selectedMessageId, setSelectedMessageId ] = useState(null);
    const [ selectedMessage, setSelectedMessage ] = useState(null);
    const [ editedMessage, setEditedMessage ] = useState(null);
    const [ profileDrawerOpen, setProfileDrawerOpen ] = useState(false);
    const [anchorER, setAnchorER] = useState(null); 
    const fileInputRef = useRef();
    const navigate = useNavigate();
    const containerBoxRef = useRef();
    const [ loading, setLoading ] = useState(true)


    // const { authUser, users } = useAuth();

    console.log("AuthUser", authUser);

    const [ messages, setMessages ] = useState([]);
    const [ visibleMessages, setVisibleMessages ] = useState(7);
    const [loadingPinnedMessage, setLoadingPinnedMessage] = useState(false); // Track if we're loading messages to find the pinned one

    const [ highlightedMessageId, setHighlightedMessageId ] = useState(null);

    const [ clickedMessages, setClickedMessages ] = useState([]);
    const [targetMessageId, setTargetMessageId] = useState(null);
    const [userReaction, setUserReaction] = useState(null);
    const observer = useRef();

    const [mediaUrl, setMediaUrl] = useState(null); // URL of the selected media
    const [mediaType, setMediaType] = useState(null); // Type of the media (e.g., 'gif')
    const [mediaGif, setMediaGif] = useState(null); // Type of the media (e.g., 'gif')
    const [ fileName, setFileName ] = useState(null);
    const [ forwardMessageDrawer, setForwardMessageDrawer ] = useState(false);
    const [ reactionDrawer, setReactionDrawer ] = useState(false);
    const containerRef = useRef(null); // Ref for the container
    const prevScrollHeight = useRef(0); // Ref to store previous scroll height
    const [hasAutoScrolled, setHasAutoScrolled] = useState(false); // Track if auto-scroll has been performed


    const userId = location.state?.userId || null;
    const [ mutedChat, setMutedChat ] = useState(false);
    const currentChatIdRef = useRef(currentChatId);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ deleteMessageOpen, setDeleteMessageOpen ] = useState(false);
    const [leftParticipants, setLeftParticipants] = useState(null);
    const [ newParticipants, setNewParticipants ] = useState(null);
    const [contextMenu, setContextMenu] = useState(null); 
    const isFirstRender = useRef(true); // Track the initial render

    const { setIsReactionDrawerOpen } = useUIState();
    const [currentMessage, setCurrentMessage] = useState(null); // Track the current message for reactions
    const handleOpenReactionDrawer = () => {
        setReactionDrawer(true);
    }

    


    console.log("currentChat", currentChatId);

    const chh = localStorage.getItem('currentChatId');
    console.log('chh', chh);

    const fetchChat = async () => {
        const chatId = currentChatId || localStorage.getItem('currentChatId');

        if (!chatId) {
            setChat(null);
            setMessages([]);
            setRecipient(null);
            return;
        }
    

         
            try {
            
                // const user = JSON.parse(localStorage.getItem('user'));
    
              const api = import.meta.env.VITE_API_URL;
              const token = localStorage.getItem('token');
            //   const headers = {
            //     'Content-Type': 'application/json',
            //   };
            //   if (token) {
            //     headers['Authorization'] = `Bearer ${token}`;
            //   }
    
              const result = await fetch(`${api}/api/chats/${chatId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                
                
              });
              
              if(result.status === 200) {
                const infoOne = await result.json();
                const info = await infoOne.chatDetail;

                const updatedChat = {
                    ...info,  // Spread the existing chat properties
                    participants: info.participants.map((participant) => {
                      // Ensure `participant.employeeId` matches the format of `user.employeeId`
                      console.log("Looking for participant:", participant.user_code);
                  
                      const foundUser = users.find((u) => u.user_code == participant.user_code);
                      console.log("Found user1:", foundUser);
                  
                      return {
                        ...participant,
                        active: foundUser ? foundUser.active : false, // Set active status based on foundUser
                        logoutTime: foundUser ? foundUser.logoutTime : null,
                        photo: foundUser ? foundUser.photo : null,
                      };
                    })
                  };
                setChat(updatedChat);
                console.log("hello", result.messages);
                console.log("ResultChat", updatedChat);

                const sortedMessages = [...info.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    setMessages(sortedMessages);
    
                // setMessages(result.messages);

                console.log("REsultMessages", info.messages);
    
                const pinned = info.messages.filter(message => message.pin === true);
    
                console.log("Pinned", pinned);
    
                setPinnedMessage(pinned);
    
                const recipient = updatedChat.participants.find(
                    participant => participant.user_code !== authUser.user_code
                );
    
                setRecipient(recipient);

                const data = info.messages;
                const files = data.filter(file => file.media_type === 'file');

                const limitedFiles = files.slice(0,4);
                setSharedFiles(limitedFiles);
                setFiles(files);

                const photos = data.filter(photo => photo.media_type === 'image' || photo.media_type === 'gif' );
                const limitedPhotos = photos.slice(0,3);
                setSharedMedias(limitedPhotos);

                const sortedMedias = [...photos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setMedias(sortedMedias);

                const mutedBy = updatedChat.mutedBy || '[]';
                console.log("MutedBy", mutedBy);
        
                if (mutedBy.includes(authUser.staff_code)) {
                    setMutedChat(true); 
                }

                socket.emit('joinChat', result.id);




    
                console.log("Recipient", recipient)

                setTimeout(() => {
                    if (containerBoxRef.current) {
                        containerBoxRef.current.scrollTop = containerBoxRef.current.scrollHeight;
                    }
                }, 0); 
    
              } else {
                throw new Error('Failed to fetch department categories');
              }
            } catch (error) {
              console.error(error);
              throw error;
            } finally {
                setLoading(false);
            }
        
    };

    // const fetchUser = async () => {
    //     if(currentUserId) {
    //         try {
            
    //             // const user = JSON.parse(localStorage.getItem('user'));
    
    //           const api = import.meta.env.VITE_API_URL;
    //         //   const headers = {
    //         //     'Content-Type': 'application/json',
    //         //   };
    //         //   if (token) {
    //         //     headers['Authorization'] = `Bearer ${token}`;
    //         //   }
    
    //           const result = await fetchWithAuth(`${api}/api/users/${currentUserId}`, {
    //             method: 'GET',
                
                
    //           });
              
    //           console.log("ResultUser", result);

    //           if(result) {
                
    //             setUser(result);
    //             console.log("CurrentUser", result);
                
                
    
    //           } else {
    //             throw new Error('Failed to fetch user');
    //           }
    //         } catch (error) {
    //           console.error(error);
    //           throw error;
    //         }
    //     }
    // };

    const fetchUser = async (currentUserId) => {
        if (!currentUserId) return null;
      
        const api = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("token");
      
        const response = await fetch(`${api}/api/users/${currentUserId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
      
        if (data.status !== 1) {
          throw new Error("Failed to fetch user data");
        }

        console.log("User24", data.user);
      
        return data.user;
      };
      

    const { data: user, isLoading: isUserLoading, isError: isUserError } = useQuery({
        queryKey: ["user", currentUserId],
        queryFn: () => fetchUser(currentUserId),
        enabled: !!currentUserId, // Fetch only if `currentUserId` exists
        staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
        onSettled: () => setLoading(false),
    });



    // useEffect(() => {
    //     currentChatIdRef.current = currentChatId;
    // }, [currentChatId]);

    useEffect(() => {
        if (currentChatId === null) {
            // Clear chat data when there's no valid chat selected
            setChat(null);
            setMessages([]);
            setPinnedMessage([]);
            setRecipient(null);
            setSharedFiles([]);
            setFiles([]);
            setSharedMedias([]);
            setMedias([]);
        }
    }, [currentChatId]);

    // useEffect(() => {
    //     if(currentUserId) {
    //         fetchUser();
    //     }
    // }, [currentUserId]);

    


  
    

    const fetchAndJoinChat = async () => {
        setIsLoading(true);
        try {
            await fetchChat();
            socket.emit('joinChat', currentChatId);
        } catch (error) {
            console.error("Error fetching or joining chat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentChatId) fetchAndJoinChat();
        return () => {
            if (currentChatId) socket.emit('leaveChat', currentChatId);
        };
    }, [currentChatId]);


    console.log("CHATGYI", chat)

   

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && currentChatId) {
                console.log("Tab is now active. Rejoining chat:", currentChatId);
                socket.emit('joinChat', currentChatId); // Ensure correct chat is joined
                fetchChat(); // Optionally refetch the chat
            }
        };
    
        document.addEventListener('visibilitychange', handleVisibilityChange);
    
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentChatId, socket]);
    

    useEffect(() => {
        console.log("Current chat in Conversation:", currentChatId);
        // Fetch messages or perform actions related to the current chat
    }, [currentChatId]);



    

   

   
    // useEffect(() => {
    //     socket.on('newReaction', (reaction) => {
    //         // Update chat.messages state
    //         setChat((prevChat) => {
    //             // Create a deep copy of the previous chat

    //             console.log("heello reaction", reaction)
    //             const updatedChat = { ...prevChat };

    //             console.log("heello reaction1", updatedChat)

                
    //             const updatedMessages = updatedChat.messages.map((message) => {
    //                 if (message.id === reaction.message_id) {
    //                     // Add the new reaction to the message
    //                     return {
    //                         ...message,
    //                         reactions: [...(message.reactions || []), reaction],
    //                     };
    //                 }
    //                 return message;
    //             });
    
    //             // Update the messages in the chat object
    //             updatedChat.messages = updatedMessages;

    //             console.log("new Reactions", updatedChat)
    
    //             return updatedChat;
    //         });
    //     });
    
    //     // Cleanup listener on unmount
    //     return () => {
    //         socket.off('newReaction');
    //     };
    // }, [socket]);

        
    

   

    
    
  



    
    
         

    useEffect(() => {
        let hideTimeout;
        if (!isHovering && !menuOpen) { // Keep IconButton if menu is open
            hideTimeout = setTimeout(() => setHoveredMessageId(null), 3000);
        } else {
            clearTimeout(hideTimeout); // Clear timeout if re-hovering or menu is open
        }
    
        return () => clearTimeout(hideTimeout); // Cleanup on component unmount
    }, [isHovering, menuOpen]);
    
    useEffect(() => {
        let hideTimeout;
        if (!isHoveringFile) { // Keep IconButton if menu is open
            hideTimeout = setTimeout(() => setHoveredFileId(null), 1000);
        } else {
            clearTimeout(hideTimeout); // Clear timeout if re-hovering or menu is open
        }
    
        return () => clearTimeout(hideTimeout); // Cleanup on component unmount
    }, [isHoveringFile, menuOpen]);

    useEffect(() => {
        if (containerRef.current) {
            // Adjust the scroll position after loading more messages
            containerRef.current.scrollTop = containerRef.current.scrollHeight - prevScrollHeight.current;
        }
    }, [visibleMessages]); // Run this effect whenever visibleMessages changes
    
    useEffect(() => {
        currentChatIdRef.current = currentChatId;
    }, [currentChatId]);


    // Event handlers for hover
    const handleMouseEnter = (messageId) => {
        setIsHovering(true);
        setHoveredMessageId(messageId); // Set current message ID as hovered
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    const handleMouseFileEnter = (fileId) => {
        setIsHoveringFile(true);
        setHoveredFileId(fileId); // Set current message ID as hovered
    };

    const handleMouseFileLeave = () => {
        setIsHoveringFile(false);
    };

    const handleDialogOpen = (id) => {
        setPinnedMessageId(id);  // Set the department ID to delete
        setOpen(true);  // Open the confirmation dialog
    };

    // Close the dialog
    const handleDialogClose = () => {
        setOpen(false);
        setPinnedMessageId(null); // Reset the selected department ID
    };

    const handleDeleteMessageOpen = (id) => {
        setSelectedMessageId(id);  // Set the department ID to delete
        setDeleteMessageOpen(true);  // Open the confirmation dialog
    };

    // Close the dialog
    const handleDeleteMessageClose = () => {
        setDeleteMessageOpen(false);
        setSelectedMessageId(null); // Reset the selected department ID
    };

    const handleOpenProfileDrawer = () => {
        console.log("Profile drawer opening...");
        setProfileDrawerOpen(true);
    }

    const handleCloseProfileDrawer = () => {
        setProfileDrawerOpen(false);
    }
    const handleCloseReactionDrawer = () => {
        setReactionDrawer(false);
    }

    const handleOpenForwardMessageDrawer = () => {
        setForwardMessageDrawer(true);
    }

    const handleCloseForwardMessageDrawer = () => {
        setForwardMessageDrawer(false);
    }

    const handleOpenAddParticipantDrawer = () => {
        setIsAddParticipantOpen(true);
        setIsChatInfoOpen(false);
        setIsMediaOpen(false);
        setIsSharedFileOpen(false);
    }

    const handleCloseAddParticipantDrawer = () => {
        setIsAddParticipantOpen(false);
    }

    const handleOpenAddGroupDrawer = () => {
        setIsAddGroupOpen(true);
        setIsAddParticipantOpen(false);
        setIsChatInfoOpen(false);
        setIsMediaOpen(false);
        setIsSharedFileOpen(false);
    }

    const handleCloseAddGroupDrawer = () => {
        setIsAddGroupOpen(false);
    }

    const handleRightClick = (event, participantId) => {
        event.preventDefault(); // Prevent the browser's default context menu
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX, mouseY: event.clientY }
                : null
        );
        setSelectedParticipantId(participantId); // Store the chat ID for delete action
    };



    const loadMoreMessages = () => {
        if (containerRef.current) {
            const isMobile = window.innerWidth <= 950; // or your own mobile breakpoint
    
            if (!isMobile) {
                // For desktop: save and restore scroll position
                const scrollPosition = containerRef.current.scrollTop;
    
                setVisibleMessages((prevVisible) => Math.min(prevVisible + 7, messages.length));
    
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.scrollTop = scrollPosition;
                    }
                }, 0);
            } else {
                // For mobile: let the browser handle scroll-to-bottom naturally
                setVisibleMessages((prevVisible) => Math.min(prevVisible + 7, messages.length));
            }
        }
    };
    



    const visibleMessageList = messages.slice(-visibleMessages);

    const sendMessage = async (event) => {
        if (event) event.preventDefault(); // Prevent default if called with an event
        const text_content = textContentRef.current.value;

        if (!text_content && !mediaUrl) return;

        const mentions = [];


       
        const formData = new FormData();
        if (text_content) {
            // Adjusted regex to match names with spaces
            const mentionRegex = /@([\w\s]+)/g;
            console.log("mentionRegex", mentionRegex);
            let match;
            while ((match = mentionRegex.exec(text_content)) !== null) {
                console.log("match", match);
                mentions.push(match[1].trim()); // Trim to remove any unwanted whitespace
            }
            
            formData.append('text_content', text_content);
        }
    
        // Add mention data to formData
        if (mentions.length > 0) {
            formData.append('mentions', JSON.stringify(mentions));
        }
        if( (currentChatId && chat.is_group_chat === false) || currentUserId) {
            formData.append('recipient_id', recipient ? recipient.user_code : user.user_code);
            
        }

        


        if(mediaType) {
            formData.append('media_type', mediaType);
        }
        
        // if (selectedFile) {
        //     formData.append('media', selectedFile); // Use the selected file
        //     console.log("selectedFile", selectedFile);
        // }

        if(mediaGif) {
            formData.append('media_gif', mediaGif);
        }

        // if (mediaGif) {
        //     formData.append('media_gif', mediaGif); // Use the selected file
           
        // }

        if(repliedMessage) {
            formData.append('reply_to', repliedMessage.id);
        }

        if (fileName) {
            formData.append('file_name', fileName); // Use the selected file 
        }

        if(currentChatId) {
            formData.append('chat_id', currentChatId)
        }

        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        const formDataObject = {};
for (let [key, value] of formData.entries()) {
    formDataObject[key] = value;
}
console.log('formData as object:', formDataObject);

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            
            const response = await fetch(`${api}/api/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

         

            console.log("Response", response);
           
            
            if(response.status === 201) {
                    
                console.log('Emitting newMessage event with:', response);
                socket.emit('newMessage', response);

                textContentRef.current.value="";
                setMediaType(null);
                setMediaUrl(null);
                setMediaGif(null);
                // setSelectedFile(null); // Clear the file after sending the message
                
                if(repliedMessage) {
                    setRepliedMessage(null)
                }

               
                    if(currentUserId) {
                        setCurrentChatId(response.chat_id);
                        fetchChat();
                        setCurrentUserId(null);
                    }

                
                    // setChat((prev) => ({
                    //     ...prev,
                    //     messages: [
                    //         ...(prev.messages || []), // Spread the existing messages array (or use an empty array if undefined)
                    //         response             // Add the new message to the end
                    //     ]
                    // }));
                    // textContentRef.current.value="";
                    // setMediaType(null);
                    // setMediaUrl(null);
                    // setSelectedFile(null); // Clear the file after sending the message
                
                // setMessages(prevMessages => [...prevMessages, savedMessage]);  // Update state with the full message
               
                

            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };



    const editMessage = async (event) => {
        if (event) event.preventDefault(); // Prevent default if called with an event
        const text_content = textContentRef.current.value;

        if (!text_content) return;

       
        
       
    

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/messages/${editedMessage.id}/edit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body:JSON.stringify({ text_content })
            });

            console.log("Response", response);
           
            
            if(response) {
                    
                console.log('Emitting editedMessage event with:', response);
                socket.emit('editedMessage', response);

                textContentRef.current.value="";
               
                
                if(editedMessage) {
                    setEditedMessage(null)
                }

                fetchChat();
                   

            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };

    


    

     


    

   

   
 
   

    useEffect(() => {
        if (currentChatId) {
            console.log(`Joining chat: ${currentChatId}`);
            socket.emit('joinChat', currentChatId);
        }
    
        return () => {
            if (currentChatId) {
                console.log(`Leaving chat: ${currentChatId}`);
                socket.emit('leaveChat', currentChatId);
            }
        };
    }, [currentChatId, socket]);
    

      const closePicker = () => {
        setMediaUrl(null);
        setMediaType(null);
    };


    const handleMenuClick = (event, messageId, message) => {
        setAnchorElS1(event.currentTarget);
        setMenuOpen(true); // Set the menu state to open
        setHoveredMessageId(messageId); // Also track which message is being interacted with
        setSelectedMessageId(messageId);
        setSelectedMessage(message);
    };
      
    const handleMenuClose = () => {
        setAnchorElS1(null);
        setSelectedMessageId(null);
        setHoveredMessageId(null); // Clear hovered message ID if needed
        setMenuOpen(false);
    };
   

    const handleToggleSendText = (messageId) => {
        setClickedMessages((prev) => 
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleDeleteMessage = async () => {

       if(selectedMessageId) {
        try {
            const response = await fetch(`${api}/api/messages/${currentChatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                body: JSON.stringify({messageId: selectedMessageId})
            })

            if(response) {
                console.log("Message deletion successful, messageId:", selectedMessageId);
                // setChat((prev) => ({
                //     ...prev,
                //     messages: prev.messages.filter(message => message.id !== messageId)
                // }));
                socket.emit('deleteMessage', { chatId: currentChatId, messageId: selectedMessageId });
                handleMenuClose();
                handleDeleteMessageClose();
                
            } else {
                console.log("failed to delete message");
            }
        } catch (error) {
            console.log("Error deleting error", error);
        }
       }
    }

    console.log("TOKEN", token)

    const handlePinMessage = async (messageId) => {
        console.log("message", messageId)
        try {
            const response = await fetch(`${api}/api/messages/pin/${messageId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                
            })

            if(response.status === 201) {
                console.log("Message pinned successful, messageId:", messageId);
                fetchChat();
                // socket.emit('deleteMessage', { chatId: currentChatId, messageId });
                handleMenuClose();
            } else {
                console.log("failed to delete message");
            }
        } catch (error) {
            console.log("Error deleting error", error);
        }
    }

    const handleUnPinMessage = async () => {
        console.log("message", pinnedMessageId)
        if( pinnedMessageId ) {
            try {
                const response = await fetch(`${api}/api/messages/unpin/${pinnedMessageId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    
                })

                console.log("UNpin", response)
    
                if(response.status === 200) {
                    console.log("Message unpinned successful, messageId:", pinnedMessageId);
                    fetchChat();
                    // socket.emit('deleteMessage', { chatId: currentChatId, messageId });
                    handleMenuClose();
                    handleDialogClose();
                } else {
                    console.log("failed to unpin message");
                }
            } catch (error) {
                console.log("Error unpin error", error);
            }
        }
    }
    const handleMuteChat = async () => {
        console.log("message", chat.id)
        if( chat.id ) {
            try {
                const response = await fetch(`${api}/api/chats/mute/${chat.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },    
                })

                const data = await response.json();
                console.log("response", response);

    
                if(response.status === 201) {
                    console.log("Chat muted successful");
                    fetchChat();
                    // socket.emit('deleteMessage', { chatId: currentChatId, messageId });
                   
                } else {
                    console.log("failed to mute chat");
                }
            } catch (error) {
                console.log("Error mute error", error);
            }
        }
    }

   useEffect(() => {
    if (!socket) return;
  
    const handleNewReaction = (reaction) => {
      // update messages with reaction
        setMessages((prevMessages) => {
            // Map over messages and add the reaction to the correct message
            const updatedMessages = prevMessages.map((message) => {
                if (message.id === reaction.message_id) {
                    // Ensure reactions exist, and then add the new reaction
                    return {
                        ...message,
                        reactions: [...(message.reactions || []), reaction], // Add reaction to existing or empty array
                    };
                }
                return message;
            });

            // Sort the messages by 'createdAt' after adding the reaction
            const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return sortedMessages; // Return the sorted and updated message list
        });
    };

   const deleteMessage = ({ chatId, messageId }) => {
        if (chatId === currentChatId) {
            // Update chat state with null values for the deleted message
            setChat((prev) => ({
                ...prev,
                messages: prev.messages.map(message =>
                    message.id === messageId
                        ? { ...message, text_content: null, media_url: null, media_type: null }
                        : message
                ),
            }));

            // Update separate messages state if exists
            setMessages((prevMessages) =>
                prevMessages.map(message =>
                    message.id === messageId
                        ? { ...message, text_content: null, media_url: null, media_type: null }
                        : message
                )
            );

            // Optionally, fetch the updated chat data from the server
            fetchChat();
        }
    };
  
    const handleRemoveReaction = ({ messageId, userId }) => {
      // update messages by removing reaction
        setMessages((prevMessages) => {
            // Map over messages and remove the reaction from the correct message
            const updatedMessages = prevMessages.map((message) => {
                if (message.id === messageId) {
                    return {
                        ...message,
                        reactions: (message.reactions || []).filter(
                            (reaction) => reaction.user_id !== userId
                        ), // Remove the reaction for the specific user
                    };
                }
                return message;
            });

            // Sort the messages by 'createdAt' after removing the reaction (if needed)
            const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return sortedMessages; // Return the sorted and updated message list
        });
    };
  
    const handleUpdatedReaction = (reaction) => {
        setMessages((prevMessages) => {
            // Map over messages and update the reaction in the correct message
            const updatedMessages = prevMessages.map((message) => {
                if (message.id === reaction.message_id) {
                    // Update the reaction if it exists, or add it if it doesn't
                    const updatedReactions = (message.reactions || []).map((r) =>
                        r.user_id === reaction.user_id ? { ...r, reaction_type: reaction.reaction_type } : r
                    );

                    // Check if the user hasn't reacted yet (add the new reaction)
                    const hasReacted = updatedReactions.some((r) => r.user_id === reaction.user_id);
                    if (!hasReacted) {
                        updatedReactions.push(reaction);
                    }

                    return {
                        ...message,
                        reactions: updatedReactions,
                    };
                }
                return message;
            });

            // Sort messages by 'createdAt' (if needed)
            const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return sortedMessages;
        });
    };
  
    const handleNewMessage = (message) => {
      // update chat with new message
        if(message.chat_id === Number(currentChatId)) {
            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages, message];
                console.log('Updated messages state:', updatedMessages);
                return updatedMessages;
            });
            console.log("SetMessages", messages);
            setChat((prev) => ({
                ...prev,
                messages: [...(prev.messages || []), message],
            }));

            if (!message.originalMessage) {
                // Fetch chat details if `originalMessage` is missing
                fetchChat();
            }
        } else {
            console.log("hi")
        }
    };
  
    const handleUserPhoto = (updatedUser) => {
      // update user photo logic
      setChat((prevChat) => ({
        ...prevChat,
        participants: prevChat.participants.map((participant) => {
          // If participant's employeeId matches the updatedUser's employeeId, update their photo
          if (participant.employeeId === updatedUser.employeeId) {
            return { ...participant, photo: updatedUser.photo };
          }
          return participant; // Otherwise, keep the participant as is
        }),
      }));
      

      // Check if the updatedUser matches the current user
      if (authUser?.employeeId === updatedUser.employeeId) {
        setAuthUser((prevAuthUser) => ({
          ...prevAuthUser,
          photo: updatedUser.photo,
        }));
      }

      setRecipient((prevUser) => ({
        ...prevUser,
        photo: updatedUser.photo,
      }))
    };

 
    const handleReadMessage = (data) => {
        console.log('Message read event received:', data);
        
        if (data.chatId === Number(currentChatId)) {
            setMessages((prevMessages) => {
                // Clone the previous messages to avoid direct mutation
                const updatedMessages = [...prevMessages];

                // Find the message that matches the incoming `messageId`
                const messageIndex = updatedMessages.findIndex(msg => msg.id === data.messageId);

                if (messageIndex !== -1) {
                    // Clone the target message to maintain immutability
                    const updatedMessage = { ...updatedMessages[messageIndex] };

                    // Parse `viewedBy` into an array and add `authUser.id` if not present
                    const viewedByArray = JSON.parse(updatedMessage.viewedBy || '[]');
                    if (!viewedByArray.includes(data.userId)) {
                        viewedByArray.push(data.userId);
                    }

                    // Update the `viewedBy` property
                    updatedMessage.viewedBy = JSON.stringify(viewedByArray);

                    // Replace the original message with the updated one
                    updatedMessages[messageIndex] = updatedMessage;
                }

                // Return the updated messages array
                return updatedMessages;
            });
        }
    };
    
        const handlePinMessage = () => {
        fetchChat();
    }
    const handleUnPinMessage = () => {
        fetchChat();
    }

    const handleGroupPhoto = (updatedGroup) => {
        if (updatedGroup.id === chat?.id) {
            setChat((prevChat) => ({
                ...prevChat,
                photo: updatedGroup.photo
            }));
        }
    }

  
    // Register all listeners
    socket.on("newReaction", handleNewReaction);
    socket.on("removeReaction", handleRemoveReaction);
    socket.on("updatedReaction", handleUpdatedReaction);
    socket.on("newMessage", handleNewMessage);
    socket.on("userPhoto", handleUserPhoto);
    socket.on("readMessage", handleReadMessage);
    socket.on("deleteMessage", handleDeleteMessage);
    socket.on("pinMessage", handlePinMessage);
    socket.on("unPinMessage", handleUnPinMessage);
    socket.on("groupPhoto", handleGroupPhoto);
    socket.on("deleteMessage", handleDeleteMessage);
  
    // Cleanup function to remove all listeners on unmount or socket change
    return () => {
      socket.off("newReaction", handleNewReaction);
      socket.off("removeReaction", handleRemoveReaction);
      socket.off("updatedReaction", handleUpdatedReaction);
      socket.off("newMessage", handleNewMessage);
      socket.off("userPhoto", handleUserPhoto);
      socket.off("readMessage", handleReadMessage);
      socket.off("deleteMessage", handleDeleteMessage);
      socket.off("pinMessage", handlePinMessage);
      socket.off("unPinMessage", handleUnPinMessage);
      socket.off("groupPhoto", handleGroupPhoto);
      socket.off("deleteMessage", handleDeleteMessage);
    };
  }, [socket, currentChatId, authUser?.staff_code]);

    const handleUnMuteChat = async () => {
        console.log("messageChatId", chat.id)
        if( chat.id ) {
            try {
                const response = await fetch(`${api}/api/chats/unmute/${chat.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

                    
                })

                const data = await response.json();
                console.log("response1", data);

    
                if(response.status === 201) {
                    console.log("Chat unmuted successful");
                    setMutedChat(false)
                    fetchChat();
                    // socket.emit('deleteMessage', { chatId: currentChatId, messageId });
                   
                } else {
                    console.log("failed to unmute chat");
                }
            } catch (error) {
                console.log("Error mute error", error);
            }
        }
    }

    const formatMessageDate = (dateString) => {
        const date = new Date(dateString);

        if(isToday(date)) {
            return 'Today'
        } else if ( isYesterday(date)) {
            return 'Yesterday'
        } else {
            return format(date, "MMM d");
        }
    }

    const groupedMessages = visibleMessageList.reduce((acc, message) => {
        const formattedDate = formatMessageDate(message.createdAt);

        if(!acc[formattedDate]) {
            acc[formattedDate] = [];
        }

        // acc[formattedDate].push(message);
        acc[formattedDate].push({ ...message, type: "message" });
        

        return acc;
    }, {});

    const groupedLeaves = (leftParticipants || []).reduce((acc, leave) => {
        const formattedDate = formatMessageDate(leave.leftAt);
    
        if (!acc[formattedDate]) {
            acc[formattedDate] = [];
        }
    
        acc[formattedDate].push({
            username: leave.username,
            leftAt: leave.leftAt,
            type: "left",
        });
    
        return acc;
    }, {});

    const groupedJoins = (newParticipants || []).reduce((acc, join) => {
        const formattedDate = formatMessageDate(join.joinedAt);
    
        if (!acc[formattedDate]) {
            acc[formattedDate] = [];
        }
    
        acc[formattedDate].push({
            username: join.username,
            joinedAt: join.joinedAt,
            type: "join",
        });
    
        return acc;
    }, {});

    const combinedGroups = { ...groupedMessages };

    Object.entries(groupedLeaves || {}).forEach(([date, leaves]) => {
    if (!combinedGroups[date]) {
        combinedGroups[date] = [];
    }
    combinedGroups[date].push(...leaves.map((leave) => ({ ...leave, type: "left" })));
    });

    Object.entries(groupedJoins || {}).forEach(([date, joins]) => {
        if (!combinedGroups[date]) {
            combinedGroups[date] = [];
        }
        combinedGroups[date].push(...joins);
    });

    const sortedDates = Object.keys(combinedGroups).sort((b, a) => new Date(b) - new Date(a));
    const sortedCombinedGroups = sortedDates.reduce((acc, date) => {
        acc[date] = combinedGroups[date];
        return acc;
    }, {});


    const groupedFiles = files.reduce((acc, file) => {
        const formattedDate = formatMessageDate(file.createdAt);

        if(!acc[formattedDate]) {
            acc[formattedDate] = [];
        }

        acc[formattedDate].push(file);

        return acc;
    }, {});

    const groupedMedias = medias.reduce((acc, media) => {
        const formattedDate = formatMessageDate(media.createdAt);

        if(!acc[formattedDate]) {
            acc[formattedDate] = [];
        }

        acc[formattedDate].push(media);

        return acc;
    }, {});


    function timeAgo(logoutTime) {
        const logoutDate = new Date(logoutTime);
        const now = new Date();
        const diffInSeconds = Math.floor((now - logoutDate) / 1000);
      
        const seconds = 60;
        const minutes = 60;
        const hours = 24;
        const days = 30;
        const months = 12;
      
        if (diffInSeconds < seconds) {
          return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < seconds * minutes) {
          const mins = Math.floor(diffInSeconds / seconds);
          return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
        } else if (diffInSeconds < seconds * minutes * hours) {
          const hrs = Math.floor(diffInSeconds / (seconds * minutes));
          return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
        } else if (diffInSeconds < seconds * minutes * hours * days) {
          const daysAgo = Math.floor(diffInSeconds / (seconds * minutes * hours));
          return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
        } else if (diffInSeconds < seconds * minutes * hours * days * months) {
          const monthsAgo = Math.floor(diffInSeconds / (seconds * minutes * hours * days));
          return monthsAgo === 1 ? '1 month ago' : `${monthsAgo} months ago`;
        } else {
          const yearsAgo = Math.floor(diffInSeconds / (seconds * minutes * hours * days * months));
          return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
        }
    }

      const handleScrollToMessage = (messageId) => {
        // Check if the message exists in the entire messages list
        const isMessageInAllMessages = messages.some((message) => message.id === messageId);
        if (!isMessageInAllMessages) {
            console.error("Message not found in all messages list.");
            return;
        }
    
        // Update clicked messages state
        setClickedMessages((prev) => [...prev, messageId]);
    
        // Set the target message ID for scrolling
        setTargetMessageId(messageId);
    
        // Highlight the message for 10 seconds
        setHighlightedMessageId(messageId);
        setTimeout(() => {
            setHighlightedMessageId(null);
        }, 10000); // 10 seconds
    
        // Start loading messages if the target message isn't visible yet
        const isMessageVisible = visibleMessageList.some((message) => message.id === messageId);
        if (!isMessageVisible) {
            setLoadingPinnedMessage(true);
        }
    };

   

    const downloadKey = `downloadedMessages-${authUser.id}`;
    
    useEffect(() => {
        // Check if we should scroll to the last clicked message
        if (clickedMessages.length > 0) {
            const lastClickedMessageId = clickedMessages[clickedMessages.length - 1];
            const isMessageVisible = visibleMessageList.some(
                (message) => message.id === lastClickedMessageId
            );
    
            if (!isMessageVisible && loadingPinnedMessage) {
                loadMoreMessages();
            } else if (isMessageVisible) {
                scrollToMessage(lastClickedMessageId);
                setLoadingPinnedMessage(false);
            }
        }
    }, [clickedMessages, loadingPinnedMessage, visibleMessages]);

    useEffect(() => {
        const storedMessages = JSON.parse(localStorage.getItem(downloadKey)) || [];
        setDownloadedMessages(storedMessages);
    }, [authUser.id]);


   

    
    const scrollToMessage = (messageId) => {
        const messageElement = messageRefs.current[messageId]?.current;
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    messages.forEach((message) => {
        if (!messageRefs.current[message.id]) {
            messageRefs.current[message.id] = React.createRef();
        }
    });

    const handleVisibleMessages = async (visibleMessageIds) => {
        if (!messages || !messages.length) {
            console.warn("Messages not loaded yet.");
            return;
        }

        console.log("Messages Array:", messages);
        console.log("Visible Message IDs:", visibleMessageIds);

        const unreadVisibleMessageIds = visibleMessageIds.filter(id => {
            const message = messages.find(msg => msg.id.toString() === id.toString());
            console.log("Message ID:", id, "Read Status:", message?.read, "Sender ID:", message?.sender_id);
            return message && !message.read && message.sender_id !== authUser.id;
        });

        console.log("Unread Visible Message IDs:", unreadVisibleMessageIds);

        if (unreadVisibleMessageIds.length) {
            console.log("Marking as read:", unreadVisibleMessageIds);
            const response = await fetch(`${api}/api/messages/markRead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },  
                body: JSON.stringify({ messageIds: unreadVisibleMessageIds }),
            });
            console.log("API Response:", response);
        }
    };

    VisibilityMessages(messageRefs, handleVisibleMessages);

    console.log("recipient", recipient);
    console.log("recipientUser", user);

    const handleReply = (message) => {
        console.log("Replying to message:", message);
        setRepliedMessage({
            id: message.id,
            sender: message.sender?.userfullname,
            textContent: message.text_content,
            mediaUrl: message.media_url,
            mediaType: message.media_type,
        })
    }
    

    const handleCancelReply = () => {
        setRepliedMessage(null);
    }

    const handleEdit = (message) => {
        console.log("Editing to message:", message);

        setEditedMessage({
            id: message.id,
            sender: message.sender?.userfullname,
            textContent: message.text_content,
        })

    }
    

    const handleCancelEdit = () => {
        setEditedMessage(null);
    }

    const handleCopyMessage = (message) => {
        setCopiedMessage(message); // Set copiedMessage with the message object
        setCopiedToClipboard(true);
        const contentToCopy = message.media_url 
            ? JSON.stringify(message.media_url)
            : String(message.text_content);
    
        navigator.clipboard.writeText(contentToCopy)
            .then(() => console.log("Message copied successfully!"))
            .catch((err) => console.error("Failed to copy message:", err));

        handleMenuClose();
    };

    const handleDeleteMessageForSelf = async (messageId) => {
        try {
            await fetch(`${api}/api/messages/${messageId}/deleteForSelf`, {
                method: 'PATCH',
                headers: {
                    "CONTENT-TYPE": "application/json",
                    "authorization": `bearer ${token}`
                }
            });

            setMessages((prevMessages) =>
                prevMessages.filter((message) => message.id !== messageId)
            );

            handleMenuClose();
        } catch (error) {
            console.error("Failed to delete message for self", error);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
      
        return `${day}/${month}/${year}`;
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
    
        // Determine AM or PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        // Convert 24-hour format to 12-hour format
        hours = hours % 12 || 12; // If hours is 0, set to 12 (midnight or noon)
        hours = String(hours).padStart(2, '0'); // Add leading zero if needed
    
        return `${hours}:${minutes} ${ampm}`;
    }

    const downloadFile = (file) => {
        const fileUrl = `${api}/${file.media_url}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.media_url;
        link.click();
    };

    console.log("User", recipient);

    const handleFileChange = async (e) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files);
            
            const filesData = await Promise.all(fileArray.map(async (file) => {
                const fileContent = await readFileContent(file);
                return { file, fileName: file.name, fileContent };
            }));

            console.log("HEII", filesData[0].file.type);
            
           
            const photo = filesData[0].fileContent; // Optional: Preview or use the content elsewhere

            console.log("Photo", photo);

            try {

                const api = import.meta.env.VITE_API_URL;
               
      
                const result = await fetch(`${api}/api/chats/photo-update/${chat.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    chat_photo: photo,
                  })
                  
                });
      
              //   if (!res.ok) {
              //     if (res.status === 401) {
              //       throw new Error('Unauthorized: Please login to access chats');
              //     } else {
              //         console.error('Error fetching chats:', res.error);
              //     }
              //   }
                const data = await result.json();
                
                
                if(data.status === 201) {
                    fetchChat();
                } else {
                    console.log("Something wrong")
                }
      
              } catch (error) {
                console.error(error);
                throw error;
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

    const handleClickOpen = (id) => {
    
        setDialogOpen(true);  // Open the confirmation dialog
        setSelectedParticipantId(id)
    };

    const handleClickLeaveOpen = (id) => {
    
        setLeaveDialogOpen(true);  // Open the confirmation dialog
        setSelectedParticipantId(id)
    };
    
    // Close the dialog
    const handleDialogClearClose = () => {
        setDialogOpen(false);
        setSelectedParticipantId(null)     
    };

    const handleLeaveDialogClearClose = () => {
        setLeaveDialogOpen(false);
        setSelectedParticipantId(null)     
    };

    console.log("CHat", chat);

    const handleConfirmRemove = async () => {
        if (selectedParticipantId) {
            const userIds = Array.isArray(selectedParticipantId) ? selectedParticipantId : [selectedParticipantId];
            const api = import.meta.env.VITE_API_URL;

            console.log("CurrentChatId", currentChatId);
        
            // Make the DELETE request to remove the user
            const res = await fetch(`${api}/api/chats/${currentChatId}/remove-users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userIds }) // assuming API accepts JSON format for the user ID(s)
            });
        
            if (res) {
                console.log("res", res)
                // Update the chat state to remove the selected participant
                

                

                setChat((prev) => ({
                    ...prev,
                    participants: prev.participants.filter(
                        (parti) => parti.id !== selectedParticipantId
                    ),
                }));

                

                localStorage.setItem('leftParticipants', JSON.stringify(leftParticipants));
               
                handleDialogClearClose();
                handleClose();
                fetchChat();


                
            }
        }
    };

    const handleGiveAdmin = async () => {
        if (selectedParticipantId) {
            const userIds = selectedParticipantId; // assuming `selectedParticipantId` is the ID of the user to remove
            const api = import.meta.env.VITE_API_URL;

            console.log("CurrentChatId", currentChatId);
        
            // Make the DELETE request to remove the user
            const res = await fetch (`${api}/api/chats/${currentChatId}/give-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userIds }) // assuming API accepts JSON format for the user ID(s)
            });

            console.log("res", res)

        
            if (res.status === 200) {
                                         
                fetchChat();
                handleClose();
                
            }
        }
    };

    console.log("currentchatid", currentChatId);

    if(currentUserId) {
        console.log("CurrenUserId1", currentUserId);
        console.log("CurrenChatId1", currentChatId);
        console.log("CurrentChat", chat);
    }

    console.log("selectedMessage", selectedMessage)

    console.log("Participants", chat);

    const handleLeaveChat = async () => {
         if(!selectedParticipantId) {
            return false;
         }
       
            try {
                // const token = localStorage.getItem(`token`);
                const api = import.meta.env.VITE_API_URL;
               
              const response = await fetch(`${api}/api/chats/leave/${chat.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                
              });

        
            //   const result = await response.json();
              if (response.status === 201) {
                // logout();
                navigate("/")
                handleLeaveDialogClearClose();
                 
              } else {
                console.error('Logout failed:', response.error.message);
              }
            } catch (error) {
              console.error('Error logging out:', error);
            }
       
    }

    console.log("Grouped", combinedGroups)

    console.log("UsersDetails", leftParticipants)

    const isAuthUserInChat = chat?.participants?.some(
        (participant) => participant.employeeId === authUser.staff_code
      );

   
    const ownerAdminIds = new Set(chat?.ownerAdmins?.map(admin => admin.employeeId));
    const handleClose = () => {
        setContextMenu(null); // Close the context menu
        setSelectedParticipantId(null);
    };

    console.log("SelectedParticipantId", recipient)


    const handleOpenReactionPicker = (event, item) => {
        setAnchorER(event.currentTarget);
        setCurrentMessage(item); // Store the current message being reacted to
        const userReaction = item.reactions?.find(
            (reaction) => reaction.user_id === authUser.staff_code
        );
        setUserReaction(userReaction?.reaction_type || null); // Set the reaction type for the current user
    };

    // Handle closing the reaction picker (popover)
    const handleCloseReactionPicker = () => {
        setAnchorER(null);
        setCurrentMessage(null); // Store the current message being reacted to

    };

    // Handle selecting a reaction
    const handleReactionSelect = async (reactionType) => {
        setUserReaction(reactionType);
        handleCloseReactionPicker();  // Close the picker after selection
    
        // Make the API request to add or update the reaction
        try {
            const response = await fetch(`${api}/api/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messageId: currentMessage.id,   // Assuming item.id is the message ID
                    reactionType,         // Selected reaction type
                }),
            });
    
            if (response.ok) {
                const responseData = await response.json();
                console.log('Reaction added/updated:', responseData);
                // Optionally, you can update the state with the updated reactions
            } else {
                console.error('Failed to add/update reaction:', response.statusText);
            }
        } catch (error) {
            console.error('Error making API request:', error);
        }
    };

    const handleRemoveReaction = async () => {
        handleCloseReactionPicker(); // Close the picker

        try {
            const response = await fetch(`${api}/api/reactions`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messageId: currentMessage.id, // Message being reacted to
                }),
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log("Reaction removed:", responseData);
                // Update the message reactions in the UI (pseudo code, adjust as needed)
                currentMessage.reactions = responseData.reactions; // Remove the user's reaction
            } else {
                console.error("Failed to remove reaction:", response.statusText);
            }
        } catch (error) {
            console.error("Error making API request:", error);
        }
    };



    const reactionIcons = {
        like: "👍",
        love: "❤️",
        haha: "😂",
        sad: "😢",
        angry: "😡",
      };


      if(currentChatId && (chat && !chat.participants && !recipient) && (users.length === 0)) {
        return <Box>Loading...</Box>
      } 

      if(currentUserId && !user) {
        return <Box>Loading...</Box>
      } 
     


   
    


    


    
    

    return (
        <Box
            ref={containerBoxRef}
            sx={{
                // width: "100vw",
                height: "100vh",
                overflowY: "auto",
                // display: "flex",
                // flexDirection: isChatInfoOpen ? "row" : "column",
            }}
        >
            <Helmet>
                <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" />
                <title>Conversation - Chat Application</title>
            </Helmet>
            <Box>
                <Box
                    sx={{
                        position: "sticky",       // Make the header sticky
                        top: 0,                    // Stick to the top
                        zIndex: 1015,              // Ensure it stays above other elements
                        backgroundColor: "#FFFFFF", // Background color to overlay content beneath it
                        minWidth: isMobileOrTablet ? "100%" : "320px",  // Adjust as needed
                        paddingLeft: isMobileOrTablet ? "18px" : "24px",
                        paddingRight: isMobileOrTablet ? "18px" : "40px",
                        height: "128px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #E5E5EA",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center", // This ensures the content is centered horizontally
                            gap: "16px",
                            // height: "64px",
                            // border: "1px solid",
                        }}
                    >
                            { (chat && chat.is_group_chat === false) && (
                                recipient.active === true ? (
                                    <Box
                                    sx={{
                                        position: "relative",
                                        display: "inline-block",
                                        // marginTop: "14px",
            
                                        // border: "1px solid",
                                    }}
                                >
                                    <Avatar
                                        src={`${api}/${recipient.photo}`}

                                        onClick={handleOpenProfileDrawer}
                                        sx={{
                                            width: isMobileOrTablet ? "50px" : "64px",
                                            height: isMobileOrTablet ? "50px" : "64px",
                                            background: "#D9D9D9",
                                        }}
                                    >
                                        
                                    </Avatar>
        
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: "4px",
                                            right: "-2px",
                                            width: "14px",
                                            height: "14px",
                                            backgroundColor: "#34C759",
                                            borderRadius: "50%",
                                            border: "1px solid #fff",
                                        }}
                                    >
        
                                    </Box>

                                    <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={recipient.employeeId} />
        
                                
                                    </Box>
                                ) : (
                                    <>
                                        <Avatar
                                            src={`${api}/${recipient.photo}`}
                                            onClick={handleOpenProfileDrawer}


                                            sx={{
                                                width: "64px",
                                                height: "64px",
                                                background: "#D9D9D9",
                                            }}
                                        >
                                            
                                        </Avatar>
                                        <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={recipient.employeeId} />
                                    </>
                                ))}

                                {chat && chat.is_group_chat && (
                                    chat.photo ? (
                                        // Display chat photo if available
                                        <>
                                            <Avatar
                                                src={`${api}/${chat.photo}`}
                                                onClick={() => openFullscreen(`${api}/${chat.photo}`)}
                                                sx={{
                                                    marginTop: "8px",
                                                    width: "64px",
                                                    height: "64px",
                                                    background: "#D9D9D9",
                                                }}
                                            />

                                            
                                            {fullscreenImage && (
                                                <div
                                                                                onClick={closeFullscreen}
                                                                                style={{
                                                                                    position: 'fixed',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    zIndex: 1500, // Ensures the overlay is above other content
                                                                                    cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={fullscreenImage}
                                                                                    alt="Full-size"
                                                                                    style={{
                                                                                        maxWidth: '90%',
                                                                                        maxHeight: '90%',
                                                                                        borderRadius: '8px',
                                                                                    }}
                                                                                />
                                                </div>
                                            )}
                                            
                                        </>
                                    ) : (
                                        // Display participants' user_photos or fallback merged into one Avatar
                                        <Avatar
                                            sx={{
                                                marginTop: "8px",
                                                width: "64px",
                                                height: "64px",
                                                position: 'relative',
                                                background: "#D9D9D9",
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    position: 'relative',
                                                }}
                                            >
                                                {chat.participants.slice(0, 4).map((participant, index, array) => (
                                                    participant.photo ? (
                                                        <Box
                                                            key={index}
                                                            component="img"
                                                            src={`${api}/${participant.photo}`}
                                                            sx={{
                                                                position: 'absolute',
                                                                width: array.length === 1 ? '100%' :
                                                                    array.length === 2 ? '50%' : '50%',
                                                                height: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '100%' : '50%',
                                                                objectFit: 'cover',
                                                                borderRadius: '50%',
                                                                top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                border: '1px solid #fff', // Border for better visuals
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                position: 'absolute',
                                                                width: array.length === 1 ? '100%' :
                                                                    array.length === 2 ? '50%' : '50%',
                                                                height: array.length === 1 ? '100%' :
                                                                    array.length === 2 ? '100%' : '50%',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                background: '#BDBDBD',
                                                                color: '#fff',
                                                                fontSize: array.length === 1 ? '14px' : '10px',
                                                                fontWeight: 'bold',
                                                                borderRadius: '50%',
                                                                top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                border: '1px solid #fff', // Border for better visuals
                                                            }}
                                                        >
                                                            {participant.userfullname.charAt(0).toUpperCase()}
                                                        </Box>
                                                    )
                                                ))}
                                            </Box>
                                        </Avatar>
                                    )
                                )}

                                {/* { (!chat && user) && (
                                     <Avatar
                                        src={`${api}/${user?.user_photo}`}

                                        sx={{
                                            width: "64px",
                                            height: "64px",
                                            background: "#D9D9D9",
                                        }}
                                    >
                                 
                                 </Avatar>
                                )} */}
                        
                           

                        <Box>
                            {(chat && chat.isGroupChat === false) && (
                                <Typography
                                    sx={{
                                        fontSize: isMobileOrTablet ? "14px" : "24px",
                                        fontWeight: "500",
                                        color: "#000000",
                                    }}
                                >
                                    {recipient.userfullname}
                                </Typography>
                            )}
                            {(chat && chat.isGroupChat === true) && (
                                <Typography
                                    sx={{
                                        fontSize: isMobileOrTablet ? "14px" : "24px",
                                        fontWeight: "500",
                                        color: "#000000",
                                    }}
                                >
                                    {chat.name}
                                </Typography>
                            )}
                            {(!chat && currentUserId) && (
                                <>
                                    <Typography
                                    sx={{
                                        fontSize: isMobileOrTablet ? "14px" : "24px",
                                        fontWeight: "500",
                                        color: "#000000",
                                    }}
                                >
                                    {user?.username}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#8E8E93"
                                    }}
                                >
                                    {`${user.position}, ${user.department_name ? user.department_name : ""}`}
                                </Typography>
                                </>
                            )}
                            {isMobileOrTablet ? (
                                <Box>
                                    <Typography
                                        sx={{
                                            fontSize: "10px",
                                            fontWeight: "500",
                                            color: "#8E8E93"
                                        }}
                                    >
                                        {recipient ? `${recipient.position}` : `${user.position}` } 
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "10px",
                                            fontWeight: "500",
                                            color: "#8E8E93"
                                        }}
                                    >
                                        {recipient && recipient.department_name ? recipient.department_name : ""}
                                    </Typography>
                                </Box>
                            ) : (
                                (chat && !chat.is_group_chat) && (
                                    <Typography
                                    sx={{
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#8E8E93"
                                    }}
                                >
                                    {recipient ? `${recipient.position},  ${recipient.department_name ? recipient.department_name : ""}` : `${user.position}, ${user.department_name ? user.department_name : ""}`} 
                                </Typography>
                                )
                                
                            )}

                            {(chat && chat.is_group_chat === false)  && (
                                recipient.active === true ? (
                                    <Typography
                                        sx={{
                                            fontSize: isMobileOrTablet ? "10px" : "14px",
                                            fontWeight: "400",
                                            color: "#A8A8A8",
                                        }}
                                    >
                                        Active now
                                    </Typography>
                                ) : (
                                    <TimeAgo logoutTime={recipient.logoutTime} />
                                )
                            )} 

                            {!chat && (
                                <TimeAgo logoutTime={user.logoutTime}  />
                            )}
                            {chat && chat.is_group_chat && (
                                <Typography
                                sx={{
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                               Participants: {chat.participants?.length}
                            </Typography>
                            )}
                        </Box>
                    </Box>

                    {currentChatId && (
                        <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: isMobileOrTablet ? "5px" : "16px",
                        }}
                    >

                        {isMobileOrTablet ? (
                             <Tooltip title="Shared File">
                                <IconButton
                                    onClick={() => {
                                        setIsSharedFileOpen(prev => !prev);
                                        setIsChatInfoOpen(false);
                                    }}
                                    sx={{
                                        "&:hover": {
                                            background: "transparent"
                                        }
                                    }}
                                >
                                    <FileOpenIcon sx={{ fontSize: "18px" }}/>
                                </IconButton>
                             </Tooltip>
                        ) : (
                            <Button
                                onClick={() => {
                                    setIsSharedFileOpen(prev => !prev);
                                    setIsChatInfoOpen(false);
                                }}
                                sx={{
                                    minWidth: isMobileOrTablet && "75px",
                                    fontSize: isMobileOrTablet ? "10px" : "16px",
                                    fontWeight: "500",
                                    textTransform: "none",
                                    color: isSharedFileOpen ? "#121660" : "#A8A8A8",
                                    "&:hover": {
                                        background: "transparent"
                                    }
                                }}
                            >
                                Shared Files
                            </Button>


                        )}

                        {isMobileOrTablet ? (
                            <Tooltip title="Chat Info">
                                 <IconButton
                                    onClick={() => {
                                        setIsChatInfoOpen(prev => !prev);
                                        setIsSharedFileOpen(false);
                                        setIsMediaOpen(false);
                                        setIsSharedFileOpen(false);
                                        setIsAddGroupOpen(false);
                                        setIsAddParticipantOpen(false);
                                    }}
                                    sx={{
                                        "&:hover": {
                                            background: "transparent"
                                        }
                                    }}
                                >
                                    <ChatIcon sx={{ fontSize: "18px" }}/>
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <Button
                                onClick={() => {
                                    setIsChatInfoOpen(prev => !prev);
                                    setIsSharedFileOpen(false);
                                    setIsMediaOpen(false);
                                    setIsSharedFileOpen(false);
                                    setIsAddGroupOpen(false);
                                    setIsAddParticipantOpen(false);
                                }}
                                sx={{
                                    fontSize: isMobileOrTablet ? "10px" : "16px",
                                    fontWeight: "500",
                                    color: isChatInfoOpen ? "#121660" : "#A8A8A8",
                                    textTransform: "none",
                                    "&:hover": {
                                        background: "transparent"
                                    }
                                }}
                            >
                                Chat Info
                            </Button>
                        )}

                        
                    </Box>
                    )}
                </Box>

                <Box
                    sx={{
                        display: isChatInfoOpen ? "flex" : isSharedFileOpen ? "flex" : isMediaOpen ? "flex" : isAddParticipantOpen ? "flex" : isAddGroupOpen ? "flex" : "block", 
                        // border: "1px solid",
                    }}
                >
                    <Box
                        sx={{
                            // width: isChatInfoOpen ? "815px" : "100%",
                            width: "100%",
                            display: ( isMobileOrTablet && (isChatInfoOpen || isSharedFileOpen || isMediaOpen || isAddParticipantOpen || isAddGroupOpen) ) && "none" 
                        }}
                    >
                        {pinnedMessage && pinnedMessage[0] && (
                            <Box
                            sx={{
                                minWidth: "320px",
                                height: (isChatInfoOpen || isSharedFileOpen) ? "80px" : "100%",
                                borderBottom: "1px solid grey",
                                paddingBottom: "10px",
                                position: "sticky",       // Make the header sticky
                                top: "17%", 
                                // top: "120px", 
                                zIndex: 1000,              // Ensure it stays above other elements
                                background: "white",
                            }}
                            onClick={() => handleScrollToMessage(pinnedMessage[0].id)}
                        >
                            {pinnedMessage[0].media_type === "image" ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginTop: "10px",

                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: "400px",
                                            paddingLeft: "30px",
                                        }}
                                    
                                    >   
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: "8px",
                                            }}
                                        >

                                                <img
                                                    key={pinnedMessage[0].id}
                                                    src={`${api}/${pinnedMessage[0].media_url}`}
                                                    alt="Image"
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        maxWidth: '100%',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                    }}
                                                />

                                            <Box>
                                                <Typography

                                                >
                                                    Photo Message
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        fontSize: "14px",
                                                        color: "#8E8E93",
                                                        marginTop: "10px",
                                                    }}
                                                >
                                                    Pinned Message
                                                </Typography>
                                            </Box>
                                                
                                        </Box>

                                        
                                    </Box>

                                    <IconButton
                                        onClick={() => {handleDialogOpen(pinnedMessage[0].id)}}
                                    >
                                        <CloseIcon />
                                    </IconButton>

                                </Box>
                            ) : pinnedMessage[0].media_type === "file" ? (
                                <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginTop: "10px",

                                }}
                            >
                                <Box
                                    sx={{
                                        width: "400px",
                                        paddingLeft: "30px",
                                    }}
                                
                                >
                                    <Typography

                                    >
                                        File Message
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "14px",
                                            color: "#8E8E93",
                                            marginTop: "10px",
                                        }}
                                    >
                                        Pinned Message
                                    </Typography>
                                </Box>

                                    <IconButton
                                        onClick={() => {handleDialogOpen(pinnedMessage[0].id)}}
                                    >
                                        <CloseIcon />
                                    </IconButton>

                                </Box>
                            ) : pinnedMessage[0].media_type === "gif" ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginTop: "10px",

                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: "400px",
                                            paddingLeft: "30px",
                                        }}
                                    
                                    >   
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: "8px",
                                            }}
                                        >

                                                <img
                                                    key={pinnedMessage[0].id}
                                                    src={pinnedMessage[0].media_url}
                                                    alt="Gif"
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        maxWidth: '100%',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                    }}
                                                />

                                            <Box>
                                                <Typography

                                                >
                                                    Gif Message
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        fontSize: "14px",
                                                        color: "#8E8E93",
                                                        marginTop: "10px",
                                                    }}
                                                >
                                                    Pinned Message
                                                </Typography>
                                            </Box>
                                                
                                        </Box>

                                        
                                    </Box>

                                    <IconButton
                                        onClick={() => {handleDialogOpen(pinnedMessage[0].id)}}
                                    >
                                        <CloseIcon />
                                    </IconButton>

                                </Box>
                            ) : (
                                <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginTop: "10px",
                                    // paddingBottom: "15px",

                                }}
                            >
                                <Box
                                    sx={{
                                        // width: "400px",
                                        paddingLeft: "30px",
                                        // paddingBottom: "10px",
                                    }}

                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            wordBreak: 'break-word', // Ensures that the text breaks at appropriate places
                                            maxWidth: '100%', // Let it take full width of the container
                                            '@media (max-width: 600px)': {
                                                maxWidth: '200px', // For mobile devices, break at 200px
                                            },                  
                                            '@media (min-width: 601px)': {
                                                maxWidth: '800px', // For desktop, break at 300px
                                            },
                                        }}
                                    >
                                        {pinnedMessage[0].text_content}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "14px",
                                            color: "#8E8E93",
                                            marginTop: "10px",
                                            // paddingBottom: "10px",
                                        }}
                                    >
                                        Pinned Message
                                    </Typography>
                                </Box>

                                    <IconButton
                                        onClick={() => {handleDialogOpen(pinnedMessage[0].id)}}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            )}

                            </Box>
                        )}

                        <Dialog open={open} onClose={handleDialogClose}>
                            <DialogTitle>{"Remove pin?"}</DialogTitle>

                            <DialogContent>
                                <DialogContentText>
                                    This will remove pin for you and {recipient ? recipient.userfullname : ""}
                                </DialogContentText>
                            </DialogContent>

                            <DialogActions>

                                <Button onClick={handleDialogClose} sx={{ color: "#000"}}>
                                    Cancel
                                </Button>

                                <Button onClick={handleUnPinMessage} autoFocus sx={{ color: "#121660"}}>
                                    Yes
                                </Button>
                                
                            </DialogActions>

                        </Dialog>

                        <Box
                            ref={containerRef}
                            
                            sx={{
                                
                                // flexGrow: 1,  // Allows this box to expand
                                overflowY: 'auto',  // Makes this container scrollable
                                padding: '0 24px',  // Adjust padding for a better look
                                marginBottom: "100px",  // Leaves space for the TextEditor below
                                width: "100%",
                            }}                       
                        >
                                {visibleMessages < messages.length && (
                                <Box sx={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                                        <Button onClick={loadMoreMessages} sx={{ marginBottom: "10px", color: "#00000", "&:hover": {background: "transparent"}}}>
                                            Load More
                                        </Button>
                                </Box>
                                )}

                                {Object.entries(sortedCombinedGroups).map(([dateLabel, items]) => (
                                    <React.Fragment key={dateLabel}>
                                        <Typography
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#3C3C4399",
                                            }}
                                        >
                                            {dateLabel}
                                        </Typography>
                                        {items.map((item, index) => {
                                            console.log('Rendering item:', item); // Debug log
                                             
                    
                                            
                                            const userHasReacted = item.reactions?.some(
                                                (reaction) => reaction.user_id === authUser.staff_code
                                            );
                                            
                                             const userHasNotReacted = item.reactions?.some(
                                                (reaction) => reaction.user_id !== authUser.staff_code
                                            );


                                            const reactionType = userHasReacted
                                            ? item.reactions?.find((reaction) => reaction.user_id === authUser.staff_code)?.reaction_type
                                            : null;
                                           
                                            const otherReaction = (userHasNotReacted && chat.isGroupChat === false)
                                            ? item.reactions?.find((reaction) => reaction.user_id !== authUser.staff_code)?.reaction_type
                                            : null;


                                            console.log('reactionType', reactionType)
                                            console.log('otherReaction', otherReaction)
                                            console.log('userHasNotReacted', userHasNotReacted)
                                    
                                            
                    
                    
                                                if (item.type === "message") {
                                                    const api = import.meta.env.VITE_API_URL;
                                                    const isLatestMessage = index === visibleMessageList.length - 1;
                                                    const isSendTextVisible = isLatestMessage || clickedMessages.includes(item.id);
                
                                                    messageRefs.current[item.id] = messageRefs.current[item.id] || React.createRef();
                                                    console.log("MessageSender", item);
                                                    return (
                                                        !JSON.parse(item.deletedBy || "[]").includes(authUser.staff_code) && (
                                                            <Box 
                                        key={item.id || `message-${index}`}
                                        ref={messageRefs.current[item.id]}
                                        data-id={item.id} // Attach the message ID for easy access
                                        className="message-item" // Add this class for querying in IntersectionObserver
                                        sx={{ 
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: item.sender_id === authUser.staff_code ? "flex-end" : (item.media_type === "leave" || item.media_type === "join" ) ? "center" : "flex-start",  // Align left or right
                                            marginTop: "40px", 
                                            marginRight: item.sender_id === authUser.staff_code ? "15px" : "10px",
                                            paddingLeft: item.media_type === "leave" ? "5px" : "24px",
                                            paddingRight: item.media_type === "leave" ? "5px" : "24px",
                                        }}
                                        
                                    >   
                                        { (hoveredMessageId === item.id) && (item.sender_id === authUser.staff_code) && (item.media_type !== "leave" && item.media_type !== "join") && (
                                            <>
                                                <IconButton
                                                    onClick={(event) => handleMenuClick(event, item.id, item)}   
                                                    sx={{
                                                        height: "100%",
                                                        "&:hover": {
                                                            background: "transparent"
                                                        }
                                                    }}                                
                                                >
                                                    <MoreHorizIcon />
                                                </IconButton>

                                                
                                            </>
                                        )}

                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                
                                                <Box 
                                                    sx={{
                                                        marginLeft: item.sender_id === authUser.staff_code ? "auto" : "10px",  // Align right or left
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: item.sender_id === authUser.staff_code ? "flex-end" : "flex-start",
                                                    }}
                                                >
                                                    
                                                    {item.originalMessage && (
                                                        <Box
                                                            sx={{
                                                                padding: "6px 12px",
                                                                backgroundColor: "#90caf9",
                                                                borderRadius: "8px 8px 0 0",
                                                                borderLeft: "4px solid #0288d1",
                                                                width: "fit-content",
                                                                maxWidth: "300px",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                alignItems: "flex-start",
                                                                fontSize: "14px",
                                                                color: "#424242",
                                                                marginBottom: "2px",
                                                            }}
                                                            onClick={() => handleScrollToMessage(item.originalMessage.id)}
                                                        >
                                                            
                                                            {item.originalMessage?.media_type === "image" ? (
                                                            <Box>
                                                                <Typography variant="caption" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                                                                    {item.originalMessage.sender?.userfullname || 'Unknown'} {/* Sender's name */}
                                                                </Typography>
                                                                <Box>
                                                                    <img
                                                                        src={`${api}/${item.originalMessage?.media_url}`}
                                                                        alt="Image"
                                                                        width={20}
                                                                        height={20}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                            ) : item.originalMessage?.media_type === "gif" ? (
                                                                <Box>
                                                                    <Typography variant="caption" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                                                                        {item.originalMessage.sender?.userfullname || 'Unknown'} {/* Sender's name */}
                                                                    </Typography>
                                                                    <Box>
                                                                        <img
                                                                            src={item.originalMessage?.media_url}
                                                                            alt="Gif"
                                                                            width={20}
                                                                            height={20}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            ) : item.originalMessage?.media_type === "file" ? (
                                                                <Box>
                                                                    <Typography>File Attachment</Typography>
                                                                </Box>
                                                            ) : (
                                                                <Box>
                                                                    <Typography variant="caption" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                                                                        {item.originalMessage.sender?.userfullname || 'Unknown'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {item.originalMessage?.text_content}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    )}
                                                    {/* <Typography 
                                                        sx={{ 
                                                            paddingLeft: message.sender_id !== authUser.id ? "10px" : "1px", 
                                                            paddingRight: message.sender_id === authUser.id ? "20px" : "1px",
                                                            fontSize: "20px",
                                                        }}
                                                    >
                                                        {message.sender?.username || 'Customer Support'} , 
                                                        
                                                    </Typography> */}
                                                    {item.edited === true && (
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                // display: "flex", 
                                                                // justifyContent: "flex-start", 
                                                                marginTop: "4px",
                                                                fontSize: "12px",
                                                                fontWeight: "400",
                                                                color: "#8E8E93",
                                                            }}>
                                                            Edited
                                                        </Typography>
                                                    )}

                                                    {item.forwarded_from && (
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                // display: "flex", 
                                                                // justifyContent: "flex-start", 
                                                                marginTop: "4px",
                                                                fontSize: "12px",
                                                                fontWeight: "400",
                                                                color: "#8E8E93",
                                                            }}>
                                                            Forwarded
                                                        </Typography>
                                                    )}

                                                        {(chat.isGroupChat === true && item.sender_id !== authUser.staff_code && item.media_type !== "leave" && item.media_type !== "join") && (
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "12px",
                                                                    color: "#808080",
                                                                }}
                                                            >
                                                                {item.sender?.userfullname}
                                                            </Typography>
                                                        )}

                                                    <Box 
                                                        onMouseEnter={() => handleMouseEnter(item.id)}
                                                        onMouseLeave={handleMouseLeave}
                                                        onClick={() => !isLatestMessage && handleToggleSendText(item.id)}

                                                        sx={{
                                                             position: "relative",
                                                            paddingLeft: isMobileOrTablet ? "10px" : (item.media_type === "leave" || item.media_type === "join") ? "10px" : "24px",
                                                            paddingRight: isMobileOrTablet ? "10px" : (item.media_type === "leave" || item.media_type === "join") ? "10px" : "24px",
                                                            paddingTop: "10px",
                                                            paddingBottom: "10px",
                                                            background: item.sender_id === authUser.staff_code ? "#DEF2FF" : (item.media_type === "leave" || item.media_type === "join") ? "#a6a6a6" : "#78788014",
                                                            color: (item.media_type === "leave" || item.media_type === "join") ? "#fff" : "#000",
                                                            borderRadius: (item.media_type === "leave" || item.media_type === "join") ? "15px" : "8px",
                                                            border: highlightedMessageId === item.id ? "2px solid #000" : "none",
                                                          

                                                          
                                                        }}

 
                                                    >   
                                                        
                                                        {item.media_url && item.media_type === 'gif' ? (
                                                                <img
                                                                    src={item.media_url}
                                                                    alt="GIF"
                                                                    style={{
                                                                        width: '300px',
                                                                        height: '300px',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                />

                                                            ) : item.media_type === 'image' ? (
                                                                <img
                                                                key={item.id}
                                                                src={`${api}/${item.media_url}`}
                                                                alt="Image"
                                                                onClick={() => openFullscreen(`${api}/${item.media_url}`)}
                                                                style={{
                                                                    width: '300px',
                                                                    height: isMobileOrTablet ? "120px" : '200px',
                                                                    maxWidth: '100%',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            />
                                                            ) : item.media_type === 'file' ? (
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        backgroundColor: '#f0f0f0',
                                                                        borderRadius: '8px',
                                                                        padding: '8px',
                                                                        width: isMobileOrTablet ? '210px' : "100%",
                                                                        maxWidth: '100%',
                                                                        // border: "1px solid",
                                                                    }}
                                                                >
                                                                    <InsertDriveFileIcon sx={{ fontSize: '30px', color: '#3f51b5' }} />
                                                                    <Box>
                                                                        <Typography 
                                                                            variant="body2" 
                                                                            sx={{ 
                                                                                width: isMobileOrTablet ? "80px" : "100%",
                                                                                overflow: isMobileOrTablet && "hidden",
                                                                                whiteSpace: isMobileOrTablet && "nowrap",
                                                                                textOverflow: isMobileOrTablet && "ellipsis", 

                                                                            }}
                                                                        >
                                                                            {item.media_url.split('_').slice(1).join('_')}
                                                                        </Typography>
                                                                       
                                                                    </Box>
                                                                    {!downloadedMessages.includes(item.id) && (
                                                                        <a
                                                                            href={`${api}/${item.media_url}`}
                                                                            download={item.media_url.split('/').pop() || "file"}
                                                                            style={{ marginLeft: 'auto', textDecoration: 'none' }}
                                                                            onClick={() => {
                                                                                const updatedDownloads = [...downloadedMessages, item.id];
                                                                                setDownloadedMessages(updatedDownloads);
                                                                                localStorage.setItem(downloadKey, JSON.stringify(updatedDownloads));
                                                                            }}
                                                                        >
                                                                            <IconButton>
                                                                                <FileDownloadIcon />
                                                                            </IconButton>
                                                                        </a>
                                                                    )}
                                                                </Box>
                                                            ) : item.text_content !== null ? (
                                                                <Typography
                                                                    variant="body1"
                                                                    sx={{
                                                                        wordBreak: 'break-word', // Ensures that the text breaks at appropriate places
                                                                        maxWidth: '100%', // Let it take full width of the container
                                                                        '@media (max-width: 600px)': {
                                                                        maxWidth: '200px', // For mobile devices, break at 200px
                                                                        },
                                                                        '@media (min-width: 601px)': {
                                                                        maxWidth: '300px', // For desktop, break at 300px
                                                                        },
                                                                    }}
                                                                    >
                                                                    {item.text_content}
                                                                </Typography>
                                                            ) : (
                                                                <Typography variant="body1" sx={{ color: "#8E8E93" }}>{item.deletedByUserId === authUser.staff_code ? 'You deleted a message' : `${item.deletedByUser.userfullname} deleted a message`}</Typography>
                                                            )}
                                                            {(item.media_type !== "leave" && item.media_type !== "join") && (
                                                                <Typography
                                                                sx={{
                                                                    marginTop: "4px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "400",
                                                                    color: "#3C3C4399",
                                                                }}
                                                            >
                                                                {formatTime(item.createdAt)}
                                                            </Typography>
                                                            )}

{otherReaction && (
    <Box
      sx={{
        position: "absolute",
        bottom: "-10px", // Adjust position to overlap bottom-right
        right: "5px", // Adjust position to overlap bottom-right
        backgroundColor: "#fff", // Optional: Background for the reaction icon
        borderRadius: "50%", // Optional: Circular reaction icon
        padding: "2px", // Optional: Padding for the reaction icon
        boxShadow: "0px 0px 5px rgba(0,0,0,0.2)", // Optional: Add shadow
      }}
    >
      {reactionIcons[otherReaction]} {/* Show reaction icon */}
    </Box>
  )}

                                                            {fullscreenImage && (
                                                                            <div
                                                                                onClick={closeFullscreen}
                                                                                style={{
                                                                                    position: 'fixed',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    zIndex: 1500, // Ensures the overlay is above other content
                                                                                    cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={fullscreenImage}
                                                                                    alt="Full-size"
                                                                                    style={{
                                                                                        maxWidth: '90%',
                                                                                        maxHeight: '90%',
                                                                                        borderRadius: '8px',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                            )}
                                                            
                                                    </Box>

                                                    {((item.media_type !== "leave" && item.media_type !== "join") && isSendTextVisible) && (
    <Typography 
        variant="caption" 
        sx={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            marginTop: "4px",
            fontSize: "12px",
            fontWeight: "400",
            color: "#8E8E93",
        }}
    >
        {chat.isGroupChat 
            ? (
                item.viewedBy?.length > 0 && (
                    <Box sx={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {chat.participants
    .filter(participant => 
        item.viewedBy.includes(participant.employeeId) && participant.employeeId !== item.sender_id
    )
    .map(viewer => (
        <Box 
            key={viewer.employeeId} 
            sx={{ display: "flex", alignItems: "center", gap: "4px", flexDirection: "column" }}
        >
            <Avatar 
                src={`${api}/${viewer.photo}`} 
                alt={viewer.userfullname[0]} 
                sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption" sx={{ fontSize: "12px" }}>
                {viewer.userfullname.split(" ")[0]}, {/* Display only the first word */}
            </Typography>
        </Box>
    ))
}
                    </Box>
                )
            )
            : (
                recipient && (
                    item.sender_id === authUser.staff_code && (
                        item.viewedBy?.includes(recipient.employeeId) 
                            ? "Seen"
                            : "Sent"
                    )
                )
            )
        }
    </Typography>
)}
                                                    
                                                </Box>
                                                
                                            </Box>
                                        
                                        </Box>

                                       
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                { (item.media_type !== "leave" && item.media_type !== "join") && (
                                                    <Box>

                                                    <IconButton
                                                        sx={{
                                                            "&:hover": {
                                                                background: "transparent",
                                                            }
                                                        }}
                                                        onClick={(event) => handleOpenReactionPicker(event, item)} // Pass item here
                                                    >
                                                         
                                                         {reactionType ? (
                                                                reactionIcons[reactionType]
                                                            ) : (
                                                                <EmojiEmotionsOutlinedIcon />
                                                        )}
                                                        {chat.isGroupChat === true && (
                                                             <Typography> ({item.reactions?.length})</Typography>
                                                        )}
                                                    </IconButton>
    
                                                    <Popover
                    open={Boolean(anchorER)}
                    anchorEl={anchorER}
                    onClose={handleCloseReactionPicker}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    {/* Use Box for layout without Grid */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',  // Arrange icons in a row
                            gap: 1,  // Space between icons
                            padding: 1,
                        }}
                    >
                        {['like', 'love', 'haha', 'sad', 'angry'].map((reaction) => {
                           
                           console.log("reaction1", reaction)
                           console.log("reaction2", reactionType)
    
                           
                           return (
                            <IconButton
                                key={reaction}
                                sx={{
                                    borderRadius: '50%',
                                    background: userReaction === reaction ? '#0288d1' : 'transparent', // Highlight selected reaction
                                    "&:hover": {
                                        background: "#f0f0f0",
                                    },
                                }}
                                onClick={() =>
                                    userReaction === reaction
                                        ? handleRemoveReaction() // Remove reaction if the same
                                        : handleReactionSelect(reaction) // Add or update reaction
                                }
                            >
                                {reactionIcons[reaction]}
                            </IconButton>
                           )
                                                    })}
                    </Box>
                                                     </Popover>
                                                    </Box>
                                                )}
                                                
                                                { (hoveredMessageId === item.id) && (item.sender_id !== authUser.staff_code) && (item.media_type !== "leave" && item.media_type !== "join") && (
                                                <IconButton
                                                    onClick={(event) => handleMenuClick(event, item.id, item)} 
                                                    sx={{
                                                        height: "100%",
                                                        "&:hover": {
                                                            background: "transparent"
                                                        }
                                                    }}                                  
                                                >
                                                    <MoreHorizIcon />
                                                </IconButton>
                                                )}
                                            </Box>

                                            <Menu 
                                                    anchorEl={anchorElS1} 
                                                    open={Boolean(anchorElS1)} 
                                                    onClose={handleMenuClose}
                                                    anchorOrigin={{
                                                        vertical: 'bottom',  // Align to the top
                                                        horizontal: 'center',
                                                    }}
                                                    transformOrigin={{
                                                        vertical: 'top', 
                                                        horizontal: 'center',
                                                    }}
                                                    // TransitionComponent={motion.div}
                                                    // transition={{ type: "spring", damping: 15, stiffness: 200 }}
                                                    slotProps={{
                                                        paper: {
                                                            // component: motion.div,
                                                            // initial: { opacity: 0, y: -10 },
                                                            // animate: { opacity: 1, y: 0 },
                                                            // exit: { opacity: 0, y: -10 },
                                                            // transition: { type: "spring", damping: 15, stiffness: 150 },
                                                            sx: {
                                                                width:'173px',
                                                                padding: "8px",
                                                                borderRadius: '8px',
                                                                backgroundColor: "#ffffff",
                                                                color: "#000000",
                                                                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)"
                                                            },
                                                        },
                                                    }}
                                                >   
                                                    
                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            borderBottom: "1px solid #E5E5EA",
                                                            
                                                        }}

                                                    >
                                                        <MenuItem
                                                            onClick={() => {
                                                                    // handleMenuClose();
                                                                    handleOpenForwardMessageDrawer();
                                                                }
                                                            }
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height:"21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#121660"
                                                                }}
                                                            >
                                                                Forward
                                                            </Typography>

                                                            <IconButton>
                                                                <ReplyIcon sx={{ fontSize: "20px" }}/>
                                                            </IconButton>
                                                        </MenuItem>
                                                        
                                                        {(selectedMessage?.text_content !== null && selectedMessage?.sender_id === authUser.staff_code) && (
                                                            <MenuItem
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height:"21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            onClick={() => {
                                                                handleEdit(selectedMessage)
                                                                handleMenuClose()
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#121660"
                                                                }}
                                                            >
                                                                Edit text
                                                            </Typography>

                                                            <IconButton>
                                                                <EditIcon sx={{ fontSize: "20px" }}/>
                                                            </IconButton>
                                                        </MenuItem>
                                                        )}

                                                        <MenuItem
                                                            onClick={() => {
                                                                handleReply(selectedMessage)
                                                                handleMenuClose();
                                                            }}
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height: "21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            // onClick={() => {handleDeleteMessage(selectedMessageId)}}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#121660"
                                                                }}
                                                            >
                                                                Reply
                                                            </Typography>

                                                            <IconButton>
                                                                <ReplyIcon sx={{ fontSize: "20px" }}/>
                                                            </IconButton>
                                                        </MenuItem>
                                                        <MenuItem
                                                            onClick={() => {
                                                                    // handleMenuClose();
                                                                    handleOpenReactionDrawer();
                                                                }
                                                            }
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height:"21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#121660"
                                                                }}
                                                            >
                                                                Reacts
                                                            </Typography>

                                                            <IconButton>
                                                                <EmojiEmotionsOutlinedIcon sx={{ fontSize: "20px" }}/>
                                                            </IconButton>
                                                        </MenuItem>

                                                        <MenuItem
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height:  "21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom:  "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            // onClick={() => {handleDeleteMessage(selectedMessageId)}}
                                                            onClick={() => {
                                                                handleCopyMessage(selectedMessage)
                                                                handleMenuClose()
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#121660"
                                                                }}
                                                            >
                                                                Copy
                                                            </Typography>

                                                            <IconButton>
                                                                <ContentCopyIcon sx={{ fontSize: "20px" }}/>
                                                            </IconButton>
                                                        </MenuItem>

                                                        <MenuItem
                                                            sx={{
                                                                // width: "173px",
                                                                height: "21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom:  "12px",
                                                                padding: "0",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                // marginBottom: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            onClick={() => {
                                                                handlePinMessage(selectedMessageId)
                                                                handleMenuClose()
                                                            
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#121660"
                                                                }}
                                                            >
                                                                Pin
                                                            </Typography>

                                                            

                                                            <IconButton>
                                                                <PushPinIcon sx={{ fontSize: "20px" }}/>
                                                            </IconButton>
                                                        </MenuItem>

                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            
                                                            
                                                        }}

                                                    >
                                                        <MenuItem
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height: "21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom: "12px",
                                                                marginTop: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            onClick={() => {
                                                                handleDeleteMessageForSelf(selectedMessageId)
                                                                handleMenuClose()
                                                            
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#FF3B30"
                                                                }}
                                                            >
                                                                Delete for myself
                                                            </Typography>

                                                            <IconButton>
                                                                <DeleteOutlineIcon sx={{ color: "#FF3B30", fontSize: "20px"}}/>
                                                            </IconButton>
                                                        </MenuItem>


                                                        {selectedMessage?.sender_id === authUser.staff_code && (
                                                            <MenuItem
                                                            sx={{
                                                                // width: "173px",
                                                                padding: "0",
                                                                
                                                                height:  "21px",
                                                                // paddingLeft: "12px",
                                                                // paddingRight: "12px",
                                                                marginBottom:  "12px",
                                                                marginTop: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                            onClick={() => {
                                                                handleDeleteMessageOpen(selectedMessageId)
                                                                // handleMenuClose();
                                                                
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "400",
                                                                    color: "#FF3B30"
                                                                }}
                                                            >
                                                                Delete for all
                                                            </Typography>

                                                            <IconButton>
                                                                <DeleteIcon sx={{ color: "#FF3B30", fontSize: "20px"}}/>
                                                            </IconButton>
                                                        </MenuItem>
                                                        )}

                                                        <ForwardMessageDrawer openForwardMessageDrawer={forwardMessageDrawer} closeForwardMessageDrawer={handleCloseForwardMessageDrawer} selectedMessageId={selectedMessageId} handleMenuClose={handleMenuClose}/>
                                                        <ReactionsDrawer openReactionDrawer={reactionDrawer} closeReactionDrawer={handleCloseReactionDrawer} selectedMessageId={selectedMessageId} handleMenuClose={handleMenuClose}/>

                                                        {deleteMessageOpen && (
                                                            <Dialog open={deleteMessageOpen} onClose={handleDeleteMessageClose}>
                                                            <DialogTitle>{"Are you sure you want to delete this message?"}</DialogTitle>
                                                                <DialogActions>
                                                                    <Button onClick={handleDeleteMessageClose} color="primary">
                                                                        Cancel
                                                                    </Button>
                                                                    <Button onClick={handleDeleteMessage}  color="secondary" autoFocus>
                                                                        Yes
                                                                    </Button>
                                                                </DialogActions>
                                                        </Dialog>
                                                        )}
                                                    </Box>

                                                                                            
                                            </Menu>
                                    </Box>
                                                        )
                                                    );
                                                } else if (item.type === "left") {
                                                    return (
                                                        
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                paddingTop: "10px",
                                                            }}

                                                        >
                                                            
                                                        </Box>
                                                    );
                                                } else if (item.type === "join") {
                                                    return (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                paddingTop: "10px",
                                                            }}

                                                        >
                                                            
                                                        </Box>
                                                    )
                                                }
                                                return null;
                                            })}
                                        </React.Fragment>
                                ))}

                                
                                

                        </Box>
                    
                        { ( (isAuthUserInChat || authUser.id === chat?.ownerId) || currentUserId ) && (
                            <TextEditor 
                                repliedMessage={repliedMessage}
                                onCancelReply={handleCancelReply}
                                textContentRef={textContentRef}
                                sendMessage={sendMessage}
                                setMediaType={setMediaType}
                                setMediaUrl={setMediaUrl}
                                mediaType={mediaType}
                                mediaUrl={mediaUrl}
                                closePicker={closePicker}
                                setSelectedFile={setSelectedFile}
                                selectedFile={selectedFile}
                                setMediaGif={setMediaGif}
                                setFileName={setFileName}
                                copiedToClipboard={copiedToClipboard}
                                setCopiedToClipboard={setCopiedToClipboard}
                                editedMessage={editedMessage}
                                onCancelEdit={handleCancelEdit}
                                editMessage={editMessage}
                                isChatInfoOpen={isChatInfoOpen}
                                isSharedFileOpen={isSharedFileOpen}
                                isMediaOpen={isMediaOpen}
                                isAddParticipantOpen={isAddParticipantOpen}
                                isAddGroupOpen={isAddGroupOpen}
                                chat={chat}
                                recipient={recipient}
                                currentUserId={currentUserId} 
                                setCurrentChatId={setCurrentChatId}
                                currentChatId={currentChatId}
                                setCurrentUserId={setCurrentUserId}
                                fetchChat={fetchChat}
                                setRepliedMessage={setRepliedMessage}
                                user={user}

                            />
                        )}
                    </Box>

                    {isChatInfoOpen && (
                        <Box
                            sx={{
                                width: isMobileOrTablet ? "100%"  : "350px",
                                paddingTop: "10px",
                                paddingBottom: "120px",
                                paddingRight: "20px",
                                paddingLeft: "20px",
                                borderLeft: "1px solid #E5E5EA",
                                zIndex: 1010, // Higher z-index value
                                // height: "100vh",
                                // overflowY: "auto",
                                // border: "1px solid",
                                // height: "100vh",
                            }}
                        >
                            <Box
                                sx={{
                                    paddingBottom: "16px",
                                    borderBottom: "1px solid #E5E5EA"
                                }}
                            >
                                <Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        { (chat && chat.isGroupChat === false) && (
                                recipient.active === true ? (
                                    <Box
                                    sx={{
                                        position: "relative",
                                        display: "inline-block",
                                        // marginTop: "14px",
            
                                        // border: "1px solid",
                                    }}
                                >
                                    <Avatar
                                        src={`${api}/${recipient.photo}`}

                                        onClick={handleOpenProfileDrawer}
                                        sx={{
                                            width: isMobileOrTablet ? "50px" : "64px",
                                            height: isMobileOrTablet ? "50px" : "64px",
                                            background: "#D9D9D9",
                                        }}
                                    >
                                        
                                    </Avatar>
        
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: "4px",
                                            right: "-2px",
                                            width: "14px",
                                            height: "14px",
                                            backgroundColor: "#34C759",
                                            borderRadius: "50%",
                                            border: "1px solid #fff",
                                        }}
                                    >
        
                                    </Box>

                                    <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={recipient.employeeId} />
        
                                
                                    </Box>
                                ) : (
                                    <>
                                        <Avatar
                                            src={`${api}/${recipient.photo}`}

                                            onClick={handleOpenProfileDrawer}

                                            sx={{
                                                width: "64px",
                                                height: "64px",
                                                background: "#D9D9D9",
                                            }}
                                        >
                                            
                                        </Avatar>
                                        <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={recipient.employeeId} />
                                    </>
                                        ))}
                                        
                                        {chat && chat.isGroupChat && (
                                    chat.photo ? (
                                        // Display chat photo if available
                                        <>
                                            <Avatar
                                                src={`${api}/${chat.photo}`}
                                                onClick={() => openFullscreen(`${api}/${chat.photo}`)}
                                                sx={{
                                                    marginTop: "8px",
                                                    width: "64px",
                                                    height: "64px",
                                                    background: "#D9D9D9",
                                                }}
                                            />

                                            
                                            {fullscreenImage && (
                                                <div
                                                                                onClick={closeFullscreen}
                                                                                style={{
                                                                                    position: 'fixed',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    zIndex: 1500, // Ensures the overlay is above other content
                                                                                    cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={fullscreenImage}
                                                                                    alt="Full-size"
                                                                                    style={{
                                                                                        maxWidth: '90%',
                                                                                        maxHeight: '90%',
                                                                                        borderRadius: '8px',
                                                                                    }}
                                                                                />
                                                </div>
                                            )}
                                            
                                        </>
                                    ) : (
                                        // Display participants' user_photos or fallback merged into one Avatar
                                        <Avatar
                                            onClick={triggerFileInput}
                                            sx={{
                                                marginTop: "8px",
                                                width: "64px",
                                                height: "64px",
                                                position: 'relative',
                                                background: "#D9D9D9",
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    position: 'relative',
                                                }}
                                            >
                                                {chat.participants.slice(0, 4).map((participant, index, array) => (
                                                    participant.photo ? (
                                                        <Box
                                                            key={index}
                                                            component="img"
                                                            src={`${api}/${participant.photo}`}
                                                            sx={{
                                                                position: 'absolute',
                                                                width: array.length === 1 ? '100%' :
                                                                    array.length === 2 ? '50%' : '50%',
                                                                height: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '100%' : '50%',
                                                                objectFit: 'cover',
                                                                borderRadius: '50%',
                                                                top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                border: '1px solid #fff', // Border for better visuals
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                position: 'absolute',
                                                                width: array.length === 1 ? '100%' :
                                                                    array.length === 2 ? '50%' : '50%',
                                                                height: array.length === 1 ? '100%' :
                                                                    array.length === 2 ? '100%' : '50%',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                background: '#BDBDBD',
                                                                color: '#fff',
                                                                fontSize: array.length === 1 ? '14px' : '10px',
                                                                fontWeight: 'bold',
                                                                borderRadius: '50%',
                                                                top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                border: '1px solid #fff', // Border for better visuals
                                                            }}
                                                        >
                                                            {participant.userfullname.charAt(0).toUpperCase()}
                                                        </Box>
                                                    )
                                                ))}
                                            </Box>
                                                <input 
                                                ref={fileInputRef}
                                                type="file" 
                                                style={{ display: 'none'}}
                                                onChange={handleFileChange}
                                    
                                            />
                                        </Avatar>
                                    )
                                        )}
                                        
                                    </Box>
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: "16px",
                                                fontWeight: "500",
                                                color: "#000000",
                                                textAlign: "center",
                                            }}
                                        
                                        >
                                            {chat?.name}
                                        </Typography>
                                        {chat?.isGroupChat === false && (
                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        color: "#8E8E93",
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {recipient.position},
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        color: "#8E8E93",
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {recipient.departmentName}
                                                </Typography>
                                            </Box>
            
                                        )}
                                    </Box>
                                </Box>
            
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "50px",
                                        marginTop: "24px",
                                        justifyContent: isMobileOrTablet && "center",
                                    }}
                                
                                >
                                    {mutedChat ? (
                                        <Box
                                        sx={{
                                            marginLeft: "25px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",

                                        }}
                                    >
                                        <Box
                                            sx={{
                                                // display: "flex",
                                                // justifyContent: "center",
                                                
                                            }}
                                        >
                                            <IconButton
                                                onClick={handleUnMuteChat}
                                                sx={{
                                                    background: "#F2F2F7",
                                                }}
                                            >
                                                <VolumeOffIcon />
                                            </IconButton>
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#8E8E93",
                                                textAlign: "center",
                                                
                                            }}
                                        >
                                            UnMute this chat
                                        </Typography>
                                    </Box>
                                    ) : (
                                        <Box
                                        sx={{
                                            marginLeft: "25px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box
                                           
                                        >
                                            <IconButton
                                                onClick={handleMuteChat}
                                                sx={{
                                                    background: "#F2F2F7",
                                                }}
                                            >
                                                <VolumeUpIcon />
                                            </IconButton>
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#8E8E93",
                                                textAlign: "center",
                                            }}
                                        >
                                            Mute this chat
                                        </Typography>
                                    </Box>
                                    )}
            
                                    <Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {chat.isGroupChat === true ? (
                                                <IconButton
                                                    onClick={handleOpenAddParticipantDrawer}
                                                    sx={{
                                                        background: "#F2F2F7",
                                                    }}
                                                >
                                                    <GroupAddIcon />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    onClick={handleOpenAddGroupDrawer}
                                                    sx={{
                                                        background: "#F2F2F7",
                                                    }}
                                                >
                                                    <GroupAddIcon />
                                                </IconButton>
                                            )}
                                        </Box>
                                        <Typography
                                           
                                            sx={{
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#8E8E93",
                                                textAlign: "center",                  
                                            }}
                                        >
                                            {chat.isGroupChat === true ? "Add participant" : "Add to group"}
                                        </Typography>
                                    </Box>


                                </Box>
                            </Box>

                            {chat?.isGroupChat === true && (
                                <Box
                                    sx={{
                                        marginTop: "32px",

                                    }}
                                >
                                    <Box
                                        sx={{
                                            marginTop: "16px",
                                        }}
                                    >
                                        <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#121660"
                                            }}
                                        >
                                            Participants
                                        </Typography>
                        
                                    </Box>
            
                                    <Box
                                        sx={{
                                            marginTop: "16px",
                                            maxHeight: "600px",
                                            width: "100%",
                                            overflowY: "auto",
                                            paddingBottom: "30px",
                                            // paddingBottom: "10px",
                                            "&::-webkit-scrollbar": {
                                                width: "8px", // Set scrollbar width
                                                height: "2px",
                                             },
                                             "&::-webkit-scrollbar-thumb": {
                                                backgroundColor: "#888", // Scrollbar thumb color
                                                borderRadius: "4px", // Round scrollbar edges
                                                height: "2px",
                                             },
                                             "&::-webkit-scrollbar-thumb:hover": {
                                                backgroundColor: "#555", // Darker on hover
                                             },
                                             "&::-webkit-scrollbar-track": {
                                                background: "#f1f1f1", // Track color behind the thumb
                                                borderRadius: "4px",
                                             },
                                        }}
                                    >
                                        {chat.participants
                                        ?.sort((a, b) => {
                                            const isAOwnerAdmin = ownerAdminIds.has(a.employeeId) ? 0 : 1;
                                            const isBOwnerAdmin = ownerAdminIds.has(b.employeeId) ? 0 : 1;
                                            return isAOwnerAdmin - isBOwnerAdmin;
                                        })
                                        .map((participant, index) => (
                                            <Box
                                            key={participant.employeeId}
                                            sx={{
                                                display: "flex",
                                                paddingRight: "4px",
                                                paddingLeft: "4px",
                                                alignItems: "center",
                                                gap: "8px",
                                                width: isMobileOrTablet ? "100%" : "252px",
                                                marginBottom: index === chat.participants.length - 1 ? "0px" : "16px", // No margin on last item
                                            }}
                                            onContextMenu={(event) => handleRightClick(event, participant.employeeId)} // Right-click event
                                            >
                                                <Avatar
                                                    src={`${api}/${participant.photo}`}

                                                    sx={{
                                                    width: "50px",
                                                    height: "50px",
                                                    background: "#D9D9D9",
                                                    }}
                                                />
                                                <Box sx={{ width: "100%", paddingLeft: "20px" }}>
                                                    <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                    }}
                                                    >
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <Typography
                                                        sx={{
                                                            width: isMobileOrTablet ? "200px" : "100px",
                                                            fontSize: "16px",
                                                            fontWeight: "400",
                                                            color: "#000000",
                                                            overflow: "hidden",
                                                            whiteSpace: "nowrap",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                        >
                                                        {participant.userfullname}
                                                        
                                                        </Typography>
                                                        {ownerAdminIds.has(participant.employeeId) && (
                                                            <Typography
                                                            component="span"
                                                            sx={{
                                                                fontSize: "12px",
                                                                color: "#808080",
                                                                marginLeft: "8px",
                                                            }}
                                                            >
                                                            Admin
                                                            </Typography>
                                                        )}

                                                       
                                                    </Box>

                                                    

                                                    <Dialog open={dialogOpen} onClose={handleDialogClearClose}>
                                                        <DialogTitle>{"Are you sure you want to remove this participant?"}</DialogTitle>
                                                        <DialogActions>
                                                        <Button onClick={handleDialogClearClose} color="primary">
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={handleConfirmRemove} color="secondary" autoFocus>
                                                            Yes
                                                        </Button>
                                                        </DialogActions>
                                                    </Dialog>
                                                    </Box>
                                                    <Typography
                                                    sx={{
                                                        marginTop: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "400",
                                                        color: "#A8A8A8",
                                                    }}
                                                    >
                                                    {participant.position}, {participant.departmentName} department
                                                    </Typography>
                                                </Box>
                                                <Menu
                                                    open={contextMenu !== null}
                                                    onClose={handleClose}
                                                    anchorReference="anchorPosition"
                                                    anchorPosition={
                                                        contextMenu !== null
                                                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                                            : undefined
                                                    }
                                                    slotProps={{
                                                        paper: {
                                                            elevation: 0, // Remove shadow
                                                            sx: {
                                                                boxShadow: 'none', // No shadow
                                                                border: '1px solid #ddd', // Optional: cleaner look with border
                                                            },
                                                        },
                                                    }}
                                                >
                                                    {/* Show "Leave Chat" if the participant is the current user */}
                                                    {selectedParticipantId === authUser.staff_code && (
                                                        <MenuItem
                                                            onClick={() => {
                                                                handleClickLeaveOpen(selectedParticipantId);
                                                            }}
                                                        >
                                                            Leave Chat
                                                        </MenuItem>
                                                    )}

                                                    {/* Show "Remove Participant" if authUser is an admin and participant is not an admin */}
                                                    {selectedParticipantId !== authUser.staff_code &&
                                                        ownerAdminIds.has(authUser.staff_code) &&
                                                        !ownerAdminIds.has(selectedParticipantId) && [
                                                            <MenuItem
                                                                key="remove-participant"
                                                                onClick={() => {
                                                                    handleClickOpen(selectedParticipantId);
                                                                }}
                                                            >
                                                                Remove Participant
                                                            </MenuItem>,
                                                            <MenuItem
                                                                key="give-admin"
                                                                onClick={() => {
                                                                    handleGiveAdmin(selectedParticipantId);
                                                                }}
                                                            >
                                                                Give Admin
                                                            </MenuItem>,
                                                    ]}

                                                </Menu>

                                                <Dialog open={leaveDialogOpen} onClose={handleLeaveDialogClearClose}>
                                                        <DialogTitle>{"Are you sure you want to leave from this chat?"}</DialogTitle>
                                                        <DialogActions>
                                                        <Button onClick={handleLeaveDialogClearClose} color="primary">
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={handleLeaveChat} color="secondary" autoFocus>
                                                            Yes
                                                        </Button>
                                                        </DialogActions>
                                                </Dialog>


                                            </Box>
                                        ))}

                                    </Box>
                                    
                                    </Box>

                                    
                            
                                </Box>
                            )}

                        
                            {sharedMedias.length > 0 && (
                                <Box
                                    sx={{
                                        marginTop: "32px",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#121660"
                                            }}
                                        >
                                            Media
                                        </Typography>
                                        <Button
                                            onClick={() => {
                                                setIsMediaOpen(true);
                                                setIsChatInfoOpen(false);
                                                setIsSharedFileOpen(false);
                                                
                                            }}
                                            sx={{
                                                fontSize: "12px",
                                                fontWeight: "400",
                                                color: "#8E8E93",
                                                textTransform: "none",
                                                "&:hover": {
                                                    background: "transparent"
                                                }
                                            }}
                                        >
                                            See All
                                        </Button>
                                    </Box>
            
                                    <Box
                                        sx={{
                                            marginTop: "16px",
                                            height: "210px",
                                            // border: "1px solid",
                                        }}
                                    >
                                        {isMobileOrTablet ? (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    gap: "10%",
                                                }}
                                            >
                                                <img
                                                    style={{
                                                        width: "25%",
                                                        height: "100px",
                                                    }}
                                                    onClick={() => openFullscreen(`${api}/${sharedMedias[0]?.media_url}`)}
    
                                                    src={sharedMedias[0]?.media_type === "gif" ? sharedMedias[0]?.media_url : `${api}/${sharedMedias[0]?.media_url}`} 
                                                />
                                                <img
                                                    style={{
                                                        width: "25%",
                                                        height: "100px",
                                                    }}
                                                    onClick={() => openFullscreen(`${api}/${sharedMedias[1]?.media_url}`)}
    
                                                    src={sharedMedias[1]?.media_type === "gif" ? sharedMedias[1]?.media_url : `${api}/${sharedMedias[1]?.media_url}`} 
                                                />
                                                <img
                                                    style={{
                                                        width: "25%",
                                                        height: "100px",
                                                    }}
                                                    onClick={() => openFullscreen(`${api}/${sharedMedias[2]?.media_url}`)}
    
                                                    src={sharedMedias[2] ? (sharedMedias[2]?.media_type === "gif" ? sharedMedias[2]?.media_url : `${api}/${sharedMedias[2]?.media_url}`) : ""} 
                                                />

{fullscreenImage && (
                                                                            <div
                                                                                onClick={closeFullscreen}
                                                                                style={{
                                                                                    position: 'fixed',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    zIndex: 1500, // Ensures the overlay is above other content
                                                                                    cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={fullscreenImage}
                                                                                    alt="Full-size"
                                                                                    style={{
                                                                                        maxWidth: '90%',
                                                                                        maxHeight: '90%',
                                                                                        borderRadius: '8px',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                            )}
                                                
                                            </Box>
                                        ) : (
                                            sharedMedias.length === 1 ? (
                                                <Box
                                                    sx={{
                                                        width: "251px",
                                                        height: "100%",
                                                        // background: "#D9D9D9",
                                                    }}
                                                >
                                                    <img
                                                        style={{
                                                            width: "251px",
                                                            height: "210px",
                                                        }}     
                                                        onClick={() => openFullscreen(`${api}/${sharedMedias[0].media_url}`)}
    
                                                        src={sharedMedias[0].media_type === "gif" ? sharedMedias[0].media_url : `${api}/${sharedMedias[0].media_url}`} 
                                                    />
                                                        
                                                </Box>
                                            ) : sharedMedias.length === 2 ? (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: "10px",
                                                        // border: "1px solid",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            height: "100%",
                                                            // background: "#D9D9D9",
                                                        }}
                                                    >
                                                        
                                                    <img
                                                        style={{
                                                            width: "120px",
                                                            height: "210px",
                    
                                                        }}
                                                        onClick={() => openFullscreen(`${api}/${sharedMedias[0].media_url}`)}
    
                                                        src={sharedMedias[0].media_type === "gif" ? sharedMedias[0].media_url : `${api}/${sharedMedias[0].media_url}`} 
                                                    />
                                                    </Box>
                    
                                                    <Box
                                                        sx={{
                                                            width: "3px",
                                                            height: "210px",
                                                            background: "#D9D9D9",
                                                        }}
                                                    >
                    
                                                    </Box>
                    
                                                    <Box
                                                        sx={{
                                                            height: "100%",
                                                            // background: "#D9D9D9",
                                                        }}
                                                    >
                                                        
                                                    <img
                                                        style={{
                                                            width: "120px",
                                                            height: "210px",
                    
                                                        }}
                                                        onClick={() => openFullscreen(`${api}/${sharedMedias[1].media_url}`)}
    
                                                        src={sharedMedias[1].media_type === "gif" ? sharedMedias[1].media_url : `${api}/${sharedMedias[1].media_url}`} 
                                                    />
                                                    </Box>
                                                
                                                </Box>
                                            ) : (
                                                <Box>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: "10px",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: "150px",
                                                                height: "100px",
                                                                background: "#D9D9D9",
                                                            }}
                                                        >
                                                            
                                                    <img
                                                        style={{
                                                            width: "150px",
                                                            height: "100px",
                                                        }}
                                                        onClick={() => openFullscreen(`${api}/${sharedMedias[0].media_url}`)}
    
                                                        src={sharedMedias[0].media_type === "gif" ? sharedMedias[0].media_url : `${api}/${sharedMedias[0].media_url}`} 
                                                    />
                                            
                                                        </Box>
                    
                                                        <Box
                                                            sx={{
                                                                width: "3px",
                                                                height: "100px",
                                                                background: "#D9D9D9",
                                                            }}
                                                        >
                    
                                                        </Box>
                    
                                                        <Box>
                                                            
                                                            <img
                                                                style={{
                                                                    width: "80px",
                                                                    height: "100px",
                                                                }}
                                                                onClick={() => openFullscreen(`${api}/${sharedMedias[1].media_url}`)}
    
                                                                src={sharedMedias[1].media_type === "gif" ? sharedMedias[1].media_url : `${api}/${sharedMedias[1].media_url}`} 
                                                            />
                                                        </Box>
                                                
                                                    </Box>
                    
                                                    <Box>
                                                        
                                                        <img
                                                            style={{
                                                                width: "251px",
                                                                height: "100px",
                                                            }}
                                                            onClick={() => openFullscreen(`${api}/${sharedMedias[2].media_url}`)}
    
                                                            src={sharedMedias[2].media_type === "gif" ? sharedMedias[2].media_url : `${api}/${sharedMedias[2].media_url}`} 
                                                        />
                                                    </Box>
                                                </Box>
                                            )
                                        )}

                                    </Box>
            
                                
                                </Box>
                            )}
        
                            {sharedFiles.length > 0 && (
                                <Box
                                    sx={{
                                        marginTop: "24px",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#121660"
                                            }}
                                        >
                                            Shared Files
                                        </Typography>
                                        <Button
                                            onClick={() => {
                                                setIsSharedFileOpen(true);
                                                setIsChatInfoOpen(false);
                                                setIsMediaOpen(false);
                                            }}
                                            sx={{
                                                fontSize: "12px",
                                                fontWeight: "400",
                                                color: "#8E8E93",
                                                textTransform: "none",
                                                "&:hover": {
                                                    background: "transparent"
                                                }
                                            }}
                                        >
                                            See All
                                        </Button>
                                    </Box>
            
                                    <Box
                                        sx={{
                                            marginTop: "16px",
                                            height: "220px"
                                        }}
                                    >
                                        {sharedFiles.map(file => (
                                            <Box
                                                key={file.id}
                                                sx={{
                                                    display: "flex",
                                                    paddingRight: "4px",
                                                    paddingLeft: "4px",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    width: "252px",
                                                    marginBottom: "16px",
                                                    // border: "1px solid",
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: "32px",
                                                        height: "32px",
                                                        background: "#D9D9D9",
                                                    }}
                                                >
            
                                                </Avatar>
                                                <Box>
                                                    <Typography
                                                        sx={{
                                                            width: "200px",
                                                            fontSize: "16px",
                                                            fontWeight: "400",
                                                            color: "#000000",
                                                            overflow: "hidden",
                                                            whiteSpace: "nowrap",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                    >
                                                        {file.media_url}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            marginTop: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "400",
                                                            color: "#A8A8A8",
                                                        }}
                                                    >
                                                        {formatDate(file.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                
                                </Box>
                            )}

                            {chat?.isGroupChat && chat.participants?.some(
                                (participant) =>
                                    participant.id === userId && participant.ChatParticipants?.leftAt === null
                            ) && (
                                <Button onClick={() => handleLeaveChat(chat.id)}>
                                    <Typography>Leave Chat</Typography>
                                </Button>
                            )}





                            
                        </Box>
                    )}

                    {isSharedFileOpen && (
                        <Box
                            sx={{
                                width: isMobileOrTablet ? "100%" : "350px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                paddingRight: "24px",
                                paddingLeft: "24px",
                                borderLeft: "1px solid #E5E5EA",
                                
                                // height: "100vh",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "40px",
                                }}
                            >
                                <IconButton
                                    onClick={() => {
                                        setIsSharedFileOpen(false);
                                    }}
                                    sx={{
                                        "&:hover": {
                                            background: "transparent"
                                        }
                                    }}
                                >
                                    <ArrowBackIosIcon sx={{ color: "#121660" }}/>
                                </IconButton>
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#121660",
                                    }}
                                >
                                    Shared Files
                                </Typography>
                            </Box>
                            {Object.entries(groupedFiles).map(([dateLabel, files]) => (
                                <React.Fragment key={dateLabel}>
                                    <Typography
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            fontSize: "14px",
                                            fontWeight: "400",
                                            color: "#3C3C4399",
                                            marginBottom: "10px",
                                        }}    
                                    >
                                        {dateLabel}
                                    </Typography>
                                    {files.map((file, index) => {
                                        return (
                                            <Box
                                                key={file.id}
                                                sx={{
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    marginBottom: "10px",
                                                    
                                                    "&:hover": {
                                                        background: "#F7F7F7",
                                                    }
                                                }}
                                                onMouseEnter={() => handleMouseFileEnter(file.id)}
                                                onMouseLeave={handleMouseFileLeave}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        
                                                    }}
                                                >
                                                   <InsertDriveFileIcon  sx={{ fontSize: "32px" }}/>

                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                width: isMobileOrTablet ? "200px" : "135px",
                                                                fontSize: "16px",
                                                                fontWeight: "400",
                                                                color: "#000000",
                                                                overflow: "hidden",
                                                                whiteSpace: "nowrap",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {file.media_url}
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                fontSize: "12px",
                                                                fontWeight: "400",
                                                                color: "#A8A8A8",
                                                            }}
                                                        >
                                                            {formatDate(file.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                { hoveredFileId === file.id && (
                                                    <>
                                                        <IconButton
                                                            onClick={() => downloadFile(file)}
                                                        >
                                                            <FileDownloadIcon />
                                                        </IconButton>

                                                        
                                                    </>
                                                )}
                                                
                                            </Box>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </Box>
                    )}

                    {isMediaOpen && (
                        <Box
                            sx={{
                                width: isMobileOrTablet ? "100%" : "350px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                paddingRight: "24px",
                                paddingLeft: "24px",
                                borderLeft: "1px solid #E5E5EA",
                                
                                // height: "100vh",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "40px",
                                }}
                            >
                                <IconButton
                                    onClick={() => {
                                        setIsMediaOpen(false);
                                    }}
                                    sx={{
                                        "&:hover": {
                                            background: "transparent"
                                        }
                                    }}
                                >
                                    <ArrowBackIosIcon sx={{ color: "#121660" }}/>
                                </IconButton>
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#121660",
                                    }}
                                >
                                    Media
                                </Typography>
                            </Box>

                            
                                {Object.entries(groupedMedias).map(([dateLabel, medias]) => (
                                    <React.Fragment key={dateLabel}>
                                        <Typography
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                marginBottom: "15px",
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                color: "#3C3C4399",
                                            }}    
                                        >
                                            {dateLabel}
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                
                                                flexWrap: "wrap",
                                                gap: isMobileOrTablet && "20px"
                                                
                                            }}
                                        >
                                            {medias.length > 0 && medias.map(media => (
                                            <Box
                                                key={media.id}
                                            >
                                            
                                                <img

                                                    style={{
                                                        width: isMobileOrTablet ? "100px" : "110px",
                                                        height: isMobileOrTablet ? "50px" : "150px",
                                                        marginBottom: "10px",
                                                    }}
                                                    src={ media.media_type === "gif" ? media.media_url : `${api}/${media.media_url}`}
                                                    onClick={() => openFullscreen(`${api}/${media.media_url}`)}
                                                />
                                                
                                            </Box>
                                        ))}
                                        </Box>

                                    </React.Fragment>
                                ))}

                               



                                {fullscreenImage && (
                                                                            <div
                                                                                onClick={closeFullscreen}
                                                                                style={{
                                                                                    position: 'fixed',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    zIndex: 1500, // Ensures the overlay is above other content
                                                                                    cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={fullscreenImage}
                                                                                    alt="Full-size"
                                                                                    style={{
                                                                                        maxWidth: '90%',
                                                                                        maxHeight: '90%',
                                                                                        borderRadius: '8px',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                            )}
                                
                             </Box>
                           
                        
                    )}

                    { isAddParticipantOpen && (
                        <AddParticipantDrawer closeAddParticipantDrawer={handleCloseAddParticipantDrawer} chat={chat} newParticipants={newParticipants} setNewParticipants={setNewParticipants}/>
                    )}

                    {isAddGroupOpen && (
                        <AddGroupDrawer closeAddGroupDrawer={handleCloseAddGroupDrawer} user={recipient}/>
                    )}

                </Box>
            </Box>

            
            
        </Box>
    )
}