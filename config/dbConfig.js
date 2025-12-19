import mongoose from "mongoose";

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.ATLESS_DB_URL);
    console.log("db is connected");
  } catch (error) {
    console.log(error);
  }
}

