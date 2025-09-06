// =================================================================
// ==      الملف الرئيسي (main.js) - النسخة النهائية والمتكاملة      ==
// =================================================================

import * as ui from './ui.js';
import * as api from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import * as achievements from './achievements.js';
import * as quests from './quests.js';
import { surahMetadata } from './quran-metadata.js';

// --- دوال التهيئة والإعداد ---

async function initialize() {
    ui.toggleLoader(true);
    try {
        // تحميل جميع الإعدادات الأساسية بالتوازي
        await Promise.all([
            progression.initializeProgression(),
            quiz.initializeQuiz(),
            achievements.initializeAchievements()
        ]);
        // إعداد مستمعي الأحداث بعد التأكد من تحميل كل شيء
        setupEventListeners();
        ui.showScreen(ui.startScreen);
    } catch (error) {
        console.error("فشل تهيئة التطبيق:", error);
        document.body.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2em;">حدث خطأ فادح أثناء تحميل التطبيق. يرجى تحديث الصفحة.</p>';
    } finally {
        ui.toggleLoader(false);
    }
}

function setupEventListeners() {
    // --- المستمعون الأساسيون ---
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.getElementById('signUpButton')?.addEventListener('click', handleSignUp);
    document.getElementById('legacyUserLink')?.addEventListener('click', handleLegacyUser);
    if (ui.startTestButton) ui.startTestButton.addEventListener('click', onStartPageTestClick);
    if (ui.reloadButton) ui.reloadButton.addEventListener('click', returnToMainMenu);
    if (ui.showFinalResultButton) {
        ui.showFinalResultButton.addEventListener('click', () => {
            const quizState = quiz.getCurrentState();
            const oldXp = player.playerData.xp - quizState.xpEarned;
            const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
            ui.displayFinalResult(quizState, levelUpInfo);
        });
    }

    // --- مستمعو التبويبات والفلاتر ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            ui.showTab(tabId);
            // إعادة تحميل البيانات عند فتح التبويبات الديناميكية
            if (!button.dataset.loaded || ['clans-tab', 'challenges-tab'].includes(tabId)) {
                if (tabId === 'store-tab') store.renderStoreTabs('all');
                else if (tabId === 'leaderboard-tab') onLeaderboardTabClick();
                else if (tabId === 'profile-tab') ui.renderPlayerStats(player.playerData);
                else if (tabId === 'quests-tab') quests.renderQuests();
                else if (tabId === 'clans-tab') onClansTabClick();
                else if (tabId === 'challenges-tab') onChallengesTabClick();
                
                if (tabId !== 'test-tab') button.dataset.loaded = 'true';
            }
        });
    });
    
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            store.renderStoreTabs(e.target.dataset.filter);
        });
    });

    // --- مستمعو النوافذ المنبثقة والأزرار الديناميكية ---
    if (ui.modalBuyButton) ui.modalBuyButton.addEventListener('click', (e) => store.purchaseItem(e.target.dataset.itemId));
    if (ui.modalCloseButton) ui.modalCloseButton.addEventListener('click', () => ui.showModal(false, null, player.playerData));
    if (ui.genericModalCloseButton) ui.genericModalCloseButton.addEventListener('click', () => ui.toggleGenericModal(false));

    const storeContainer = document.getElementById('store-container');
    if (storeContainer) {
        storeContainer.addEventListener('click', (e) => {
            if (e.target.matches('.details-button')) {
                e.preventDefault();
                const itemId = e.target.dataset.itemId;
                if (itemId) store.handleDetailsClick(itemId);
            }
        });
    }

    // مستمع عام للأحداث الحية (لأنها تضاف ديناميكيًا)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.challenge-start-button')) {
            handleLiveEventStart(e.target.dataset.eventId, surahMetadata);
        }
    });
}

// --- دوال المصادقة ---

