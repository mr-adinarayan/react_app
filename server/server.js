import express, { json } from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from "firebase-admin";
import serviceAccountKey from "./react-blogging-b2904-firebase-adminsdk-pxpro-d71e2ef5a8.json" assert{type:'json'};

const { getAuth } = admin;


import User from './Schema/User.js';
const server = express();
    let PORT =3000;
    admin.initializeApp({
        credential:admin.credential.cert(serviceAccountKey)
    }
    )
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
server.use(express.json());
server.use(cors())
    mongoose.connect(process.env.DB_LOCATION,{
        autoIndex: true
    })

    const formatDatatoSend=(user)=>{
const access_token= jwt.sign({id:user._id},process.env.SECRET_ACCESS_KEY)


        return{
            access_token,
            profile_img:user.personal_info.profile_img,
            username:user.personal_info.username,
            fullname:user.personal_info.fullname
        }
    }

    const genarateUsername =async(email)=>{
        let username= email.split("g")[0];
        let isUsernameNotUnique= await User.exists({"personal_info.username":username}).then((result)=>result)

        isUsernameNotUnique ? username+= nanoid().substring(0,5) : "";
        return username
    }

    server.post("/signup",(req,res)=>{
        let {fullname,email,password}=req.body;
        if(fullname.length <3){
            return res.status(403).json({"error":"This must be at least 3 letters long."} )
        }
        if(!email.length){
            return res.status(403).json({"error":"Enter Email"})
        }
        if(!emailRegex.test(email)){
            return res.status(403).json({"error":"Email is invalid"})
        }
        if(!passwordRegex.test(password)){
            return res.status(403).json({"error":"Password should be 6 to 20 character long with a numeric, 1 Lower and Upper case alphabets"})
        }
        bcrypt.hash(password,10,async(err,hashed_password)=>{
            let username= await genarateUsername(email);
            let user = new User({
                personal_info:{fullname,email,password:hashed_password, username}
            })
            user.save().then((u)=>{
                return res.status(200).json(formatDatatoSend(u))
            })
            .catch(err => {

                if(err.code==11000){
                    return res.status(500).json({"error":"email already exist"})
                }
                return res.status(500).json({"error": err.message})
            })
        })

    })

    server.post("/signin",(req,res)=>{
        let {email,password}= req.body;
        User.findOne({"personal_info.email":email})
        .then((user)=>{
            if (!user) {
                return res.status(403).json({"error":"email not found"})
            }
            if(!user.google_auth){
                bcrypt.compare(password,user.personal_info.password,(err,result)=>{
                    if(err){
                        return res.status(403).json({"error":"error occured while login please try again"});
                    }
                    if(!result){
                        return res.status(403).json({"error":"incorrect password"});
                    }else{
                        return res.status(200).json(formatDatatoSend(user));
    
                    }
                })
            }else{
                return res.status(403).json({"error":"This account was created with Google try logi in with Google"})
            }
           



        })
        .catch(err=>{
            console.log(err.message);
            return res.status(403).json({"error": err.message})
        })
    })


    server.post("/google-auth", (req, res) => {
        let { access_token } = req.body;
    
        getAuth()
            .verifyIdToken(access_token)
            .then((decodedUser) => {
                let { email, name, picture } = decodedUser;
                picture = picture.replace("s96-c", "s384-c");
    
                User.findOne({ "personal_info.email": email })
                    .select("personal_info.fullname personal_info.username personal_info.profile_img google_auth")
                    .then((user) => {
                        if (user) {
                            if (user.google_auth) {
                                return res.status(403).json({ "error": "This email was signed up without Google. Please sign in with a password." });
                            }
                        } else {
                            let username = genarateUsername(email);
                            let newUser = new User({
                                personal_info: { fullname: name, email, username },
                                google_auth: true
                            });
                            return newUser.save();
                        }
                    })
                    .then((savedUser) => {
                        return res.status(200).json(formatDatatoSend(savedUser));
                    })
                    .catch((err) => {
                        return res.status(500).json({ "error": err.message });
                    });
            })
            .catch((err) => {
                return res.status(500).json({ "error": "Failed to Authenticate with Google. Try with any other Google Account" });
            });
    });
    

    server.listen(PORT,()=>{
        console.log('listen '+PORT);
    })