import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env', 
     // use this in package.json "scripts": {
    //     "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
    //   },
});


const app = express();



connectDB();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//     console.log("MongoDB connection success");
//     app.on("error", (error) => console.log(`Error: ${error}`));
//     app.listen(process.env.PORT, () =>
//       console.log(`Server is running on port ${process.env.PORT}`)
//     );
//   } catch (error) {
    
//     console.log("MongoDB connection failed");
//     throw new Error(error);
//   }
// })();
