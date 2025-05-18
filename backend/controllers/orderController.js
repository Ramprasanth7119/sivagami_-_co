//logic for orders so that when we fill the form and select cod, order will be places and we will get order details in db, for this we have to create api in the backend

// import { currency } from "../../admin/src/App.jsx"
import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import Stripe from "stripe"
import razorpay from "razorpay"

// global variables
const currency='inr'//while creating stripe account we have used currency inr
const deliveryCharge=10


//gateway initialise
//use stripe secret key from .env to create instance of stripe
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY)//from env variable
// initialise razorpay
const razorpayInstance=new razorpay({//creating instance of razorpay, using this we will create razorpay payment controller function, pass key id and key secret defined in env variable
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})


//to create order api we have to create new model

const placeOrder=async(req,res)=>{//using this function we can place cod order, placing order using COD method
    try {
       const {userId, items, amount, address}=req.body //get these from req.body, whenever we will create a request, then items, amount and address will be sent from the body and we will also send token from headers using this we can get the userId using auth.js middleware
       const orderData={//it will create one order data as defined in orderSchema defined in orderModel.js
        userId,
        items,
        address,
        amount,
        paymentMethod:"COD",//is for COD
        payment:false,//since it is a COD
        date:Date.now()//we will get current date and time stamp
    }

    //using the above order data we will create a new order, for this import orderModel in this file
    const newOrder=new orderModel(orderData)//provide orderData we have created above
    //save order in db
    await newOrder.save()//using this order will be saved in db, whenever order will be saved we have to clear cart data of the user, because using the cart data we have already save the order
    await userModel.findByIdAndUpdate(userId,{cartData:{}})//provide userId and object where we will add cartdata and we will set it with {} so the cart data will be reset

    res.json({success:true,message:"Order Placed"})//generate a response
       //create a orderdata
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
        
    }

}//using this we can place a new order, integrate this api with our frontend

