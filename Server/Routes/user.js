import express from "express"
import { login } from "../Controllers/Auth.js"
import { updatechaneldata,getallchanels } from "../Controllers/channel.js";
import { createChatRoom } from "../Controllers/ChatRoom.js"; // Fixed case sensitivity

const routes=express.Router();

routes.post('/login',login)
routes.patch('/update/:id',updatechaneldata)
routes.get('/getallchannel',getallchanels)
routes.post('/create-chat-room', createChatRoom)

export default routes;