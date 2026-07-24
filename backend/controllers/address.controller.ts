import { Request, Response } from 'express';
import User, { IUser } from "../models/userModel";
// All routes below assume auth middleware has already set req.user._id
// (the logged-in user's own id) - these all operate on "me", never someone else's addresses.

// GET /api/users/me/addresses
export async function getMyAddresses(req: Request, res: Response) {
    res.set('Cache-Control', 'no-store');
    console.log('(req as any).user', (req as any).user._id)
    const user = await User.findById((req as any).user._id).select('addresses');
    console.log('user found?', user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.addresses);
}

// POST /api/users/me/addresses
// Body: Omit<Address, '_id' | 'isDefault'>
export async function addAddress(req: Request, res: Response) {
    const user: any = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isFirstAddress = user.addresses.length === 0;

    // isDefault is never taken from the request body (frontend already omits it) -
    // the first address a user ever saves becomes default automatically;
    // every address after that starts as false until explicitly promoted via setDefault.
    user.addresses.push({
        ...req.body,
        isDefault: isFirstAddress,
    });

    await user.save();
    const created = user.addresses[user.addresses.length - 1];
    return res.status(201).json(created);
}

// PATCH /api/users/me/addresses/:id
// Body: Partial<Address>
export async function updateAddress(req: Request, res: Response) {
    const user: any = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id((req as any).params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    // isDefault is intentionally not accepted here either - it has its own
    // dedicated endpoint below, so a stray PATCH can't silently create two defaults.
    const { isDefault, ...safeUpdates } = (req as any).body;
    Object.assign(address, safeUpdates);

    await user.save();
    return res.json(address);
}

// DELETE /api/users/me/addresses/:id
export async function deleteAddress(req: Request, res: Response) {
    const user: any = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id((req as any).params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const wasDefault = address.isDefault;
    user.addresses.pull((req as any).params.id);

    // If the deleted address was the default, promote whatever's left (if anything)
    // so the user is never left with zero defaults while still having addresses.
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.status(204).send();
}

// PATCH /api/users/me/addresses/:id/default
export async function setDefaultAddress(req: Request, res: Response) {
    const user: any = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const target = user.addresses.id((req as any).params.id);
    if (!target) return res.status(404).json({ message: 'Address not found' });

    // Only one address can be default at a time - unset every other one first.
    user.addresses.forEach(addr => {
        addr.isDefault = String(addr._id) === req.params.id;
    });

    await user.save();
    return res.json(target);
}