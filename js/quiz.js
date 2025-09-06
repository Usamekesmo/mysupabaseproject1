// =============================================================
// ==      وحدة الاختبار (quiz.js) - النسخة النهائية والمتكاملة
// =============================================================

import * as ui from './ui.js';
import * as api from './api.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js';
import * as quests from './quests.js';
import { allQuestionGenerators } from './questions.js';

let state = {
    pageAyahs: [],
    intruderAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: null,
    xpEarned: 0,
    startTime: 0,
    // السياق الكامل (liveEvent, challengeId, etc.) يأتي من دالة start
};

let allQuestionTypes = [];
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

export async function initializeQuiz() {
    const config = await api.fetchQuestionsConfig();
    if (config && config.length > 0) {
        allQuestionTypes = config;
    } else {
        console.error("فشل تحميل إعدادات الأسئلة من قاعدة البيانات.");
    }
}

export function start(context) {
    state = {
        ...state,
        ...context,
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0,
        startTime: Date.now()
    };
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    const playerLevelInfo = progression.getLevelInfo(player.playerData.xp);
    
    const availableQuestionTypes = allQuestionTypes.filter(qType => {
        if (playerLevelInfo.level < qType.required_level) return false;
        // يمكن إضافة المزيد من شروط الفلترة هنا إذا لزم الأمر
        return true;
    });

    if (availableQuestionTypes.length === 0) {
        ui.showToast("عفواً، لا توجد أسئلة متاحة لهذه المعايير.", "error");
        endQuiz(); 
        return;
    }

    let questionGenerated = false;
    let attempts = 0;
    const shuffledTypes = shuffleArray(availableQuestionTypes);

    while (!questionGenerated && attempts < 15) { // زيادة عدد المحاولات للاحتياط
        attempts++;
        const selectedType = shuffledTypes[attempts % shuffledTypes.length];
        const generatorFunction = allQuestionGenerators[selectedType.id];

        if (generatorFunction) {
            let question;
            const funcId = selectedType.id;

            // منطق استدعاء مرن يعتمد على نوع السؤال
            if (funcId === 'generateFindIntruderText' || funcId === 'generateFindIntruderAudio') {
                question = generatorFunction(state.pageAyahs, state.intruderAyahs, state.selectedQari, handleResult, selectedType.options_count || selectedType.sequence_length);
            } else if (selectedType.options_count || selectedType.sequence_length) {
                question = generatorFunction(state.pageAyahs, state.selectedQari, handleResult, selectedType.options_count || selectedType.sequence_length);
            } else {
                question = generatorFunction(state.pageAyahs, state.selectedQari, handleResult);
            }
            
            if (question) {
                ui.questionArea.innerHTML = question.questionHTML;
                question.setupListeners(ui.questionArea);
                questionGenerated = true;
            }
        } else {
            console.error(`لم يتم العثور على دالة توليد للسؤال بالمعرف: ${selectedType.id}`);
        }
    }

    if (!questionGenerated) {
        console.error("فشل توليد أي سؤال صالح بعد عدة محاولات.");
        ui.showToast("حدث خطأ أثناء إعداد السؤال التالي.", "error");
        endQuiz();
    }
}

function handleResult(isCorrect, correctAnswerText, clickedElement, questionId) {
    ui.disableQuestionInteraction();
    const rules = progression.getGameRules();
    if (isCorrect) {
        state.score++;
        state.xpEarned += rules.xp_per_correct_answer || 10;
        ui.markAnswer(clickedElement, true);
    } else {
        state.errorLog.push({
            question_id: questionId, // تسجيل معرف السؤال عند الخطأ
            questionHTML: ui.questionArea.innerHTML,
            correctAnswer: correctAnswerText
        });
        ui.markAnswer(clickedElement, false);
    }
    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000);
}

async function endQuiz() {
    const durationInSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const rules = progression.getGameRules();
    const isPerfect = state.score === state.totalQuestions;

    if (state.testMode !== 'personal_challenge') {
        player.playerData.total_quizzes_completed = (player.playerData.total_quizzes_completed || 0) + 1;
        player.playerData.total_play_time_seconds = (player.playerData.total_play_time_seconds || 0) + durationInSeconds;
        player.playerData.total_correct_answers = (player.playerData.total_correct_answers || 0) + state.score;
        player.playerData.total_questions_answered = (player.playerData.total_questions_answered || 0) + state.totalQuestions;

        if (isPerfect) {
            state.xpEarned += rules.xp_bonus_all_correct || 50;
            if (state.liveEvent) {
                player.playerData.diamonds += state.liveEvent.reward_diamonds || 0;
            }
            if (state.pageNumber) {
                api.updateMasteryRecord(state.pageNumber, durationInSeconds);
            }
            quests.updateQuestsProgress('mastery_check');
        }

        const oldXp = player.playerData.xp;
        player.playerData.xp += state.xpEarned;
        const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
        if (levelUpInfo) {
            player.playerData.diamonds += levelUpInfo.reward;
        }

        quests.updateQuestsProgress('quiz_completed');
        achievements.checkAchievements('quiz_completed', {
            isPerfect: isPerfect,
            pageNumber: state.pageNumber
        });

        const resultToSave = {
            pageNumber: state.pageNumber,
            score: state.score,
            totalQuestions: state.totalQuestions,
            xpEarned: state.xpEarned,
            errorLog: state.errorLog
        };
        
        await player.savePlayer();
        await api.saveResult(resultToSave);
        await api.logPlayerAction('QUIZ_COMPLETED', {
            pageNumber: state.pageNumber,
            score: state.score,
            totalQuestions: state.totalQuestions,
            xpEarned: state.xpEarned,
            durationInSeconds: durationInSeconds,
            isPerfect: isPerfect
        });

    } else if (state.testMode === 'personal_challenge') {
        const challengeResult = {
            challengeId: state.challengeId,
            score: state.score,
            durationInSeconds: durationInSeconds,
            isPerfect: isPerfect
        };
        await api.saveChallengeResult(challengeResult);
        ui.showToast("تم تسجيل نتيجتك في التحدي بنجاح!", "info");
    }
    
    ui.updateSaveMessage(true);

    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        const finalLevelUpInfo = progression.checkForLevelUp(player.playerData.xp - state.xpEarned, player.playerData.xp);
        ui.displayFinalResult(state, finalLevelUpInfo);
    }
}

export function getCurrentState() {
    return state;
}
