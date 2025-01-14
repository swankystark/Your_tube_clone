import * as API from '../api';

export const addtolikedvideo=(likedvideodata)=>async(dispatch)=>{
    try {
        const {data}=await API.addtolikevideo(likedvideodata)
        dispatch({type:"POST_LIKEDVIDEO",data})
        dispatch(getalllikedvideo())
    } catch (error) {
        console.log(error)
    }
}

export const  getalllikedvideo=()=>async(dispatch)=>{
    try {
        const {data}=await API.getalllikedvideo()
        dispatch({type:"FETCH_ALL_LIKED_VIDEOS",payload:data})
    } catch (error) {
        console.log(error)
    }
}

export const deletelikedvideo=(likedvidedata)=>async(dispatch)=>{
    try {
        const {videoid,viewer}=likedvidedata
        await API.deletelikedvideo(videoid,viewer)
        dispatch(getalllikedvideo())
    } catch (error) {
        console.log(error)
    }
}