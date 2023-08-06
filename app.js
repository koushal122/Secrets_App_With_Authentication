import 'dotenv/config'
import express from 'express';
import mongoose, { Mongoose } from 'mongoose';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose'; 


const app=express();
const port=process.env.PORT || 3000;
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//telling to use session package
app.use(session({
   secret:"this is our secret key",//this is secret key used for encryption
   resave:false,
   saveUninitialized:false
}));

app.use(passport.initialize()); //initialize passport
app.use(passport.session()); //use passport to initialize session


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
const userSchema=new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(passportLocalMongoose);//we are using plugin to save users in mongoDB databse

const userModel=mongoose.model("User",userSchema);

passport.use(userModel.createStrategy());
//serialize means creating cookie or opening cookies
passport.serializeUser(userModel.serializeUser());
//deserialize meand we are destroying or deleting cookies
passport.deserializeUser(userModel.deserializeUser());

app.get("/",(req,res)=>{
   res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
 });

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",function(req,res){

    //if someone directly request this page then it will not ask 
    //login untill cookies was saved.
    //if we go to cookies in browser there we can see when that will expire
    if(req.isAuthenticated()){//we are checking either req is authenticated or not 
        res.render("secrets");
    }
    else res.redirect("/login");
});

 app.post("/register",async (req,res)=>{
    //this register method is  coming here because of passport-local-mongoose package 
    //this passport-local-mongoose automatically salts and hash passwords 
    userModel.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
 });

 app.post("/login",async (req,res)=>{
   const user=new userModel({
    username:req.body.username,
    password:req.body.password
   });
   req.login(user,function(err){
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res,function(){
             res.redirect("/secrets");
        });
    }
   })
 });
 
 //remember when we start server again, our cookies get deleted
 //so we have to login again.
 app.get("/logout",function(req,res){
   req.logout(function(err){
    if(err)
    console.log(err);
    res.redirect("/"); 
   });
   
 });


app.listen(port,(err)=>{
    if(err)
    console.log("server has not started");
    else console.log(`server has started on port ${port}`);
})
