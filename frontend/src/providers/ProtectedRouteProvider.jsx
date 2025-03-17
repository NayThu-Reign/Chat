import { useAuth } from './AuthProvider';

export default function ProtectedRouteProvider({ children }) {
  const { accessToken, loading } = useAuth();

  // Show a loading indicator while checking authentication status
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to the SSO login page if no access token is available
  if (!accessToken) {
    const redirectUri = encodeURIComponent(window.location.href); // Redirect back to the current page after login
    window.location.href = `https://sso.trustlinkmm.com/loginForm?redirect_uri=${redirectUri}`;
    return null; // Prevent rendering anything else
  }

  // Render children if authenticated
  return children;
}
