import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createCustomUser, getCustomUsers, deleteCustomUser, findCustomUserByUsername } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        const token = jwt.sign(
            { username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.json({ token, username });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// Verify token endpoint
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false });
    }

    try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ valid: true });
    } catch {
        return res.status(401).json({ valid: false });
    }
});

// Custom user login
router.post('/custom-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        const user = await findCustomUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ username: user.username, role: 'custom' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, username: user.username });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Admin: list custom users
router.get('/custom-users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const users = await getCustomUsers();
        return res.json(users);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Admin: create custom user
router.post('/custom-users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        const user = await createCustomUser(username, password);
        return res.status(201).json(user);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// Admin: delete custom user
router.delete('/custom-users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        await deleteCustomUser(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
