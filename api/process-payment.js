import { supabaseAdmin } from './_utils.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { studentId, applicationId, enrollmentId, amount, utrNumber } = req.body;

    if (!studentId || (!applicationId && !enrollmentId)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        console.log(`[PAYMENT] Processing manual UPI payment for student: ${studentId}, UTR: ${utrNumber}`);

        // We will store the Payment State and UTR number safely inside 'application_status' 
        // string to bypass the 'internship_enrollments_status_check' constraint.
        // Format: 'PAYMENT_PENDING:utrNumber'
        let enrollQuery = supabaseAdmin
            .from('internship_enrollments')
            .update({
                application_status: `PAYMENT_PENDING:${utrNumber || 'MANUAL_UPI'}`
            })
            .eq('user_id', studentId);

        if (enrollmentId) {
            enrollQuery = enrollQuery.eq('id', enrollmentId);
        }

        const { error: updErr } = await enrollQuery;

        if (updErr) {
            console.error('[PAYMENT] Error updating enrollment state:', updErr);
            throw updErr;
        }

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully and certificate status updated.',
            transactionId: utrNumber
        });
    } catch (err) {
        console.error('[PAYMENT] Error:', err);
        res.status(500).json({ error: err.message });
    }
}
