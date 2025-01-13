import React from 'react'
import "./Leftsidebar.css"
import { AiFillPlaySquare, AiOutlineHome, AiFillLike } from 'react-icons/ai'
import { MdOutlineExplore, MdOutlineVideoLibrary, MdSubscriptions, MdOutlineWatchLater, MdChat } from "react-icons/md"
import { FaHistory } from 'react-icons/fa'
import shorts from "./shorts.png"
import { NavLink } from 'react-router-dom'
const Drawersliderbar = ({ toggledraw, toggledrawersidebar }) => {
  return (
    <div className="container_DrawaerLeftSidebar" style={toggledrawersidebar}>
      <div className="container2_DrawaerLeftSidebar">
        <div className="Drawer_leftsidebar">
          <NavLink to={'/'} className="icon_sidebar_div">
            <AiOutlineHome size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Home</span>
          </NavLink>
          <div className="icon_sidebar_div">
            <MdOutlineExplore size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Explore</span>
          </div>
          <div className="icon_sidebar_div">
            <img src={shorts} width={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Shorts</span>
          </div>

          <div className="icon_sidebar_div">
            <MdSubscriptions size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Subscriptions</span>
          </div>
          
          {/* New Chat Rooms Link */}
          <NavLink to={'/chatrooms'} className="icon_sidebar_div">
            <MdChat size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Chat Rooms</span>
          </NavLink>
        </div>
        <div className="libraryBtn_Drawerleftsidebar">
          <NavLink to={'/Library'} className="icon_sidebar_div">
            <MdOutlineVideoLibrary size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Library</span>
          </NavLink>
          <NavLink to={'/Watchhistory'} className="icon_sidebar_div">
            <FaHistory size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">History</span>
          </NavLink>
          <NavLink to={'/Yourvideo'} className="icon_sidebar_div">
            <AiFillPlaySquare size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Your Videos</span>
          </NavLink>
          <NavLink to={'/Watchlater'} className="icon_sidebar_div">
            <MdOutlineWatchLater
              size={22}
              className={"icon_sidebar"}
              style={{ margin: "auto 0.7rem" }}
            />
            <span className="text_sidebar_icon">Watch Later</span>
          </NavLink>
          <NavLink to={'/Likedvideo'} className="icon_sidebar_div">
            <AiFillLike size={22} className='icon_sidebar' style={{ margin: "auto 0.7rem" }} />
            <span className="text_sidebar_icon">Liked Videos</span>
          </NavLink>
        </div>
        <div className="subScriptions_lsdbar">
          <h3>Your Subscription</h3>
          <div className="chanel_lsdbar">
            <span>C</span>
            <span>Chanel</span>
          </div>
          <div className="chanel_lsdbar">
            <span>C</span>
            <span>Chanel</span>
          </div>
          <div className="chanel_lsdbar">
            <span>C</span>
            <span>Chanel</span>
          </div>
          <div className="chanel_lsdbar">
            <span>C</span>
            <span>Chanel</span>
          </div>
        </div>
      </div>
      <div className="container3_DrawaerLeftSidebar" onClick={() => toggledraw()}></div>
    </div>
  )
}

export default Drawersliderbar