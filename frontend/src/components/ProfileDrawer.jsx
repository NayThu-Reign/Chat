import { 
    Avatar,
    Box,
    Button,
    IconButton,
    Modal,
    TextField,
    Typography,
    Checkbox,
    useMediaQuery,
    CircularProgress

} from "@mui/material";

import {
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    ArrowDropDown as ArrowDropDownIcon,
    ArrowDropUp as ArrowDropUpIcon,
} from "@mui/icons-material"
import { useEffect, useRef, useState } from "react";
import { useUIState } from "../providers/UIStateProvider";

import { useAuth } from "../providers/AuthProvider";
import { io } from 'socket.io-client';
import CompanyLogo from "../images/TrustLinkLogo.jpg";






export default function ProfileDrawer({ openProfileDrawer, closeProfileDrawer, userId, setUserId }) {

     const { authUser, setAuthUser, users, setUsers, socket} = useAuth();
     const token = localStorage.getItem('token');
     const [ loadingPhoto, setLoadingPhoto ] = useState(true);
     const [fullscreenImage, setFullscreenImage] = useState(null);

     const openFullscreen = (url) => {
        setFullscreenImage(url);
    };

    const closeFullscreen = () => {
        setFullscreenImage(null);
    };

    // const token = Cookies.get('auth_tokens')

    
    
      // const { authUser } = useAuth();
    const api = import.meta.env.VITE_API_URL;
    const [detailsOpen, setDetailsOpen] = useState(false);

    const usernameRef = useRef();
    // const { authUser, setAuthUser, users, setUsers } = useAuth();

    // console.log("USERRS", users);
    

    const fileInputRef = useRef();
    const [ userPhoto, setUserPhoto ] = useState(null);
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


    console.log("UserId", userId);
    
    const [ user, setUser ] = useState([]);
    const [ editName, setEditName ] = useState(false);

    const fetchUser = async () => {
        try {
            const result = await fetch(`https://portal.trustlinkmm.com/api/getEmployeeByStaffCode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ staff_code: userId })
            });
    
            const data = await result.json();
            console.log("Fetched user data:", data);
    
            if (data.staffs && data.staffs.length > 0) {
                const userInfo = data.staffs[0]; // Get the first staff object
    
                // Find matching user in users[]
                const matchingUser = users.find((user) => user.employeeId == userId);
    
                // Add photo if available
                if (matchingUser && matchingUser.photo) {
                    userInfo.photo = matchingUser.photo;
                } else {
                    console.warn("No matching user or photo found in users[].");
                }
    
                // Only update the user state after ensuring photo is added
                setUser(userInfo);
                console.log("Updated user with photo:", userInfo);
                setLoadingPhoto(false);
            } else {
                console.error("No user data found from API response.");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            throw error;
        }
    };
    

    console.log("userPhoto", users)

    useEffect(() => {
        if (userId && users.length > 0) {
            fetchUser();
        }
    }, [userId]);


   useEffect(() => {
  const handleUserPhotoUpdate = (updatedUser) => {
    console.log("Updated user photo:", updatedUser);

    // Update authUser if the updated user matches
    if (authUser?.employeeId === updatedUser.user_id) {
      setAuthUser((prevAuthUser) => ({
        ...prevAuthUser,
        photo: updatedUser.photo,
      }));
    }

    // Update user state
    setUser((prevUser) => ({
      ...prevUser,
      photo: updatedUser.photo,
    }));

    // Update users list
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.employeeId === updatedUser.user_id
          ? { ...user, photo: updatedUser.photo }
          : user
      )
    );

    // Update local storage
    const storedPhotos =
      JSON.parse(localStorage.getItem("employeePhoto")) || [];
    const updatedPhotos = storedPhotos.map((photo) =>
      photo.user_id === updatedUser.user_id
        ? { ...photo, photo: updatedUser.photo }
        : photo
    );

    if (!storedPhotos.some((photo) => photo.user_id === updatedUser.user_id)) {
      updatedPhotos.push({
        user_id: updatedUser.user_id,
        photo: updatedUser.photo,
      });
    }

    localStorage.setItem("employeePhoto", JSON.stringify(updatedPhotos));
  };

  // Register the event listener
  socket.on("userPhoto", handleUserPhotoUpdate);

  // Cleanup the event listener on component unmount
  return () => {
    socket.off("userPhoto", handleUserPhotoUpdate);
    console.log("Removed userPhoto listener");
  };
}, [socket, authUser, setAuthUser, setUsers]);
   

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
               
      
                const result = await fetch(`${api}/api/users/update/${userId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    user_photo: photo,
                  })
                  
                });

                console.log("RESULTTT", result);

                if(result.status === 201) {
                    window.location.reload();
                }
      
              //   if (!res.ok) {
              //     if (res.status === 401) {
              //       throw new Error('Unauthorized: Please login to access chats');
              //     } else {
              //         console.error('Error fetching chats:', res.error);
              //     }
              //   }
      
                
                
                // if(result) {
                //     fetchUser();
                // } else {
                //     console.log("Something wrong")
                // }
      
              } catch (error) {
                console.error(error);
                throw error;
              }
            
        }
    };

    

    const handleEdit = async (e) => {
        e.preventDefault();
        const username = usernameRef.current.value;
        try {

            const api = import.meta.env.VITE_API_URL;
           
  
            const result = await fetch(`${api}/api/users/update/${userId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                username: username,
              })
              
            });
  
          //   if (!res.ok) {
          //     if (res.status === 401) {
          //       throw new Error('Unauthorized: Please login to access chats');
          //     } else {
          //         console.error('Error fetching chats:', res.error);
          //     }
          //   }
  
            
            
            if(result) {
                fetchUser();
                setEditName(false);
            } else {
                console.log("Something wrong")
            }
  
          } catch (error) {
            console.error(error);
            throw error;
          }
    }

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

      const handleInputChange = (event) => {
        const { name, value } = event.target;
        setUser((prevUser) => ({
          ...prevUser,
          [name]: value,
        }));
      };

      const toggleDetails = () => {
        setDetailsOpen(prev => !prev);
    };

      if(!user || !user.username || !user.photo) {
        <Box>Loading...</Box>
      }
      


    return (
        <Modal
            open={openProfileDrawer}
            onClose={closeProfileDrawer}
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
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#121660",
                        }}
                    >
                        {userId === authUser.staff_code ? "Your Profile" : "Profile"}
                    </Typography>

                    <IconButton
                        onClick={closeProfileDrawer}
                    >
                        <CloseIcon />
                    </IconButton>

                </Box>

                <Box
                    sx={{
                        marginTop: "40px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}
                >   
                    <Avatar

                         src={authUser.staff_code == userId ? `${api}/${authUser.photo}` : `${api}/${user.photo}`} // Display fallback image while loading
                        onLoad={() => setLoadingPhoto(false)} // Set loadingPhoto to false once the image is loaded
                        onClick={() => openFullscreen(authUser.staff_code == userId ? `${api}/${authUser.photo}` : `${api}/${user.photo}`)}
                        sx={{
                            width: "64px",
                            height: "64px",
                            background: "#A8A8A8",
                        }}
                    >
                         {loadingPhoto && <CircularProgress sx={{ fontSize: "15px", color: "#F6FBFD" }} />} 
                    </Avatar>

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

                    
                    <Box>
                        <Typography
                            sx={{
                                fontSize: isMobileOrTablet ? "15px" : "20px",
                                fontWeight: "500",
                                color: "#000000",
                            }}
                        >
                            {user.userfullname}
                        </Typography>
                        {/* <Typography
                            sx={{
                                marginTop: "4px",
                                fontSize: isMobileOrTablet ? "13px" : "15px",
                            }}
                        >
                            {user.position}, {user.departmentName}
                        </Typography> */}
                    </Box>
                </Box>

                
                <Box
                    sx={{
                        marginTop: "40px",

                    }}
                >
                   <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
			    cursor: "pointer"
                        }}
 			onClick={toggleDetails}
                   >
                        <Typography
                            sx={{
                                fontSize: "16px",
                                fontWeight: "400",
                                color: "#A8A8A8",
                            }}
                        >
                            Details
                        </Typography>
                        <IconButton
                            
                            sx={{ marginLeft: "8px", fontSize: "20px" }}
                        >
                            {detailsOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                        </IconButton>

                   </Box>
                    {detailsOpen && (
                        <Box
                        sx={{
                            marginTop: "8px",
                            paddingTop: "16px",
                            paddingBottom: "16px",
                            paddingLeft: "24px",
                            paddingRight: "24px",
                            background: "#F7FBFD",
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Profile Photo
                            </Typography>
                            <Box
                                sx={{
                                    marginTop: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px"
                                }}
                            >
                                <Avatar

                                    src={authUser.staff_code == userId ? `${api}/${authUser.photo}` : `${api}/${user.photo}`} // Display fallback image while loading
                                    onLoad={() => setLoadingPhoto(false)} // Set loadingPhoto to false once the image is loaded
                                    onClick={() => openFullscreen(authUser.staff_code == userId ? `${api}/${authUser.photo}` : `${api}/${user.photo}`)}
                                    sx={{
                                    width: "64px",
                                    height: "64px",
                                    background: "#A8A8A8",
                                    }}
                                    >
                                    {loadingPhoto && <CircularProgress sx={{ fontSize: "15px", color: "#F6FBFD" }} />} 
                                </Avatar>
                                {user.employeeId === authUser.staff_code && (
                                    <>
                                        <Button
                                            onClick={triggerFileInput}
                                            sx={{
                                                fontSize: "12px",
                                                fontWeight: "400",
                                                color: "blue",
                                                textTransform: "none",
                                                textDecoration: "underline",
                                                "&:hover": {
                                                    background: "transparent"
                                                }
                                            }}
                                        >
                                            edit photo
                                        </Button>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            style={{ display: 'none'}}
                                            onChange={handleFileChange}
                                
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
                                )}
                               
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",

                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#A8A8A8",
                                    }}
                                >
                                    Name
                                </Typography>

                                

                                


                            </Box>
                           
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#1D0707",
                                    }}
                                >
                                    {user.userfullname}
                                </Typography>

                          

                            
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",

                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Position
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#1D0707",
                                }}
                            >
                                {user.position}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",

                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Department
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#1D0707",
                                }}
                            >
                                {user.departmentName}
                            </Typography>
                        </Box>

                    </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    )
}