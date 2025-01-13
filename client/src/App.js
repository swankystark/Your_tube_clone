import './App.css';
import React, { useEffect, useState } from "react"
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './Component/Navbar/Navbar';
import Drawersliderbar from './Component/Leftsidebar/Drawersliderbar';
import Allroutes from "./Allroutes"
import Createeditchannel from './Pages/Channel/Createeditchannel';
import Videoupload from './Pages/Videoupload/Videoupload';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { fetchallchannel } from './action/channeluser';
import { getallvideo } from './action/video';
import { getallcomment } from './action/comment';
import { getallhistory } from './action/history';
import { getalllikedvideo } from './action/likedvideo';
import { getallwatchlater } from './action/watchlater';

function App() {
  const [toggledrawersidebar, settogledrawersidebar] = useState({
    display: "none"
  });
  const [editcreatechanelbtn, seteditcreatechanelbtn] = useState(false);
  const [videouploadpage, setvideouploadpage] = useState(false);
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchallchannel())
    dispatch(getallvideo())
    dispatch(getallcomment())
    dispatch(getallhistory())
    dispatch(getalllikedvideo())
    dispatch(getallwatchlater())
  }, [dispatch])

  const toggledrawer = () => {
    settogledrawersidebar(prev => ({
      display: prev.display === "none" ? "flex" : "none"
    }));
  }

  return (
    <Router>
      <div className="App">
        <Navbar 
          seteditcreatechanelbtn={seteditcreatechanelbtn} 
          toggledrawer={toggledrawer} 
        />
        <Drawersliderbar 
          toggledraw={toggledrawer} 
          toggledrawersidebar={toggledrawersidebar} 
        />
        
        {/* Conditional Rendering for Video Upload */}
        {videouploadpage && (
          <Videoupload setvideouploadpage={setvideouploadpage} />
        )}
        
        {/* Conditional Rendering for Create/Edit Channel */}
        {editcreatechanelbtn && (
          <Createeditchannel seteditcreatechanelbtn={seteditcreatechanelbtn} />
        )}
        
        {/* Main Routes */}
        <Allroutes 
          seteditcreatechanelbtn={seteditcreatechanelbtn} 
          setvideouploadpage={setvideouploadpage} 
        />
        
        {/* Toast Notifications */}
        <ToastContainer 
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
