import videofile from "../Models/videofile.js";
import mongoose from "mongoose";

export const likevideocontroller = async (req, res) => {
    const { id: _id } = req.params;
    const { Like } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("video unavailable..")
    }

    try {
        // Find the video first
        const video = await videofile.findById(_id);

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        // Ensure Like is either 1 or -1
        const likeIncrement = Like > 0 ? 1 : -1;

        // Update the like count, ensuring it doesn't go below 0
        const updatedVideo = await videofile.findByIdAndUpdate(
            _id,
            { 
                $inc: { 
                    Like: likeIncrement 
                } 
            },
            { 
                new: true,  // Return the updated document
                setDefaultsOnInsert: true  // Ensure default values are set
            }
        );

        // Ensure Like is never negative
        if (updatedVideo.Like < 0) {
            await videofile.findByIdAndUpdate(
                _id,
                { Like: 0 },
                { new: true }
            );
            updatedVideo.Like = 0;
        }

        res.status(200).json(updatedVideo);
    } catch (error) {
        console.error('Like Video Error:', error);
        res.status(400).json({ message: "Error updating likes", error: error.message });
    }
};
