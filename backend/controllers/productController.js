import {v2 as cloudinary} from "cloudinary"
import productModel from "../models/productModel.js"

//we will now create controllers function to add product
//function for add product
const addProduct=async (req,res)=>{//now this api is publicly open and anyone can access this api (endpoint) and add a new product, later we will add authentication on this route, so that only admin can add product using admin email id and password
    //logic to add a product in db, we will create a middleware using multer, so that if we send any file as form data, then that file will be called using multer(for this, create multer.js in middleware folder)
    try {
        const {name,description,price,category,subCategory,sizes,bestseller}=req.body//get those properties from req.body
        //we have to get product images we will get from req.files and we will store these files in variables
        const image1=req.files.image1 && req.files.image1[0]//we will use 1st element from image1 array
        // when we have not send any image file and we are trying to access a file, we will get one error and to solve this error
        const image2=req.files.image2 && req.files.image2[0]//checking if image 2 is available in req.files, then we will store that image in image1 variable
        const image3=req.files.image3 && req.files.image3[0]
        const image4=req.files.image4 && req.files.image4[0]
        // now we have to store images and data in db but in db we cannot store image, so first we have to upload images in cloudinary and from cloudinary we will get url and we should upload this url in db
        const images=[image1,image2,image3,image4].filter((item)=>item!==undefined)//pass individual item and check if item is not = undefined, then only we will store that image in array, undefined images are removed
        //upload all images in cloudinary storage and from there we will get url which we will store in db
        let imagesUrl=await Promise.all(
            images.map(async(item)=>{//pass individual item
                let result=await cloudinary.uploader.upload(item.path,{resource_type:'image'})//use uploader method and upload function and pass path of image and define resource path as image and in this result we will get one secure url that will be image url(store this in image url array)
                return result.secure_url//all these image1,2,3,4 will be uploaded in cloudinary storage and we will get url which will be stored in imagesurl array
            })//return images url and store it in this array
        )
        //we will get product details from body and from the above lines we will image details
        // console.log(name,description,price,category,subCategory,sizes,bestseller);
        // console.log(images);
        
        
        // console.log(imagesUrl);//we have one array with images we will send from admin panel, if we have only 1 image, we will upload only 1 image and so on in cloudinary
        //all images have been uploaded and we are getting url of all images

        //now we have to save all these data in mongodb db
        const productData={
            name,
            description,
            category,
            price:Number(price),//to convert it to a number from string(that we get from form data), data is converted in Boolean
            subCategory,
            bestseller:bestseller==="true"? true : false,//from form data we will get this as a string, so convert it to Boolean, check if bestseller is true, then return true else return false
            sizes:JSON.parse(sizes),//will be one array so that when we send this array in form data, before sending this array using form data, we have to convert these sizes using json.stringify method to string, when we get to string, we have to parse it and convert it into array using json.parse(sizes), we are adding this because we cannot send array directly as form data, so from frontend we will send sizes that will be converted in string and here we are converting string to array using json.parse 
            image:imagesUrl,
            date:Date.now()//returns a timestamp and type will be number
        }

        console.log(productData);

        //to add product we will use product model created
        const product=new productModel(productData)//provide productdata, we have provided product format in product controller which we should match with product model

        await product.save()//to save in db, product is saved in db now, product is added using api
        
        res.json({success:true,message:"Product Added"})
        
        
    } catch (error) {
        console.log(error);
        
        res.json({success:false,message:error.message})
    }

}//now test api where we will check if these product details and images are coming in this function or not

//function for list product
const listProducts=async (req,res)=>{//logic for listing products
    //now we will create api for listproducts, return all products in one array, using which we can display the product on frontend
    try {
        const products=await productModel.find({})//we will store products data
        res.json({success:true,products})
    } catch (error) {
        console.log(error);
        
        res.json({success:false,message:error.message})
    }
}

//function for removing product
const removeProduct=async (req,res)=>{//logic for removing the product
    try {
        await productModel.findByIdAndDelete(req.body.id)//when we will call this api then in body we will send this id, where we will send products id, in the endpoint(/api/product/remove) send product id as raw json data
        //after this our product will be removed from our db
        res.json({success:true,message:"Product Removed"})
    } catch (error) {
        console.log(error);
        
        res.json({success:false,message:error.message})
    }

}

//function for single product info
const singleProduct=async (req,res)=>{//create this function to get info of a single product
    try {
        const {productId}=req.body//get productid, when we will hit this api we have to provide the product id in body
        //using this product id we can find product and we will send this data as a response
        const product=await productModel.findById(productId)//provide product Id which we will get from req.body
        //send variable as response
        res.json({success:true, product})


    } catch (error) {
         console.log(error);
        
        res.json({success:false,message:error.message})
    }

}//send productId in json body in the endpoint(/api/product/single)


export {listProducts, addProduct, removeProduct, singleProduct}//used in product Route .js