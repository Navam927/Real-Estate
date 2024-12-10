import express from 'express';
import {signout, signin, signup, verifyLoginOtp } from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get('/signout', signout);
router.post('/verifyLoginOtp/:id', verifyLoginOtp);


export default router;