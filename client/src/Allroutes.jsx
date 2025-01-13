import React from 'react'
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux'

// Import all route components
import Home from './Pages/Home/Home'
import Auth from './Pages/Auth/Auth'
import Search from './Pages/Search/Search'
import Videopage from './Pages/Videopage/Videopage'
import Library from './Pages/Library/Library'
import Likedvideo from './Pages/Likedvideo/Likedvideo'
import Watchhistory from './Pages/Watchhistory/Watchhistory'
import Watchlater from './Pages/Watchlater/Watchlater'
import Yourvideo from './Pages/Yourvideo/Yourvideo'
import Channel from './Pages/Channel/Channel'
import ChatRoom from './Pages/ChatRoom/ChatRoom'
import ChatRoomList from './Pages/ChatRoom/ChatRoomList'

const Allroutes = ({seteditcreatechanelbtn, setvideouploadpage}) => {
    const currentUser = useSelector(state => state.currentuserreducer?.result)

    return (
        <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/Auth' element={<Auth/>}/>
            <Route path='/search/:Searchquery' element={<Search/>}/>
            <Route path='/videopage/:vid' element={<Videopage/>}/>
            <Route path='/Library' element={<Library/>}/>
            <Route path='/Likedvideo' element={<Likedvideo/>}/>
            <Route path='/Watchhistory' element={<Watchhistory/>}/>
            <Route path='/Watchlater' element={<Watchlater/>}/>
            <Route path='/Yourvideo' element={<Yourvideo/>}/>
            <Route path='/channel/:cid' element={
                <Channel 
                    seteditcreatechanelbtn={seteditcreatechanelbtn} 
                    setvideouploadpage={setvideouploadpage}
                />
            }/>
            <Route path="/chatroom/:roomId" element={<ChatRoom currentUser={currentUser} />} />
            <Route path="/chatrooms" element={<ChatRoomList />} />
        </Routes>
    )
}

export default Allroutes;