import {
    Avatar,
    Box,
    Button,
    Checkbox,
    IconButton,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material"

import {
    ArrowBackIos as ArrowBackIosIcon,
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Close as CloseIcon,
} from "@mui/icons-material"
import { useEffect, useState } from "react";

import { useAuth } from "../providers/AuthProvider";


export default function AddGroupDrawer({ closeAddGroupDrawer, chat, user }) {

    const [searchTerm, setSearchTerm] = useState('');
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");

    const [filteredGroups, setFilteredGroups] = useState([]);
    const [ chats, setChats ] = useState([]);
    const [ departments, setDepartments ] = useState([]);
    const [ selectedGroups, setSelectedGroups ] = useState([]);

    const { authUser } = useAuth();
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    // const token = Cookies.get('auth_tokens')


    const fetchChats = async () => {
        try {
            const token = localStorage.getItem(`token`);
            // const user = JSON.parse(localStorage.getItem('user'));

          const api = import.meta.env.VITE_API_URL;
         

          const result = await fetch(`${api}/api/chats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            
          });

          const data = await result.json();



          const groups = data.filter(g => g.isGroupChat === true);

        //   if (!res.ok) {
        //     if (res.status === 401) {
        //       throw new Error('Unauthorized: Please login to access chats');
        //     } else {
        //         console.error('Error fetching chats:', res.error);
        //     }
        //   }
          
          setChats(groups);
          console.log("hello", groups);

        } catch (error) {
          console.error(error);
          throw error;
        }
    };


    useEffect(() => {
        fetchChats();
    }, []);

    const handleGroupSearch = (event) => {
        const { value } = event.target;
        setSearchTerm(value);
        if (value) {


            const usersByName = chats.filter(chat =>
                chat.name.toLowerCase().includes(value.toLowerCase())
            );

            

            
            setFilteredGroups(usersByName);
        } else {
            setFilteredGroups([]);
        }
    };

    const handleSelectGroup = (group) => {
        setSelectedGroups((prevSelectedGroups) => {
            if (prevSelectedGroups.some(g => g.id === group.id)) {
                // If user is already selected, remove them
                return prevSelectedGroups.filter(g => g.id !== group.id);
            } else {
                // If user is not selected, add them
                return [...prevSelectedGroups, group];
            }
        });
    };

    const removeSelectedGroup = (group) => {
        setSelectedGroups((prevSelectedGroups) => {
          return prevSelectedGroups.filter(parti => parti.id !== group.id);
        })
    }

    const handleAddGroup = async (event) => {
        event.preventDefault(); // Prevent default if called with an event
        
        const groupIds = selectedGroups.map(group => group.id);
              

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/users/${user.employeeId}/add-to-group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatIds: groupIds
                    
                })
            });

            console.log("Response", response);

            if(response.status === 403) {
                alert('Only Admin can add new user')
            }
           
            
            if(response.status === 201) {

                console.log('successfully added participants into a chat')
               
                closeAddGroupDrawer();
                

            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };

    return (
        <Box
            sx={{
                width: isMobileOrTablet ? "100%" : "350px",
                paddingTop: "10px",
                // paddingBottom: "10px",
                // paddingRight: "10px",
                paddingLeft: "10px",
                borderLeft: "1px solid #E5E5EA",
                // border: "1px solid",
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
                    onClick={closeAddGroupDrawer}
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
                    Select Groups
                </Typography>

            </Box>

            <Box
                sx={{
                    marginBottom: "20px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                {selectedGroups?.length > 0 && selectedGroups.map(group => (
                                    <Box
                                        key={group.id}
                                    >     
                                            <Avatar
                                                // src={`${api}/${participant.user_photo}`}
                                                sx={{
                                                    width: "38px",
                                                    height: "38px",
                                                    border: "1px solid",
                                                }}
                                            >

                                            </Avatar>                                    
                                    </Box>
                ))}
            </Box>

           <Box
                sx={{
                    paddingLeft: "10px",
                    paddingRight: "10px",
                }}
           >
                <TextField
                    
                    type="text"
                    placeholder="Search Group Chat"
                    value={searchTerm}
                    onChange={handleGroupSearch}
                    sx={{ 
                        width: isMobileOrTablet ? "100%" : "250px",
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

                {filteredGroups.length > 0 && (
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
                                        flexDirection: "column",
                                    }}
                                >
                                    {filteredGroups.map(group => (
                                        <Box
                                            key={group.id}
                                            sx={{
                                                width: isMobileOrTablet ? "100%" : "300px",
                                                paddingTop: "10px",
                                                paddingBottom: "10px",
                                                paddingLeft: "10px",
                                                paddingRight: "10px",
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
                                                            src={`${api}/${group.photo}`}
                                                            sx={{
                                                                width: "50px",
                                                                height: "50px",
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
                                                                {group.name}
                                                            </Typography>
                                                           
                                                            
                                                        </Box>
                                                    </Box>
                                                

                                                    {group.participants.some(p => p.employeeId === user.employeeId) ? (
                                                        <Typography
                                                            sx={{
                                                                color: '#8E8E93',
                                                                fontSize: '12px',
                                                            }}
                                                        >
                                                            participant
                                                        </Typography>
                                                    ) : (
                                                        <Checkbox
                                                            checked={selectedGroups.some(g => g.id === group.id)}
                                                            onChange={() => handleSelectGroup(group)}
                                                            icon={<RadioButtonUncheckedIcon />} // Unchecked state icon
                                                            checkedIcon={<RadioButtonCheckedIcon />} // Checked state icon
                                                            sx={{
                                                                '& .MuiSvgIcon-root': {
                                                                    fontSize: 16,
                                                                    borderRadius: "100px",
                                                                    backgroundColor: "#fff",
                                                                    border: "0.5px solid #000000",
                                                                },
                                                                '&.Mui-checked': {
                                                                    color: '#000', // Color when checked
                                                                }
                                                            }}
                                                        />
                                                    )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            )}



           </Box>

           <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    position: "fixed",
                    bottom: "10px",
                    zIndex: 1000,
                    width: isMobileOrTablet ? "100%" : "300px",
                    paddingLeft: "24px",
                    paddingRight: "24px",
                    background: "white",
                }}
            
            >
                
                    <Button
                        variant="contained"
                        onClick={handleAddGroup}
                        disabled={selectedGroups.length === 0}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#fff",
                            textTransform: "none",

                        }}
                    >
                        Add
                    </Button>

            </Box>

        </Box>
    )
}