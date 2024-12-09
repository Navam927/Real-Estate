import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar:{
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    twoFAEnabled : {
      type : Boolean,
      default : false,
    },
    loginOtp : {
      type : Number,
    },
    loginOtpExpire: {
      type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    loginOtpAttempts: {
        type: Number,
        default: 0
    },
    loginOtpAttemptsExpire: {
        type: Date
    },
    otp: {
      type: Number,
    },
    otpExpire: {
        type: Date
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpAttemptsExpire: {
        type: Date
    },
  
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
