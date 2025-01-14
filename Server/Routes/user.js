import express from "express"
import { login } from "../controllers/auth.js"
import { updatechaneldata,getallchanels } from "../controllers/channel.js";
import { createChatRoom } from "../controllers/chatroom.js";

const routes=express.Router();

routes.post('/login',login)
routes.patch('/update/:id',updatechaneldata)
routes.get('/getallchannel',getallchanels)
routes.post('/create-chat-room', createChatRoom)

export default routes;