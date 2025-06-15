
import express from 'express';
import { evaluateCodeApi } from '../services/evaluate.service.js';

const router = express.Router();

router.post('/evaluate', evaluateCodeApi);

export default router;
