import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, JWT_SECRET } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { id, name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // Support trigger integration: if user was created with trigger's mock hash passcode,
            // overwrite code/meta instead of raising 'User already exists'
            if (existingUser.password === '$2a$10$MOCKHASHVIONIXSECUREPASSWORDSTRINGDONTUSEINPROD') {
                const passwordHash = await bcrypt.hash(password, 10);
                const userRole = role === 'ADMIN' ? 'ADMIN' : 'STUDENT';

                const updatedUser = await prisma.user.update({
                    where: { email },
                    data: {
                        name,
                        password: passwordHash,
                        role: userRole,
                    }
                });

                const token = jwt.sign({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({
                    token,
                    user: {
                        id: updatedUser.id,
                        name: updatedUser.name,
                        email: updatedUser.email,
                        role: updatedUser.role,
                        skills: updatedUser.skills || [],
                    }
                });
            }
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userRole = role === 'ADMIN' ? 'ADMIN' : 'STUDENT';

        const user = await prisma.user.create({
            data: {
                id: id || undefined, // Use Supabase ID if provided!
                name,
                email,
                password: passwordHash,
                role: userRole,
                skills: userRole === 'STUDENT' ? [] : undefined,
            },
        });

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });


        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills: user.skills || [],
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills: user.skills || [],
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                skills: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update Profile Skills
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { skills, name } = req.body;
        const updateData = {};
        if (skills !== undefined) updateData.skills = skills;
        if (name !== undefined) updateData.name = name;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                skills: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
});

export default router;
