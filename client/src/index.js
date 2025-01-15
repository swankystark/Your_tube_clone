import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from "react-redux";
import { applyMiddleware,compose } from 'redux';
import {legacy_createStore as createstore} from "redux"
import {thunk} from 'redux-thunk';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Reducers from './Reducers';
const store=createstore(Reducers,compose(applyMiddleware(thunk)));
const root = ReactDOM.createRoot(document.getElementById('root'));

const handleLogin = async (response) => {
    const { profileObj } = response; // Assuming you're using Google Login
    const { email, name, googleId } = profileObj;

    try {
        const res = await fetch('https://your-tube-clone-2-hrmk.onrender.com/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: profileObj.email,
                name: profileObj.name,
                googleId: profileObj.googleId,
                sessionTimestamp: new Date().toISOString(),
            }),
        });

        const data = await res.json();
        if (res.ok) {
            // Handle successful login, e.g., store token, redirect
        } else {
            console.error("Login failed:", data.message);
        }
    } catch (error) {
        console.error("Error during login:", error);
    }
};

root.render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId="899100000328-t7vnv2icphs4n95qmi0lfesobk0jaivq.apps.googleusercontent.com">
      <React.StrictMode>
        <App handleLogin={handleLogin} />
      </React.StrictMode>
    </GoogleOAuthProvider>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
