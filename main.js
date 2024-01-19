import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "Authentication",
  })
  .then(() => console.log("Databse Connected"))
  .catch((err) => {
    console.log(err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "asdfasdfasdfa");
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};
app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/login", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) return res.redirect("/register");

  // yeh await ke saath hi hoga, buss dekhne meh dhoka khane jaisa lag rha hai
  const isMatch =await bcrypt.compare(password,user.password)
  if (!isMatch) {
    return res.render("login", { name, email, message: "Incorrect Password" });
  }
  const token = jwt.sign({ _id: user._id }, "asdfasdfasdfa");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // sirf ek hi user ko dhundega
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  const token = jwt.sign({ _id: user._id }, "asdfasdfasdfa");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "null", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(1000, () => {
  console.log("Server is Listening");
});

// locals.message wale trick seh kaam kiya
