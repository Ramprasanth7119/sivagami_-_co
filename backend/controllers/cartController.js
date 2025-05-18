// add api so that when we add any product in cart and whenever we are logged in, then that product will be saved in our db

import userModel from "../models/userModel.js"

//add products to user Cart
const addToCart=async(req,res)=>{
    try {
        //get userId from req.body, we will also get itemid and size
        const {userId, itemId,size}=req.body//userId from token decode, it will be added in body, itemId is product id we are trying to add in cart, add size from req.body, we need info about product size as well
        const userData=await userModel.findById(userId)// after this using userId from userModel we will find that user and we will modify that cart data and we will add this itemId and size in their cart data, provide userId we will get from req.body, using that we will get particular user data in that variable
        //from userdata variable we will extract cart data
        let cartData=await userData.cartData//we will perform operation on cartData, so use let
        if (cartData[itemId]) {//check if cartData has this itemId available
            if (cartData[itemId][size]) {//in cartData, for this itemId and for this size, already entry is available
                cartData[itemId][size]+=1//we will add quantity 1

                
            }else{// if in cartData, if itemId is available and size is not available
                cartData[itemId][size]=1

            }
            
        }else{
            // if in cartData we don't have any product with this productId in that case we will add else statement
            cartData[itemId]={}//create size
            cartData[itemId][size]=1
        }
        // now we have to add updatedCartData in userCartData
        await userModel.findByIdAndUpdate(userId,{cartData})//provide userId and in object we need to update cart Data, this is the cartData we are getting from user's data cartData, we have updated that and we are sending updated cartdata, for this userID, it will update cartdata in db
        res.json({success:true, message:"Added to Cart"})//generate a response


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
//we have added logic for addToCart

//update user Cart
const updateCart=async(req,res)=>{
    try {
        const {userId,itemId,size,quantity}=req.body//get userId, item size and quantity from req.body, whenever we will do api call, we need to provide last 3 items because userId will be automatically added by middleware that we created in auth.js

        const userData=await userModel.findById(userId)// after this using userId from userModel we will find that user and we will modify that cart data and we will add this itemId and size in their cart data, provide userId we will get from req.body, using that we will get particular user data in that variable
        //from userdata variable we will extract cart data
        let cartData=await userData.cartData//we will perform operation on cartData, so use let
        //now we have cartdata, now we need to update cart data
        cartData[itemId][size]=quantity//using this it will update product quantity in cartData  
        //now save udpated cart data in db
        
        await userModel.findByIdAndUpdate(userId,{cartData})//provide userId and in object we need to update cart Data, this is the cartData we are getting from user's data cartData, we have updated that and we are sending updated cartdata, for this userID, it will update cartdata in db
        res.json({success:true, message:"Cart Updated"})//generate a response
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//get user cart data
const getUserCart=async(req,res)=>{
try {
    const {userId}=req.body//get user Id from req.body, using this userId we will find req.body and we will find user and their cart data and we will store cart data in variable

    const userData=await userModel.findById(userId)// after this using userId from userModel we will find that user and we will modify that cart data and we will add this itemId and size in their cart data, provide userId we will get from req.body, using that we will get particular user data in that variable
        //from userdata variable we will extract cart data
        let cartData=await userData.cartData//we will perform operation on cartData, so use let

        res.json({success:true,cartData})//we have to send this cartdata as a response
} catch (error) {
    console.log(error);
    res.json({success:false,message:error.message})
}

}
//we have created middleware(auth.js) that will take our token and verify that, using that token it will generate the id and it iwll provide id in req.body


export {addToCart, updateCart, getUserCart}//now for these functions we will create routes(cartRoute.jsx)

