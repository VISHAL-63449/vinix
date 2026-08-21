import { supabase } from '../utils/supabase';

export const APPLICATIONS_KEY = 'vinix_applications';

export interface LocalApplication {
    domainId: string;
    status: 'enrolled' | 'pending' | 'rejected' | 'active';
    appliedAt: string;
    enrolledAt?: string;
    internshipName?: string;
    domain?: string;
}

export interface UnifiedApplication {
    id: string;
    domainId: string;
    status: string;
    internshipName: string;
    domainName: string;
    appliedAt: string;
}

/**
 * Gets the current Supabase authenticated user.
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.warn('[internshipService] getCurrentUser error:', error);
            return null;
        }
        return user;
    } catch (err) {
        console.error('[internshipService] getCurrentUser failed:', err);
        return null;
    }
}

/**
 * Returns all applications for a given user, querying the database first
 * and syncing with target localStorage key structure (user-specific).
 */
export async function getUserApplications(userId: string): Promise<UnifiedApplication[]> {
    if (!userId) return [];
    try {
        // Query both applications and enrollments to get the full state
        const dbAppsPromise = supabase
            .from('internship_applications')
            .select('*')
            .eq('user_id', userId);

        const dbEnrollmentsPromise = supabase
            .from('internship_enrollments')
            .select('*')
            .eq('user_id', userId);

        const [appsRes, enrollRes] = await Promise.all([dbAppsPromise, dbEnrollmentsPromise]);

        const dbApps = appsRes.data || [];
        const dbEnrollments = enrollRes.data || [];

        // Combine unique records by internship_id/domainId
        const combinedMap = new Map<string, UnifiedApplication>();

        // Process application entries
        for (const app of dbApps) {
            if (!app.internship_id) continue;
            combinedMap.set(app.internship_id, {
                id: app.id,
                domainId: app.internship_id,
                status: app.status || 'active',
                internshipName: app.internship_name || app.domain || 'Internship Track',
                domainName: app.domain || 'Virtual Internship',
                appliedAt: app.applied_at || new Date().toISOString()
            });
        }

        // Process enrollment entries (always status = active / enrolled)
        for (const enroll of dbEnrollments) {
            if (!enroll.internship_id) continue;
            const existing = combinedMap.get(enroll.internship_id);
            if (existing) {
                // If enrolled in database, promote status to active
                existing.status = 'active';
            } else {
                combinedMap.set(enroll.internship_id, {
                    id: enroll.id,
                    domainId: enroll.internship_id,
                    status: 'active',
                    internshipName: 'Internship Track',
                    domainName: 'Virtual Internship',
                    appliedAt: enroll.created_at || new Date().toISOString()
                });
            }
        }

        const unifiedList = Array.from(combinedMap.values());

        // Update localStorage cache to match exactly the required structure
        const localData = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '{}');

        if (unifiedList.length > 0) {
            localData[userId] = unifiedList.map(app => ({
                domainId: app.domainId,
                status: app.status === 'active' ? 'enrolled' : app.status,
                appliedAt: app.appliedAt,
                enrolledAt: app.appliedAt,
                internshipName: app.internshipName,
                domain: app.domainName
            }));
            localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(localData));
        } else {
            // DB returned empty, maybe due to RLS hiding lines or new connection.
            // Check if local cache has applications and backfill/use them.
            const userLocalApps: LocalApplication[] = localData[userId] || [];
            if (userLocalApps.length > 0) {
                console.log('[internshipService] DB returned empty, but local cache has applications. Restoring:');
                for (const la of userLocalApps) {
                    unifiedList.push({
                        id: `local-${la.domainId}`,
                        domainId: la.domainId,
                        status: la.status === 'enrolled' ? 'active' : la.status,
                        internshipName: la.internshipName || 'Internship Track',
                        domainName: la.domain || 'Virtual Internship',
                        appliedAt: la.appliedAt
                    });
                }
            }
        }

        return unifiedList;
    } catch (err) {
        console.warn('[internshipService] Failed to fetch from DB, falling back to localStorage cache:', err);
        const localData = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '{}');
        const userLocalApps: LocalApplication[] = localData[userId] || [];
        return userLocalApps.map((la, index) => ({
            id: `local-${la.domainId}-${index}`,
            domainId: la.domainId,
            status: la.status === 'enrolled' ? 'active' : la.status,
            internshipName: la.internshipName || 'Internship Track',
            domainName: la.domain || 'Virtual Internship',
            appliedAt: la.appliedAt
        }));
    }
}

/**
 * Check if the user has applied to a specific domain.
 */
