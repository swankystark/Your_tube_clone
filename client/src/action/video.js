import * as api from "../api";

export const uploadvideo = (videodata) => async (dispatch) => {
    try {
        const { filedata, fileoption } = videodata;
        
        // Detailed logging for debugging
        console.log('Video Upload Data:', {
            fileTitle: filedata.get('title'),
            fileType: filedata.get('file').type,
            fileSize: filedata.get('file').size,
            channel: filedata.get('chanel'),
            uploader: filedata.get('uploader')
        });

        const { data } = await api.uploadvideo(filedata, {
            ...fileoption,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Video Upload Response:', data);
        
        dispatch({ type: 'POST_VIDEO', data });
        dispatch(getallvideo());
    } catch (error) {
        console.error('Video Upload Error:', {
            errorMessage: error.message,
            errorResponse: error.response?.data,
            errorStatus: error.response?.status
        });
        
        alert(error.response?.data?.message || 'Failed to upload video');
    }
}

export const getallvideo = () => async (dispatch) => {
    try {
        const { data } = await api.getvideos()
        dispatch({ type: 'FETCH_ALL_VIDEOS', payload: data })
    } catch (error) {
        console.log(error)
    }
}

export const likevideo = (likedata) => async (dispatch) => {
    try {
        const { id, Like } = likedata;
        console.log('Like Video Data:', { id, Like });
        
        const { data } = await api.likevideo(id, Like);
        
        console.log('Like Video Response:', data);
        
        dispatch({ type: "POST_LIKE", payload: data });
        dispatch(getallvideo());
    } catch (error) {
        console.error('Like Video Error:', {
            errorMessage: error.message,
            errorResponse: error.response?.data,
            errorStatus: error.response?.status
        });
        
        alert(error.response?.data?.message || 'Failed to like video');
    }
};

export const viewvideo=(viewdata)=>async(dispatch)=>{
    try {
        const{id}=viewdata;
        console.log(id)
        const {data}=await api.viewsvideo(id)
        dispatch({type:"POST_VIEWS",data})
        dispatch(getallvideo())
    } catch (error) {
        console.log(error)
    }
}