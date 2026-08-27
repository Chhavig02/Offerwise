# Firebase Legacy Rules (Archived)

These rules belonged to the previous Firestore/Firebase Storage architecture and are NOT used by the current PostgreSQL/local-storage architecture.

The current application architecture is:

- Firebase Authentication (ID token verification only)
- Express backend
- PostgreSQL (via Prisma)
- Private local disk storage for uploaded documents

`firestore.rules` and `storage.rules` in this folder do not govern any data path the application reads from or writes to today. Application data lives in PostgreSQL (`backend/prisma/schema.prisma`) and uploaded files live on local disk (`backend/src/services/storageService.ts`), not in Firestore or Firebase Storage.

Do not treat these rules as providing any current application security guarantee. Access control for the live system is enforced by the Express backend (Firebase ID token verification via `firebase-admin`, plus ownership checks in `backend/src/routes/offers.ts`).

Kept for historical reference only.
