import React, { useState, useEffect } from 'react'
import logo from "./logo.ico"
import "./Navbar.css"
import { useDispatch, useSelector } from 'react-redux'
import { Link } from "react-router-dom"
import { RiVideoAddLine } from "react-icons/ri"
import { IoMdNotificationsOutline } from "react-icons/io"
import { BiUserCircle } from "react-icons/bi"
import Searchbar from './Searchbar/Searchbar'
import Auth from '../../Pages/Auth/Auth'
import axios from "axios"
import { login } from "../../action/auth"
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { setcurrentuser } from '../../action/currentuser';
import {jwtDecode} from "jwt-decode"

const Navbar = ({ toggledrawer, seteditcreatechanelbtn }) => {
    const [authbtn, setauthbtn] = useState(false)
    const dispatch = useDispatch()
    const currentuser = useSelector(state => state.currentuserreducer);

    const google_login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const userInfo = await axios.get(
                    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`, 
                    {
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                            Accept: 'application/json'
                        }
                    }
                );

                // Dispatch login with user email directly
                dispatch(login({ 
                    email: userInfo.data.email, 
                    name: userInfo.data.name,
                    sessionTimestamp: Date.now()
                }));
            } catch (error) {
                console.error("Login error:", error);
            }
        },
        onError: (error) => console.log("Login Failed", error)
    });

    useEffect(() => {
        const token = currentuser?.token;
        if (token) {
            try {
                const decodetoken = jwtDecode(token);
                // Check if token is expired
                if (decodetoken.exp * 1000 < new Date().getTime()) {
                    console.log('Token expired, logging out');
                    logout();
                    return;
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                logout(); // Logout if token is invalid
                return;
            }
        }
        
        // Retrieve user from localStorage safely
        const storedProfile = localStorage.getItem("Profile");
        const authChangeLog = localStorage.getItem("authChange");
        
        if (storedProfile && authChangeLog) {
            try {
                const parsedProfile = JSON.parse(storedProfile);
                const parsedAuthChange = JSON.parse(authChangeLog);
                
                // Add additional check to ensure the stored profile matches the current session
                const currentTime = Date.now();
                const sessionAge = currentTime - (parsedProfile.sessionTimestamp || 0);
                
                // Only use the profile if it's from the current session (within 1 hour)
                if (sessionAge < 3600000) { // 1 hour in milliseconds
                    // Ensure the current user in Redux matches the most recent login
                    if (currentuser?.result?.email !== parsedAuthChange.email) {
                        console.log('Updating current user from stored profile', {
                            currentUserEmail: currentuser?.result?.email,
                            storedProfileEmail: parsedAuthChange.email
                        });
                        dispatch(setcurrentuser(parsedProfile));
                    }
                } else {
                    console.log('Stored profile is too old, clearing...');
                    localStorage.removeItem("Profile");
                    localStorage.removeItem("authChange");
                    dispatch(setcurrentuser(null));
                }
            } catch (error) {
                console.error('Error parsing stored profile or auth change:', error);
                localStorage.removeItem("Profile");
                localStorage.removeItem("authChange");
                dispatch(setcurrentuser(null));
            }
        }
    }, [currentuser?.token, currentuser?.result?.email, dispatch]);

    useEffect(() => {
        const handleAuthChange = (event) => {
            const authChange = event.detail;
            console.log('Auth change event received:', authChange);

            // Handle different auth actions
            if (authChange.action === 'LOGIN') {
                // Update the current user if the email is different
                if (currentuser?.result?.email !== authChange.email) {
                    console.log('Updating user due to login in another tab', {
                        currentUserEmail: currentuser?.result?.email,
                        newUserEmail: authChange.email
                    });

                    // Retrieve the stored profile and update the current user
                    const storedProfile = localStorage.getItem('Profile');
                    if (storedProfile) {
                        try {
                            const parsedProfile = JSON.parse(storedProfile);
                            dispatch(setcurrentuser(parsedProfile));
                        } catch (error) {
                            console.error('Error parsing stored profile:', error);
                        }
                    }
                }
            } else if (authChange.action === 'LOGOUT') {
                // Clear current user on logout
                dispatch(setcurrentuser(null));
            }
        };

        // Add event listener for auth changes
        window.addEventListener('auth-change', handleAuthChange);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, [dispatch, currentuser?.result?.email]);

    const logout = () => {
        dispatch(setcurrentuser(null))
        googleLogout()
        // Use the reducer's logout mechanism to ensure cross-tab synchronization
        dispatch({ type: 'LOGOUT' });
    }

    return (
        <>
            <div className="Container_Navbar">
                <div className="Burger_Logo_Navbar">
                    <div className="burger" onClick={() => toggledrawer()}>
                        <p></p>
                        <p></p>
                        <p></p>
                    </div>
                    <Link to={"/"} className='logo_div_Navbar'>
                        <img src={logo} alt="" />
                        <p className="logo_title_navbar">Your-Tube</p>
                    </Link>
                </div>
                <Searchbar />
                <RiVideoAddLine size={22} className={"vid_bell_Navbar"} />
                <div className="apps_Box">
                    {[...Array(9)].map((_, index) => (
                        <p key={index} className="appBox"></p>
                    ))}
                </div>

                <IoMdNotificationsOutline size={22} className={"vid_bell_Navbar"} />
                <div className="Auth_cont_Navbar">
                    {currentuser?.result ? (
                        <div className="Chanel_logo_App" onClick={() => setauthbtn(true)}>
                            <p className="fstChar_logo_App">
                                {currentuser.result.name ? 
                                    currentuser.result.name.charAt(0).toUpperCase() : 
                                    (currentuser.result.email ? 
                                        currentuser.result.email.split('@')[0].charAt(0).toUpperCase() : 
                                        '?')
                                }
                            </p>
                        </div>
                    ) : (
                        <p className='Auth_Btn' onClick={() => google_login()}>
                            <BiUserCircle size={22} />
                            <b>Sign in</b>
                        </p>
                    )}
                </div>
            </div>
            {
                authbtn &&
                <Auth 
                    seteditcreatechanelbtn={seteditcreatechanelbtn} 
                    setauthbtn={setauthbtn} 
                    user={currentuser} 
                    logout={logout}
                />
            }
        </>
    )
}

export default Navbar
