import express from "express"

import { loginUser, registerUser, adminLogin } from "../controllers/userController.js"

//create a router using express router

const userRouter=express.Router()

userRouter.post('/register', registerUser)//pass endpoint and function, whenever we will call this, we will use execute function
userRouter.post('/login', loginUser)//if we hit this endpoint /api/user/login, then this login user controller function will be executed
userRouter.post('/admin',adminLogin)

export default userRouter//using this, we will create endpoints in server.js file