async function handleLogin() {
    const userName = ui.userNameInput.value.trim();
    const password = document.getElementById('password').value;
    if (!userName || !password) return ui.showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "error");

    ui.toggleLoader(true);
    const email = `${btoa(unescape(encodeURIComponent(userName)))}@quran-quiz.app`;
    const { error } = await api.loginUser(email, password);
    ui.toggleLoader(false);

    if (error) {
        return ui.showToast("فشل تسجيل الدخول: " + error.message, "error");
    }
    await postLoginSetup();
    ui.showScreen(ui.mainInterface);
}

async function handleSignUp() {
    const userName = ui.userNameInput.value.trim();
    const password = document.getElementById('password').value;
    if (!userName || !password) return ui.showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "error");
    if (password.length < 6) return ui.showToast("يجب أن تكون كلمة المرور 6 أحرف على الأقل.", "error");

    ui.toggleLoader(true);
    const email = `${btoa(unescape(encodeURIComponent(userName)))}@quran-quiz.app`;
    const { error } = await api.signUpUser(email, password, userName);
    ui.toggleLoader(false);

    if (error) {
        return ui.showToast("فشل إنشاء الحساب: " + error.message, "error");
    }
    await postLoginSetup();
    ui.showScreen(ui.mainInterface);
}

async function handleLegacyUser() {
    const userName = prompt("لاستعادة حسابك القديم، يرجى إدخال اسم المستخدم تمامًا كما كان.");
    if (!userName) return;
    const password = prompt("الآن، يرجى إدخال كلمة مرور جديدة لحسابك (6 أحرف على الأقل).");
    if (!password || password.length < 6) {
        return ui.showToast("كلمة المرور غير صالحة. يجب أن تكون 6 أحرف على الأقل.", "error");
    }
    
    ui.toggleLoader(true);
    const email = `${btoa(unescape(encodeURIComponent(userName)))}@quran-quiz.app`;
    const { error } = await api.signUpUser(email, password, userName);
    ui.toggleLoader(false);

    if (error) {
        return ui.showToast("فشل استعادة الحساب: " + error.message, "error");
    }
    
    ui.showToast("تم استعادة حسابك بنجاح! يرجى تسجيل الدخول الآن.", "info");
}

// --- دوال منطق اللعبة ---

async function returnToMainMenu() {
    await postLoginSetup();
    ui.showScreen(ui.mainInterface);
}

async function postLoginSetup() {
    const playerLoaded = await player.loadPlayer();
    if (!playerLoaded) return ui.showToast("فشل تحميل بيانات اللاعب. حاول تحديث الصفحة.", "error");

    const [storeItems, specialOffers, liveEvents, assignedQuests, masteryData] = await Promise.all([
        api.fetchStoreConfig(),
        api.fetchSpecialOffers(),
        api.fetchLiveEvents(),
        api.fetchOrAssignDailyQuests(),
        api.fetchPlayerMastery()
    ]);
    
    store.processStoreData(storeItems, specialOffers);
    quests.initialize(assignedQuests, masteryData);
    
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerHeader(player.playerData, levelInfo);
    updateAvailablePages();
    ui.populateQariSelect(ui.qariSelect, player.playerData.inventory);
    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);
    ui.renderEvents(liveEvents);
}

export function updateAvailablePages() {
    const purchasedPages = (player.playerData.inventory || []).filter(id => id.startsWith('page_')).map(id => parseInt(id.replace('page_', ''), 10));
    const availablePages = [...new Set([...player.FREE_PAGES, ...purchasedPages])].sort((a, b) => a - b);
    ui.populateSelect(ui.pageSelect, availablePages, 'الصفحة');
}

async function onStartPageTestClick() {
    const selectedPage = ui.pageSelect.value;
    if (!selectedPage) return ui.showToast("يرجى اختيار صفحة.", "error");

    startTestWithSettings({
        pageNumbers: [parseInt(selectedPage, 10)],
        totalQuestions: parseInt(ui.questionsCountSelect.value, 10),
        scope: 'page',
        testMode: 'normal_test'
    });
}

