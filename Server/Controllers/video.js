import videofile from "../Models/videofile.js";

export const uploadvideo = async (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            return res.status(400).json({ 
                message: "No file uploaded. Please select a valid video file.",
                supportedTypes: [
                    "MP4", 
                    "MPEG", 
                    "QuickTime", 
                    "AVI", 
                    "WMV"
                ]
            });
        }

        // Validate file details
        const { originalname, path, mimetype, size } = req.file;
        const { title, chanel, uploader } = req.body;

        // Additional validations
        if (!title) {
            return res.status(400).json({ message: "Video title is required" });
        }

        if (size > 100 * 1024 * 1024) { // 100 MB limit
            return res.status(400).json({ 
                message: "File too large. Maximum upload size is 100 MB",
                maxSize: "100 MB"
            });
        }

        const file = new videofile({
            videotitle: title,
            filename: originalname,
            filepath: path,
            filetype: mimetype,
            filesize: size,
            videochanel: chanel,
            uploader: uploader,
        });

        await file.save();
        
        res.status(200).json({ 
            message: "File uploaded successfully", 
            fileDetails: {
                name: originalname,
                size: `${(size / 1024 / 1024).toFixed(2)} MB`,
                type: mimetype
            }
        });
    } catch (error) {
        console.error('Video Upload Error:', error);
        res.status(500).json({ 
            message: "Error uploading video", 
            error: error.message 
        });
    }
};

export const getallvideos=async(req,res)=>{
    try {
        const files=await videofile.find();
        res.status(200).send(files)
    } catch (error) {
        res.status(404).json(error.message)
            return
    }
}