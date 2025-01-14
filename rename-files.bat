@echo off
cd server
cd models
ren Auth.js auth.js
ren ChatMessage.js chatmessage.js
ren ChatRoom.js chatroom.js
ren ChatRoomInvitation.js chatroominvitation.js
cd ..
cd routes
ren ChatRoom.js chatroom.js
ren ChatRoomInvitation.js chatroominvitation.js
cd ..
echo Done renaming files
