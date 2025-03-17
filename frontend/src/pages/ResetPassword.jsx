// ResetPassword.jsx
import { useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResetPassword () {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
  const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


    // Extract token from query parameters
    const token = new URLSearchParams(location.search).get('token');

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        try {
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Ensure JSON content type is specified
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                    confirmPassword
                }),
            });
        
      
            setMessage(response.data.message);
            // Redirect to login after a delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            setMessage(error.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="reset-password-container">
            <h2>Reset Your Password</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleResetPassword}>
                <div>
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
};
