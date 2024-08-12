import React, { FunctionComponent, ReactElement, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { DefaultLayout } from "../layouts/default";
import './home.css';

interface JWTDecodedPayload {
    sub: string; // Adjust based on actual structure
    [key: string]: any; // To accommodate other potential fields
}

export const HomePage: FunctionComponent = (): ReactElement => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const navigate = useNavigate(); // Hook for navigation

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        
        try {
            // Request to get the access token
            const authResponse = await fetch('https://localhost:9444/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic aEFxTnZISzdoNmxfdUNmb29mVVNoZFZpcGZvYTpBV1U1Nm9BeGVBYk9UNkZ0ZlVrckVtUjlCTWNh',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'grant_type': 'password',
                    'username': username,
                    'password': password
                }).toString()
            });

            if (!authResponse.ok) {
                throw new Error('Authentication failed');
            }

            const authData = await authResponse.json();
            const { access_token } = authData;

            // Decode the JWT token
            const decodedToken: JWTDecodedPayload = jwtDecode(access_token);

            // Extract roles from 'sub'
            const roles = decodedToken.sub.split(',').map(role => role.trim()); // Split and trim roles
            const requiredRoles = ['patient', 'admins', 'doctor'];
            const presentRoles = requiredRoles.filter(role => roles.includes(role));

            if (presentRoles.length === 0) {
                throw new Error('None of the required roles (patient, admin, doctor) found.');
            }


            // Request using the dynamically determined scope
            const secondResponse = await fetch('https://localhost:9444/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic anRQVFNqdWJMd25sV3NmSzBCWVUyUV9KRzNzYTpUWjMwVlJBZjNZWEhwN1loaHlYT0lTclVIOUlh',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'grant_type': 'password',
                    'assertion': access_token,
                    'scope': presentRoles[0],
                    'username': username,
                    'password': password
                }).toString()
            });

            if (!secondResponse.ok) {
                throw new Error('Second request failed');
            }

            const secondData = await secondResponse.json();
            const { access_token: secondAccessToken } = secondData;

            // Set the token to be used in the InformationPage
            setToken(secondAccessToken);

            // Redirect to /information and pass the access token
            navigate('/information', { state: { token: secondAccessToken } });

        } catch (error) {
            console.error('Error:', error);
            setLoginError('Request failed. Please check your credentials or try again.');
        }
    };

    return (
        <DefaultLayout
            isLoading={false} // Adjust as needed
            hasErrors={Boolean(loginError)}
        >
            <div className="login-container">
                <h2>Login</h2>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    {loginError && <p className="error-message">{loginError}</p>}
                    <button type="submit" className="submit-button">Login</button>
                </form>
            </div>
        </DefaultLayout>
    );
};
