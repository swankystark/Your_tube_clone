@echo off
cd Server
ren Models models_temp
ren models_temp models
ren Routes routes_temp
ren routes_temp routes
ren Controllers controllers_temp
ren controllers_temp controllers
ren Server server
cd ..
echo Done fixing case sensitivity
