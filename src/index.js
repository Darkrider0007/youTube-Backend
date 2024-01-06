import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
  // use this in package.json "scripts": {
  //     "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
  //   },
});

connectDB()
  .then(() => {
    app.on("error", (error) => console.log(`Error: ${error}`));
    app.listen(process.env.PORT || 8000, () =>
      console.log(`Server🚀 is running on port ${process.env.PORT}✨`)
    );
  })
  .catch((error) => console.log(error.message));
















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
