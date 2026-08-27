import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { admin } from '@/lib/firebase-admin';

const router = Router();

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR'];
const SUPPORTED_JURISDICTIONS = ['IN', 'US', 'GLOBAL'];

async function authenticate(req: Request): Promise<{ userId: string; email: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  return { userId: decodedToken.uid, email: decodedToken.email || 'unknown@example.com' };
}

router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, email } = await authenticate(req);

    // A user who hasn't uploaded an offer yet has no Postgres row -- create
    // one on first preferences access instead of 404ing.
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email },
      select: { displayName: true, currency: true, jurisdiction: true, email: true }
    });

    return res.json({ success: true, data: user });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(status).json({ error: msg });
  }
});

router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, email } = await authenticate(req);

    const { displayName, currency, jurisdiction } = req.body as {
      displayName?: unknown;
      currency?: unknown;
      jurisdiction?: unknown;
    };

    const data: { displayName?: string | null; currency?: string; jurisdiction?: string } = {};

    if (displayName !== undefined) {
      if (displayName !== null && typeof displayName !== 'string') {
        return res.status(400).json({ error: 'displayName must be a string' });
      }
      const trimmed = typeof displayName === 'string' ? displayName.trim() : null;
      if (trimmed && trimmed.length > 100) {
        return res.status(400).json({ error: 'displayName must be 100 characters or fewer' });
      }
      data.displayName = trimmed || null;
    }

    if (currency !== undefined) {
      if (typeof currency !== 'string' || !SUPPORTED_CURRENCIES.includes(currency)) {
        return res.status(400).json({ error: `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` });
      }
      data.currency = currency;
    }

    if (jurisdiction !== undefined) {
      if (typeof jurisdiction !== 'string' || !SUPPORTED_JURISDICTIONS.includes(jurisdiction)) {
        return res.status(400).json({ error: `jurisdiction must be one of: ${SUPPORTED_JURISDICTIONS.join(', ')}` });
      }
      data.jurisdiction = jurisdiction;
    }

    const updated = await prisma.user.upsert({
      where: { id: userId },
      update: data,
      create: { id: userId, email, ...data },
      select: { displayName: true, currency: true, jurisdiction: true, email: true }
    });

    return res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(status).json({ error: msg });
  }
});

export default router;