async function onLeaderboardTabClick() {
    ui.leaderboardList.innerHTML = '<p>جاري تحميل البيانات...</p>';
    const leaderboardData = await api.fetchLeaderboard();
    if (leaderboardData && leaderboardData.length > 0) {
        ui.displayLeaderboard(leaderboardData, 'leaderboard-list');
    } else {
        ui.leaderboardList.innerHTML = '<p>لوحة الصدارة فارغة حاليًا.</p>';
    }
}

async function handleLiveEventStart(eventId, localSurahMetadata) {
    if (!localSurahMetadata) return console.error("بيانات السور الوصفية غير متوفرة.");

    const event = ui.getEventById(eventId);
    if (!event) return console.error(`لم يتم العثور على حدث بالمعرف: ${eventId}`);
    
    const surahInfo = localSurahMetadata[event.target_surah]; 
    if (!surahInfo) return console.error(`لم يتم العثور على بيانات وصفية للسورة: ${event.target_surah}`);
    
    const confirmation = confirm(`أنت على وشك بدء تحدي "${event.title}". هل أنت مستعد؟`);
    if (confirmation) {
        const pageNumbers = Array.from({ length: surahInfo.endPage - surahInfo.startPage + 1 }, (_, i) => surahInfo.startPage + i);
        startTestWithSettings({
            pageNumbers: pageNumbers,
            totalQuestions: event.questions_count,
            liveEvent: event,
            scope: 'surah',
            testMode: 'live_event'
        });
    }
}

async function startTestWithSettings(settings) {
    ui.toggleLoader(true);
    let allAyahs = [];
    for (const pageNum of settings.pageNumbers) {
        const pageAyahs = await api.fetchPageData(pageNum);
        if (pageAyahs) allAyahs.push(...pageAyahs);
    }
    ui.toggleLoader(false);
    if (allAyahs.length > 0) {
        quiz.start({
            pageAyahs: allAyahs,
            selectedQari: ui.qariSelect.value,
            totalQuestions: settings.totalQuestions,
            userName: player.playerData.username,
            pageNumber: settings.pageNumbers.length === 1 ? settings.pageNumbers[0] : null,
            liveEvent: settings.liveEvent,
            challengeId: settings.challengeId,
            scope: settings.scope,
            testMode: settings.testMode
        });
    } else {
        ui.showToast("حدث خطأ أثناء تحميل آيات الصفحة.", "error");
    }
}

// --- دوال التحكم بالقبائل ---

async function onClansTabClick() {
    const clansTabContainer = document.getElementById('clans-tab');
    clansTabContainer.innerHTML = '<p>جاري تحميل بيانات القبائل...</p>';
    await player.loadPlayer();
    if (player.playerData.clan_id) {
        const [clanDetails, lastWeekWinners] = await Promise.all([
            api.fetchClanDetails(player.playerData.clan_id),
            api.fetchLastWeekWinners()
        ]);
        ui.renderClansTab(player.playerData, [], clanDetails, lastWeekWinners);
        document.getElementById('leaveClanButton')?.addEventListener('click', handleLeaveClan);
        document.getElementById('showClanLeaderboardButton')?.addEventListener('click', async () => {
            ui.toggleLoader(true);
            const leaderboard = await api.fetchClansLeaderboard();
            ui.toggleLoader(false);
            ui.showClansLeaderboardModal(leaderboard);
        });
        document.querySelectorAll('.action-button.kick').forEach(button => button.addEventListener('click', (e) => handleKickMember(e.currentTarget.dataset.memberId)));
        document.querySelectorAll('.action-button.promote').forEach(button => button.addEventListener('click', (e) => handlePromoteMember(e.currentTarget.dataset.memberId)));
    } else {
        const clansList = await api.fetchClans();
        ui.renderClansTab(player.playerData, clansList, null, null);
        document.getElementById('showCreateClanModalButton')?.addEventListener('click', handleShowCreateClanModal);
        document.querySelectorAll('.joinClanButton').forEach(button => button.addEventListener('click', (e) => handleJoinClan(e.target.dataset.clanId)));
    }
}

