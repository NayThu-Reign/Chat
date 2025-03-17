import {
    Box,
    Container,
    Typography,
    TextField, 
    Button,
    Alert,
    useMediaQuery,
    
} from "@mui/material"

import { useAuth } from "../providers/AuthProvider"
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CompanyLogo from "../images/TrustLinkLogo.jpg";
import { Helmet } from "react-helmet-async";

export default function Login() {
    const userCredRef = useRef();
	const passwordRef = useRef();
    

	const { setAuthUser } = useAuth();
    
	const navigate = useNavigate();
  const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


	const [hasError, setHasError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
    const [ loginReason, setLoginReason ] = useState("");
    const [ hasLogin, setHasLogin ] = useState(false);



    useEffect(() => {
        // Get the logout reason from local storage
        const reason = localStorage.getItem('loginReason');
        console.log("REASON", reason);
        
        if (reason) {
          setLoginReason(reason);
          setHasLogin(true);
          // Remove the reason from local storage after reading
          localStorage.removeItem('loginReason');
        }
    }, []);

    useEffect(() => {
        let timer;
        if (hasError, hasLogin) {
            timer = setTimeout(() => {
                setHasError(false);
                setHasLogin(false);
                setLoginReason("");
            }, 5000); 
        }
        return () => clearTimeout(timer);

        

      }, [hasError, hasLogin])

    return (
        <Box
            sx={{
                background: "#F6FBFD",
            }}
        >
            <Helmet>
                <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" />
                <title>Login - Chat Application</title>
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
                                                setErrorMessage("Invalid login details");
                                                return false;
                                            }

                                            (async () => {
                                                try {
                                                    const api = import.meta.env.VITE_API_URL;
                                                    const res = await fetch(`${api}/api/login`, {
                                                        method: 'POST',
                                                        body: JSON.stringify({ email, password }),
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                    });
                                        
                                                    const data = await res.json();

                                                    console.log("HIIIIII", data.user);
                                        
                                                    if (res.status === 200) {
                                                        setAuthUser(data.user);
                                                       
                                                        localStorage.setItem(`token`, data.token);
                                                        localStorage.setItem(`user`, JSON.stringify(data.user));
                                                        localStorage.setItem(`refreshToken`, JSON.stringify(data.refreshToken));
                                                        localStorage.setItem(`accessTokenExpiry`, JSON.stringify(data.accessTokenExpiry));
                                                        localStorage.setItem(`refreshTokenExpiry`, JSON.stringify(data.refreshTokenExpiry));
                                                        // login(data.currentUser);
                                                        
                                                       navigate("/");

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

                                        {hasLogin && (
                                            <Alert
                                                severity="success"
                                                sx={{ mb: 4 }}
                                            >
                                                {loginReason}
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
                                            Login
                                        </Button>
                                        </form>
                                    <Box sx={{
                                        marginTop: "15px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}>
                                        <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                                            <Typography sx={{ fontSize: "13px", color: "#000000" }}>
                                                Forgot Password?
                                            </Typography>
                                        
                                        </Link>
                                    </Box>
                                    <Box sx={{
                                        marginTop: "40px",
                                        marginBottom: "130px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}>
                                        <Typography sx={{
                                            color: "#808080",
                                            fontSize: "13px",    
                                        }}>
                                            Do not have an account?
                                        </Typography>
                                        <Button
                                           variant="outlined"

                                            sx={{
                                                 mt: 2, 
                                                //  background: "#74b683", 
                                                 
                                                 borderColor: '#808080',
                                                 color: '#fff',
                                                 height: "45px",
                                                 textTransform: 'none',
                                                 fontSize: '20px',
                                                  letterSpacing: 'normal',
                                                  background: "#121660",
                                                 '&:hover': {
                                                    backgroundColor: '#121660', 
                                                    // borderColor: 'black', 
                                                    color: '#fff', 
                                                  },
                                                  
                                            }}
                                            fullWidth
                                            onClick={() => {
                                                navigate("/register");
                                            }}>
                                            Register
                                        </Button>
                                    </Box>

                                </Box>


                           </Box>
                    </Container>
                </Box>
			</Box>


        </Box>
         
    )
}