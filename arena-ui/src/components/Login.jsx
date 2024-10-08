import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, getIdToken } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login, user } = useAuth();

    useEffect(() => {
        if (user) {
            console.log('User is already logged in, redirecting...');
            navigate('/jobseeker-intake');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            console.log('Attempting Firebase authentication...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await getIdToken(userCredential.user);
            console.log('Firebase authentication successful');

            console.log('Attempting login with AuthContext...');
            await login(idToken);
            console.log('AuthContext login successful');

            // Use the backend URL from the environment variable
            const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/users/check-intake`;
            console.log('Sending request to:', apiUrl);
            console.log('Request headers:', {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            });

            const response = await axios.get(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.data.redirectPath) {
                console.log('Attempting to redirect to:', response.data.redirectPath);
                navigate(response.data.redirectPath, { replace: true });
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Login error:", error);

            // Log the entire Axios error response
            if (axios.isAxiosError(error)) {
                console.error("Axios error response:", error.response);
                setError(error.response?.data?.error || 'An error occurred during login. Please try again.');
            } else if (error.code) {
                switch (error.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        setError('Invalid email or password. Please try again.');
                        break;
                    case 'auth/too-many-requests':
                        setError('Too many failed login attempts. Please try again later.');
                        break;
                    default:
                        setError('An error occurred during login. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container">
            <div className="left">
                <img src="/images/login.png" alt="Arena Logo" className="logo" />
            </div>
            <div className="right">
                <form onSubmit={handleSubmit} className="login-form">
                    <img src="/images/black-logo.png" alt="Arena Logo" className="white-logo-signup" />
                    <h2 className="welcome-message" style={{color: 'black'}}
                    >Welcome Back!</h2>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Email"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="show-password-button"
                                onClick={togglePasswordVisibility}
                                disabled={loading}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <div className="forgot-password-container">
                            <button
                                type="button"
                                className="forgot-password-button"
                                onClick={() => navigate('/reset-password')}
                                disabled={loading}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    {error && <div className="error-message">{error}</div>}

                    <p className="terms">By logging in you accept our <a href="/terms">terms</a> and <a href="/privacy">privacy policy</a>.</p>
                    <p className="login">New to Arena? <a href="/signup">Signup</a></p>
                </form>
            </div>
        </div>
    );
}

export default Login;
