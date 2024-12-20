import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import { generateFromEmail } from "unique-username-generator";
import responseHandler from "../utils/resHandler.js";
import errorResponseHandler from "../utils/errorResponseHandler.js";


export const registerUser = async (req, res) => {

    const { fullName, email, password , dob , gender , personType } = req.body;

    if (!fullName || !email || !password) {
        return errorResponseHandler(res, 400, "error", "Please fill in all fields");
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return errorResponseHandler(res, 400, "error", "User already exists");
        }

        const userName = generateFromEmail(email, 5, 10, "sanket");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            userName,
            email,
            gender,
            category : personType,
            password: hashedPassword

        });

        user.save();

        return responseHandler(res, 200, "success", "User registered successfully", user);

    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem registering user");
    }
}

export const loginUser = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return errorResponseHandler(res, 400, "error", "Please fill in all fields");
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return errorResponseHandler(res, 400, "error", "Invalid credentials");
        }

        const token = jwt.sign({ email: user.email, id: user._id, verified: user.isVerified }, process.env.JWT_SECRET, { expiresIn: "60d" });

        user.token = token;

        user.save();

        return responseHandler(res, 200, "success", "User logged in successfully", token);

    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem logging in user");
    }
}

export const googleAuth = async (req, res) => {

    if (!req.body.userInfo || !req.body.userInfo.data || !req.body.userInfo.data.user) {
        return errorResponseHandler(res, 400, "error", "Google auth data not found");
    }
    
    const { name, email, photo } = req.body.userInfo.data.user;
    
    const authType = req.body.userInfo.type;

    if (!name || !email) {
        return errorResponseHandler(res, 400, "error", "Google auth data not found");
    }
    if (authType !== "success") {
        return errorResponseHandler(res, 400, "error", "Google auth failed");
    }

    try {
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            userExists.isVerified = true; //by using google auth old unvarified user is now verified
            const token = jwt.sign({ email: userExists.email, id: userExists._id, verified: userExists.isVerified }, process.env.JWT_SECRET, { expiresIn: "60d" });
            userExists.token = token; //updating token
            await userExists.save();
            return responseHandler(res, 200, "success", "User logged in successfully through Google", token);
        } else {
            const userName = generateFromEmail(email, 5, 10, "sanket");

            const user = await User.create({
                fullName: name,
                userName,
                email,
                profilePicture: photo,
                isVerified: true
            });

            const token = jwt.sign({ email: user.email, id: user._id, verified: user.isVerified }, process.env.JWT_SECRET, { expiresIn: "60d" });
            user.token = token;
            await user.save();
            return responseHandler(res, 200, "success", "User registered successfully through Google", token);

        }

    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem logging in user through Google");
    }

}

export const sentOtp = async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return errorResponseHandler(res, 400, "error", "Please fill in all fields");
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }

        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });

        const otpExpire = new Date();

        otpExpire.setMinutes(otpExpire.getMinutes() + 10);

        const response = await User.updateOne({ email: email }, { otp: otp, otpExpire: otpExpire });
        const findName = await User.findOne({ email: email });
        

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP for password reset',
            html: `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification - SanketBani</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    color: #333;
                }
                .email-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                }
                .header img {
                    width: 120px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .content p {
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 10px;
                }
                .otp-container {
                    background-color: #EFEFEF;
                    padding: 15px;
                    text-align: center;
                    font-size: 20px;
                    font-weight: bold;
                    border-radius: 5px;
                }
                .footer {
                    text-align: center;
                    font-size: 14px;
                    color: #777;
                }
                .footer a {
                    color: #FFE70A;
                    text-decoration: none;
                }
                .developer-info {
                    margin-top: 30px;
                    font-size: 14px;
                    text-align: center;
                    color: #555;
                }
                .developer-info a {
                    color: #FFE70A;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img src="https://res.cloudinary.com/dpcor2qvh/image/upload/v1733587758/applogo3_lglvnk.png" alt="SanketBani Logo">
                    <h2>Account Verification OTP</h2>
                </div>
                
                <div class="content">
                    <p>Hello, ${findName.fullName}</p>
                    <p>Thank you for using SanketBani! We have received a request to reset your password. To proceed, please use the following One-Time Password (OTP):</p>
                    
                    <div class="otp-container">
                        ${otp} <!-- This dynamically inserts the OTP -->
                    </div>
                    
                    <p>If you did not request this, please ignore this email or contact support immediately.</p>
                    <p>This OTP is valid for 10 minutes only.</p>
                </div>
                
                <div class="footer">
                    <p>Need assistance? Contact us at: <a href="mailto:thedeveloperguy23@gmail.com">thedeveloperguy23@gmail.com</a></p>
                </div>

                <div class="developer-info">
                    <p>App developed by:</p>
                    <p>
                        <strong>Biswajit Dey</strong> (Full Stack) | <a href="https://github.com/Phinix-BI">GitHub</a><br>
                        <strong>Rajdeep Paul</strong> (Backend) | <a href="https://github.com/Rajdeep05-Web">GitHub</a><br>
                        <strong>Sayan Majumder</strong> (Frontend) | <a href="https://github.com/sayan-majumder-github">GitHub</a><br>
                        <strong>Rishit Chakraborty</strong> (AI/ML) | <a href="https://github.com/recursioncat">GitHub</a><br>
                    </p>
                    <p>Follow us on Instagram: <a href="https://instagram.com/_thedeveloperguy">_thedeveloperguy</a></p>
                    <p>Phinix-BI | SanketBani</p>
                </div>
            </div>
        </body>
        </html>`
        };

        const result = await transporter.sendMail(mailOptions);

        if (!result) {
            return errorResponseHandler(res, 500, "error", "Error from nodemailer");
        }

        return responseHandler(res, 200, "success", "OTP sent successfully");
    } catch (error) {
        console.log(error);
        return errorResponseHandler(res, 500, "error", "Problem sending OTP");
    }
}

