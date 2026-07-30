const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");


// SIGNUP
router.post("/signup", async(req,res)=>{
try{

const {name,email,password} = req.body;

const userExists = await User.findOne({email});

if(userExists){
return res.status(400).json({message:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const user = new User({
name,
email,
password:hashedPassword
});

await user.save();

res.json({message:"Account created successfully"});

}catch(err){
res.status(500).json({message:"Server Error"});
}
});


// LOGIN
router.post("/login", async(req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(400).json({message:"Invalid credentials"});
}

const isMatch = await bcrypt.compare(password,user.password);

if(!isMatch){
return res.status(400).json({message:"Invalid credentials"});
}

res.json({
message:"Login successful",
user:{
id:user._id,
name:user.name,
email:user.email
}
});

}catch(err){
res.status(500).json({message:"Server Error"});
}

});

// LOGOUT / DELETE USER
router.delete("/logout/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User logged out and deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;