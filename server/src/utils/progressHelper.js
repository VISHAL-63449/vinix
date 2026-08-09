import { prisma } from '../config.js';

/**
 * Calculates and updates the enrollment progress for a user and course.
 * Progress = 20% (LinkedIn submission) + 80% (assignments submission status)
 * If there are no assignments, LinkedIn submission = 100%
 * @param {string} userId 
 * @param {string} courseId 
 */
export async function calculateAndUpdateProgress(userId, courseId) {
    try {
        // 1. Get enrollment with related course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            },
            include: { course: true }
        });

        if (!enrollment) return null;

        // 2. Fetch all project submissions for this student
        const studentProjects = await prisma.project.findMany({
            where: { studentId: userId }
        });

        const assignments = enrollment.course.assignments || [];
        const totalAssignments = assignments.length;
        let submittedCount = 0;

        if (totalAssignments > 0) {
            assignments.forEach(as => {
                const hasProj = studentProjects.some(p =>
                    p.title.toLowerCase().includes(as.title.toLowerCase()) ||
                    as.title.toLowerCase().includes(p.title.toLowerCase())
                );
                if (hasProj) submittedCount++;
            });
        }

        const hasLinkedIn = !!enrollment.linkedinUrl;

        let newProgress = 0;
        if (totalAssignments > 0) {
            newProgress = (hasLinkedIn ? 20 : 0) + Math.round((submittedCount / totalAssignments) * 80);
        } else {
            newProgress = hasLinkedIn ? 100 : 0;
        }

        // Clamp between 0 and 100
        newProgress = Math.min(100, Math.max(0, newProgress));
        const status = newProgress === 100 ? 'COMPLETED' : 'ENROLLED';

        // Update in DB
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                id: enrollment.id
            },
            data: {
                progress: newProgress,
                status
            }
        });

        return updatedEnrollment;
    } catch (err) {
        console.error('Error calculating progress:', err);
        throw err;
    }
}
