import express from 'express';
import authEmailRouter from './authEmail.js';

const router = express.Router();

// Mount the real routes first (e.g., /password/request, /password/reset, /signup, /verify/*)
router.use(authEmailRouter);

// Compatibility aliases — forward to the actual handlers without HTTP round-trips
router.post('/forgot-password', (req, res, next) => {
  // forward to /password/request
  req.url = '/password/request';
  return authEmailRouter.handle(req, res, next);
});

router.post('/reset-password', (req, res, next) => {
  // forward to /password/reset
  req.url = '/password/reset';
  return authEmailRouter.handle(req, res, next);
});

router.post('/register', (req, res, next) => {
  // forward to /signup
  req.url = '/signup';
  return authEmailRouter.handle(req, res, next);
});

export default router;
