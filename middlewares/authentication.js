import User from "../models/userModel.js"
import bcrypt from "bcryptjs"
export async function addUser(req,res) {
    try {    
        const {name,email,password}=req.body
        const existingUser=await User.findOne({email})
        if (existingUser) {
            console.log("email already exist");
            res.status(400).send("email already exist")
            return
        }
        //////////////////////////////////////////////
       if (name.trim().length<=3) return res.send("name must be more than 3 letters")
       if (password.trim().length<=6) return res.send("atleast 6 charectors needed in password");

        ////////////////////////////////////////////////

          const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id
    });
        
    } catch (error) {
        console.log(error);
      res.status(400).send("error occured when registering user")

        
    }
    
}

import jwt from "jsonwebtoken";

export const middleWareAuthentication = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed" });
  }
};
