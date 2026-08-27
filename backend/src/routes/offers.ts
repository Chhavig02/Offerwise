import { Router, Request, Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { storageService } from '@/services/storageService';
import { runAnalysisPipeline, runAnalysisPipelineFromText } from '@/services/pipeline';
import { prisma } from '@/lib/prisma';
import { admin } from '@/lib/firebase-admin';
import { Prisma } from '@prisma/client';
import { AnalysisResult } from '@/types';

const router = Router();
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Please upload a PDF or DOCX file.'));
    }
    cb(null, true);
  }
});

// Each upload triggers a paid Gemini call, so cap how often one client can trigger it.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please try again later.' }
});

async function saveAnalysisResult(offerId: string, result: AnalysisResult): Promise<void> {
  await prisma.offerAnalysis.create({
    data: {
      offerId,
      score: result.score,
      summary: result.summary,
      flags: result.flags as unknown as Prisma.InputJsonValue,
      informationGaps: result.information_gaps as unknown as Prisma.InputJsonValue,
      positiveSignals: result.positive_signals as unknown as Prisma.InputJsonValue,
      extractedData: (result.extracted_data as unknown as Prisma.InputJsonValue) || {},
      companyResearch: (result.company_research as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      comparison: (result.comparison as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      decision: (result.decision as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      extractionVersion: result.extraction_version,
      rulesVersion: result.rules_version
    }
  });

  await prisma.offer.update({
    where: { id: offerId },
    data: { status: 'completed' }
  });
}

router.post('/upload', uploadLimiter, upload.single('document'), async (req: Request, res: Response) => {
  let offerId: string | undefined;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!req.file) {
      return res.status(400).json({ error: 'No document provided' });
    }

    // Upsert User (in case they don't exist in Postgres yet)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: decodedToken.email || 'unknown@example.com' }
    });

    // Create an Offer Record
    const offer = await prisma.offer.create({
      data: {
        userId,
        status: 'processing'
      }
    });
    offerId = offer.id;

    // Save File via Storage Abstraction
    const storagePath = await storageService.uploadFile(userId, offer.id, req.file.buffer, req.file.mimetype);

    await prisma.offer.update({
      where: { id: offer.id },
      data: { storagePath }
    });

    // Run Pipeline
    const result = await runAnalysisPipeline(req.file.buffer, req.file.mimetype, offer.id);
    await saveAnalysisResult(offer.id, result);

    return res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Upload & Analysis failed', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';

    // Don't leave the offer stuck in "processing" forever if analysis failed partway through.
    if (offerId) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: 'failed' }
      }).catch(updateErr => console.error('Failed to mark offer as failed', updateErr));
    }

    return res.status(500).json({ error: msg });
  }
});

router.post('/analyze-text', uploadLimiter, async (req: Request, res: Response) => {
  let offerId: string | undefined;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { text } = req.body as { text?: string };
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }
    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text is too long. Please paste under 50,000 characters.' });
    }

    // Upsert User (in case they don't exist in Postgres yet)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: decodedToken.email || 'unknown@example.com' }
    });

    // Create an Offer Record (no file, so no storagePath)
    const offer = await prisma.offer.create({
      data: {
        userId,
        status: 'processing'
      }
    });
    offerId = offer.id;

    // Run Pipeline
    const result = await runAnalysisPipelineFromText(text, offer.id);
    await saveAnalysisResult(offer.id, result);

    return res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Text analysis failed', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';

    if (offerId) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: 'failed' }
      }).catch(updateErr => console.error('Failed to mark offer as failed', updateErr));
    }

    return res.status(500).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const offerId = req.params.id;

    // Fetch the analysis and verify ownership
    const analysis = await prisma.offerAnalysis.findFirst({
      where: {
        offerId: offerId,
        offer: {
          userId: userId
        }
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.json({ success: true, data: analysis });
  } catch (error: unknown) {
    console.error('Fetch analysis failed', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Fetch all offers for this user
    const offers = await prisma.offer.findMany({
      where: { userId },
      include: {
        analyses: {
          select: {
            score: true,
            createdAt: true,
            extractedData: true,
            informationGaps: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedOffers = offers.map(o => ({
      ...o,
      analysis: o.analyses && o.analyses.length > 0 ? o.analyses[0] : null,
      analyses: undefined // remove the array from the payload
    }));

    return res.json({ success: true, data: mappedOffers });
  } catch (error: unknown) {
    console.error('Fetch offers failed', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const offerId = req.params.id;

    // Verify ownership
    const offer = await prisma.offer.findUnique({
      where: { id: offerId }
    });

    if (!offer || offer.userId !== userId) {
      return res.status(404).json({ error: 'Offer not found or unauthorized' });
    }

    if (!offer.storagePath) {
      return res.status(404).json({ error: 'Document file not found' });
    }

    const { storageService } = await import('../services/storageService');
    const fileBuffer = await storageService.getFileBuffer(offer.storagePath);
    
    // Guess mime type based on extension
    let mimeType = 'application/octet-stream';
    if (offer.storagePath.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (offer.storagePath.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (offer.storagePath.endsWith('.jpg') || offer.storagePath.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (offer.storagePath.endsWith('.png')) mimeType = 'image/png';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="offer_${offerId}${offer.storagePath.substring(offer.storagePath.lastIndexOf('.'))}"`);
    return res.send(fileBuffer);
  } catch (error: unknown) {
    console.error('Download file failed', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

export default router;
