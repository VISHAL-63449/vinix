import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey);

async function testInsert() {
    try {
        console.log('Inserting a test review...');
        const { data, error } = await client
            .from('reviews')
            .insert({
                student_id: '2a53a98c-3cff-4cf9-96bb-e018c3fe53f0', // kr pain tamil
                internship_id: 'c37a2171-7412-488b-9ab1-ccf01f0fb90e', // Full Stack Development
                rating: 5,
                review: 'Vinix changed my perspective on engineering. The tasks are challenging yet extremely rewarding!'
            })
            .select();

        if (error) {
            console.error('INSERT ERROR:', error);
            return;
        }
        console.log('INSERT SUCCESS:', data);

        // Try querying again to check that fetching works
        const { data: reviewsData, error: reviewsError } = await client
            .from('reviews')
            .select(`
                id,
                rating,
                review,
                created_at,
                student_id,
                internships (
                    id,
                    title,
                    category
                )
            `);

        const studentIds = [...new Set(reviewsData.map(r => r.student_id).filter(Boolean))];

        let profilesMap = new Map();
        if (studentIds.length > 0) {
            const { data: profilesData, error: profilesError } = await client
                .from('profiles')
                .select('id, full_name, college')
                .in('id', studentIds);

            if (profilesData) {
                profilesData.forEach(p => profilesMap.set(p.id, p));
            }
        }

        const mapped = reviewsData.map(r => {
            const profile = profilesMap.get(r.student_id);
            return {
                id: r.id,
                name: profile?.full_name || 'Anonymous Student',
                domain: r.internships?.title || 'Virtual Internship',
                college: profile?.college || 'Institution',
                text: r.review,
                rating: r.rating
            };
        });

        console.log('RETRIEVED REVIEWS AFTER INSERT:', mapped);

    } catch (e) {
        console.error('EXCEPTION:', e);
    }
}

testInsert();
