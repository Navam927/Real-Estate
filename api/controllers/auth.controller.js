import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendMail } from '../middleware/sendMail.js';
import fs from 'fs';
import path from 'path';
import { Response } from '../utils/Response.js';
import { fileURLToPath } from 'url';
import { message } from '../utils/message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  try {
    await newUser.save();
    res.status(201).json('User created successfully!');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return Response(res, 400, false, message.missingFieldMessage);
    }
    // Find user
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return Response(res, 404, false, message.userNotFoundMessage);
    }
    // check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return Response(res, 401, false, message.invalidCredentialsMessage);
    }

    const loginOtp = Math.floor(100000 + Math.random() * 900000);
    let emailTemplate = fs.readFileSync(path.join(__dirname, '../templates/mail.html'), 'utf-8');

    const subject = "Verify your account";

    emailTemplate = emailTemplate.replace('{{OTP_CODE}}', loginOtp);
    emailTemplate = emailTemplate.replaceAll('{{MAIL}}', process.env.SMTP_USER);
    emailTemplate = emailTemplate.replace('{{PORT}}', process.env.PORT);
    emailTemplate = emailTemplate.replace('{{USER_ID}}', user._id.toString());

    await sendMail({
      email,
      subject,
      html: emailTemplate,
    })

    user.loginOtp = loginOtp;

    try {
      await user.save();
      // console.log('user saved successfully');
    } catch (error) {
      // console.log('error saving user:', error);
    }


    const updatedUser = await User.findById(user._id);
    // console.log('Updated User after save: ', updatedUser);  // Check if loginOtp is still there

    return Response(res, 200, true, message.otpSentSuccessfullyMessage, user._id);
  } catch (error) {
    return Response(res, 500, false, error.message);
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    
    const { id } = req.params;
    const { otp } = req.body;

    if (!id) {
      return Response(res, 404, false, message.idNotFoundMessage);
    }
    if (!otp) {
      return Response(res, 404, false, message.otpNotFoundMessage);
    }
    
    const user = await User.findById(id);
    if (!user) {
      return Response(res, 404, false, message.userNotFoundMessage);
    }
    
    if (String(user.loginOtp).trim() !== String(otp).trim()) {
      
      return Response(res, 401, false, message.invalidOtpMessage);
    }
    

    await user.save();
    
    const token = jwt.sign({ id: id }, process.env.JWT_SECRET);

    console.log('token generated', token);

    const userData = user.toObject();
    delete userData.password;

    res.cookie('access_token', token, {
      secure : false,
      sameSite : 'None',
      httpOnly : true,
      maxAge : 24 * 60 * 60 * 1000,
    });

    // console.log('cookie set : ', res.headers['set-cookie']);

    return res.status(200).json({
      success : true,
      message : message.otpVerifiedSuccessfullyMessage,
      data : userData
    })

  } catch (error) {
    Response(res, 500, false, error.message);
  }
}

export const signout = async (req, res, next) => {
  try {
    // console.log('signout user started');
    res.clearCookie('access_token');
    res.status(200).json('User has been logged out!');
  } catch (error) {
    // console.log(error.message)
    next(error);
  }
};

