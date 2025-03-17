import {
    Box,
    Container,
    Typography,
    TextField, 
    Button,
    Alert,
    FormControl,
    Select,
    MenuItem,
    useMediaQuery,
    
} from "@mui/material"

import { useAuth } from "../providers/AuthProvider"
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CompanyLogo from "../images/TrustLinkLogo.jpg";
import { Helmet } from "react-helmet-async";

export default function Register() {
    const userCredRef = useRef();
	const passwordRef = useRef();
    const positionRef = useRef();
    const departmentRef = useRef();
    const usernameRef = useRef();
    
    const [ departments, setDepartments ] = useState([]);
  const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


	const navigate = useNavigate();

	const [hasError, setHasError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
    const [ selectedDepartment, setSelectedDepartment ] = useState('');

    const fetchDepartments = async () => {
        try {

          const api = import.meta.env.VITE_API_URL;
         

          const res = await fetch(`${api}/api/departments`, {
            method: 'GET',
            headers: {
               'Content-Type': "application/json"
            }
          });

          const data = await res.json();

          if (res.status === 200 ) {
              setDepartments(data);
              console.log("hello", data);
           
          } else {  
            console.error('Error fetching department:', data.error);
          }
          

        } catch (error) {
          console.error(error);
          throw error;
        }
    };

    useEffect(() => {
        fetchDepartments();
        let timer;
        if (hasError) {
            timer = setTimeout(() => {
                setHasError(false);
            }, 5000); 
        }
        return () => clearTimeout(timer);

        

      }, [hasError])

      const handleDepartmentChange = (event) => {
        setSelectedDepartment(event.target.value);
      };

    return (
        <Box
            sx={{
                background: "#F6FBFD",
            }}
        >
            <Helmet>
                <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" />
                <title>Register - Chat Application</title>
            </Helmet>
            <Box
                 sx={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
				<Box>
                    <Container maxWidth="lg">
                           <Box sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                           }}>
                                <img src={CompanyLogo} alt="TrustLink" style={{ marginBottom: "32px",   mixBlendMode: "multiply", }} />    
                                <Box sx={{
                                    width: isMobileOrTablet ? "100%" : "350px",

                                }}>
                                    <form
                                            onSubmit={e => {
                                            e.preventDefault();
                                            const email = userCredRef.current.value;
                                            const password = passwordRef.current.value;
                                           
                                            

                                            if (!email || !password) {
                                                setHasError(true);
                                                setErrorMessage("Invalid Register details");
                                                return false;
                                            }

                                            (async () => {
                                                try {
                                                    const api = import.meta.env.VITE_API_URL;
                                                    const res = await fetch(`${api}/api/register`, {
                                                        method: 'POST',
                                                        body: JSON.stringify({
                                                         
                                                            email, 
                                                            password, 
                                                            
                                                        }),
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                    });
                                                    

                                                    const data = await res.json();
                                        
                                                    if (res.status === 201) {
                                                        
                                                        // login(data.currentUser);
                                                        
                                                       navigate("/login");
                                                       localStorage.setItem('loginReason', "You can login after verifying your email");

                                                    } else {
                                                        setHasError(true);
                                                        setErrorMessage(data.error);
                                                        console.log("Error", data.error);
                                                    }
                                                } catch (err) {
                                                    setHasError(true);
                                                    setErrorMessage(err.message);
                                                }
                                            })();

    
                                        }}>
                                        {hasError && (
                                            <Alert
                                                severity="warning"
                                                sx={{ mb: 4 }}>
                                                {errorMessage}
                                            </Alert>
                                        )}

                                       

                                       
                                        <TextField
                                            label="Email"
                                            fullWidth
                                            type="text"
                                            sx={{ 
                                                mb: 2,
                                                backgroundColor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    '&.Mui-focused fieldset': {
                                                      borderColor: "black",
                                                    },
                                                },
                                            }}
                                            inputRef={userCredRef}
                                        />

                                        <TextField
                                            label="Password"
                                            fullWidth
                                            type="password"
                                            sx={{ 
                                                mb: 2,
                                                backgroundColor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    '&.Mui-focused fieldset': {
                                                      borderColor: "black",
                                                    },
                                                },
                                            
                                            }}
                                            inputRef={passwordRef}
                                        />

                                       

                                        

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                height: "45px",
                                                background: "#121660",
                                                textTransform: 'none',
                                                fontSize: "20px",
                                                '&:hover': {
                                                    backgroundColor: "#121660", 
                                                    
                                                  },
                                            }}    
                                            
                                        >
                                            Register
                                        </Button>
                                        </form>
                                    
                                    

                                </Box>


                           </Box>
                    </Container>
                </Box>
			</Box>


        </Box>
         
    )
}