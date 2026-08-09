import express from 'express';
import { prisma } from '../config.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all courses (supports filter by category/type)
router.get('/', async (req, res) => {
    try {
        const { category, type, search } = req.query;
        const where = {};
        if (category) where.category = category;
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const courses = await prisma.course.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(courses);
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ message: 'Failed to fetch courses.' });
    }
});

// Get single course details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.json(course);
    } catch (error) {
        console.error('Fetch single course error:', error);
        res.status(500).json({ message: 'Failed to fetch course details.' });
    }
});

// ADMIN: Create Course or Internship Program
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { title, category, description, duration, type, skills, lessons, assignments, quizzes } = req.body;
        if (!title || !category || !description || !duration) {
            return res.status(400).json({ message: 'Title, category, description, duration are required fields.' });
        }

        const course = await prisma.course.create({
            data: {
                title,
                category,
                description,
                duration,
                type: type || 'COURSE',
                skills: skills || [],
                lessons: lessons || [],
                assignments: assignments || [],
                quizzes: quizzes || [],
            }
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Failed to create course.' });
    }
});

// ADMIN: Update Course
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, description, duration, type, skills, lessons, assignments, quizzes } = req.body;

        const course = await prisma.course.update({
            where: { id },
            data: {
                title,
                category,
                description,
                duration,
                type,
                skills,
                lessons,
                assignments,
                quizzes,
            }
        });

        res.json(course);
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Failed to update course.' });
    }
});

// ADMIN: Delete Course
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.course.delete({ where: { id } });
        res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Failed to delete course.' });
    }
});

export default router;
