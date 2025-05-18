// now we will create middleware, using the middleware we will authenticate the user
//we will authenticate the user whenever user will add product in cart/update cart data or user will place the order, then we will use this middleware, 
// this middleware will convert user's token in the user's id
import jwt from "jsonwebtoken"

const authUser=async(req,res,next)=>{//call back function called next
    const {token}=req.headers//get user's token from headers
    if (!token) {// check if token is not available
        return res.json({success:false, message:"Not Authorized Login Again"})
    }
// if token is available
    try {
        const token_decode=jwt.verify(token,process.env.JWT_SECRET)//decode token, provide token and JWT SECRET
        req.body.userId=token_decode.id// in decoded token we will get user's id, in usercontroller.js file when we have created token then we have added one object in which we have user's id, we will get user id from this token and we will set this in req.body.userId property, in body of req it will add user id property that we will get from the token, using this we can update cart or place order
        next()//call next function
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
        
    }

}

export default authUser//add this middleware in cartRoute