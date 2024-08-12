import React, { FunctionComponent, ReactElement, useState } from "react";
import { useLocation } from 'react-router-dom';
import { DefaultLayout } from "../layouts/default";
import { JsonViewer } from '@textea/json-viewer';
import { useNavigate } from 'react-router-dom';

interface LocationState {
    token: string;
}

export const InformationPage: FunctionComponent = (): ReactElement => {
    const location = useLocation();
    const state = location.state as LocationState;
    const token = state?.token;
    const navigate = useNavigate(); 

    const [email, setEmail] = useState<string>('');
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = () => {
        // Clear the token (if it's stored somewhere in local storage or state)
        // For example, you might clear it from local storage:
        localStorage.removeItem('token');
        // Redirect to the home page
        navigate('/');
    };

    const fetchApiData = async (email: string) => {
        try {
            if (token && email) {
                const response = await fetch(`https://localhost:8243/health/1.0/${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    let errorMessage = 'API request failed';
                    if (response.status === 403) {
                        setApiResponse({error : 'user not authorized to access resource'})
                    } else if (response.status === 404) {
                        setApiResponse({error: 'user not found'})
                    }
                     // Clear any previous data
                    return; // Exit the function to prevent further processing
                }

                const data = await response.json();
                setApiResponse(data);
                setError(null); // Clear any previous errors
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch data. Please try again later.');
            setApiResponse(null); // Clear any previous data
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        fetchApiData(email);
    };

    return (
        <DefaultLayout
            hasErrors={Boolean(error)}
        >
            <div className="information-container">
                <h2>Information Page</h2>
                <form onSubmit={handleSubmit} className="email-form">
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="submit-button">Fetch Data</button>
                </form>

                {error ? (
                    <p className="error-message">{error}</p>
                ) : apiResponse ? (
                    <div className="json">
                        <h5><b>Response:</b></h5>
                        <JsonViewer
                            className="asg-json-viewer"
                            value={apiResponse}
                            enableClipboard={false}
                            displayObjectSize={false}
                            displayDataTypes={false}
                            rootName={false}
                            theme="dark"
                        />
                    </div>
                ) : (
                    <p>No data available. Enter an email and click "Fetch Data".</p>
                )}

            <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
        </DefaultLayout>
    );
};
