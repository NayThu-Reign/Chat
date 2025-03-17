import { 
    Avatar,
    Box,
    Button,
    Drawer,
    IconButton,
    Modal,
    TextField,
    Typography,
    Radio,
    Checkbox,
    useMediaQuery

} from "@mui/material";

import {
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Close as CloseIcon,
} from "@mui/icons-material"
import { useEffect, useRef, useState } from "react";
import { useUIState } from "../providers/UIStateProvider";

import { useAuth } from "../providers/AuthProvider";

export default function GroupChatDrawer({ openGroupChatDrawer, closeGroupChatDrawer }) {

    const { authUser, users } = useAuth();
    const nameRef = useRef();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [ departments, setDepartments ] = useState([]);
    const [ selectedParticipants, setSelectedParticipants ] = useState([]);
    const api = import.meta.env.VITE_API_URL;
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
    const token = localStorage.getItem('token');
    // const token = Cookies.get('auth_tokens')


    






   

    // const handleUserSearch = (event) => {
    //     const { value } = event.target;
    //     setSearchTerm(value);
    //     if (value) {

    //         const lowercasedValue = value.toLowerCase();


    //         const usersByName = users.filter(user =>
    //             user.username.toLowerCase().includes(value.toLowerCase())
    //         );

    //         const departmentStaffs = departments
    //             .filter(dept => dept.name.toLowerCase().includes(lowercasedValue))
    //             .flatMap(dept => dept.staffs);

    //         const combinedResults = [...usersByName, ...departmentStaffs];

    //         // const uniqueUsers = [...new Map([...usersByName, ...departmentStaffs].map(user => [user.id, user])).values()];
    //         const uniqueUsers = combinedResults
    //             .filter(user => user.id !== authUser.id)
    //             .reduce((acc, user) => {
    //                 if(!acc.some(u => u.id === user.id)) {
    //                     acc.push(user);
    //                 }
    //                 return acc;
    //             }, []);
    //         setFilteredUsers(uniqueUsers);
    //     } else {
    //         setFilteredUsers([]);
    //     }
    // };

    const handleUserSearch = (event) => {
        const { value } = event.target;
        setSearchTerm(value);
    
        if (value) {
            const lowercasedValue = value.toLowerCase();
    
            // Filter users by username or departmentName
            const usersByNameOrDepartment = users.filter(user =>
                user.userfullname.toLowerCase().includes(lowercasedValue) ||
                user.departmentName.toLowerCase().includes(lowercasedValue)
            );
    
            // Exclude the authenticated user and ensure unique results
            const uniqueUsers = usersByNameOrDepartment
                .filter(user => user.employeeId !== authUser.staff_code)
                .reduce((acc, user) => {
                    if (!acc.some(u => u.employeeId === user.employeeId)) {
                        acc.push(user);
                    }
                    return acc;
                }, []);
    
            setFilteredUsers(uniqueUsers);
        } else {
            setFilteredUsers([]);
        }
    };
    
    const handleSelectParticipant = (user) => {
        setSelectedParticipants((prevSelectedParticipants) => {
            if (prevSelectedParticipants.some(participant => participant.employeeId === user.employeeId)) {
                // If user is already selected, remove them
                return prevSelectedParticipants.filter(participant => participant.employeeId !== user.employeeId);
            } else {
                // If user is not selected, add them
                return [...prevSelectedParticipants, user];
            }
        });
    };

    const removeSelectedParticipant = (user) => {
        setSelectedParticipants((prevSelectedParticipants) => {
          return prevSelectedParticipants.filter(parti => parti.employeeId !== user.employeeId);
        })
    }

    const createChat = async (event) => {
        event.preventDefault(); // Prevent default if called with an event
        const participantIds = selectedParticipants.map(participant => participant.employeeId);

        const name = nameRef.current.value;
       
       

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    isGroupChat: true,
                    participantIds,
                    
                })
            });

            console.log("Response", response);
           
            
            if(response) {

                console.log('successfully created a chat')
                setSelectedParticipants([]);
                setSearchTerm('');
                nameRef.current.value="";
                setFilteredUsers([]);
                closeGroupChatDrawer();

                
                    
                //     console.log('Emitting newMessage event with:', response);
                // // socket.emit('sendMessage', savedMessage);    // Emit the saved message, not the original one
                // // console.log("Hi", savedMessage);
                // socket.emit('newMessage', response);

                // textContentRef.current.value="";
                // setMediaType(null);
                // setMediaUrl(null);
                // setSelectedFile(null); // Clear the file after sending the message
                
                // if(repliedMessage) {
                //     setRepliedMessage(null)
                // }

                // if(currentUserId) {
                //     setCurrentChatId(response.chat_id);
                //     fetchChat();
                //     setCurrentUserId(null);
                    
                // } else {
                //     setChat((prev) => ({
                //         ...prev,
                //         messages: [
                //             ...(prev.messages || []), // Spread the existing messages array (or use an empty array if undefined)
                //             response             // Add the new message to the end
                //         ]
                //     }));
                //     // textContentRef.current.value="";
                //     // setMediaType(null);
                //     // setMediaUrl(null);
                //     // setSelectedFile(null); // Clear the file after sending the message
                // }
                // // setMessages(prevMessages => [...prevMessages, savedMessage]);  // Update state with the full message
               
                

            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };


    return (
        <Modal
            open={openGroupChatDrawer}
            onClose={closeGroupChatDrawer}
            sx={{
                background: 'background.paper',
            }}
        >
            <Box
                sx={{
                    width: isMobileOrTablet ? "100%" : "800px",
                    paddingLeft: "32px",
                    paddingRight: "32px",
                    paddingTop: "24px",
                    paddingBottom: "24px",
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: "#fff",
                    boxShadow: 'none',  // Removes the box shadow
                    border: 'none',      // Removes the border
                    outline: 'none', // Disable the outline to prevent the initial border
                    height: "700px",
                    overflowY: "auto",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <Avatar
                            sx={{
                                width: "64px",
                                height: "64px",
                                background: "#A8A8A8",
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#FFFFFF"
                            }}
                        >
                            G
                        </Avatar>
                        <Typography
                            sx={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#121660",
                            }}
                        >
                            Create a Group
                        </Typography>
                    </Box>

                    <IconButton
                        onClick={closeGroupChatDrawer}
                    >
                        <CloseIcon sx={{ fontSize: "20px", color: "#FF3B30"}}/>
                    </IconButton>

                </Box>

                <Box
                    sx={{
                        marginTop: "40px",

                    }}
                
                >
                    <Typography
                        sx={{
                            fontSize: "20px",
                            fontWeight: "200",
                            color: "#121660",
                        }}
                    >
                        Group&apos;s name
                    </Typography>
                    <Box
                        sx={{
                            width: "100%",
                            borderRadius: "8px",
                            // border: "0.5px solid #C6C6C8",
                            height: "24px",
                        }}
                    >
                        <TextField
                            fullWidth
                            type="text"
                           
                            sx={{ 
                                mb: 2,
                                backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                    height: "100%",
                                },
                                                    
                            }}
                            inputRef={nameRef}
                        />
                    </Box>
                </Box>

                <Box
                    sx={{
                        marginTop: "40px",
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "20px",
                            fontWeight: "400",
                            color: "#121660",
                        }}
                    >
                        Add Participants
                    </Typography>

                    <Box
                        sx={{
                            marginTop: "16px",
                            
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Added members:
                            </Typography>

                            <Box 
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "18px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {selectedParticipants?.length > 0 && selectedParticipants.map(participant => (
                                    <Box
                                        key={participant.employeeId}
                                        sx={{
                                            paddingLeft: "16px",
                                            paddingRight: "16px",
                                            paddingTop: "6px",
                                            paddingBottom: "6px",
                                            border: "1px solid #E5E5EA",
                                            borderRadius: "100px",
                                            display: "flex",
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                            // justifyContent: "space-between",
                                            gap: "24px",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <Avatar
                                                src={`${api}/${participant?.user_photo}`}
                                                sx={{
                                                    width: "24px",
                                                    height: "24px",
                                                }}
                                            >

                                            </Avatar>
                                            <Typography
                                                sx={{
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    color: "#00000",
                                                }}
                                            >
                                                {participant.userfullname}
                                            </Typography>
                                        </Box>

                                        <IconButton
                                            sx={{
                                                border: "0.5px solid #E5E5EA"
                                            }}
                                            onClick={() => removeSelectedParticipant(participant)}
                                        >
                                            <CloseIcon sx={{ fontSize: "10px", color: "#FF3B30"}}/>
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",
                                borderRadius: "8px",
                                border: "0.5px solid #C6C6C8",
                                paddingTop: "20px",
                                paddingBottom: "20px",
                                paddingLeft: "16px",
                                paddingRight: "16px",
                            }}
                        >
                            <Box
                                sx={{
                                    borderBottom: "1px solid #E5E5EA"
                                }}
                            >
                                <TextField
                                    fullWidth
                                    type="text"
                                    placeholder="Search by username or department..."
                                    value={searchTerm}
                                    onChange={handleUserSearch}
                                    sx={{ 
                                        mb: 2,
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
                            {filteredUsers.length > 0 && (
                                <Box
                                    sx={{
                                        marginTop: "24px",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "12px",
                                            fontWeight: "400",
                                            color: "#3C3C4399",
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
                                            height: "200px",
                                            overflowY: "auto",
                                        }}
                                    >

                                        {filteredUsers.map(user => (
                                            <Box
                                                key={user.employeeId}
                                                sx={{
                                                    padding: "16px",
                                                    borderRadius: "8px",
                                                    background: "#F7FBFD",
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={selectedParticipants.some(participant => participant.employeeId === user.employeeId)}
                                                        onChange={() => handleSelectParticipant(user)}
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

                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: "4px",
                                                            // alignItems: "center",

                                                        }}
                                                    >
                                                        <Avatar
                                                            src={`${api}/${user?.user_photo}`}
                                                            sx={{
                                                                width: "44px",
                                                                height: "44px",
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
                                                                    width: "100px",
                                                                    overflow: "hidden",
                                                                    whiteSpace: "nowrap",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {user.userfullname}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "12px",
                                                                    fontWeight: "500",
                                                                    color: "#8E8E93",
                                                                    width: "200px",
                                                                    overflow: "hidden",
                                                                    whiteSpace: "nowrap",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {user.position}, {user.departmentName}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}

                                    </Box>
                            </Box>
                            )}
                        </Box>
                    </Box>

                </Box>

                <Box
                    sx={{
                        marginTop: "40px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",

                    }}
                >
                    <Button
                        onClick={closeGroupChatDrawer}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#FF3B30",
                            textTransform: "none",
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={createChat}
                        variant="contained"
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            background: "#121660",
                            color: "#DEF2FF",
                            textTransform: "none",
                        }}
                    >
                        Create Group
                    </Button>
                </Box>
            </Box>
        </Modal>
    )
}