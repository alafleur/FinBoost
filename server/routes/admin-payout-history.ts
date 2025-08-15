import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Auth middleware inline (matching existing routes.ts pattern)
interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; isAdmin: boolean };
}

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Admin access requires authentication token' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin token - user not found' });
    }

    // Check admin privileges using both methods for maximum reliability (matching routes.ts pattern)
    const isAdminByFlag = user.isAdmin === true;
    const isAdminByEmail = user.email === 'lafleur.andrew@gmail.com';
    
    if (!isAdminByFlag && !isAdminByEmail) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - invalid admin token' });
  }
};

router.use(requireAdmin);

/**
 * List batches for a cycle with summaries
 */
router.get('/:cycleId', async (req, res) => {
  try {
    const cycleId = parseInt(req.params.cycleId);
    if (!cycleId) {
      return res.status(400).json({ error: 'Invalid cycle ID' });
    }

    const batches = await storage.listBatchesForCycle(cycleId);
    
    // Get stats for each batch
    const batchesWithStats = await Promise.all(
      batches.map(async (batch: any) => {
        const stats = await storage.getBatchItemStats(batch.id);
        return {
          ...batch,
          stats
        };
      })
    );

    res.json({ 
      success: true, 
      batches: batchesWithStats 
    });
  } catch (error) {
    console.error('Error loading batch history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load batch history' 
    });
  }
});

/**
 * Get detailed summary for a specific batch
 */
router.get('/batch/:batchId/summary', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    if (!batchId) {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }

    const summary = await storage.getBatchItemStats(batchId);
    
    res.json({ 
      success: true, 
      summary 
    });
  } catch (error) {
    console.error('Error loading batch summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load batch summary' 
    });
  }
});

/**
 * Retry failed items from a batch
 */
router.post('/batch/:batchId/retry', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    if (!batchId) {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }

    const result = await storage.createRetryBatchFromFailed(batchId);
    
    res.json({ 
      success: true, 
      newBatchId: result.id,
      message: 'Retry batch created successfully'
    });
  } catch (error) {
    console.error('Error creating retry batch:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create retry batch'
    });
  }
});

export default router;