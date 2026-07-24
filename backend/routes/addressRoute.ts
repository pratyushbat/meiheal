import { Router } from 'express';
// import { requireAuth } from './middleware/require-auth'; // adjust to your real auth middleware
import {
    getMyAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from '../controllers/address.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard); // every route below requires a logged-in (non-guest, or guest-with-session) user

router.get('/', getMyAddresses);
router.post('/', addAddress);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;

// Mount in your main app, e.g.:
// app.use('/api/users/me/addresses', addressRouter);