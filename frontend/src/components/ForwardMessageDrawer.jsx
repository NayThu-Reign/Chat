import { Avatar, Box, Button, Checkbox, IconButton, Modal, TextField, Typography, useMediaQuery } from "@mui/material";
import {
    ArrowBackIos as ArrowBackIosIcon,
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from "@mui/icons-material"
import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";



export default function ForwardMessageDrawer({ openForwardMessageDrawer, closeForwardMessageDrawer, selectedMessageId, handleMenuClose }) {

    const [searchTerm, setSearchTerm] = useState('');
    const [ chats, setChats ] = useState([]);
    const [ selectedChats, setSelectedChats ] = useState([]);

    const [filteredChats, setFilteredChats] = useState([]);
    const { authUser } = useAuth();
    const api = import.meta.env.VITE_API_URL;
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
    const token = localStorage.getItem(`token`);
    // const token = Cookies.get('auth_tokens')




    const fetchChats = async () => {
        try {
            // const user = JSON.parse(localStorage.getItem('user'));

          const api = import.meta.env.VITE_API_URL;
         

          const result = await fetch(`${api}/api/chatsOne`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
            
          });

          const data = await result.json();

          
          setChats(data.processedChats);
          setFilteredChats(data.processedChats);
          console.log("hello", data);

        } catch (error) {
          console.error(error);
          throw error;
        }
    };


    useEffect(() => {
        fetchChats();
    }, []);

    const handleChatSearch = (event) => {
        const { value } = event.target;
        setSearchTerm(value);
        if (value) {


            const usersByName = chats.filter(chat =>
                chat.name.toLowerCase().includes(value.toLowerCase())
            );

            

            
            setFilteredChats(usersByName);
        } else {
            setFilteredChats(chats);
        }
    };

    const handleSelectChat = (chat) => {
        setSelectedChats((prevSelectedChats) => {
            if (prevSelectedChats.some(c => c.id === chat.id)) {
                // If user is already selected, remove them
                return prevSelectedChats.filter(c => c.id !== c.id);
            } else {
                // If user is not selected, add them
                return [...prevSelectedChats, chat];
            }
        });
    };

    // const removeSelectedGroup = (group) => {
    //     setSelectedGroups((prevSelectedGroups) => {
    //       return prevSelectedGroups.filter(parti => parti.id !== group.id);
    //     })
    // }

    const handleForward = async (event) => {
        event.preventDefault(); // Prevent default if called with an event
        
        const chatIds = selectedChats.map(chat => chat.id);
        // const recipientIds = selectedChats.map(chat => chat.reci)
              

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/messages/forward`, {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatIds: chatIds,
                    originalMessageId: selectedMessageId,
                    senderId: authUser.id,        
                })
            });

            console.log("Response", response);
           
            
            if(response) {

                console.log('successfully forwarded messages')
               
                closeForwardMessageDrawer();
                handleMenuClose();
                

            } else {
                throw new Error('Failed to forward message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };

    return (
        <Modal
        open={openForwardMessageDrawer}
        onClose={closeForwardMessageDrawer}
        sx={{
            background: 'white', // Adds a translucent overlay for the modal
        }}
    >
        <Box
             sx={{
                width: isMobileOrTablet ? "100%" : "800px",
                // paddingLeft: "32px",
                // paddingRight: "32px",
                // paddingTop: "24px",
                height: "400px",
                overflowY: "auto",
                paddingBottom: "24px",
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: "#fff",
                boxShadow: 'none',  // Removes the box shadow
                border: 'none',      // Removes the border
                outline: 'none', // Disable the outline to prevent the initial border
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    // marginBottom: "40px",
                }}
            >
                <IconButton
                    onClick={closeForwardMessageDrawer}
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
                    Select Chats
                </Typography>

            </Box>

           <Box
                sx={{
                    // paddingLeft: "10px",
                    // paddingRight: "10px",
                    display: "flex",
                    // alignItems: "center",
                    // justifyContent: "center",
                    paddingLeft: "30px",
                    marginBottom: "20px",
                }}
           >
                <TextField
                    
                    type="text"
                    placeholder="Search Chats"
                    value={searchTerm}
                    onChange={handleChatSearch}
                    sx={{ 
                        width: isMobileOrTablet ? "80%" : "250px",
                        // marginBottom: "15px",
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                                borderColor: "black",
                            },
                            height: "24px",
                        },
                                                                
                    }}
                                        
                />

                



           </Box>

           {filteredChats.length > 0 && (
                                <Box
                                sx={{
                                    marginTop: "24px",
                                    marginBottom: "20px",
                                    // border: "1px solid",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "12px",
                                        fontWeight: "400",
                                        color: "#3C3C4399",
                                        marginLeft: "30px",
                                    }}
                                >
                                    Search results;
                                </Typography>

                                <Box
                                    sx={{
                                        marginTop: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                        flexDirection: "column",
                                    }}
                                >
                                    {filteredChats.map(chat => {

                                        let participant = null;
                                        if (chat.isGroupChat === false) {
                                            // Use filter to exclude authUser, then select the first (and only) other participant
                                            participant = chat.participants?.filter(c => c.employee !== authUser.staff_code)[0];
                                        }

                                        return (
                                            <Box
                                            key={chat.id}
                                            sx={{
                                                width: isMobileOrTablet ? "100%" : "600px",
                                                paddingTop: "10px",
                                                paddingBottom: "10px",
                                                paddingLeft: "10px",
                                                borderRadius: "8px",
                                                background: "#F7FBFD",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: "10px",
                                                            alignItems: "center",

                                                        }}
                                                    >
                                                        <Avatar
                                                            src={ chat.isGroupChat ? "" : `${api}/${participant?.user_photo}`}
                                                            sx={{
                                                                width: "30px",
                                                                height: "30px",
                                                                background: "#D9D9D9",
                                                            }}
                                                        >
                                                        </Avatar>

                                                        <Box>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "500",
                                                                    color: "#000000",
                                                                }}
                                                            >
                                                                {chat.name}
                                                            </Typography>
                                                           
                                                            
                                                        </Box>
                                                    </Box>
                                                

                                                   
                                                        <Checkbox
                                                            checked={selectedChats.some(c => c.id === chat.id)}
                                                            onChange={() => handleSelectChat(chat)}
                                                            icon={<RadioButtonUncheckedIcon />} // Unchecked state icon
                                                            checkedIcon={<RadioButtonCheckedIcon />} // Checked state icon
                                                            sx={{
                                                                '& .MuiSvgIcon-root': {
                                                                    fontSize: 16,
                                                                    borderRadius: "100px",
                                                                    backgroundColor: "#fff",
                                                                    // border: "0.5px solid #000000",
                                                                },
                                                                '&.Mui-checked': {
                                                                    color: '#000', // Color when checked
                                                                }
                                                            }}
                                                        />
                                                    
                                            </Box>
                                        </Box>
                                        )
                                    })}
                                </Box>
                            </Box>
                )}

           <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    position: "fixed",
                    // marginTop: "100px",
                    // bottom: "0px",
                    zIndex: 1000,
                    width: isMobileOrTablet ? "100%" : "750px",
                    // paddingLeft: "24px",
                    // paddingRight: "24px",
                    background: "white",
                }}
            
            >
                
                    <Button
                        variant="contained"
                        onClick={handleForward}
                        disabled={selectedChats.length === 0}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#fff",
                            textTransform: "none",

                        }}
                    >
                        Send
                    </Button>

            </Box>

        </Box>
    </Modal>
    )
}