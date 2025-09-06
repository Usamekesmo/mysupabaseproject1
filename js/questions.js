// =============================================================
// ==      وحدة مصنع الأسئلة (questions.js) - النسخة النهائية
// =============================================================

// دالة مساعدة لخلط عناصر مصفوفة، تستخدمها معظم دوال الأسئلة
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

// --- 1. دوال أسئلة "اختر التالي" ---

function generateChooseNextText(pageAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount + 1) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, optionsCount - 1);
    if (wrongOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    const questionHTML = `
        <h3>السؤال: ما هي الآية التالية لهذه الآية؟</h3>
        <p class="question-text">${questionAyah.text}</p>
        <hr>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctNextAyah.number, correctNextAyah.text, el, 'choose_next_text'))
    );
    return { questionHTML, setupListeners };
}

function generateChooseNextAudioText(pageAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount + 1) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, optionsCount - 1);
    if (wrongOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    const questionHTML = `
        <h3>السؤال: استمع واختر الآية التالية</h3>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctNextAyah.number, correctNextAyah.text, el, 'choose_next_audio_text'))
    );
    return { questionHTML, setupListeners };
}

function generateChooseNextAudioAudio(pageAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount + 1) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, optionsCount - 1);
    if (wrongOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    const questionHTML = `
        <h3>السؤال: استمع للآية، ثم استمع للخيارات واختر الآية التالية الصحيحة</h3>
        <p>الآية المعطاة:</p>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        <hr>
        <p>الخيارات:</p>
        ${options.map(opt => `<div class="option-div-audio"><audio controls src="https://cdn.islamic.network/quran/audio/128/${qari}/${opt.number}.mp3"></audio><button class="audio-choice-btn" data-number="${opt.number}">اختر</button></div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.audio-choice-btn').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctNextAyah.number, `الآية رقم ${correctNextAyah.numberInSurah} في سورة ${correctNextAyah.surah.name}`, el, 'choose_next_audio_audio'))
    );
    return { questionHTML, setupListeners };
}

// --- 2. دوال أسئلة "اختر السابق" ---

function generateChoosePreviousText(pageAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount + 1) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1)) + 1;
    const questionAyah = pageAyahs[startIndex];
    const correctPreviousAyah = pageAyahs[startIndex - 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctPreviousAyah.number && a.number !== questionAyah.number)).slice(0, optionsCount - 1);
    if (wrongOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([correctPreviousAyah, ...wrongOptions]);
    const questionHTML = `
        <h3>السؤال: ما هي الآية السابقة لهذه الآية؟</h3>
        <p class="question-text">${questionAyah.text}</p>
        <hr>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctPreviousAyah.number, correctPreviousAyah.text, el, 'choose_prev_text'))
    );
    return { questionHTML, setupListeners };
}

function generateChoosePreviousAudioText(pageAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount + 1) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1)) + 1;
    const questionAyah = pageAyahs[startIndex];
    const correctPreviousAyah = pageAyahs[startIndex - 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctPreviousAyah.number && a.number !== questionAyah.number)).slice(0, optionsCount - 1);
    if (wrongOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([correctPreviousAyah, ...wrongOptions]);
    const questionHTML = `
        <h3>السؤال: استمع واختر الآية السابقة</h3>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctPreviousAyah.number, correctPreviousAyah.text, el, 'choose_prev_audio_text'))
    );
    return { questionHTML, setupListeners };
}

function generateChoosePreviousAudioAudio(pageAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount + 1) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1)) + 1;
    const questionAyah = pageAyahs[startIndex];
    const correctPreviousAyah = pageAyahs[startIndex - 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctPreviousAyah.number && a.number !== questionAyah.number)).slice(0, optionsCount - 1);
    if (wrongOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([correctPreviousAyah, ...wrongOptions]);
    const questionHTML = `
        <h3>السؤال: استمع للآية، ثم استمع للخيارات واختر الآية السابقة الصحيحة</h3>
        <p>الآية المعطاة:</p>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        <hr>
        <p>الخيارات:</p>
        ${options.map(opt => `<div class="option-div-audio"><audio controls src="https://cdn.islamic.network/quran/audio/128/${qari}/${opt.number}.mp3"></audio><button class="audio-choice-btn" data-number="${opt.number}">اختر</button></div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.audio-choice-btn').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctPreviousAyah.number, `الآية رقم ${correctPreviousAyah.numberInSurah} في سورة ${correctPreviousAyah.surah.name}`, el, 'choose_prev_audio_audio'))
    );
    return { questionHTML, setupListeners };
}

// --- 3. دوال أسئلة "الآية الدخيلة" ---

function generateFindIntruderText(pageAyahs, intruderAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount - 1 || intruderAyahs.length < 1) return null;
    const intruderAyah = shuffleArray(intruderAyahs)[0];
    const correctOptions = shuffleArray(pageAyahs).slice(0, optionsCount - 1);
    if (correctOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([...correctOptions, intruderAyah]);
    const questionHTML = `
        <h3>السؤال: إحدى الآيات التالية ليست من هذه الصفحة. أيها هي؟</h3>
        ${options.map(opt => `<div class="option-div" data-is-intruder="${opt.number === intruderAyah.number}">${opt.text}</div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.isIntruder === 'true', intruderAyah.text, el, 'find_intruder_text'))
    );
    return { questionHTML, setupListeners };
}

