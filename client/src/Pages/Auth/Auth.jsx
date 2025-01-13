import React ,{ useEffect } from 'react'
import { BiLogOut } from 'react-icons/bi'
import { Link } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google';
import "./Auth.css"
import {useDispatch} from "react-redux"
import { setcurrentuser } from '../../action/currentuser';

const Auth = ({ user, setauthbtn, seteditcreatechanelbtn }) => {
    const dispatch = useDispatch()
    const logout = () => {
        dispatch(setcurrentuser(null))
        localStorage.clear()
        googleLogout()
        // Use the reducer's logout mechanism to ensure cross-tab synchronization
        dispatch({ type: 'LOGOUT' });
    }
    
    // Safety check for user object
    const userResult = user?.result || {};
    const userEmail = userResult.email || 'No Email';
    const userName = userResult.name || userEmail.split('@')[0];

    return (
        <div className="Auth_container" onClick={() => setauthbtn(false)}>
            <div className="Auth_container2">
                <div className="User_Details">
                    <div className="Chanel_logo_App">
                        <span className="fstChar_logo_App">
                            {userName ? 
                                userName.charAt(0).toUpperCase() : 
                                '?'
                            }
                        </span>
                    </div>
                    <div className="email_auth">{userEmail}</div>
                </div>
                <div className="btns_Auth">
                    {userName && userName !== userEmail ? (
                        <Link to={`/channel/${userResult._id || ''}`} className='btn_Auth'>
                            Your Channel
                        </Link>
                    ) : (
                        <button 
                            className='btn_Auth' 
                            onClick={() => seteditcreatechanelbtn(true)}
                        >
                            Create Your Own Channel
                        </button>
                    )}
                    <div className="btn_Auth" onClick={() => logout()}>
                        <BiLogOut/>
                        Log Out
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Auth