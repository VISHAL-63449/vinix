import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// Robust function to get base64 image representation
export async function getImageBase64(fileName, req) {
    // 1. Try local filesystem options first
    const pathsToSearch = [
        path.join(process.cwd(), 'public', fileName),
        path.join(process.cwd(), 'dist', fileName),
        path.join(process.cwd(), fileName),
        path.join(process.cwd(), '..', 'public', fileName),
        path.join(process.cwd(), 'vinix', 'public', fileName)
    ];

    for (const p of pathsToSearch) {
        try {
            if (fs.existsSync(p)) {
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                const buffer = fs.readFileSync(p);
                return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`Local file read failed for ${p}:`, e.message);
        }
    }

    // 2. Try fetching from URL/Origin if request context is provided
    if (req) {
        try {
            const host = req.headers.host || 'localhost:5173';
            const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
            const origin = req.headers.origin || `${protocol}://${host}`;
            const fileUrl = new URL(fileName, origin).toString();

            console.log(`Attempting to fetch image asset via HTTP fallback: ${fileUrl}`);
            const response = await fetch(fileUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`HTTP fetch fallback failed for ${fileName}:`, e.message);
        }
    }

    // 3. Last resort: Try fetching from standard production base URL
    try {
        const fallBackUrl = `https://vinix.online/${fileName}`;
        const response = await fetch(fallBackUrl);
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = path.extname(fileName).replace('.', '').toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : ext;
            return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.warn(`Production CDN fetch failed for ${fileName}:`, e.message);
    }

    return null;
}

// Ensure Supabase Storage bucket exists
export async function ensureBucketExists() {
    try {
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        if (listError) throw listError;

        const exists = buckets.some(b => b.name === 'documents');
        if (!exists) {
            console.log('Documents bucket not found. Creating bucket...');
            const { error: createError } = await supabaseAdmin.storage.createBucket('documents', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['application/pdf']
            });
            if (createError) {
                console.error('Failed to create documents bucket:', createError.message);
            } else {
                console.log('Documents bucket created successfully.');
            }
        }
    } catch (e) {
        console.error('Error ensuring bucket exists:', e.message);
    }
}

// Mailer Helper
export async function sendEmail({ email, name, subject, body, pdfBuffer, pdfName }) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'VINIX Academic Council <academic@vinix.online>';

    if (!host || !user || !pass) {
        console.log(`[MAIL MOCK] Mail configured to mock mode. Logging payload:`);
        console.log(` - To: ${name} <${email}>`);
        console.log(` - Subject: ${subject}`);
        console.log(` - Attachment: ${pdfName} (${pdfBuffer.length} bytes)`);
        console.log(`-----------------------------------------`);
        console.log(body);
        console.log(`-----------------------------------------`);
        return { mock: true, recipient: email };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        attachments: [
            {
                filename: pdfName,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });

    console.log(`[MAIL SUCCESS] Email sent to ${email}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
}
