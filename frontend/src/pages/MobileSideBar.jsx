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
    MenuItem,
    ListItemIcon,
    Switch,
    Menu,
} from "@mui/material"

import {
    BorderColor as BorderColorIcon,
    DoneAll as DoneAllIcon,
    Check as CheckIcon,
    Logout as LogoutIcon,
    Circle as CircleIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
} from "@mui/icons-material";

import CompanyLogo from "../images/TrustLinkLogo.jpg";
import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUIState } from "../providers/UIStateProvider";
// import { useFetchWithAuth } from "../hooks/useFetchWithAuth";
import Cookies from "js-cookie";


import { io } from 'socket.io-client';
// import GroupChatDrawer from "./GroupChatDrawer";
import GroupChatDrawer from "../components/GroupChatDrawer";
import ProfileDrawer from "../components/ProfileDrawer";
import { Helmet } from "react-helmet-async";



export default function MobileSideBar() {

     const { authUser, setAuthUser, users, loading, setUsers, socket } = useAuth();
    
    
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
        
        // console.log("socket", socket);

   const [ chats, setChats ] = useState([]);
   const  [ chatsOne, setChatsOne ] = useState([]);
    // const [ users, setUsers ] = useState([]);
    const [ departments, setDepartments ] = useState([]);
    const [ groupChatDrawerOpen, setGroupChatDrawerOpen ] = useState(false);
    const [ profileDrawerOpen, setProfileDrawerOpen ] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); 
    const [selectedChatId, setSelectedChatId] = useState(null);
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    // const token = Cookies.get('auth_tokens')


    const [ mutedChat, setMutedChat ] = useState(false);
    // const api = import.meta.env.VITE_API_URL;

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [isNotificationAllowed, setIsNotificationAllowed] = useState(false);
    

    // const { authUser, setAuthUser, users, loading, setUsers } = useAuth();
    // const fetchWithAuth = useFetchWithAuth();
    

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
   
   
   const fetchChats = async () => {
           try {
             const token = localStorage.getItem(`token`);
             const api = import.meta.env.VITE_API_URL;
         
             const result = await fetch(`${api}/api/chats`, {
               method: 'GET',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
               }
             });
         
             const data = await result.json();
             console.log("Fetched chats:", data);
         
             // Map through chats and update participants with active status
             const updatedChats = data.processedChats?.map((chat) => ({
               ...chat,
               participants: chat.participants.map((participant) => {
                 // Make sure `participant.employeeId` matches the format of `user.employeeId`
                 console.log("Looking for participant:", participant.employeeId);
             
                 const foundUser = users.find((u) => u.employeeId == participant.employeeId);
                 console.log("Found user:", foundUser);
             
                 return {
                   ...participant,
                   active: foundUser ? foundUser.active : false, // Add active status if user is found
                   photo: foundUser ? foundUser.photo : null,
                 };
               })
             }));
             
             setChats(updatedChats); // Set the updated chats
             console.log("chattttg", chats)
         
             const chatIds = updatedChats.map((chat) => chat.id);
             socket.emit('joinChatRooms', chatIds);
         
           } catch (error) {
             console.error('Error fetching chats:', error);
           }
         };
         
         useEffect(() => {
           if(!loading) {
            fetchChats();
           }
         }, [users]);

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
          
          
          setChatsOne(data.processedChats); // Set the updated chats
        //   console.log("chattttg", updatedChats)

        //   const isMutedChat = updatedChats.every((chat) => {
        //     // Parse mutedBy from string to array
        //     const mutedByArray = JSON.parse(chat.mutedBy || '[]');
        //     return Array.isArray(mutedByArray) && mutedByArray.includes(authUser.staff_code);
        // });
        // console.log("chattttg1", isMutedChat)
        
        // // Set the mutedChat state
        // setMutedChat(isMutedChat);
          
      
        //   const chatIds = updatedChats.map((chat) => chat.id);
        //   socket.emit('joinChatRooms', chatIds);
      
        } catch (error) {
          console.error('Error fetching chats:', error);
        }
      };
      
      useEffect(() => {
       
            fetchChatsOne(); // Only fetch chats when users are ready
       
    }, []);
      

    

    
    // console.log("MessageId", messageId);
    
    
    // useEffect(() => {
    //     fetchChats();
    
    //     socket.on('updateLastMessage', (lastMessage) => {
    //         console.log("Received updated lastMessage:", lastMessage);
    //         // fetchChats();
    
    //         setChats((prevChats) => {
    //             // Case 1: If there are no existing chats, create the first chat
    //             if (prevChats.length === 0) {
    //                 return [{
    //                     id: lastMessage.chat_id,
    //                     messages: [lastMessage], // Initialize with the first message
    //                     // You can add other default properties here, e.g., `name`, `participants`
    //                 }];
    //             }
    
    //             // Case 2: If chats exist, check if the specific chat exists
    //             const chatExists = prevChats.some((chat) => chat.id === lastMessage.chat_id);

    //             console.log("ChatExisted", chatExists);
    
    //             if (chatExists) {
    //                 // Update the existing chat with the new message
                    
    //                 console.log("ChatExist");
    //                 return prevChats.map((chat) => {
    //                     if (chat.id === lastMessage.chat_id) {
    //                         const updatedMessages = (chat.messages || []).filter(
    //                             (message) => message.id !== lastMessage.id
    //                         );
    
    //                         // Add `lastMessage` only if it has valid content
    //                         if (lastMessage) {
    //                             updatedMessages.push(lastMessage);
    //                         }
    
    //                         // Sort messages by `createdAt` to maintain chronological order
    //                         updatedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    //                         return {
    //                             ...chat,
    //                             messages: updatedMessages,
    //                         };
    //                     }
    //                     console.log("Chattttt", chat);
    //                     return chat;
    //                 });
    //             } else {
    //                 // Case 3: If chats exist but this specific chat doesn't, add a new chat
    //                 const newChat = {
    //                     id: lastMessage.chat_id,
    //                     messages: [lastMessage],
    //                     // Add other default properties as needed
    //                 };
    
    //                 return [...prevChats, newChat];
    //             }
    //         });
    //     });
    
    //     return () => {
    //         socket.off('updateLastMessage');
    //     };
    // }, []);


    useEffect(() => {
        const handleUpdateLastMessage = (lastMessage) => {
            console.log("New lastMessage received:", lastMessage);
    
            setChats((prevChats) => {
                const chatExists = prevChats.some((chat) => chat.id === lastMessage.chat_id);
                if (!chatExists) return prevChats; // Ignore updates for unknown chats
    
                return prevChats.map((chat) =>
                    chat.id === lastMessage.chat_id
                        ? {
                              ...chat,
                              messages: [lastMessage, ...chat.messages.slice(1)],
                          }
                        : chat
                );
            });
    
            fetchChats(); // Optionally, keep the chat list up to date
        };
    
        socket.on('updateLastMessage', handleUpdateLastMessage);
    
        return () => {
            socket.off('updateLastMessage', handleUpdateLastMessage);
        };
    }, [socket]);
    
    useEffect(() => {
        const handleReadMessage = (data) => {
            const { messageId, chatId, userId } = data;
    
            console.log("Read status updated for message:", data);
    
            setChats((prevChats) => {
                const chatExists = prevChats.some((chat) => chat.id === chatId);
                if (!chatExists) return prevChats; // Ignore updates for unknown chats
    
                return prevChats.map((chat) => {
                    if (chat.id !== chatId) return chat;
    
                    console.log("Updating messages for chat:", chat);
    
                    // Update the specific message's viewedBy array
                    const updatedMessages = chat.messages.map((message) =>
                        message.id === messageId
                            ? {
                                  ...message,
                                  viewedBy: Array.isArray(message.viewedBy)
                                      ? [...new Set([...message.viewedBy, userId])]
                                      : [userId], // Add userId to viewedBy
                              }
                            : message
                    );
    
                    return { ...chat, messages: updatedMessages };
                });
            });
        };
    
        socket.on('readMessage', handleReadMessage);
    
        return () => {
            socket.off('readMessage', handleReadMessage);
        };
    }, [socket]);
    
    

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

    socket.on('newGroupChat', (users) => {
        console.log('New Group Chat:', users);
    
        // Check if authUser.id exists in users[]
        const isUserIncluded = users.some(user => user.id === authUser.id);
    
        if (isUserIncluded) {
            fetchChats(); // Call fetchChats only if authUser.id is in users[]
            console.log("AuthUser is part of this group chat.");
        } else {
            console.log("AuthUser is not part of this group chat.");
        }
    
        
    });
    useEffect(() => {

        socket.on('updateForwardLastMessage', () => {
            console.log("updatedForwardLastMessage")
           fetchChats();
        });
    
        return () => {
            socket.off('updateForwardLastMessage');
        };
    }, []);

    useEffect(() => {

        socket.on('newChat', (chatId) => {
            if(chats.length > 0) {
                const chatExists = chats.some(chat => chat.id === chatId);
                if(!chatExists) {
                    fetchChats();
                }
            }
             else {
                fetchChats();
            }

           
        });
    
        return () => {
            socket.off('newChat');
        };
    }, [chats]);

    useEffect(() => {
        socket.on('leftChat', (data) => {
            const { chat_id, user_id } = data;
    
            setChats((prevChats) => {
                return prevChats.map((chat) => {
                    if (chat.id === chat_id) {
                        return {
                            ...chat,
                            participants: chat.participants.filter((participant) => participant.id !== user_id),
                        };
                    }
                    return chat;
                });
            });
        });
    
        return () => {
            socket.off('leftChat');
        };
    }, [setChats]);

    

    // useEffect(() => {

    //     socket.on('leftChat', (chatId) => {
    //         if(chats.length > 0) {
    //             const chatExists = chats.some(chat => chat.id === chatId);
    //             if(!chatExists) {
    //                 fetchChats();
    //             }
    //         }
    //          else {
    //             fetchChats();
    //         }

           
    //     });
    
    //     return () => {
    //         socket.off('newChat');
    //     };
    // }, [chats]);

    useEffect(() => {
        const handleNewGroupChat = () => {
           
           
                fetchChats(); // If you want to re-fetch the whole list
                
        };

        // Listen for the `newGroupChat` event
        socket.on('newGroupChat', handleNewGroupChat);

        return () => {
            // Clean up the event listener on component unmount
            socket.off('newGroupChat', handleNewGroupChat);
        };
    }, [chats]); // Dependencies ensure the effect re-runs when `chats` changes

    useEffect(() => {
        socket.on("userPhoto", (updatedUser) => {
            console.log("Received updated user in Sidebar:", updatedUser); // Check if both username and user_photo are here

            // Update only the affected chat
            setChats((prevChats) =>
                prevChats.map((chat) => {
                    // Check if the updated user is a participant in the chat
                    const isParticipant = chat.participants.some(
                        (participant) => participant.id === updatedUser.id
                    );
    
                    if (isParticipant) {
                        // Map over participants to update only the affected user
                        const updatedParticipants = chat.participants.map((participant) => 
                            participant.id === updatedUser.id
                                ? { ...participant, username: updatedUser.username, user_photo: updatedUser.user_photo }
                                : participant
                        );
    
                        // Return the chat with updated participants
                        return { ...chat, participants: updatedParticipants };
                    }
    
                    // If the user is not a participant, return the chat as is
                    return chat;
                })
            );
        });
    
        // Cleanup listener on unmount
        return () => {
            socket.off("userPhoto");
        };
    }, [setChats]);

    useEffect(() => {
        socket.on("groupPhoto", (updatedGroup) => {
            console.log("Received updated group photo in Sidebar:", updatedGroup);
    
            setChats((prevChats) =>
                prevChats.map((chat) => {
                    // Check if the current chat matches the updated group
                    if (updatedGroup.id === chat.id) {
                        // Return a new object with the updated photo
                        return {
                            ...chat,
                            photo: updatedGroup.photo
                        };
                    }
                    // Return the chat as is if it doesn't match
                    return chat;
                })
            );
        });
    
        // Cleanup listener on unmount
        return () => {
            socket.off("groupPhoto");
        };
    }, [setChats]);

    useEffect(() => {
        socket.on("userPhoto", (updatedUser) => {
            // Only update if the user in the event is the same as authUser
            if (updatedUser.id === authUser.id) {
                const updatedAuthUser = {
                    ...authUser,
                    username: updatedUser.username,
                    user_photo: updatedUser.user_photo,
                };
    
                setAuthUser(updatedAuthUser);
                localStorage.setItem('user', JSON.stringify(updatedAuthUser));
            }
        });
    
        // Cleanup listener on unmount
        return () => {
            socket.off("userPhoto");
        };
    }, [authUser, setAuthUser]);

  

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

    // const handleLogout = async () => {
       
    //     try {
    //         const token = localStorage.getItem(`token`);
    //         const api = import.meta.env.VITE_API_URL;
    //       const response = await fetch(`${api}/api/logout`, {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //           'Authorization': `Bearer ${token}`,
    //         },
    //       });
    
    //       const result = await response.json();
    //       if (response.status === 200) {
    //         // logout();
    
    //         setAuthUser(null);
    //         localStorage.removeItem(`token`);
    //         localStorage.removeItem(`user`);
    //         localStorage.removeItem('currentChatId');
    //         localStorage.removeItem('currentUserId');
    //         navigate('/login')
             
    //       } else {
    //         console.error('Logout failed:', result.error.message);
    //       }
    //     } catch (error) {
    //       console.error('Error logging out:', error);
    //     }
    // };

    
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
            navigate("/");
             
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
            chat.isGroupChat === false && // Ensure it's not a group chat
            chat.participants.length === 2 && // Ensure exactly two participants
            chat.participants.some(p => p.employeeId === user.employeeId) && // Check if the selected user is a participant
            chat.participants.some(p => p.employeeId === authUser.staff_code) // Ensure the authUser is also a participant
        );

        const existingGroupChat = chatsOne.find(chat =>
            chat.id === user.id
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
            setCurrentUserId(user.employeeId); // Set the user as the recipient for the new chat
            
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
                user.employeeId !== authUser.staff_code && (
                    user.userfullname.toLowerCase().includes(lowercasedValue) ||
                    user.departmentName.toLowerCase().includes(lowercasedValue)
                )
            );
    
            // Filter chats by chat name
            const matchedChats = chatsOne.filter(chat =>
                chat.isGroupChat === true && chat.name.toLowerCase().includes(lowercasedValue)
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
        
    

    const handleChatClick = (chatId, isGroupChat) => {
        if (chatId && chatId !== currentChatId) {
            console.log("CHatId", chatId)
            setCurrentChatId(chatId); // Update the chat ID
            setIsGroupChatOpen(isGroupChat); // Update group chat status
            navigate('/conversation'); // Navigate to the conversation page
        }
    };

    const handleRightClick = (event, chatId) => {
        event.preventDefault(); // Prevent the browser's default context menu
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX, mouseY: event.clientY }
                : null
        );
        setSelectedChatId(chatId); // Store the chat ID for delete action
    };

    const handleClose = () => {
        setContextMenu(null); // Close the context menu
        setSelectedChatId(null);
    };

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
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } else {
                // Mute chats
                response = await fetch(`${api}/api/allChats/unmute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
    
            if (response) {
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
    


    return (
        <Box
            sx={{
                // width: "300px",
                height: "100vh",
                overflowY: "auto",
                background: "#F6FBFD",
                borderRight: "1px solid #E5E5EA"
            }}
        >
            <Helmet>
                <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" />
                <title>Home - Chat Application</title>
            </Helmet>
            <Box
                sx={{
                    display: "flex",
                   
                    justifyContent: "space-between",
                    // paddingLeft: "20px",
                    paddingRight: "20px",
                    // border: "1px solid",
                }}
            >
                <img src={CompanyLogo} alt="TrustLink" style={{ marginTop: "32px",   mixBlendMode: "multiply", }} />
                <IconButton
        onClick={handleNotiClick}
        sx={{ 
            marginTop: '32px', 
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
                    marginTop: "40px",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                    // border: "1px solid",
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
                            width: "100%",
                            // border: "0.5px solid #C6C6C8",
                            // border: "1px solid",
                        }}
                    >
                        <TextField
                                                        
                            fullWidth
                            type="text"
                            placeholder="Search by username or department..."
                            value={searchTerm}
                            onChange={handleUserSearch}
                            sx={{                             
                                display: "flex",                            
                                // backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        border: "0.5px solid #C6C6C8",
                                    },
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
                            <BorderColorIcon sx={{ fontSize: "27px" }}/>
                        </IconButton>
                    </Tooltip>
                    
                    
                    <GroupChatDrawer openGroupChatDrawer={groupChatDrawerOpen} closeGroupChatDrawer={handleCloseGroupChatDrawer}/>
                </Box>

                {filteredUsers.length > 0 && (
                    <Box
                    sx={{
                        marginTop: "4px",
                        // background: "#fff",
                        borderRadius: "8px",

                        maxHeight: "200px",
                        overflowY: "auto",
                        // marginBottom: "10px",
                    }}
                
                >
                    <List>
                        {filteredUsers.map(user => (
                            <ListItem  
                                key={user.employeeId || user.id} 
                                onClick={() => handleUserClick(user)}
                                sx={{ 
                                    cursor: "pointer",
                                    height: "87px",
                                    paddingTop: "16px",
                                    paddingBottom: "16px",
                                    paddingLeft: "12px",
                                    paddingRight: "12px", 
                                    display: "flex",
                                    gap: "10px",
                                    background: "#fff",
                                    marginBottom: "10px",

                                }}
                            >
                                <Avatar
                                    src={`${api}/${user?.photo}`}
                                    sx={{
                                        width: "44px",
                                        height: "44px",
                                        background: "#D9D9D9"
                                    }}
                                >

                                </Avatar>

                                <Box>
                                    <Typography
                                        sx={{
                                            fontSize: "13px",
                                            fontWeight: "400",
                                            color: "#000",
                                        }}
                                    >
                                        {user.userfullname}
                                    </Typography>

                                    {user.isGroupChat === false && (
                                         <Typography
                                            sx={{
                                                fontSize: "13px",
                                                fontWeight: "400",
                                                color: "#808080",
                                            }}
                                        >
                                            Group Chat
                                     </Typography>
                                    )}

                                    <Typography
                                        sx={{
                                            marginTop: "5px",
                                            fontSize: "10px",
                                            fontWeight: "400",
                                            color: "#3C3C4399",
                                            width: "200px",
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {user.position}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "10px",
                                            fontWeight: "400",
                                            color: "#3C3C4399",
                                            width: "200px",
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {user.departmentName} 
                                    </Typography>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </Box>
                )}

                <Box
                    sx={{
                        marginTop: "32px",
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "13px",
                            fontWeight: "400",
                            color: "#3C3C4399",
                            marginBottom: "12px",
                        }}
                    >
                        Recent Conversations
                    </Typography>

                    { 
                        chats.length > 0 && chats.map(chat => {
                            const lastMessage = chat.messages?.[chat.messages.length - 1];

                           
                            console.log("lastMessageOne1", chat);
                            let participant = null;
                            let isSeen = false;
                            
                            
                            if (chat.isGroupChat === false) {
                                // Private chat: Find the single participant who isn't authUser
                                participant = chat.participants?.find(p => p.employeeId !== authUser.staff_code);

                                if (lastMessage?.sender_id === authUser.staff_code) {
                                    // Check if the other participant has viewed the message
                                    isSeen = lastMessage?.viewedBy?.includes(participant.employeeId);
                                } else {
                                    // Check if authUser has viewed the message
                                    isSeen = lastMessage?.viewedBy?.includes(authUser.staff_code);
                                }
                            } else if (chat.isGroupChat === true) {
                                // Group chat: Include all participants except authUser
                                const otherParticipants = chat.participants?.filter(p => p.employeeId !== authUser.staff_code);
                                participant = otherParticipants;

                                if (lastMessage?.sender_id === authUser.staff_code) {
                                    // Check if all other participants have viewed the message
                                    isSeen = otherParticipants.every(p => lastMessage.viewedBy?.includes(p.employeeId));
                                } else {
                                    // Check if authUser has viewed the message
                                    isSeen = lastMessage?.viewedBy?.includes(authUser.staff_code);
                                }
                            }



                            console.log("Participant", participant);
                            const lastMessageTime = lastMessage ? formatDate(lastMessage.createdAt) : "";
                            console.log("lastMessage", lastMessage?.read);
                            return (
                                <Box
                            key={chat.id}
                            onClick={() => {
                                handleChatClick(chat.id)
                            }}
                            onContextMenu={(event) => handleRightClick(event, chat.id)} // Right-click event
                        sx={{
                            width: "100%",
                            display: "flex",
                            marginBottom: "8px",
                            cursor: "pointer",
                            // paddingRight: "10px",
                            // border: "1px solid",
                            // justifyContent: "space-between",
                            backgroundColor: chat.id === currentChatId ? '#f0f0f0' : 'none',
                            "&:hover": {
                                background: "#E5E5EA"
                            }
                        }}
                    >
                        {(chat.isGroupChat === false && participant.active === false) ? (
                            <Avatar
                                src={`${api}/${participant?.photo}`}
                                sx={{
                                    marginTop: "8px",
                                    width: "45px",
                                    height: "45px",
                                    background: "#D9D9D9",
                                }}
                        
                            >
                                {/* {!participant?.user_photo && participant?.username} */}
                            </Avatar>
                        ) : (chat.isGroupChat === false && participant.active === true) ? (
                            <Box
                            sx={{
                                position: "relative",
                                display: "inline-block",
                                // marginTop: "14px",
    
                                // border: "1px solid",
                            }}
                        >
                            <Avatar
                                src={`${api}/${participant?.photo}`}
                              
                                sx={{
                                    width: "45px",
                                    height: "45px",
                                    background: "#D9D9D9",
                                }}
                            >
                                
                            </Avatar>

                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: "8px",
                                    right: "-2px",
                                    width: "14px",
                                    height: "14px",
                                    backgroundColor: "#34C759",
                                    borderRadius: "50%",
                                    border: "1px solid #fff",
                                }}
                            >

                            </Box>

                           
                        
                            </Box>
                        ) : chat.isGroupChat === true && (
                            chat.photo ? (
                                // Display chat photo if available
                                <Avatar
                                    src={`${api}/${chat.photo}`}
                                    sx={{
                                        marginTop: "8px",
                                        width: "45px",
                                        height: "45px",
                                        background: "#D9D9D9",
                                    }}
                                />
                            ) : (
                                // Display participants' user_photos or fallback merged into one Avatar
                                <Avatar
                                    sx={{
                                        marginTop: "8px",
                                        width: "40px",
                                        height: "40px",
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
                                                    <MenuItem
                                                        onClick={() => {
                                                            handleDeleteChat(selectedChatId); // Call delete action
                                                            handleClose();
                                                        }}
                                                    >
                                                        Delete Chat
                                                    </MenuItem>
                                                </Menu>

                        <Box
                            sx={{
                                width: "100%",
                                marginLeft: "16px",
                                marginTop: "5px",
                                // border: "1px solid",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    // alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "10px",
                                    // border: "1px solid",
                                }}
                            >
                                <Typography
                                    sx={{
                                        width: "100%",
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#000",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        // border: "1px solid"
                                    }}
                                >
                                    {chat.name}
                                </Typography>

                                <Typography
                                    sx={{
                                        width: "70px",
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#3C3C4399"
                                    }}
                                
                                >
                                    {lastMessageTime}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingRight: "15px",
                                }}
                            >
                                {lastMessage && (
                                    <Typography
                                        sx={{
                                            fontSize: "16px",
                                            fontWeight: "400",
                                            color: "#3C3C4399",
                                            width: "190px",
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                            
                                        }}
                                    >
                                        {lastMessage.sender_id === authUser.staff_code 
                                            ? `You: ${lastMessage.text_content ? lastMessage.text_content : lastMessage.media_type || 'deleted message'}`
                                            : (lastMessage.text_content || lastMessage.media_type || `${lastMessage.sender?.userfullname} deleted a message`)
                                        }
                                    </Typography>
                                )}

                                {lastMessage && (
                                    lastMessage.sender_id === authUser.staff_code ? (
                                        // Show icons for messages sent by authUser
                                        !isSeen ? (
                                            <CheckIcon sx={{ fontSize: "22px", color: "#3C3C4399" }} />
                                        ) : (
                                            <DoneAllIcon sx={{ fontSize: "22px", color: "#14AE5C" }} />
                                        )
                                    ) : (
                                        // For messages not sent by authUser
                                        !lastMessage.viewedBy?.includes(authUser.staff_code) && (
                                            <CircleIcon sx={{ fontSize: "10px" }} />
                                        )
                                    )
                                )}
                                
                                
                                
                            </Box>
                        </Box>
                            </Box>
                            )
                        })
                    }

                    

                    {/* <Box
                        sx={{
                            display: "flex",
                            marginBottom: "8px",
                        }}
                    >
                        <Avatar
                            sx={{
                                marginTop: "8px",
                                width: "64px",
                                height: "64px",
                                background: "#D9D9D9",
                            }}
                        
                        >

                        </Avatar>

                        <Box
                            sx={{
                                width: "206px",
                                marginLeft: "16px",
                                marginTop: "14px",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    // justifyContent: "space-between",
                                    gap: "10px",
                                }}
                            >
                                <Typography
                                    sx={{
                                        width: "158px",
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#000",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        // border: "1px solid"
                                    }}
                                >
                                    Nay Thu Rein Soe Tint
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#3C3C4399"
                                    }}
                                
                                >
                                    21:54
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#3C3C4399",
                                    }}
                                >
                                    Hello
                                </Typography>
                                
                                <CheckIcon sx={{ fontSize: "22px", color: "#3C3C4399"}}/>
                                
                            </Box>
                        </Box>
                    </Box> */}
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
                    width: "100%",
                    paddingLeft: "24px",
                    paddingRight: "24px",
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
                                        src={`${api}/${authUser.photo}`}
                                        
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
                                    src={`${api}/${authUser.photo}`}
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
                        {authUser.staff_name}
                    </Typography>
                    <Button
                        onClick={handleOpenProfileDrawer}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#A8A8A8",
                            textTransform: "none",
                        }}
                    >
                        Edit profile
                    </Button>

                    <ProfileDrawer openProfileDrawer={profileDrawerOpen}  closeProfileDrawer={handleCloseProfileDrawer} userId={authUser.staff_code}/>
                </Box>
            </Box>

            
        </Box>
    )
}