export async function getApplication(userId: string, domainId: string): Promise<UnifiedApplication | null> {
    const apps = await getUserApplications(userId);
    return apps.find(app => app.domainId === domainId) || null;
}

/**
 * Returns whether a check matches.
 */
export async function hasApplied(userId: string, domainId: string): Promise<boolean> {
    const app = await getApplication(userId, domainId);
    return !!app;
}

/**
 * Returns all active or enrolled tracks.
 */
export async function getActiveInternships(userId: string): Promise<UnifiedApplication[]> {
    const apps = await getUserApplications(userId);
    return apps.filter(app => ['active', 'enrolled', 'approved'].includes(app.status));
}

/**
 * Submits a new internship application and sets up enrollment, offer letter, and tasks in DB,
 * and maintains the unified localStorage copy.
 */
export async function applyToInternship(params: {
    userId: string;
    email: string;
    username: string;
    domainId: string;
    domainTitle: string;
    domainCategory: string;
    duration: string;
    phone: string;
    college: string;
}) {
    const { userId, email, username, domainId, domainTitle, domainCategory, duration, phone, college } = params;

    // Check duplicate first
    const alreadyExists = await hasApplied(userId, domainId);
    if (alreadyExists) {
        throw new Error('You have already applied and enrolled in this internship domain. Check your dashboard!');
    }

    const durationMonths = duration.includes('1') ? 1 : duration.includes('2') ? 2 : duration.includes('6') ? 6 : 3;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // 1. Insert internship application
    const appData = {
        user_id: userId,
        internship_id: domainId,
        status: 'active',
        student_name: username,
        email: email,
        phone: phone || '',
        college: college || '',
        domain: domainCategory || 'Virtual Internship',
        internship_name: domainTitle || 'Developer Internship',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        certificate_status: 'pending',
        offer_letter_status: 'pending',
        progress: 0,
        mentor_id: null
    };

    console.log('[internshipService] Inserting application record:', appData);
    const { error: appErr } = await supabase
        .from('internship_applications')
        .insert([appData]);

    if (appErr) {
        if (appErr.code === '23505' || appErr.message?.includes('unique') || appErr.message?.includes('duplicate')) {
            throw new Error('You have already applied and enrolled in this internship domain. Check your dashboard!');
        }
        throw new Error(`Database registration failed: ${appErr.message}`);
    }

    // 2. Insert enrollment record
    console.log('[internshipService] Inserting enrollment record...');
    const { data: enrolledRecord, error: enrollErr } = await supabase
        .from('internship_enrollments')
        .insert({
            user_id: userId,
            internship_id: domainId,
            status: 'active',
            application_status: 'active'
        })
        .select()
        .single();

    if (enrollErr) {
        console.warn('[internshipService] Warning: Could not create database enrollment:', enrollErr);
    }

    // 3. Create offer letter
    const offerLetterNumber = `VINIX-OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log('[internshipService] Creating offer letter record...');
    await supabase
        .from('offer_letters')
        .insert({
            enrollment_id: enrolledRecord?.id || null,
            user_id: userId,
            offer_letter_id: offerLetterNumber,
            student_name: username,
            student_email: email,
            internship_title: domainTitle,
            duration: duration,
            status: 'GENERATED'
        });

    // 4. Seed task progress list
    console.log('[internshipService] Fetching tasks to seed task progress...');
    const { data: tasks } = await supabase
        .from('internship_tasks')
        .select('*')
        .eq('internship_id', domainId)
        .order('task_number', { ascending: true });

    if (tasks && tasks.length > 0) {
        const progressLines = tasks.map(t => ({
            user_id: userId,
            internship_id: domainId,
            task_id: t.id,
            status: t.task_number === 1 ? 'approved' : t.task_number === 2 ? 'available' : 'locked'
        }));
        const { error: seedErr } = await supabase
            .from('task_progress')
            .insert(progressLines);
        if (seedErr) {
            console.warn('[internshipService] Failed to seed task progress:', seedErr);
        }
    }

    // 5. Update localStorage database structure
    const localData = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '{}');
    if (!localData[userId]) {
        localData[userId] = [];
    }
    const localExisting = localData[userId].find((la: any) => la.domainId === domainId);
    if (!localExisting) {
        localData[userId].push({
            domainId: domainId,
            status: 'enrolled',
            appliedAt: startDate.toISOString(),
            enrolledAt: startDate.toISOString(),
            internshipName: domainTitle,
            domain: domainCategory
        });
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(localData));
    }
    console.log('[internshipService] Finished applying successfully. Local cache updated.');
}
