import express from "express"
import { login } from "../Controllers/Auth.js"
import { updatechaneldata,getallchanels } from "../Controllers/channel.js";
import { createChatRoom } from "../Controllers/chatRoom.js"; // Import the new function

const routes=express.Router();

routes.post('/login',login)
routes.patch('/update/:id',updatechaneldata)
routes.get('/getallchannel',getallchanels)
routes.post('/create-chat-room', createChatRoom) // Add the new route

export default routes;