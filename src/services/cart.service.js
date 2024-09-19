const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {

  const cart = await Cart.findOne({email: user.email})

  if(!cart){
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not have Cart')
  }

  return cart;
  
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  let cart = await Cart.findOne({email:user.email});

  if(!cart){
    //create a cart
   try{
      cart = await Cart.create({
      email:user.email,
      cartItems:[],
      paymentOption: config.default_payment_option
    })
   }catch(e){
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong.. Internal server error')
   }
  }
  
  if(cart == null){
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'User Does not have cart')
  }
 
  
  for(let i =0; i<cart.cartItems.length; i++){
    
    if(cart.cartItems[i].product._id == productId){
     
      throw new ApiError(httpStatus.BAD_REQUEST, 'Product already in cart. Use the cart sidebar to update or remove product from cart')
    }
  }

    const product = await Product.findOne({_id: productId})

    if(!product){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Product Not Found')
    }
    cart.cartItems.push({product:product , quantity:quantity})
  
 

  await cart.save()
  return cart

};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  const userCart = await Cart.findOne({email:user.email})
  if(!userCart){
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not have a cart. Use POST to create cart and add a product')
  }

  const product = await Product.findOne({_id:productId});

  if(!product){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database")
  }

 
  const isProductInCart = userCart.cartItems.find((ele)=>ele.product._id==productId);

  if(!isProductInCart){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product not in cart')
  }

  if(quantity === 0){
    const index = userCart.cartItems.findIndex(ele => ele._id == productId)
    userCart.cartItems.splice(index,1);
    await userCart.save()
    return userCart
  }

  userCart.cartItems.forEach(item => {
    if(item.product._id == productId){
      item.quantity = quantity;
    }
  })

  await userCart.save()
   return userCart 

};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const cart = await Cart.findOne({email:user.email})
  if(!cart){
    throw new ApiError(httpStatus.BAD_REQUEST, 'user does not have cart')
  }
  const isProductInCart = cart.cartItems.find(item => item.product._id == productId)
  if(!isProductInCart){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product not in users cart')
  } else {
    const index = cart.cartItems.findIndex(ele => ele.product._id == productId)
    if(index){
      cart.cartItems.splice(index,1)
    }
  }

  cart.save();

};



// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {

  const cart = await Cart.findOne({email:user.email})

  if(!cart){
    throw new ApiError(httpStatus.NOT_FOUND, 'user does not have cart')
  }

  if(cart.cartItems.length == 0){
    throw new ApiError(httpStatus.BAD_REQUEST, 'no products found in the cart')
  }

  const hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress();

  if(!hasSetNonDefaultAddress){

    throw new ApiError(httpStatus.BAD_REQUEST, 'user has default address')
  }

 const total = cart.cartItems.reduce((acc, curr)=> acc += curr.product.cost , 0)

 if(user.walletMoney<total){
  throw new ApiError(httpStatus.BAD_REQUEST, 'insufficient balance')
 }

 user.walletMoney = user.walletMoney - total;
 user.cartItems = []

 user.save()



};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
