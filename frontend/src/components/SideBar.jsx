import {
    Box,
    IconButton,
    Typography,
    TextField,
    Avatar,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    Modal,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    Switch,
} from "@mui/material"

import {
    BorderColor as BorderColorIcon,
    DoneAll as DoneAllIcon,
    Check as CheckIcon,
    Logout as LogoutIcon,
    Circle as CircleIcon,
    Groups as GroupsIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
} from "@mui/icons-material";

import CompanyLogo from "../images/TrustLinkLogo.jpg";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUIState } from "../providers/UIStateProvider";

import Cookies from "js-cookie";


import { io } from 'socket.io-client';
import GroupChatDrawer from "./GroupChatDrawer";
import ProfileDrawer from "./ProfileDrawer";
import { useQuery } from '@tanstack/react-query';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { debounce } from 'lodash';
import {produce} from 'immer';
import UserList from "./UserList";

const avatarStyle = { width: "30px", height: "30px", background: "#D9D9D9", marginTop: "8px" };
const activeBadgeStyle = { position: "absolute", bottom: "8px", right: "-2px", width: "14px", height: "14px", backgroundColor: "#34C759", borderRadius: "50%", border: "1px solid #fff" };
const chatNameStyle = { width: "140px", fontSize: "15px", fontWeight: "400", color: "#000", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" };
const timeStyle = { width: "60px", fontSize: "15px", fontWeight: "400", color: "#3C3C4399" };
const messageStyle = { fontSize: "15px", fontWeight: "400", color: "#3C3C4399", width: "180px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" };
const iconStyle = { fontSize: "22px", color: "#3C3C4399" };

// Functions for Avatar Positioning
const getAvatarPositionStyle = (index, total) => ({
    position: "absolute",
    width: total === 1 ? "100%" : "50%",
    height: total === 1 ? "100%" : "50%",
    objectFit: "cover",
    borderRadius: "50%",
    top: total === 1 ? "0%" : index < 2 ? "0%" : "50%",
    left: total === 1 ? "0%" : index % 2 === 0 ? "0%" : "50%",
    border: "1px solid #fff",
});

const getInitialAvatarStyle = (index, total) => ({
    position: "absolute",
    width: total === 1 ? "100%" : "50%",
    height: total === 1 ? "100%" : "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#BDBDBD",
    color: "#fff",
    fontSize: total === 1 ? "14px" : "10px",
    fontWeight: "bold",
    borderRadius: "50%",
    top: total === 1 ? "0%" : index < 2 ? "0%" : "50%",
    left: total === 1 ? "0%" : index % 2 === 0 ? "0%" : "50%",
    border: "1px solid #fff",
});



export default function SideBar() {

     const { authUser, setAuthUser, socket } = useAuth();

    //  const [ users, setUsers ] = useState([]);
    
    
           const [ chats, setChats ] = useState([]);
    // const [ chatsOne, setChatsOne ] = useState([]);
  
    const [ departments, setDepartments ] = useState([]);
    const [ groupChatDrawerOpen, setGroupChatDrawerOpen ] = useState(false);
    const [ profileDrawerOpen, setProfileDrawerOpen ] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); 
    const [selectedChatId, setSelectedChatId] = useState(null);
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token')
    // const token = Cookies.get('auth_tokens')

    const [ mutedChat, setMutedChat ] = useState(false);
    // const api = import.meta.env.VITE_API_URL;

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [isNotificationAllowed, setIsNotificationAllowed] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    
    

    // const { authUser, setAuthUser, users } = useAuth();

    const navigate = useNavigate();

    const { setCurrentChatId, setCurrentUserId, currentUserId, currentChatId } = useUIState();

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const { setIsGroupChatOpen } = useUIState();

    const handleGroupChatDrawer = () => {
        setIsGroupChatOpen(true);
    }

    const handleOpenGroupChatDrawer = () => {
        setGroupChatDrawerOpen(true);
    }

   
    const handleCloseGroupChatDrawer = () => {
        setGroupChatDrawerOpen(false);
    }

    const handleOpenProfileDrawer = () => {
        setProfileDrawerOpen(true);
    }

    const handleCloseProfileDrawer = () => {
        setProfileDrawerOpen(false);
    }

    const fetchUsers = useCallback(async () => {
        try {
          const token = localStorage.getItem('token');
          const api = import.meta.env.VITE_API_URL;

          const response = await fetch(`${api}/api/users`, {
            method: 'GET',
            headers: {
            //   'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }
          const data = await response.json();
          console.log("Fetched users:", data);
          return data || [];
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }, []);

      const { data: users, isLoading: isUsersLoading, isError: isUsersError } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        staleTime: 1000 * 60 * 5,
      });

      console.log("Employees", users);
   
   
    const fetchChats = useCallback(async () => {
        try {
          const token = localStorage.getItem('token');
          const api = import.meta.env.VITE_API_URL;
      
          const response = await fetch(`${api}/api/chats`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
      
          if (!response.ok) {
            throw new Error('Failed to fetch chats');
          }
      
          const data = await response.json();

          console.log("Chatsss", data.processedChats);
          return data.processedChats || [];
        } catch (error) {
          console.error('Error fetching chats:', error);
          throw error;
        }
    },[]);
      
      const { data, isLoading, isError } = useQuery({
        queryKey: ['chats'],
        queryFn: fetchChats,
        staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      });

      useEffect(() => {
        if (data && data.length > 0) {
          // Process chats
          const updatedChats = data.map((chat) => ({
            ...chat,
            participants: chat.participants.map((participant) => {
              const foundUser = users.find((u) => u.user_code == participant.user_code);
              return {
                ...participant,
                active: foundUser ? foundUser.active : false,
                photo: foundUser ? foundUser.photo : null,
              };
            }),
          }));
    
          setChats(updatedChats);
          console.log('Updated chats:', updatedChats);
    
          // Determine if all chats are muted
          const isMutedChat = updatedChats.every((chat) => {
            const mutedByArray = JSON.parse(chat.mutedBy || '[]');
            return Array.isArray(mutedByArray) && mutedByArray.includes(authUser.user_code);
          });
    
          setMutedChat(isMutedChat);
          console.log('Muted chat status:', isMutedChat);
    
          // Emit chat IDs to socket
          const chatIds = updatedChats.map((chat) => chat.id);
          console.log("chatIds", chatIds);
        //   socket.emit('joinChatRooms', chatIds);
        }
      }, [data, users, authUser, socket]);
    
     
    const fetchChatsOne = async () => {
        try {
          const token = localStorage.getItem(`token`);
          const api = import.meta.env.VITE_API_URL;
      
          const result = await fetch(`${api}/api/chatsOne`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
      
          const data = await result.json();
          console.log("Fetched chats:", data);
      
          // Map through chats and update participants with active status

          return data.processedChats || [];     
      
        } catch (error) {
          console.error('Error fetching chats:', error);
        }
      };

      const { data: chatsOne, isLoading: isChatsOneLoading, isError: isChatsOneError } = useQuery({
        queryKey: ['chatsOne'],
        queryFn: fetchChatsOne,
        staleTime: 1000 * 60 * 5,
      });

     
      
      
      

    console.log("userssss", users)

    
        console.log("Chats after update:", chats);

        const handleChatClick = useCallback((chatId, isGroupChat) => {
            if (chatId && chatId !== currentChatId) {
                setCurrentChatId(chatId);
                setIsGroupChatOpen(isGroupChat);
                navigate('/conversation');
            }
        }, [currentChatId, navigate]);

        const handleRightClick = (event, chatId) => {
            event.preventDefault(); // Prevent the browser's default context menu
            setContextMenu(
                contextMenu === null
                    ? { mouseX: event.clientX, mouseY: event.clientY }
                    : null
            );
            setSelectedChatId(chatId); // Store the chat ID for delete action
        };

        const filteredChats = useMemo(() => {
            if (!chats) return [];
            
            switch (selectedFilter) {
                case 'personalized':
                    return chats.filter(chat => chat.is_group_chat === false);
                case 'groups':
                    return chats.filter(chat => chat.is_group_chat === true);
                default:
                    return chats;
            }
        }, [chats, selectedFilter]);

        // Memoize chat item renderer
        const ChatItem = useCallback(({ index }) => {
            const chat = filteredChats[index];
            const lastMessage = chat?.messages?.[chat.messages?.length - 1];
        
            const determineParticipantAndSeenStatus = () => {
                if (!chat?.participants) return { participant: null, isSeen: false };
        
                let participant = null;
                let isSeen = false;
        
                if (!chat.is_group_chat) {
                    participant = chat.participants.find(p => p?.user_code !== authUser?.user_code);
        
                    if (lastMessage) {
                        isSeen = lastMessage.sender_id === authUser?.user_code
                            ? lastMessage.viewedBy?.includes(participant?.user_code)
                            : lastMessage.viewedBy?.includes(authUser?.user_code);
                    }
                } else {
                    const otherParticipants = chat.participants.filter(p => p?.user_code !== authUser?.user_code);
                    participant = otherParticipants;
        
                    if (lastMessage) {
                        isSeen = lastMessage.sender_id === authUser?.user_code
                            ? otherParticipants.every(p => lastMessage.viewedBy?.includes(p?.user_code))
                            : lastMessage.viewedBy?.includes(authUser?.user_code);
                    }
                }
        
                return { participant, isSeen };
            };
        
            const { participant, isSeen } = determineParticipantAndSeenStatus();
            const lastMessageTime = lastMessage ? formatDate(lastMessage.createdAt) : "";
        
            return (
                <Box
                    key={chat.id}
                    onClick={() => handleChatClick(chat.id, chat.is_group_chat)}
                    onContextMenu={(event) => handleRightClick(event, chat.id)}
                    sx={{
                        width: "100%",
                        display: "flex",
                        marginBottom: "8px",
                        cursor: "pointer",
                        maxHeight: "250px",
                        overflowY: "auto",
                        backgroundColor: chat.id === currentChatId ? "#f0f0f0" : "none",
                        "&:hover": { background: "#E5E5EA" }
                    }}
                >
                    {/* Avatar Section */}
                    {chat.is_group_chat ? (
                        chat.photo ? (
                            <Avatar src={`${api}/${chat.photo}`} sx={avatarStyle} />
                        ) : (
                            <Avatar sx={{ ...avatarStyle, position: "relative" }}>
                                <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                                    {chat.participants.slice(0, 4).map((participant, index, array) => (
                                        participant.photo ? (
                                            <Box
                                                key={index}
                                                component="img"
                                                src={`${api}/${participant.photo}`}
                                                sx={getAvatarPositionStyle(index, array.length)}
                                            />
                                        ) : (
                                            <Box key={index} sx={getInitialAvatarStyle(index, array.length)}>
                                                {participant.userfullname.charAt(0).toUpperCase()}
                                            </Box>
                                        )
                                    ))}
                                </Box>
                            </Avatar>
                        )
                    ) : (
                        <Box sx={{ position: "relative", display: "inline-block" }}>
                            <Avatar src={`${api}/${participant?.photo}`} sx={avatarStyle} />
                            {participant?.active && <Box sx={activeBadgeStyle} />}
                        </Box>
                    )}
        
                    {/* Chat Details */}
                    <Box sx={{ width: "180px", marginLeft: "10px", marginTop: "5px" }}>
                        <Box sx={{ display: "flex", gap: "10px" }}>
                            <Typography sx={chatNameStyle}>{chat.name}</Typography>
                            <Typography sx={timeStyle}>{lastMessageTime}</Typography>
                        </Box>
        
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {lastMessage && (
                                <Typography sx={messageStyle}>
                                    {lastMessage.sender_id === authUser.user_code
                                        ? `You: ${lastMessage.text_content || lastMessage.media_type || "deleted message"}`
                                        : lastMessage.text_content || lastMessage.media_type || `${lastMessage.sender?.userfullname} deleted a message`}
                                </Typography>
                            )}
        
                            {lastMessage && (
                                lastMessage.sender_id === authUser.user_code ? (
                                    !isSeen ? <CheckIcon sx={iconStyle} /> : <DoneAllIcon sx={{ ...iconStyle, color: "#14AE5C" }} />
                                ) : (
                                    !lastMessage.viewedBy?.includes(authUser.user_code) && <CircleIcon sx={{ fontSize: "10px" }} />
                                )
                            )}
                        </Box>
                    </Box>
        
                    {/* Context Menu */}
                    <Menu
                        open={contextMenu !== null}
                        onClose={handleClose}
                        anchorReference="anchorPosition"
                        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
                        slotProps={{
                            paper: { elevation: 0, sx: { boxShadow: "none", border: "1px solid #ddd" } },
                        }}
                    >
                        <MenuItem onClick={() => { handleDeleteChat(selectedChatId); handleClose(); }}>
                            Delete Chat
                        </MenuItem>
                    </Menu>
                </Box>
            );
        }, [filteredChats, currentChatId, authUser, api, handleChatClick, handleRightClick]);

      

    // useEffect(() => {
    //     const handleUpdateLastMessage = (lastMessage) => {
    //         console.log("New lastMessage received:", lastMessage);
    
    //         setChats((prevChats) =>
    //             prevChats.map((chat) =>
    //                 chat.id === lastMessage.chat_id
    //                     ? {
    //                           ...chat,
    //                           messages: [lastMessage, ...chat.messages.slice(1)], // Update messages[0] and retain the rest
    //                       }
    //                     : chat
    //             )
    //         );

    //         fetchChats();
    //     };
    
    //     socket.on('updateLastMessage', handleUpdateLastMessage);
    
    //     return () => {
    //         socket.off('updateLastMessage', handleUpdateLastMessage);
    //     };
    // }, [socket]);
    

    
    // console.log("MessageId", messageId);
    
    



       
    

    // useEffect(() => {

    //     socket.on('readMessage', () => {

    //        fetchChats();
    //     });
    
    //     return () => {
    //         socket.off('readMessage');
    //     };
    // }, []);

    // useEffect(() => {

    //     socket.on('newGroupChat', (users) => {
            
    //        fetchChats();
    //     });
    
    //     return () => {
    //         socket.off('newGroupChat');
    //     };
    // }, []);

    // useEffect(() => {
    //     socket.on('newGroupChat', (users) => {

    //         console.log("real-time", users);
           
    //         const isAuthUserInGroup = users.some(user => user.id === authUser.id);
    
    //         if (isAuthUserInGroup) {
    //             fetchChats(); // Fetch chats only if authUser is part of the group
    //         }
    //     });
    
    //     return () => {
    //         socket.off('newGroupChat');
    //     };
    // }, [authUser.id, socket, fetchChats]);  

    // useEffect(() => {
    //     if (!socket) return;
    
    //     socket.on('newGroupChat', (data) => {
    //         console.log('Real-time new group chat:', data);
    
    //         // Check if the authenticated user is part of the group
    //         const isAuthUserInGroup = data.participants.some(user => user.id === authUser.id);
    
    //         if (isAuthUserInGroup) {
    //             fetchChats(); // Fetch chats if the user is a participant
    //         }
    //     });
    
    //     return () => {
    //         socket.off('newGroupChat');
    //     };
    // }, [authUser.id, socket, fetchChats]);

 



  const handleUpdateLastMessage = useCallback((lastMessage) => {
    console.log("New lastMessage received:", lastMessage);

    setChats((prevChats) =>
        produce(prevChats, (draft) =>{
            const chat = draft.find(c => c.id === lastMessage.chat_id);
            if(chat) {
                chat.messages[length - 1] = lastMessage;
            }
        })
    );

   
  }, []);

  const handleReadMessage = useCallback((data) => {
    console.log("Read status updated for message:", data);

    setChats((prevChats) =>
        produce(prevChats, (draft) =>{
            const chat = draft.find(c => c.id === data.chatId);
            if(chat) {
                const message = chat.messages.find(m => m.id === data.messageId);
                if(message) {
                    message.viewed_by = new Set(message.viewed_by || []).add(data.userId);
                }
            }
        })
    );

  }, []);

  const handleNewGroupChat = useCallback((usersList) => {
    console.log("New Group Chat:", usersList);
    if (usersList.some((user) => user.id === authUser?.user_code)) {
      fetchChats(); // Fetch only when necessary
    }
  }, [authUser, fetchChats]);

  const handleUpdateForwardLastMessage = useCallback(() => {
    console.log("updatedForwardLastMessage received");
    fetchChats(); // Fetch updated chat list
  }, [fetchChats]);

  const handleNewChat = useCallback((chatId) => {
    setChats((prevChats) => {
      if (!prevChats.some((chat) => chat.id === chatId)) {
        fetchChats();
      }
      return prevChats;
    });
  }, [fetchChats]);

  const handleLeftChat = useCallback((data) => {
    const { chat_id, user_id } = data;
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chat_id
          ? { ...chat, participants: chat.participants.filter((p) => p.user_code !== user_id) }
          : chat
      )
    );
  }, []);

  const handleGroupPhoto = useCallback((updatedGroup) => {
    console.log("Received updated group photo:", updatedGroup);
    setChats((prevChats) =>
        produce(prevChats, (draft) => {
            const chat = draft.find(c => c.id === updatedGroup.id);
            if(chat) {
                chat.photo = updatedGroup.photo;
            }
        })
    );
  }, []);

  const handleUserPhoto = useCallback((updatedUser) => {
    setChats((prevChats) =>
        produce(prevChats, (draft) => {
            draft.forEach(chat => {
                chat.participants.forEach(participant => {
                    if (participant.user_code === updatedUser.user_code) {
                        participant.photo = updatedUser.photo;
                    }
                });
            });
        })
    )
  }, []);

  // ✅ Optimize: Register and cleanup socket listeners efficiently
  useEffect(() => {
    if (!socket) return;

    const events = {
      updateLastMessage: handleUpdateLastMessage,
      readMessage: handleReadMessage,
      newGroupChat: handleNewGroupChat,
      updateForwardLastMessage: handleUpdateForwardLastMessage,
      newChat: handleNewChat,
      leftChat: handleLeftChat,
      groupPhoto: handleGroupPhoto,
      userPhoto: handleUserPhoto,
    };

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket]);

    const handleNotiClick = (event) => {
        setAnchorEl(event.currentTarget);
      };
    
      const handleNotiClose = () => {
        setAnchorEl(null);
      };
    
      const handleNotificationToggle = async () => {
        try {
            let response;
    
            if (mutedChat === false) {
                // Unmute chats
                response = await fetch(`${api}/api/allChats/mute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            } else {
                // Mute chats
                response = await fetch(`${api}/api/allChats/unmute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
    
            if (response.status === 201) {
                console.log(`Chat Mute Or UnMute successfully`, response);
                fetchChats(); // Refresh chats to update the UI state
                console.log("chatNotification", isNotificationAllowed)
            } else {
                console.error(`Failed to ${mutedChat ? 'unmute' : 'mute'} chat`);
            }
        } catch (error) {
            console.error(`Error during notification toggle:`, error);
        }
    };

  

    const formatDate = (createdAt) => {
        const date = new Date(createdAt);
        const now = new Date();
        
        const isToday = date.toDateString() === now.toDateString();
        const isThisWeek = date > new Date(now.setDate(now.getDate() - now.getDay())); // start of the week
    
        if (isToday) {
            // Format as hour:minute (24-hour format)
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        } else if (isThisWeek) {
            // Format as weekday (e.g., Sun, Mon)
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            // Format as month day (e.g., Oct 17)
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };


const handleLogout = () => {
  const api = "https://sso.trustlinkmm.com";
  const redirectUri = window.location.origin; 
  const logoutUrl = `${api}/api/SSOlogout?redirectUri=${redirectUri}&email=${authUser.email}`;

  // Clear local data before redirecting
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  Cookies.remove("auth_tokens");

  // Redirect to the logout URL (no CORS issues)
  window.location.href = logoutUrl;
};


        const handleDeleteChat = async () => {
       
        try {
            const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
          const response = await fetch(`${api}/api/chats/delete/${selectedChatId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
    
          const result = await response.json();
          if (response.status === 200) {
            // logout();
    
            fetchChats();
             
          } else {
            console.error('Logout failed:', result.error.message);
          }
        } catch (error) {
          console.error('Error logging out:', error);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSearchTerm('');
        setFilteredUsers([]);
    };

    const handleUserClick = (user) => {
        // Check if a chat already exists with the user
        console.log("UserClicked", user);
        const existingChat = chats.find(chat => 
            chat.is_group_chat === false && // Ensure it's not a group chat
            chat.participants.length === 2 && // Ensure exactly two participants
            chat.participants.some(p => p.user_code === user.user_code) && // Check if the selected user is a participant
            chat.participants.some(p => p.user_code === authUser.user_code) // Ensure the authUser is also a participant
        );

        const existingGroupChat = chatsOne.find(chat =>
            chat.id === user.user_code
        )
        console.log("ExistingChat", existingGroupChat);
        setFilteredUsers([]);
    
        if (existingChat) {
          
            setCurrentChatId(existingChat.id);
            navigate('/conversation'); 

        } else if (existingGroupChat) {
            setCurrentChatId(existingGroupChat.id);
            navigate('/conversation'); 
        } else {
            // If no chat exists, reset currentChatId and set recipient
            setCurrentChatId(null);
            localStorage.removeItem('currentUserId'); // Clear storage if no chat ID
            setCurrentUserId(user.user_code); // Set the user as the recipient for the new chat
            
            navigate('/conversation'); // Or however you handle routing
            

        }
    
        // Navigate to the Conversation component
    };

    const handleUserSearch = (event) => {
        const { value } = event.target;
        setSearchTerm(value);
    
        if (value) {
            const lowercasedValue = value.toLowerCase();
    
            // Filter users by username or departmentName
            const matchedUsers = users.filter(user =>
                user.user_code !== authUser.user_code && (
                    user.username.toLowerCase().includes(lowercasedValue) ||
                    user.department_name.toLowerCase().includes(lowercasedValue)
                )
            );
    
            // Filter chats by chat name
            const matchedChats = chatsOne.filter(chat =>
                chat.is_group_chat === true && chat.name.toLowerCase().includes(lowercasedValue)
            );
    
            // Combine matched users and chats
            const combinedResults = [
                ...matchedUsers,
                ...matchedChats
            ];
    
            setFilteredUsers(combinedResults);
        } else {
            setFilteredUsers([]);
        }
    };    

    // const handleUserSearch = useCallback(
    //     debounce((value) => {
    //         if (value) {
    //             const lowercasedValue = value.toLowerCase();
    //             const matchedUsers = users.filter(user =>
    //                 user.user_code !== authUser.user_code && (
    //                     user.username.toLowerCase().includes(lowercasedValue) ||
    //                     user.department_name.toLowerCase().includes(lowercasedValue)
    //                 )
    //             );
    //             const matchedChats = chatsOne.filter(chat =>
    //                 chat.is_group_chat === true && chat.name.toLowerCase().includes(lowercasedValue)
    //             );
    //             setFilteredUsers([...matchedUsers, ...matchedChats]);
    //         } else {
    //             setFilteredUsers([]);
    //         }
    //     }, 300),
    //     [users, chatsOne, authUser.user_code]
    // );
    

  

    

    const handleClose = () => {
        setContextMenu(null); // Close the context menu
        setSelectedChatId(null);
    };



    // useEffect(() => {
    //     if (chats.length > 0) {
    //         chats.forEach((chat) => {
    //             socket.emit('joinRoom', `chat_${chat.id}`);
    //         });
    //     }
    
    //     return () => {
    //         // Leave rooms when the component unmounts or chats change
    //         chats.forEach((chat) => {
    //             socket.emit('leaveRoom', `chat_${chat.id}`);
    //         });
    //     };
    // }, [chats]);


    console.log("AuthUser", authUser);
    console.log("CHATTTTK", chats);

    if(!chats) {
        return <Box>Loading...</Box>
    }

    if (isLoading) return <p>Loading chats...</p>;
    if (isError) return <p>Error loading chats</p>;
    


    return (
        <Box
            sx={{
                width: "300px",
                height: "100vh",
                // overflowY: "auto",
                background: "#F6FBFD",
                borderRight: "1px solid #E5E5EA",
                paddingBottom: "80px",
                paddingLeft: "20px",
                paddingRight: "20px",
                
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    // border: "1px solid",
                   
                    justifyContent: "space-between",
                }}
            >
                <img src={CompanyLogo} alt="TrustLink" style={{ marginTop: "25px",   mixBlendMode: "multiply", }} />
                <IconButton
        onClick={handleNotiClick}
       sx={{ 
            marginTop: '25px', 
            "&:hover": {
                background: "transparent"
            }
        }}      >
        <SettingsIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleNotiClose}
        PaperProps={{
          style: { minWidth: '250px' },
        }}
      >
        {/* Notification Permission Menu Item with Switch */}
        <MenuItem>
          <ListItemIcon>
            <NotificationsIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit" sx={{ flexGrow: 1 }}>
            Notification Permission
          </Typography>
          <Switch
            checked={mutedChat === false}
            onChange={handleNotificationToggle}
            color="primary"
            
          />
        </MenuItem>

        {/* Logout Menu Item */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Logout</Typography>
        </MenuItem>
      </Menu>
            </Box>

            

            <Box
                sx={{
                    marginTop: "30px",
                    // paddingLeft: "32px",
                    // paddingRight: "32px",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <Box sx={{ 
                            width: "244px",
                            // border: "0.5px solid #C6C6C8",
                            // border: "1px solid",
                        }}
                    >
                        <TextField
                                                        
                            fullWidth
                            type="text"
                            placeholder="Search by username or department"
                            value={searchTerm}
                            onChange={handleUserSearch}
                            sx={{                             
                                display: "flex",                            
                                // backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        border: "0.5px solid #C6C6C8",
                                        
                                    },
                                    borderRadius: "10px",
                                    height: "40px",
                                },
                            }}
                                                       
                        />
                           
                    </Box>
                    <Tooltip title="Create Group Chat">
                        <IconButton
                            onClick={handleOpenGroupChatDrawer}
                            sx={{
                                "&:hover": {
                                    background: "transparent"
                                }
                            }}
                        
                        >
                            <GroupsIcon sx={{ fontSize: "30px" }}/>
                        </IconButton>
                    </Tooltip>
                    
                    
                    <GroupChatDrawer openGroupChatDrawer={groupChatDrawerOpen} closeGroupChatDrawer={handleCloseGroupChatDrawer}/>
                </Box>

               {filteredUsers.length > 0 && (
                    <Box>
                        <UserList filteredUsers={filteredUsers} handleUserClick={handleUserClick} api={api} />
                    </Box>
               )}

                <Box
                    sx={{
                        marginTop: "15px",
                        borderRadius: "15px",
                        background: "#f5f5f5",
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        padding: "8px",
                        gap: "4px",
                    }}
                >
                    <Button
                        onClick={() => setSelectedFilter('all')}
                        sx={{
                            borderRadius: "50px",
                            background: selectedFilter === 'all' ? "#fff" : "none",
                            color: selectedFilter === 'all' ? "#28A745" : "#808080",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: selectedFilter === 'all' ? "#218838" : "#e8f5e9",
                                transform: "translateY(-1px)",
                            }
                        }}
                    >
                        All
                    </Button>
                    <Button
                        onClick={() => setSelectedFilter('personalized')}
                        sx={{
                            borderRadius: "50px",
                            background: selectedFilter === 'personalized' ? "#fff" : "none",
                            color: selectedFilter === 'personalized' ? "#28A745" : "#808080",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: selectedFilter === 'personalized' ? "#218838" : "#e8f5e9",
                                transform: "translateY(-1px)",
                            }
                        }}
                    >
                        Personalized
                    </Button>
                    <Button
                        onClick={() => setSelectedFilter('groups')}
                        sx={{
                            borderRadius: "50px",
                            background: selectedFilter === 'groups' ? "#fff" : "none",
                            color: selectedFilter === 'groups' ? "#28A745" : "#808080",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: selectedFilter === 'groups' ? "#218838" : "#e8f5e9",
                                transform: "translateY(-1px)",
                            }
                        }}
                    >
                        Groups
                    </Button>
                </Box>

                <Box sx={{ height: "calc(100vh - 280px)", marginTop: "20px",position: "relative", }}>
                    <Typography
                        sx={{
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#3C3C4399",
                            marginBottom: "12px",
                        }}
                    >
                        Recent Conversations
                    </Typography>

                    {/* New Box to contain only scrollable content */}
                    <Box sx={{ height: "calc(100vh - 250px)", overflowY: "auto" }}>
                        {filteredChats.length > 0 ? (
                            <AutoSizer>
                                {({ height, width }) => (
                                    <FixedSizeList
                                        height={height}
                                        width={width}
                                        itemCount={filteredChats.length}
                                        itemSize={72} // Adjust based on your chat item height
                                        overscanCount={5}
                                    >
                                        {ChatItem}
                                    </FixedSizeList>
                                )}
                            </AutoSizer>
                        ) : (
                            <Box
                                sx={{
                                    textAlign: "center",
                                    padding: "20px",
                                    color: "#666",
                                }}
                            >
                                <Typography>
                                    No {selectedFilter === 'all' ? '' : selectedFilter} chats available
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>


                

               
            </Box>

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    position: "fixed",
                    bottom: "0",
                    zIndex: 1000,
                    width: "300px",
                    // paddingLeft: "20px",
                    paddingBottom: "8px",
                    background: "#F6FBFD",
                }}
            
            >
                { (authUser.active === true) ? (
                                <Box
                                    sx={{
                                        position: "relative",
                                        display: "inline-block",
                                        // marginTop: "14px",
            
                                        // border: "1px solid",
                                    }}
                                >
                                    <Avatar
                                        src={`${api}/${authUser?.photo}`}
                                        sx={{
                                            width: "44px",
                                            height: "44px",
                                            background: "#D9D9D9",
                                        }}
                                    >
            
                                    </Avatar>
        
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: "2px",
                                            right: "-4px",
                                            width: "14px",
                                            height: "14px",
                                            backgroundColor: "#34C759",
                                            borderRadius: "50%",
                                            border: "1px solid #fff",
                                        }}
                                    >
        
                                    </Box>
        
                                
                                </Box>
                            ) : (
                                <Avatar
                                    src={`${api}/${authUser?.photo}`}

                                    sx={{
                                        width: "44px",
                                        height: "44px",
                                        background: "#D9D9D9",
                                    }}
                                >
            
                                </Avatar>
                            )}

                <Box>
                    <Typography
                        sx={{
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#000000",
                        }}
                    >
                        {authUser.username}
                    </Typography>
                    <Button
                        onClick={handleOpenProfileDrawer}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#A8A8A8",
                            textTransform: "none",
                            maxHeight: "16px",
                            "&:hover": {
                                background: "none",
                                transform: "none",
                            },
                        }}
                    >
                        View profile
                    </Button>

                    {/* <ProfileDrawer openProfileDrawer={profileDrawerOpen}  closeProfileDrawer={handleCloseProfileDrawer} userId={authUser.staff_code}/> */}
                </Box>
            </Box>

            
        </Box>
    )
}