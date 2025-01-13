import express from "express"

import { 
    postcomment, 
    getcomment, 
    deletecomment, 
    editcomment,
    translateComment,
    likeComment,
    dislikeComment
} from "../Controllers/Comment.js"
import auth from "../middleware/auth.js"

const router=express.Router()

router.post("/post",auth,postcomment)
router.get('/get',getcomment)
router.delete('/delete/:id',auth,deletecomment)
router.patch('/edit/:id',auth,editcomment)

// New routes for translation and comment moderation
router.post('/translate', auth, translateComment)
router.post('/like', auth, likeComment)
router.post('/dislike', auth, dislikeComment)

export default router