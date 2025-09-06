// =============================================================
// ==      وحدة الاتصالات (api.js) - النسخة النهائية والمتكاملة
// =============================================================

import { supabase } from './config.js';

// --- 1. دوال المصادقة ---
export async function loginUser(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpUser(email, password, username) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            }
        }
    });

    if (authError) {
        if (authError.message.includes('User already registered')) {
            const { error: loginError } = await loginUser(email, password);
            if (loginError) {
                return { data: null, error: new Error("هذا المستخدم مسجل بالفعل. إذا كان هذا حسابك، يرجى إدخال كلمة المرور الصحيحة.") };
            } else {
                return { data: authData, error: null };
            }
        }
        return { data: null, error: authError };
    }
    return { data: authData, error: null };
}

// --- 2. دوال جلب البيانات ---
export async function fetchPlayer() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('players').select('*').eq('id', user.id).single();
    if (error) console.error("خطأ في جلب بيانات اللاعب:", error);
    return data;
}

export async function fetchProgressionConfig() {
    const { data, error } = await supabase.from('progression_config').select('settings').eq('id', 1).single();
    if (error) {
        console.error("خطأ في جلب إعدادات التقدم:", error);
        return null;
    }
    return data ? data.settings : null;
}

export async function fetchQuestionsConfig() {
    const { data, error } = await supabase.from('questions_config').select('*');
    if (error) {
        console.error("خطأ في جلب إعدادات الأسئلة:", error);
        return [];
    }
    return data || [];
}

export async function fetchStoreConfig() {
    const { data, error } = await supabase.from('store_config').select('*').order('sort_order', { ascending: true });
    if (error) console.error("خطأ في جلب إعدادات المتجر:", error);
    return data || [];
}

export async function fetchSpecialOffers() {
    const { data, error } = await supabase.from('special_offers').select('*');
    if (error) console.error("خطأ في جلب العروض الخاصة:", error);
    return data || [];
}

export async function fetchLiveEvents() {
    const { data, error } = await supabase.from('live_events').select('*');
    if (error) console.error("خطأ في جلب الأحداث الحية:", error);
    return data || [];
}

export async function fetchOrAssignDailyQuests() {
    const { data, error } = await supabase.rpc('get_or_assign_daily_quests');
    if (error) console.error("خطأ في جلب أو تعيين المهام اليومية:", error);
    return data || [];
}

export async function fetchPlayerMastery() {
    const { data, error } = await supabase.from('player_page_mastery').select('*');
    if (error) console.error("خطأ في جلب سجل الإتقان:", error);
    return data || [];
}

export async function fetchPageData(pageNumber) {
    try {
        const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
        if (!response.ok) throw new Error('فشل استجابة الشبكة.');
        const data = await response.json();
        return data.data.ayahs;
    } catch (error) {
        console.error("Error fetching page data:", error);
        return null;
    }
}

export async function fetchLeaderboard() {
    const { data, error } = await supabase.from('players').select('username, xp').order('xp', { ascending: false }).limit(10);
    if (error) console.error("خطأ في جلب لوحة الصدارة الدائمة:", error);
    return data || [];
}

// --- 3. دوال حفظ البيانات ---
export async function savePlayer(playerData) {
    const { id, ...updatableData } = playerData;
    const { error } = await supabase.from('players').update(updatableData).eq('id', id);
    if (error) console.error("خطأ في حفظ بيانات اللاعب:", error);
}

export async function saveResult(resultData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dataToSave = {
        user_id: user.id,
        page_number: resultData.pageNumber,
        score: resultData.score,
        total_questions: resultData.totalQuestions,
        xp_earned: resultData.xpEarned,
        errors: resultData.errorLog
    };
    const { error } = await supabase.from('quiz_results').insert([dataToSave]);
    if (error) console.error("خطأ في حفظ نتيجة الاختبار:", error);
}

export async function updatePlayerQuests(updates) {
    const { error } = await supabase.from('player_quests').upsert(updates);
    if (error) console.error("Error updating player quests:", error);
}

export async function updateMasteryRecord(pageNumber, durationInSeconds) {
    const { error } = await supabase.rpc('update_mastery_on_perfect_quiz', {
        p_page_number: pageNumber,
        p_quiz_duration_seconds: durationInSeconds
    });
    if (error) console.error("Error updating mastery record:", error);
}

// --- 4. دوال القبائل ---
export async function fetchClans() {
    const { data, error } = await supabase
        .from('clans')
        .select('id, name, description, emblem, weekly_xp, players(count)');
        
    if (error) {
        console.error("خطأ في جلب قائمة القبائل:", error);
        return [];
    }
    return data.map(clan => ({
        ...clan,
        member_count: clan.players[0]?.count || 0
    }));
}