function handleShowCreateClanModal() {
    const content = `
        <h3>إنشاء قبيلة جديدة</h3>
        <input type="text" id="newClanName" placeholder="اسم القبيلة (3-20 حرف)" maxlength="20" required>
        <textarea id="newClanDescription" placeholder="وصف قصير للقبيلة (اختياري)" maxlength="100"></textarea>
        <button id="confirmCreateClanButton" class="button-primary">تأكيد الإنشاء</button>
    `;
    ui.toggleGenericModal(true, content);
    document.getElementById('confirmCreateClanButton')?.addEventListener('click', handleCreateClan);
}

async function handleCreateClan() {
    const name = document.getElementById('newClanName').value.trim();
    const description = document.getElementById('newClanDescription').value.trim();
    if (name.length < 3) return ui.showToast("يجب أن يكون اسم القبيلة 3 أحرف على الأقل.", "error");
    ui.toggleLoader(true);
    const newClan = await api.createClan(name, description);
    ui.toggleLoader(false);
    if (newClan) {
        ui.showToast(`تم إنشاء قبيلة "${name}" بنجاح!`, "info");
        ui.toggleGenericModal(false);
        onClansTabClick();
    }
}

async function handleJoinClan(clanId) {
    if (!confirm("هل أنت متأكد من أنك تريد الانضمام إلى هذه القبيلة؟")) return;
    ui.toggleLoader(true);
    const success = await api.joinClan(clanId);
    ui.toggleLoader(false);
    if (success) {
        ui.showToast("تم الانضمام للقبيلة بنجاح!", "info");
        onClansTabClick();
    } else {
        ui.showToast("فشل الانضمام للقبيلة.", "error");
    }
}

async function handleLeaveClan() {
    if (!confirm("هل أنت متأكد من أنك تريد مغادرة القبيلة؟")) return;
    ui.toggleLoader(true);
    const success = await api.leaveClan();
    ui.toggleLoader(false);
    if (success) {
        ui.showToast("لقد غادرت القبيلة.", "info");
        onClansTabClick();
    } else {
        ui.showToast("فشلت عملية المغادرة.", "error");
    }
}

async function handleKickMember(memberId) {
    if (!confirm("هل أنت متأكد من أنك تريد طرد هذا العضو؟")) return;
    ui.toggleLoader(true);
    const success = await api.kickMember(memberId);
    ui.toggleLoader(false);
    if (success) {
        ui.showToast("تم طرد العضو بنجاح.", "info");
        onClansTabClick();
    }
}

async function handlePromoteMember(memberId) {
    if (!confirm("هل أنت متأكد من أنك تريد تعيين هذا العضو كقائد جديد؟")) return;
    ui.toggleLoader(true);
    const success = await api.promoteMember(memberId);
    ui.toggleLoader(false);
    if (success) {
        ui.showToast("تم تعيين قائد جديد بنجاح.", "info");
        onClansTabClick();
    }
}

// --- دوال التحكم بالتحديات الشخصية ---

async function onChallengesTabClick() {
    const container = document.getElementById('challenges-list-container');
    container.innerHTML = '<p>جاري تحميل التحديات...</p>';
    
    document.getElementById('create-challenge-button')?.addEventListener('click', showCreateChallengeModal);
    
    const challenges = await api.fetchAvailableChallenges();
    ui.renderAvailableChallenges(challenges);

    document.querySelectorAll('.challenge-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const challengeId = e.currentTarget.dataset.challengeId;
            if (e.target.matches('.start-challenge-button')) {
                handleStartPersonalChallenge(challengeId);
            } else {
                handleShowChallengeDetails(challengeId);
            }
        });
    });
}

