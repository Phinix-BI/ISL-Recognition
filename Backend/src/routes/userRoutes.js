import express from 'express';
import { registerUser, loginUser, sentOtp , resetPassword , verifyEmail, getUserId } from '../controllers/userControllers.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/sentotp', sentOtp);
router.post('/resetpassword', resetPassword);
router.post('/verifyemail', verifyEmail);
router.get('/getUserId/:userEmail', getUserId);

export default router;