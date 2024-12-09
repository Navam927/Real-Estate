import express from 'express';
import {signout, signin, signup, verifyLoginOtp, disable2fa, enable2fa, verifyOtp } from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get('/signout', signout);
router.post('/signin/verify/:id', verifyLoginOtp);
router.post('/disable2fa/:id', disable2fa)
router.post('/enable2fa/:id', enable2fa)
router.post('/verify/:id', verifyOtp)


export default router;