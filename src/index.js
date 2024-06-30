const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

let server;

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port
const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Connected to DB at", process.env.MONGODB_URL)
    }catch(e){
        console.log("Failed to connect to DB", e)
    }
}

connectDB()

app.listen(process.env.PORT, ()=>{
    console.log(`App is listening at ${process.env.PORT}`)
})