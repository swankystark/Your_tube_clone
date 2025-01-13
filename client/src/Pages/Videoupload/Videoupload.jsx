import React, { useState } from 'react'
import './Videoupload.css'
import { buildStyles, CircularProgressbar } from "react-circular-progressbar"
import { useSelector, useDispatch } from 'react-redux'
import { uploadvideo } from '../../action/video'
const Videoupload = ({ setvideouploadpage }) => {
    const [title, settitle] = useState("")
    const [videofile, setvideofile] = useState("")
    const [progress, setprogress] = useState(0)
    const dispatch = useDispatch()
    const handlesetvideofile = (e) => {
        setvideofile(e.target.files[0])
    }
    const currentuser = useSelector(state => state.currentuserreducer);
    const fileoption = {
        onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentage = Math.floor(((loaded / 1000) * 100) / (total / 1000));
            setprogress(percentage)
            if (percentage === 100) {
                setTimeout(function () { }, 3000);
                setvideouploadpage(false)
            }
        },
    };
    const uploadvideofile = () => {
        if (!title) {
            alert("plz enter a title of the video")
            return;
        } 
        
        if (!videofile) {
            alert("plz attach a video file");
            return;
        } 
        
        // Validate file type
        const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
        if (!allowedTypes.includes(videofile.type)) {
            alert(`Unsupported file type: ${videofile.type}. Please upload a valid video file.`);
            return;
        }

        // Validate file size (100 MB limit)
        const maxSize = 100 * 1024 * 1024; // 100 MB
        if (videofile.size > maxSize) {
            alert(`File too large. Maximum upload size is 100 MB. Your file is ${(videofile.size / 1024 / 1024).toFixed(2)} MB`);
            return;
        }

        const filedata = new FormData()
        filedata.append("file", videofile)
        filedata.append("title", title)
        filedata.append("chanel", currentuser?.result?._id)
        filedata.append("uploader", currentuser?.result.name)

        // Log file details before upload
        console.log('Uploading Video:', {
            title: title,
            fileType: videofile.type,
            fileSize: `${(videofile.size / 1024 / 1024).toFixed(2)} MB`,
            channel: currentuser?.result?._id,
            uploader: currentuser?.result.name
        });

        dispatch(uploadvideo({ filedata: filedata, fileoption: fileoption }))
    }
    return (
        <div className="container_VidUpload">
            <input type="submit" name='text' value={"X"} onClick={() => setvideouploadpage(false)} className="ibtn_x" />
            <div className="container2_VidUpload">
                <div className="ibox_div_vidupload">
                    <input type="text" maxLength={30} placeholder='Enter title of your video' className="ibox_vidupload" onChange={(e) => {
                        settitle(e.target.value);
                    }} />
                    <label htmlFor="file" className='ibox_cidupload btn_vidUpload'>
                        <input type="file" name='file' style={{ fontSize: "1rem" }} onChange={(e) => { handlesetvideofile(e) }} className="ibox_vidupload" />
                    </label>
                </div>
                <div className="ibox_div_vidupload">
                    <input type="submit" onClick={() => uploadvideofile()} value={"Upload"} className='ibox_vidupload btn_vidUpload' />
                    <div className="loader ibox_div_vidupload">
                        <CircularProgressbar
                            value={progress}
                            text={`${progress}`}
                            styles={buildStyles({
                                rotation: 0.25,
                                strokeLinecap: "butt",
                                textSize: "20px",
                                pathTransitionDuration: 0.5,
                                pathColor: `rgba(255,255,255,${progress / 100})`,
                                textColor: "#f88",
                                trailColor: "#adff2f",
                                backgroundColor: "#3e98c7",
                            })}

                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Videoupload