function generateFindIntruderAudio(pageAyahs, intruderAyahs, qari, handleResultCallback, optionsCount = 4) {
    if (pageAyahs.length < optionsCount - 1 || intruderAyahs.length < 1) return null;
    const intruderAyah = shuffleArray(intruderAyahs)[0];
    const correctOptions = shuffleArray(pageAyahs).slice(0, optionsCount - 1);
    if (correctOptions.length < optionsCount - 1) return null;
    const options = shuffleArray([...correctOptions, intruderAyah]);
    const questionHTML = `
        <h3>السؤال: استمع للآيات. إحداها ليست من هذه الصفحة. أيها هي؟</h3>
        ${options.map(opt => `<div class="option-div-audio"><audio controls src="https://cdn.islamic.network/quran/audio/128/${qari}/${opt.number}.mp3"></audio><button class="audio-choice-btn" data-is-intruder="${opt.number === intruderAyah.number}">اختر</button></div>`).join('')}
    `;
    const setupListeners = (area) => area.querySelectorAll('.audio-choice-btn').forEach(el => 
        el.addEventListener('click', () => handleResultCallback(el.dataset.isIntruder === 'true', `الآية الدخيلة كانت من سورة ${intruderAyah.surah.name}`, el, 'find_intruder_audio'))
    );
    return { questionHTML, setupListeners };
}


// --- 4. كتالوج الأسئلة (يجب أن يطابق تمامًا ما في قاعدة البيانات) ---
export const allQuestionGenerators = {
    // أسئلة "اختر التالي"
    'choose_next_text_3': (p, q, h) => generateChooseNextText(p, q, h, 3),
    'choose_next_text_4': (p, q, h) => generateChooseNextText(p, q, h, 4),
    'choose_next_text_5': (p, q, h) => generateChooseNextText(p, q, h, 5),
    'choose_next_text_6': (p, q, h) => generateChooseNextText(p, q, h, 6),
    'choose_next_audio_text_3': (p, q, h) => generateChooseNextAudioText(p, q, h, 3),
    'choose_next_audio_text_4': (p, q, h) => generateChooseNextAudioText(p, q, h, 4),
    'choose_next_audio_text_5': (p, q, h) => generateChooseNextAudioText(p, q, h, 5),
    'choose_next_audio_text_6': (p, q, h) => generateChooseNextAudioText(p, q, h, 6),
    'choose_next_audio_audio_3': (p, q, h) => generateChooseNextAudioAudio(p, q, h, 3),
    'choose_next_audio_audio_4': (p, q, h) => generateChooseNextAudioAudio(p, q, h, 4),
    'choose_next_audio_audio_5': (p, q, h) => generateChooseNextAudioAudio(p, q, h, 5),
    'choose_next_audio_audio_6': (p, q, h) => generateChooseNextAudioAudio(p, q, h, 6),

    // أسئلة "اختر السابق"
    'choose_prev_text_3': (p, q, h) => generateChoosePreviousText(p, q, h, 3),
    'choose_prev_text_4': (p, q, h) => generateChoosePreviousText(p, q, h, 4),
    'choose_prev_text_5': (p, q, h) => generateChoosePreviousText(p, q, h, 5),
    'choose_prev_text_6': (p, q, h) => generateChoosePreviousText(p, q, h, 6),
    'choose_prev_audio_text_3': (p, q, h) => generateChoosePreviousAudioText(p, q, h, 3),
    'choose_prev_audio_text_4': (p, q, h) => generateChoosePreviousAudioText(p, q, h, 4),
    'choose_prev_audio_text_5': (p, q, h) => generateChoosePreviousAudioText(p, q, h, 5),
    'choose_prev_audio_text_6': (p, q, h) => generateChoosePreviousAudioText(p, q, h, 6),
    'choose_prev_audio_audio_3': (p, q, h) => generateChoosePreviousAudioAudio(p, q, h, 3),
    'choose_prev_audio_audio_4': (p, q, h) => generateChoosePreviousAudioAudio(p, q, h, 4),
    'choose_prev_audio_audio_5': (p, q, h) => generateChoosePreviousAudioAudio(p, q, h, 5),
    'choose_prev_audio_audio_6': (p, q, h) => generateChoosePreviousAudioAudio(p, q, h, 6),

    // أسئلة "الآية الدخيلة"
    'find_intruder_text_3': (p, i, q, h) => generateFindIntruderText(p, i, q, h, 3),
    'find_intruder_text_4': (p, i, q, h) => generateFindIntruderText(p, i, q, h, 4),
    'find_intruder_text_5': (p, i, q, h) => generateFindIntruderText(p, i, q, h, 5),
    'find_intruder_text_6': (p, i, q, h) => generateFindIntruderText(p, i, q, h, 6),
    'find_intruder_audio_3': (p, i, q, h) => generateFindIntruderAudio(p, i, q, h, 3),
    'find_intruder_audio_4': (p, i, q, h) => generateFindIntruderAudio(p, i, q, h, 4),
    'find_intruder_audio_5': (p, i, q, h) => generateFindIntruderAudio(p, i, q, h, 5),
    'find_intruder_audio_6': (p, i, q, h) => generateFindIntruderAudio(p, i, q, h, 6),
};
