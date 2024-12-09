import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import { sendMail } from '../middleware/sendMail.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  console.log('signin user started');
  const { email, password } = req.body;
  console.log('body data parsed');
  try {
    let validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, 'User not found!'));
    } else {
      console.log(validUser.username,' found successfully');
    }
       
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(401, 'Wrong credentials!'));
    } else {
      console.log('password is correct');
    }
      

    if(validUser.twoFAEnabled) {
      console.log('2FA enabled');
      
      if(validUser.lockUntil < Date.now()) {
        validUser.loginAttempts = 0;
        validUser.loginOtp = undefined;
        await validUser.save();
        return res.status(400).json({
          status: 'failed',
          message: '2FA is locked. Please try again later.'
        })
      } else {
        console.log('user is not locked');
      }

      if(validUser.loginAttempts >= process.env.MAX_LOGIN_ATTEMPTS) {
        validUser.loginAttempts = 0;
        validUser.loginOtp = undefined;
        validUser.lockUntil = new Date(Date.now() + process.env.MAX_LOGIN_ATTEMPTS_EXPIRE * 60 * 1000);
        await validUser.save();

        return res.status(400).json({
          message : "Max otp attempts reached. Please try again later.",
          success : false
        })

      } else {
        console.log('otp attempts not reached');
      }

      const loginOtp = Math.floor(100000 + Math.random() * 900000);
      const loginOtpExpire = new Date(Date.now() + process.env.LOGIN_OTP_EXPIRE * 60 * 1000);

      // Email Template
      let emailTemplate = fs.readFileSync(path.join(__dirname, '../templates/mail.html'), 'utf-8');

      // Send otp
      const subject = "Verify your account";
      // const body = `Your OTP is ${otp}`;

      emailTemplate = emailTemplate.replace('{{OTP_CODE}}', loginOtp);
      emailTemplate = emailTemplate.replaceAll('{{MAIL}}', process.env.SMTP_USER);
      emailTemplate = emailTemplate.replace('{{PORT}}', process.env.PORT);
      emailTemplate = emailTemplate.replace('{{USER_ID}}', validUser._id.toString());

      

      try {
        await sendMail({ email, subject, html : emailTemplate });
        console.log('mail sent');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return next(errorHandler(500, 'Failed to send OTP email'));
      }

      validUser.loginOtp = loginOtp;
      validUser.loginOtpExpire = loginOtpExpire;
      validUser.loginAttempts = 0;
      validUser.lockUntil = undefined

      await validUser.save();

        // Send response
      return res.status(200).json({
        message: 'OTP sent successfully. Please verify to continue.',
        id : validUser._id,
        success : true

      });


    } else {
      console.log('2FA not enabled');
      const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
      console.log('token generated');
      const { password: pass, ...rest } = validUser._doc;
      res
        .cookie('access_token', token, { httpOnly: true })
        .status(200)
        .json(rest);
    }

    
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOtp = async (req, res, next) => {
  const { id } = req.params;
  const { otp } = req.body;

  // Validate input
  
  if (!id || !otp) {
    return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
  }

  try {
    const user = await User.findById(id);
    console.log(user.loginOtp);
    console.log(otp);
    // Validate user existence
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if OTP attempts are locked
    if (user.loginOtpAttemptsExpire && user.loginOtpAttemptsExpire > Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP attempts are locked. Try again later.' });
    }

    // Check if maximum OTP attempts are exceeded
    if (user.loginOtpAttempts >= process.env.MAX_LOGIN_ATTEMPTS) {
      user.loginOtpAttemptsExpire = new Date(Date.now() + process.env.LOGIN_OTP_ATTEMPTS_EXPIRE * 60 * 1000);
      await user.save();
      return res.status(400).json({ success: false, message: 'Maximum OTP attempts exceeded. Try again later.' });
    }

    // Check if OTP has expired
    if (!user.loginOtpExpire || user.loginOtpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    
    // Compare OTP (ensure type consistency)
    if (String(user.loginOtp) !== String(otp)) {

      user.loginOtpAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Incorrect OTP...' });
    }

    // OTP is valid - clear OTP-related fields
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpAttemptsExpire = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set secure cookie options
    const options = {
      expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    };

    // Send response
    return res.status(200).cookie('access_token', token, options).json({
      success: true,
      message: 'Login successful.',
      data: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    next(errorHandler(500, 'Internal server error.'));
  }
};

export const disable2fa = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('disable 2fa started for user', id);
    const user = await User.findById(id);
    if(!user) {
      console.log('user not found');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    console.log('user found');
    if (!user.twoFAEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already disabled.' });
    }
    user.twoFAEnabled = false;
    await user.save();
    console.log('user saved');
    res.status(200).json({ success: true, message: '2FA has been disabled.' });

  } catch (error) {
    console.log('error disabling 2fa:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export const enable2fa = async (req, res, next) =>  {
  try {
    const id = req.params.id;
    if(!id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
    const user = await User.findById(id);
    if(!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if(user.twoFAEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled.' });
    }
    const loginOtp = Math.floor(100000 + Math.random() * 900000);
      // Email Template
    let emailTemplate = fs.readFileSync(path.join(__dirname, '../templates/mail.html'), 'utf-8');

      // Send otp
    const subject = "Verify your account";
      // const body = `Your OTP is ${otp}`;

      emailTemplate = emailTemplate.replace('{{OTP_CODE}}', loginOtp);
      emailTemplate = emailTemplate.replaceAll('{{MAIL}}', process.env.SMTP_USER);
      emailTemplate = emailTemplate.replace('{{PORT}}', process.env.PORT);
      emailTemplate = emailTemplate.replace('{{USER_ID}}', user._id.toString());

      const email = user.email;
      console.log('email', email);

      try {
        await sendMail({ email, subject, html : emailTemplate });
        console.log('mail sent');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return next(errorHandler(500, 'Failed to send OTP email'));
      }

      user.loginOtp = loginOtp;

      await user.save();

        // Send response
      return res.status(200).json({
        message: 'OTP sent successfully. Please verify to continue.',
        user : {_id : user._id},
        success : true

      });
  } catch(error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
export const verifyOtp = async (req, res) => {
  try {
    const {id} = req.params;
    const {otp} = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if OTP matches
    if (user.loginOtp != otp) {
      return res.status(401).json({ success: false, message: 'Incorrect OTP.' });
    }

    // Clear OTP-related fields and enable 2FA
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    user.twoFAEnabled = true;
    await user.save();

    return res.status(200).json({ success: true, message: '2FA enabled successfully.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
export const signout = async (req, res, next) => {
  try {
    console.log('signout user started');
    res.clearCookie('access_token');
    res.status(200).json('User has been logged out!');
  } catch (error) {
    console.log(error.message)
    next(error);
  }
};