export const verifyOtp = async ({ email, otp }) => {

    if (!email || !otp) {
        return { code: 400, status: "error", message: "Please fill in all fields" };
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return { code: 400, status: "error", message: "User does not exist" };
        }

        if (user.otp != otp) {
            return { code: 400, status: "error", message: "Invalid OTP" };
        }

        const currentTime = new Date();

        if (currentTime > user.otpExpire) {
            return { code: 400, status: "error", message: "OTP expired" };
        }

        return { code: 200, status: "success", message: "OTP verified successfully" };

    } catch (error) {
        return { code: 500, status: "error", message: "Problem verifying OTP" };
    }
}

export const resetPassword = async (req, res) => {

    const { email, otp, password, confirmPassword } = req.body;

    console.log(email , otp , password , confirmPassword);

    if (!email || !otp || !password || !confirmPassword) {
        return errorResponseHandler(res, 400, "error", "Please fill in all fields");
    }

    if (password !== confirmPassword) {
        return errorResponseHandler(res, 400, "error", "Passwords do not match");
    }

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }
        const response = await verifyOtp({ email, otp });

        if (response.status === "error") {
            return errorResponseHandler(res, 400, "error", response.message);
        }

        const comparePassword = await bcrypt.compare(password, user.password);

        if (comparePassword) {
            return errorResponseHandler(res, 400, "error", "Cannot use old password");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.otp = null;
        user.otpExpire = null;

        user.save();

        return responseHandler(res, 200, "success", "Password reset successfully");

    } catch (error) {
        console.log(error);
        return errorResponseHandler(res, 500, "error", "Problem resetting password");
    }

}

export const verifyEmail = async (req, res) => {

    const { email, otp } = req.body;

    if (!email || !otp) {
        return errorResponseHandler(res, 400, "error", "Please fill in all fields");
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }

        
        const response = await verifyOtp({ email, otp });

        if (response.status === "error") {
            return errorResponseHandler(res, 400, "error", response.message);
        }

        if(user.isVerified){
            return responseHandler(res, 200, "success", "otp verified successfully");
        }

        user.isVerified = true;

        const token = jwt.sign({ email: user.email, id: user._id, verified: true }, process.env.JWT_SECRET, { expiresIn: "60d" });

        user.token = token;

        user.save();

        return responseHandler(res, 200, "success", "User verified successfully", token);

    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem verifying user");
    }
}

export const getUser = async (req, res) => {

    try {
        const token = req.headers["x-auth-token"];

        if (!token) {
            return errorResponseHandler(res, 400, "error", "Please provide token");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id.toString(); // Convert userId to a string

        const user = await User.findById(userId);

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }

        return responseHandler(res, 200, "success", "Users fetched successfully", user);

    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem fetching users");
    }
}

export const updateUser = async (req, res) => {
    const token = req.headers["x-auth-token"];

    if (!token) {
        return errorResponseHandler(res, 400, "error", "Please provide token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id.toString(); // Convert userId to a string

    const { fullName, gender, category } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }

        user.fullName = fullName || user.fullName;
        user.gender = gender || user.gender;
        user.category = category || user.category;

        user.save();

        return responseHandler(res, 200, "success", "User updated successfully");
    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem updating user");
    }
}

export const getUserId = async (req, res) => {
    const { userEmail } = req.params;

    if (!userEmail) {
        return errorResponseHandler(res, 400, "error", "Please provide email");
    }

    try {
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return errorResponseHandler(res, 400, "error", "User does not exist");
        }

        return responseHandler(res, 200, "success", "User fetched successfully", { id: user._id });
    } catch (error) {
        return errorResponseHandler(res, 500, "error", "Problem fetching user");
    }
}
