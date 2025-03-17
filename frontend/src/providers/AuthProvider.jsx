import { createContext, useState, useContext, useEffect, useRef } from 'react';
import Cookies from "js-cookie";


import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};



export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("token"));
    const [socket, setSocket] = useState(null);
  const [ users, setUsers ] = useState([]);
  const [ photos, setPhotos ] = useState([]);
  const api = import.meta.env.VITE_API_URL;

  const [ activeUsers, setActiveUsers ] = useState([]);
  const [authUser, setAuthUser] = useState(() => {
    const storedUser = localStorage.getItem("user");

    console.log("storedUser", storedUser);


    
   return storedUser && storedUser !== "undefined" && storedUser !== null
  ? {
      ...JSON.parse(storedUser || "{}"), // Prevent undefined error
      active: false,
      logoutTime: null,
      photo: null
    }
  : null;});

  console.log("AUTHUSERRR", authUser);

  const usersReady = useRef(false);


  const [loading, setLoading] = useState(true);

  const redirectToLogin = () => {
    const redirectUri = encodeURIComponent(window.location.href); // Redirect back to current page after login
    window.location.href = `https://sso.trustlinkmm.com/loginForm?redirect_uri=${redirectUri}`;
  };

  const authTokens = Cookies.get("auth_tokens");

  console.log("auth_tokens", accessToken);


 const checkSSO = async () => {
    try {
      const authTokens = Cookies.get("auth_tokens");
      console.log("authTokens (raw):", authTokens);

      if (!authTokens) {
        console.log("No auth tokens found.");
        return redirectToLogin();
      }

      const response = await fetch("https://sso.trustlinkmm.com/api/verify_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: authTokens }),
        credentials: "include",
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("API Response:", responseData);

        // Extract the user array from the response
        const users = responseData.user; // Assuming `user` is an array
        const token = responseData.token;

        // Check if the array exists and has at least one item
        if (!users || users.length === 0) {
          console.log("User data not found in response.");
           return redirectToLogin();
        }

        // Use the first user in the array
        const firstUser = users[0];
        setAccessToken(token);
        setAuthUser(firstUser); // Set the first user object

        // Store the first user in localStorage
        localStorage.setItem("user", JSON.stringify(firstUser));
        localStorage.setItem("token", token);

      } else {
        console.log("Token invalid.");
        return redirectToLogin();
      }
    } catch (error) {
      console.error("Error during verification:", error);
      return redirectToLogin();
    }
  };  

console.log("AccessToken", accessToken);
  useEffect(() => {
    const authenticateUser = async () => {
      // const authTokens = Cookies.get("auth_tokens");
      // console.log('authTokens ', authTokens);
      // if (!accessToken) {
      //   console.log("No auth tokens found. Logging out...");
      //   localStorage.removeItem("token");
      //   localStorage.removeItem("user");
      //   setAccessToken(null);
      //   setAuthUser(null);
      //   return redirectToLogin();
      // }

      const params = new URLSearchParams(window.location.search || window.location.hash.replace("#", "?"));
      
      const token = params.get("token");
      
      const user = params.get("user");
      
  
      if (token && user) {
          try {
              const response = await fetch(`${api}/api/users/get-detail`, {
                  method: "GET",
                  headers: { 
                    // "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}`
                  },
                  credentials: "include",
              });
              const data = await response.json();
              if(data.status === 1) {
                 const user = data.user;
                 localStorage.setItem("token", token);
                 localStorage.setItem("user", JSON.stringify(user));
                 setAccessToken(token);
                 setAuthUser(user);
                 window.history.replaceState({}, document.title, "/");
                 await new Promise((resolve) => setTimeout(resolve, 100));
                 setLoading(false);
                 return;
              } else {
                console.log("Invalid user JSON:", data);
              }
             
          } catch (error) {
              console.error("Invalid user JSON:", user);
          }
              
      }
  
      // await checkSSO(); // Proceed with normal SSO check if no token in URL
      setLoading(false);
    };
  
    if (!accessToken) {
      authenticateUser();
    } else {
      const currentPath = window.location.pathname; // Get the current path (e.g., /conversation)
      window.history.replaceState({}, document.title, currentPath);
      setLoading(false);
    }
  }, [accessToken]);

  // useEffect(() => {
  //   const interval = setInterval(checkSSO, 30000); // Check every 30 sec
  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, []);

  