export async function createClan(name, description) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: clanData, error: clanError } = await supabase
        .from('clans')
        .insert([{ name, description, leader_id: user.id }])
        .select()
        .single();

    if (clanError) {
        console.error("خطأ في إنشاء القبيلة:", clanError);
        if (clanError.code === '23505') {
            alert('هذا الاسم مستخدم بالفعل. يرجى اختيار اسم آخر.');
        }
        return null;
    }

    const { error: playerError } = await supabase
        .from('players')
        .update({ clan_id: clanData.id })
        .eq('id', user.id);

    if (playerError) {
        console.error("خطأ في تحديث اللاعب بعد إنشاء القبيلة:", playerError);
        return null;
    }

    return clanData;
}

export async function fetchClanDetails(clanId) {
    const { data, error } = await supabase
        .from('clans')
        .select(`*, players (id, username, xp)`)
        .eq('id', clanId)
        .single();

    if (error) {
        console.error("خطأ في جلب تفاصيل القبيلة:", error);
        return null;
    }
    return data;
}

export async function leaveClan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('players')
        .update({ clan_id: null })
        .eq('id', user.id);

    if (error) {
        console.error("خطأ أثناء مغادرة القبيلة:", error);
        return false;
    }
    return true;
}

export async function joinClan(clanId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('players')
        .update({ clan_id: clanId })
        .eq('id', user.id);

    if (error) {
        console.error("خطأ أثناء الانضمام للقبيلة:", error);
        return false;
    }
    return true;
}

export async function addXpToClan(clanId, xpAmount) {
    const { error } = await supabase.rpc('add_weekly_xp', {
        clan_id_to_update: clanId,
        xp_to_add: xpAmount
    });

    if (error) {
        console.error("خطأ في تحديث نقاط القبيلة:", error);
    }
}

export async function fetchClansLeaderboard() {
    const { data, error } = await supabase
        .from('clans')
        .select('id, name, emblem, weekly_xp')
        .order('weekly_xp', { ascending: false })
        .limit(20);

    if (error) {
        console.error("خطأ في جلب لوحة صدارة القبائل:", error);
        return [];
    }
    return data;
}

export async function fetchLastWeekWinners() {
    const { data, error } = await supabase
        .from('clan_weekly_winners')
        .select('clan_name, rank')
        .order('rank', { ascending: true });

    if (error) {
        console.error("خطأ في جلب الفائزين السابقين:", error);
        return [];
    }
    return data;
}

export async function kickMember(memberId) {
    const { error } = await supabase.rpc('kick_clan_member', {
        member_id_to_kick: memberId
    });

    if (error) {
        console.error("خطأ في طرد العضو:", error.message);
        alert(`فشل: ${error.message}`);
        return false;
    }
    return true;
}

export async function promoteMember(memberId) {
    const { error } = await supabase.rpc('promote_new_clan_leader', {
        new_leader_id: memberId
    });

    if (error) {
        console.error("خطأ في ترقية العضو:", error.message);
        alert(`فشل: ${error.message}`);
        return false;
    }
    return true;
}

// --- 5. دوال التحديات الشخصية ---
export async function fetchAvailableChallenges() {
    const { data, error } = await supabase
        .from('challenges')
        .select(`
            id, title, scope_type, scope_value, win_condition, privacy_level, participants_count,
            creator:players!creator_id ( username )
        `)
        .eq('is_active', true);

    if (error) {
        console.error("خطأ في جلب التحديات المتاحة:", error);
        return [];
    }
    return data;
}

export async function fetchChallengeDetails(challengeId) {
    const { data, error } = await supabase
        .from('challenges')
        .select(`
            *,
            challenge_participations (
                score,
                time_in_seconds,
                players ( username )
            )
        `)
        .eq('id', challengeId)
        .single();

    if (error) {
        console.error("خطأ في جلب تفاصيل التحدي:", error);
        return null;
    }
    return data;
}

export async function createChallenge(challengeData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: playerData } = await supabase.from('players').select('clan_id').eq('id', user.id).single();
    const clanId = playerData ? playerData.clan_id : null;

    const dataToInsert = {
        ...challengeData,
        creator_id: user.id,
        clan_id: clanId
    };

    const { data, error } = await supabase.from('challenges').insert(dataToInsert).select().single();

    if (error) {
        console.error("خطأ في إنشاء التحدي:", error);
        return null;
    }
    return data;
}

export async function saveChallengeResult(resultData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !resultData.challengeId) return null;

    const participationData = {
        challenge_id: resultData.challengeId,
        user_id: user.id,
        score: resultData.score,
        time_in_seconds: resultData.durationInSeconds,
        is_perfect: resultData.isPerfect
    };

    const { data, error } = await supabase.from('challenge_participations').upsert(participationData, { onConflict: 'challenge_id, user_id' }).select().single();

    if (error) {
        console.error("خطأ في حفظ نتيجة المشاركة في التحدي:", error);
        return null;
    }

    await supabase.rpc('increment_challenge_participants', { challenge_id_to_update: participationData.challenge_id });

    return data;
}
