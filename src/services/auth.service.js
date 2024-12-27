const httpStatus = require("http-status");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");

/**
 * Login with username and password
 * - Utilize userService method to fetch user object corresponding to the email provided
 * - Use the User schema's "isPasswordMatch" method to check if input password matches the one user registered with (i.e, hash stored in MongoDB)
 * - If user doesn't exist or incorrect password,
 * throw an ApiError with "401 Unauthorized" status code and message, "Incorrect email or password"
 * - Else, return the user object
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
// const loginUserWithEmailAndPassword = async (email, password) => {
//   const user = await userService.getUserByEmail(email);
//   console.log(user, ' user from auth service')
//   if(!user){
//     throw new ApiError(httpStatus.UNAUTHORIZED, 'No User with this email found')
//   }
//   const isPasswordMatch = await bcrypt.compare(password, user.password)
//   console.log(isPasswordMatch, 'is paass match from auth')
//   if(!isPasswordMatch){
//     throw new ApiError(httpStatus.UNAUTHORIZED, 'email or password is incorrect')
//   }

//   return user;
  
  
// };


const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email)
  if(!user || !(await user.isPasswordMatch(password)))
  {
    throw new ApiError(httpStatus.UNAUTHORIZED,"Incorrect Credentials")
  }
  // return {_id:user._id,walletMoney:parseInt(user.walletMoney),name:user.name,email:user.email,password:user.password,address:user.address};
  return user
};

module.exports = {
  loginUserWithEmailAndPassword,
};