useEffect(() => {
  const currentPath = window.location.pathname;
  window.history.replaceState({}, document.title, currentPath);
}, []);
  

  

  useEffect(() => {

    if (!authUser) {
    console.log("Waiting for authUser before initializing socket...");
    return;
   }

  if (!authUser.staff_code) {
    console.log("authUser is set but missing staff_code:", authUser);
    return;
  }
   

    if (authUser?.staff_code) {
      
        console.log("Initializing socket with authUser after delay:", authUser);

        const newSocket = io(import.meta.env.VITE_API_URL, {
          withCredentials: true,
          query: {
            user: JSON.stringify({
              staff_code: authUser.staff_code,
            }),
          },
          reconnection: true, // Enable auto-reconnection
          reconnectionAttempts: Infinity, // Infinite attempts (default if omitted)
          reconnectionDelay: 1000, // Time between attempts in milliseconds (default: 1000ms)
          reconnectionDelayMax: 5000, // Maximum delay between reconnection attempts
        });

        newSocket.on("connect", () => {
          console.log("Connected to server with ID:", newSocket.id);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Disconnected from server:", reason);
        });

        

        newSocket.on("userConnected", ({ employeeId }) => {
          console.log("User connected:", employeeId);
          setActiveUsers((prevActiveUsers) => {
            // Add the connected user if not already in the list
            if (!prevActiveUsers.some((user) => user.employeeId === employeeId)) {
              return [...prevActiveUsers, { employeeId, active: true }];
            }
            return prevActiveUsers;
          });
        });
    
        // Handle user disconnections
        newSocket.on("userDisconnected", ({employeeId, logoutTime}) => {
          console.log("User disconnected:", employeeId);
          setActiveUsers((prevActiveUsers) => {
            // Mark the user as inactive by setting `active` to false
            return prevActiveUsers.map((user) =>
              user.employeeId === employeeId
                ? { ...user, active: false, logoutTime }
                : user
            );
          });
        });

        newSocket.on("reconnect_attempt", (attempt) => {
          console.log(`Reconnect attempt #${attempt}`);
      });
      
      newSocket.on("reconnect", () => {
          console.log("Reconnected to server");
          // Optionally, reinitialize any necessary subscriptions or states
          newSocket.emit("rejoinChats", authUser?.staff_code);
      });
      
      newSocket.on("reconnect_error", (error) => {
          console.log("Reconnection error:", error);
      });
      
      newSocket.on("reconnect_failed", () => {
          console.log("Failed to reconnect after maximum attempts");
      });

       
        
         
        setSocket(newSocket);


        return () => {
          newSocket.off("userConnected");
          newSocket.off("userDisconnected");
          newSocket.disconnect();
        };
      
    }

    
  }, [authUser?.staff_code]); 

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
          console.log("User is active on the tab");
          setAuthUser((prevAuthUser) => ({
            ...prevAuthUser,
            active: true,
            logoutTime: null,
          }));
  
          setUsers((prevUsers) => {
            console.log("Updating users based on authUser.staff_code:", authUser?.staff_code);
          
            return prevUsers.map((user) => {
              if (user.employeeId === authUser?.staff_code) {
                // Match found; update the user's status
                return {
                  ...user,
                  active: true,
                  logoutTime: null, // Reset logout time if the user is active
                };
              }
              // Return the user unchanged if no match
              return user;
            });
          });
      } else {
        console.log("User left the tab");
        setAuthUser((prevAuthUser) => ({
          ...prevAuthUser,
          active: false,
          logoutTime: new Date(),
        }));

        setUsers((prevUsers) => {
          console.log("Updating users based on authUser.staff_code:", authUser?.staff_code);
        
          return prevUsers.map((user) => {
            if (user.employeeId === authUser?.staff_code) {
              // Match found; update the user's status
              return {
                ...user,
                active: false,
                logoutTime: new Date(), // Reset logout time if the user is active
              };
            }
            // Return the user unchanged if no match
            return user;
          });
        });
    }}



    
        document.addEventListener("visibilitychange", handleVisibilityChange);
  }, [authUser])
  

  // Use another effect to update `users` state when `activeUser` changes

  console.log("ActiveUser", activeUsers)
  useEffect(() => {
    if (activeUsers.length > 0) {
      // Create a Set of employeeIds from activeUsers
      const activeUserIds = new Set(activeUsers.map((au) => au.employeeId));
      
      setUsers((prevUsers) => {
        console.log("Updating users based on activeUsers:", activeUserIds);
  
        // Update users by checking if their employeeId is in the activeUserIds Set
        return prevUsers.map((user) => {
          const isActive = activeUserIds.has(user.employeeId);
          console.log('isActive', isActive)
          
          // If the user is active, update their status
          if (isActive) {
            const activeUser = activeUsers.find((au) => au.employeeId == user.employeeId);
            console.log("activeUser2", activeUser)
            return { ...user, active: activeUser.active, logoutTime: activeUser.logoutTime };
          }
          
          // If the user is not active, return the user as is
          return { ...user, active: false, logoutTime: null };
        });
      });
    }
  }, [activeUsers]); // Trigger when `activeUsers` changes
  
  useEffect(() => {
  // Find the active user corresponding to `authUser.staff_code`
  const matchingUser = activeUsers?.find((user) => user.employeeId == authUser?.staff_code);

  if (matchingUser) {
    setAuthUser((prevAuthUser) => ({
      ...prevAuthUser,
      active: matchingUser.active,
      logoutTime: matchingUser.active ? null : new Date(),
    }));
  }
}, [activeUsers, authUser?.staff_code]); // Only trigger when `activeUser` or `authUser.staff_code` changes

 

  useEffect(() => {
    console.log("Updated users:", users);
  }, [users]); // This will run whenever the `users` state changes


  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, authUser, setAuthUser, loading, redirectToLogin, users, setUsers, usersReady, socket }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}