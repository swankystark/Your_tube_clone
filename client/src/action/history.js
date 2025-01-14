import * as API from '../api';

export const addtohistory=(historydata)=>async(dispatch)=>{
    try {
        const{data}=await API.addtohistory(historydata)
        dispatch({type:"POST_HISTORY",data})
        dispatch(getallhistory())
    } catch (error) {
        console.log(error)
    }
}
export const getallhistory=()=>async(dispatch)=>{
    try {
        const {data}=await API.getallhistory()
        dispatch({type:'FETCH_ALL_HISTORY',payload:data})
    } catch (error) {
        console.log(error)
    }
}
export const clearhistory=(historydata)=>async(dispatch)=>{
    try {
        const {userid}=historydata
        await API.deletehistory(userid)
        dispatch(getallhistory())
    } catch (error) {
        console.log(error)
    }
}