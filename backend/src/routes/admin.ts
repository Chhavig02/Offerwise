import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { admin } from '@/lib/firebase-admin';

const router = Router();

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function authenticateAdmin(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);

  const email = (decodedToken.email || '').toLowerCase();
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0 || !adminEmails.includes(email)) {
    throw Object.assign(new Error('Forbidden: admin access only'), { status: 403 });
  }

  return { userId: decodedToken.uid };
}

// GET /api/admin/offers — list every uploaded offer across every user
router.get('/offers', async (req: Request, res: Response) => {
  try {
    await authenticateAdmin(req);

    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        status: true,
        storagePath: true,
        createdAt: true,
        user: { select: { email: true } },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { score: true }
        }
      }
    });

    const data = offers.map((o) => ({
      id: o.id,
      companyName: o.companyName,
      status: o.status,
      hasFile: Boolean(o.storagePath),
      fileName: o.storagePath ? o.storagePath.split('/').pop() : null,
      createdAt: o.createdAt,
      userEmail: o.user.email,
      score: o.analyses[0]?.score ?? null
    }));

    return res.json({ success: true, data });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(status).json({ error: msg });
  }
});

// GET /api/admin/offers/:id/download — download any user's uploaded file
router.get('/offers/:id/download', async (req: Request, res: Response) => {
  try {
    await authenticateAdmin(req);

    const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    if (!offer.storagePath) {
      return res.status(404).json({ error: 'Document file not found' });
    }

    const { storageService } = await import('../services/storageService');
    const fileBuffer = await storageService.getFileBuffer(offer.storagePath);

    let mimeType = 'application/octet-stream';
    if (offer.storagePath.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (offer.storagePath.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (offer.storagePath.endsWith('.jpg') || offer.storagePath.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (offer.storagePath.endsWith('.png')) mimeType = 'image/png';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="offer_${offer.id}${offer.storagePath.substring(offer.storagePath.lastIndexOf('.'))}"`);
    return res.send(fileBuffer);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(status).json({ error: msg });
  }
});

export default router;
