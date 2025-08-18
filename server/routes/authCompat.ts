import express from 'express';
import authEmailRouter from './authEmail.js';

const router = express.Router();

// Mount the real routes first (e.g., /password/request, /password/reset, /signup, /verify/*)
router.use(authEmailRouter);

// Compatibility aliases — forward to the actual handlers using Express middleware
router.post('/forgot-password', (req, res, next) => {
  // Change URL and let the main router handle it
  req.url = '/password/request';
  req.originalUrl = req.originalUrl.replace('/forgot-password', '/password/request');
  authEmailRouter(req, res, next);
});

router.post('/reset-password', (req, res, next) => {
  // Change URL and let the main router handle it  
  req.url = '/password/reset';
  req.originalUrl = req.originalUrl.replace('/reset-password', '/password/reset');
  authEmailRouter(req, res, next);
});

router.post('/register', (req, res, next) => {
  // Change URL and let the main router handle it
  req.url = '/signup';
  req.originalUrl = req.originalUrl.replace('/register', '/signup');
  authEmailRouter(req, res, next);
});

export default router;