function showCreateChallengeModal() {
    const content = `
        <h3>إنشاء تحدي جديد</h3>
        <form id="create-challenge-form">
            <label for="challenge-title">عنوان التحدي</label>
            <input type="text" id="challenge-title" required maxlength="50">
            
            <label for="challenge-scope-type">نطاق التحدي</label>
            <select id="challenge-scope-type">
                <option value="single_page">صفحة واحدة</option>
                <option value="surah">سورة كاملة</option>
            </select>
            
            <label for="challenge-scope-value">قيمة النطاق (رقم الصفحة أو السورة)</label>
            <input type="number" id="challenge-scope-value" required min="1" max="604">
            
            <label for="challenge-win-condition">شرط الفوز</label>
            <select id="challenge-win-condition">
                <option value="highest_score">أعلى نتيجة</option>
                <option value="fastest_perfect_time">أسرع وقت (بنتيجة كاملة)</option>
            </select>
            
            <label for="challenge-privacy">خصوصية التحدي</label>
            <select id="challenge-privacy">
                <option value="public">عام (لكل اللاعبين)</option>
                <option value="clan_only">للقبيلة فقط</option>
            </select>
            
            <button type="submit" class="button-primary">تأكيد وإنشاء</button>
        </form>
    `;
    ui.toggleGenericModal(true, content);
    document.getElementById('create-challenge-form')?.addEventListener('submit', handleCreateChallenge);
}

async function handleCreateChallenge(event) {
    event.preventDefault();
    const challengeData = {
        title: document.getElementById('challenge-title').value,
        scope_type: document.getElementById('challenge-scope-type').value,
        scope_value: parseInt(document.getElementById('challenge-scope-value').value),
        win_condition: document.getElementById('challenge-win-condition').value,
        privacy_level: document.getElementById('challenge-privacy').value,
    };

    if (!challengeData.title || !challengeData.scope_value) {
        return ui.showToast("يرجى ملء جميع الحقول المطلوبة.", "error");
    }

    ui.toggleLoader(true);
    const newChallenge = await api.createChallenge(challengeData);
    ui.toggleLoader(false);

    if (newChallenge) {
        ui.showToast("تم إنشاء التحدي بنجاح!", "info");
        ui.toggleGenericModal(false);
        onChallengesTabClick();
    } else {
        ui.showToast("فشل إنشاء التحدي.", "error");
    }
}

async function handleStartPersonalChallenge(challengeId) {
    ui.toggleLoader(true);
    const challenge = await api.fetchChallengeDetails(challengeId);
    ui.toggleLoader(false);

    if (!challenge) return ui.showToast("لا يمكن بدء هذا التحدي.", "error");

    let pageNumbers = [];
    let scope = 'page';
    if (challenge.scope_type === 'single_page') {
        pageNumbers = [parseInt(challenge.scope_value, 10)];
    } else if (challenge.scope_type === 'surah') {
        const surahInfo = surahMetadata[challenge.scope_value];
        if (!surahInfo) return ui.showToast("رقم السورة غير صالح.", "error");
        pageNumbers = Array.from({ length: surahInfo.endPage - surahInfo.startPage + 1 }, (_, i) => surahInfo.startPage + i);
        scope = 'surah';
    }

    startTestWithSettings({
        pageNumbers: pageNumbers,
        totalQuestions: 10,
        challengeId: challenge.id,
        scope: scope,
        testMode: 'personal_challenge'
    });
}

async function handleShowChallengeDetails(challengeId) {
    ui.toggleLoader(true);
    const details = await api.fetchChallengeDetails(challengeId);
    ui.toggleLoader(false);
    if (details) {
        ui.showChallengeDetailsModal(details);
    }
}

// بدء تشغيل التطبيق
initialize();