const placeOrderStripe=async(req,res)=>{//using this function we can place stripe order, placing order using Stripe method
    try {
        const {userId, items, amount, address}=req.body//get products data from req.body
        const {origin}=req.headers //we need origin url, from where user has initiated payment, we will get from req.headers, whenever we create any req, then in headers origin property will be created where it includes frontend url, suppose we are placing order from website, then origin will be localhost:5173
        //now create the orderdata
        const orderData={//it will create one order data as defined in orderSchema defined in orderModel.js
            userId,
            items,
            address,
            amount,
            paymentMethod:"Stripe",//is for COD
            payment:false,//initialise payment as false
            date:Date.now()//we will get current date and time stamp
        }
        const newOrder=new orderModel(orderData)//provide orderData we have created above
        //save order in db
        await newOrder.save()//using this order will be saved in db
        //we will create line items, using that we will execute stripe payment
        const line_items=items.map((item)=>({//we will get items from body , pass individual item
            price_data:{
                currency:currency,
                product_data:{
                    name:item.name

                },
                unit_amount:item.price*100
            },
            quantity:item.quantity

        }))

        //in line items we will add delivery charges
        line_items.push({
            price_data:{
                currency:currency,
                product_data:{
                    name:'Delivery Charges'

                },
                unit_amount:deliveryCharge*100
            },
            quantity:1
        })

        //using line items we will create a new session
        const session=await stripe.checkout.sessions.create({//we have to define success and cancel url, if payment is successful,we will be redirected to success page, else to cancel page
            success_url:`${origin}/verify?success=true&orderId=${newOrder._id}`,//frontend url, add parameters, redirected to success url
            cancel_url:`${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,//created above
            mode:"payment",
        })//now we have created the session, whenever session will be created, in this session, there will be one url and using that url we can send users in payment gateway, in that case add a response using json method

        res.json({success:true,session_url:session.url})//controller function for placeorderstripe has been created

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
    

}//implement api in frontend in placeOrder.jsx file


// use success_url to verify payment
//Verify Stripe
const verifyStripe=async(req,res)=>{
   const {orderId, success,userId}=req.body //get user's id and users order id and success property from req.body
   try {
    if (success==="true") {//verify if success is true, in that case we will change payment status to true for this orderId
        await orderModel.findByIdAndUpdate(orderId,{payment:true})//provide orderid and add an object where we will define payment property and make it true
        await userModel.findByIdAndUpdate(userId,{cartData:{}})// clear cart data of user
        res.json({success:true})//generate a response
        
    }else{//if payment is failed, order will be deleted
        await orderModel.findByIdAndDelete(orderId)
        res.json({success:false})// generate a response

    }
   } catch (error) {
    console.log(error);
    res.json({success:false,message:error.message})
   }
}//link this function with route

const placeOrderRazorpay=async(req,res)=>{//using this function we can place razorpay order, placing order using Razorpay method
    try {
        const {userId, items, amount, address}=req.body//get products data from req.body, destructure order details
        
        //now create the orderdata
        const orderData={//it will create one order data as defined in orderSchema defined in orderModel.js
            userId,
            items,
            address,
            amount,
            paymentMethod:"Razorpay",//is for Razorpay
            payment:false,//initialise payment as false
            date:Date.now()//we will get current date and time stamp
        }

        const newOrder=new orderModel(orderData)//provide orderData we have created above
        //save order in db
        await newOrder.save()//using this order will be saved in db

        //create an option , using this we can execute  payment of razorpay
        const options={//add amount we will get from req.body
            amount:amount*100,
            currency:currency.toUpperCase(),//already defined in global variables, for razorpay we need currency in uppercase
            receipt:newOrder._id.toString()//we will get after we save after we save order in mongodb
        }

        //using these options, we will create new order of razorpay
        await razorpayInstance.orders.create(options,(error,order)=>{//options created above, send error and orders in parameter
            if (error) {//if there is any error
                console.log(error);
                return res.json({success:false,message:error})
                
            } 
            res.json({success:true,order})//pass order we will get from parameter
        })
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }

}

console.log("First step is complete");

//using 3 items,we will verify payment
const verifyRazorpay=async(req,res)=>{
    try {
        //from frontend to backend, we will send razorpay order id, using this we will check payment
        const {userId,razorpay_order_id}=req.body

        //find order from razorpay_order_id
        const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)//provide razorpay order id
        // console.log(orderInfo);
        //check if status is paid, it means total payment is complete, in this case we will use receipt where we have used orderId, for this orderId we will change payment to true and we will clear user cart 
        if (orderInfo.status==="paid") {//payment is successful
            await orderModel.findByIdAndUpdate(orderInfo.receipt, {payment:true})//provide orderId we have saved in the receipt, update payment in db to true
            await userModel.findByIdAndUpdate(userId,{cartData:{}})//clear user cart data of user, add userid and user's cart data
            res.json({success:true,message:"Payment Successful"})//create a response
            
        }else{
            //if order status is not paid
            res.json({success:false,message:"Payment Failed"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}//now payment is verified


//controller function using this we can display all orders on our admin panel, all orders data for admin panel
// logic to display all orders in our admin panel
const allOrders=async(req,res)=>{
    try {
        const orders=await orderModel.find({})//here we want all orders from all users, add an {}
        //these orders will be stored in one []
        res.json({success:true,orders})//generate a response

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
    


}

// user order data for frontend
const userOrders=async(req,res)=>{//we can display orders for particular user and we will display it in my orders page
    // remove dummy orders and add user's actual orders
    try {
        const {userId}=req.body//get userId from req.body
        // using this userId we can find all orders
        const orders=await orderModel.find({userId})//when we are placing order, we have added userId property of user who has placed the order, use this userId property to find userData, we will get orders in this orders array and we will send this array as a response
        res.json({success:true,orders})//send orders array
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }

}

//update order status from admin panel
// to change this status from admin panel, we have to create one controller function
const updateStatus=async(req,res)=>{
    try {
        const {orderId,status}=req.body//get orderid and status from user, send orderid and status when hit api
        //use order model to find order and update status
        await orderModel.findByIdAndUpdate(orderId,{status})//pass orderId and add status we will get from req.body, whatever status we will send here will be saved for orderId and it will be saved in db
        res.json({success:true,message:"Status Updated"})//generate a response
    } catch (error) {
         console.log(error);
        res.json({success:false,message:error.message})
    }//now we have updated status in orderRoute.js file in the endpoint /status and we have added admin auth so only admin can update the status

}

export {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus,verifyStripe, verifyRazorpay}//using these we will create routes