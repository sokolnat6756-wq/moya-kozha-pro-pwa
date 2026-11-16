/* МОЯ КОЖА PRO — полностью локальное приложение, без сетевых запросов. */
(() => {
  'use strict';

  const STORAGE_KEY = 'moya-kozha-pro:v1';
  const DIARY_DAYS = 30;
  const NOTE_LIMIT = 280;
  const SCREENS = ['home', 'quiz', 'result', 'ritual', 'diary'];

  const QUESTIONS = [
    {
      title: 'Как ты обычно ощущаешь кожу после умывания?',
      hint: 'Выбери вариант, который чаще всего похож на твои ощущения.',
      options: ['Комфортно', 'Иногда хочется больше мягкости и комфорта', 'Часто хочется сразу нанести увлажняющее средство', 'Пока не обращала внимания']
    },
    {
      title: 'Сколько времени тебе хочется уделять уходу?',
      hint: 'Идеальный ритуал — тот, который реально вписывается в твой день.',
      options: ['Пару минут, только основное', 'Около пяти минут', 'Люблю неспешные ритуалы', 'Пока не знаю']
    },
    {
      title: 'Как сейчас устроено твоё очищение?',
      hint: 'Мы спрашиваем только о привычках, не о состоянии кожи.',
      options: ['Обычно утром и вечером', 'Чаще вечером', 'Когда получается', 'Пока нет постоянного ритуала']
    },
    {
      title: 'Какая текстура увлажнения тебе приятнее?',
      hint: 'Это вопрос комфорта и предпочтений — не определения типа кожи.',
      options: ['Лёгкая и быстро впитывающаяся', 'Более насыщенная и обволакивающая', 'Любая, если комфортно', 'Хочу попробовать и понять']
    },
    {
      title: 'Как у тебя обстоят дела с SPF утром?',
      hint: 'SPF — солнцезащитное средство. Отвечай так, как есть.',
      options: ['Уже есть привычка использовать', 'Вспоминаю время от времени', 'Пока не использую регулярно', 'Хочу сделать частью утреннего ухода']
    },
    {
      title: 'Что тебе ближе при выборе средств?',
      hint: 'Предпочтения помогают сделать ежедневный уход приятнее.',
      options: ['Средства без отдушек', 'Минимум разных средств', 'Главное — приятная текстура', 'Особых предпочтений нет']
    },
    {
      title: 'Что сейчас важнее всего в твоём уходе?',
      hint: 'На основе главного желания мы выберем один из четырёх сценариев.',
      options: ['Упростить повседневный уход', 'Делать уход регулярнее', 'Добавить больше комфорта', 'Не забывать о защите от солнца']
    }
  ];

  const SCENARIOS = [
    {
      name: 'Красота простоты',
      description: 'Тебе близок минимализм. Основой станет короткий, понятный уход: бережное очищение по потребности, увлажнение и SPF 30+ утром. Не нужно добавлять много средств сразу.',
      focus: 'Оставь только необходимые шаги. Простая последовательность удобнее, чем длинный список, который трудно повторять.'
    },
    {
      name: 'Ритм заботы',
      description: 'Тебе хочется больше регулярности. Начни с небольших повторяемых действий утром и вечером. Отмечай галочки без гонки за идеальным результатом.',
      focus: 'Свяжи ритуал с уже знакомым действием: умыванием утром и подготовкой ко сну вечером.'
    },
    {
      name: 'Бережный комфорт',
      description: 'Для тебя важны приятные ощущения. Обращай внимание на мягкость очищения и комфортную текстуру увлажнения. Никаких сложных процедур для базового ухода не требуется.',
      focus: 'Выбирай привычные, комфортные средства и не вводи много новых продуктов одновременно.'
    },
    {
      name: 'Солнечная привычка',
      description: 'Ты хочешь сделать защиту от солнца частью дня. Основа остаётся простой: очищение по потребности, увлажнение и SPF 30+ утром, с обновлением защиты на улице по инструкции.',
      focus: 'Размести средство SPF рядом с привычными утренними средствами, чтобы легче вспоминать о нём.'
    }
  ];

  const RITUAL_STEPS = {
    morning: [
      ['Деликатное очищение', 'По потребности, без интенсивного трения.'],
      ['Увлажнение', 'Нанеси комфортное для тебя увлажняющее средство.'],
      ['SPF 30+', 'Утренний солнцезащитный шаг; при нахождении на улице обновляй по инструкции.']
    ],
    evening: [
      ['Бережное очищение', 'Особенно если использовались косметика или SPF.'],
      ['Увлажнение', 'Спокойное завершение ухода без лишних шагов.']
    ]
  };

  const MOODS = ['comfortable', 'tight', 'dry', 'different'];
  const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function emptyState() {
    return { version: 1, theme: 'quartz', answers: Array(7).fill(null), rituals: {}, diaryStartDate: null, diary: {} };
  }

  function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  function isValidISO(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const [year, month, day] = iso.split('-').map(Number);
    const d = new Date(year, month - 1, day, 12);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day && year >= 2000 && year <= 2100;
  }

  function dateFromISO(iso) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function formatISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function todayISO() { return formatISO(new Date()); }

  function plusDays(iso, days) {
    const d = dateFromISO(iso);
    d.setDate(d.getDate() + days);
    return formatISO(d);
  }

  function daysBetween(a, b) {
    // Календарные дни: расчёт в UTC исключает переходы на летнее/зимнее время.
    const toUTC = (iso) => {
      const [y, m, d] = iso.split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    };
    return Math.round((toUTC(b) - toUTC(a)) / 86400000);
  }

  function prettyDate(iso, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
    return new Intl.DateTimeFormat('ru-RU', options).format(dateFromISO(iso));
  }

  function sanitizeState(raw) {
    const cleaned = emptyState();
    if (!isPlainObject(raw)) return cleaned;
    if (raw.theme === 'champagne') cleaned.theme = 'champagne';
    if (Array.isArray(raw.answers)) {
      cleaned.answers = QUESTIONS.map((question, i) => {
        const answer = raw.answers[i];
        return Number.isInteger(answer) && answer >= 0 && answer < question.options.length ? answer : null;
      });
    }
    if (isPlainObject(raw.rituals)) {
      for (const [date, entry] of Object.entries(raw.rituals).slice(-1000)) {
        if (!isValidISO(date) || !isPlainObject(entry)) continue;
        cleaned.rituals[date] = {
          morning: RITUAL_STEPS.morning.map((_, i) => entry.morning?.[i] === true),
          evening: RITUAL_STEPS.evening.map((_, i) => entry.evening?.[i] === true)
        };
      }
    }
    if (isValidISO(raw.diaryStartDate)) cleaned.diaryStartDate = raw.diaryStartDate;
    if (cleaned.diaryStartDate && isPlainObject(raw.diary)) {
      for (const [date, entry] of Object.entries(raw.diary).slice(-100)) {
        if (!isValidISO(date) || daysBetween(cleaned.diaryStartDate, date) < 0 || daysBetween(cleaned.diaryStartDate, date) >= DIARY_DAYS || !isPlainObject(entry)) continue;
        cleaned.diary[date] = {
          mood: MOODS.includes(entry.mood) ? entry.mood : null,
          note: typeof entry.note === 'string' ? entry.note.slice(0, NOTE_LIMIT) : ''
        };
      }
    }
    return cleaned;
  }

  let storageAvailable = true;
  function loadState() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? sanitizeState(JSON.parse(stored)) : emptyState();
    } catch (error) {
      storageAvailable = false;
      $('#storage-warning').hidden = false;
      console.warn('Не удалось прочитать локальные данные:', error);
      return emptyState();
    }
  }

  let state = loadState();
  let quizDraft = null;
  let questionIndex = 0;
  let ritualDate = todayISO();
  let selectedDiaryDate = null;
  let toastTimer = null;

  function saveState() {
    if (!storageAvailable) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      storageAvailable = false;
      $('#storage-warning').hidden = false;
      console.warn('Не удалось сохранить локальные данные:', error);
      return false;
    }
  }

  function notify(text) {
    const toast = $('#app-toast');
    toast.textContent = text;
    toast.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4000);
  }

  function applyTheme() {
    document.body.dataset.theme = state.theme;
    $$('[data-theme-choice]').forEach(button => {
      const active = button.dataset.themeChoice === state.theme;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = state.theme === 'quartz' ? '#faf6f3' : '#faf5ed';
  }

  function completeAnswers() {
    return state.answers.every((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < QUESTIONS[index].options.length);
  }

  function showScreen(screen) {
    if (!SCREENS.includes(screen)) return;
    if (screen === 'quiz' && quizDraft === null) {
      quizDraft = [...state.answers];
      questionIndex = 0;
    }
    if (screen === 'diary') ensureDiaryStarted();
    if (screen === 'ritual') ritualDate = todayISO();

    for (const name of SCREENS) {
      const section = $(`#screen-${name}`);
      section.hidden = name !== screen;
      section.classList.toggle('is-active', name === screen);
    }
    $$('[data-route]').forEach(button => {
      if (button.closest('.main-nav')) {
        if (button.dataset.route === screen) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      }
    });

    if (screen === 'home') renderHome();
    if (screen === 'quiz') renderQuestion();
    if (screen === 'result') renderResult();
    if (screen === 'ritual') renderRitual();
    if (screen === 'diary') renderDiary();

    window.scrollTo({ top: 0, behavior: 'instant' });
    $(`#${screen}-title`)?.focus({ preventScroll: true });
  }

  function renderHome() {
    $('#home-result-description').textContent = completeAnswers()
      ? 'Твоя карточка уже готова. Посмотри базовые рекомендации, подобранные под твои предпочтения.'
      : 'Ответь на вопросы и получи сценарий базового ухода под свои предпочтения.';
  }

  function startQuiz(fresh = true) {
    quizDraft = fresh ? Array(QUESTIONS.length).fill(null) : [...state.answers];
    questionIndex = 0;
    showScreen('quiz');
  }

  function renderQuestion() {
    const question = QUESTIONS[questionIndex];
    $('#quiz-step-text').textContent = `Вопрос ${questionIndex + 1} из ${QUESTIONS.length}`;
    $('#quiz-progress').setAttribute('aria-valuenow', String(questionIndex + 1));
    $('#quiz-progress-fill').style.width = `${(questionIndex + 1) / QUESTIONS.length * 100}%`;
    $('#question-title').textContent = question.title;
    $('#question-hint').textContent = question.hint;

    const fieldset = $('#quiz-choices');
    fieldset.replaceChildren();
    const legend = document.createElement('legend');
    legend.className = 'visually-hidden';
    legend.textContent = 'Выберите один вариант ответа';
    fieldset.append(legend);

    question.options.forEach((option, index) => {
      const label = document.createElement('label');
      label.className = 'choice-label';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'quiz-answer';
      input.value = String(index);
      input.checked = quizDraft[questionIndex] === index;
      input.addEventListener('change', () => {
        quizDraft[questionIndex] = index;
        $('#quiz-next').disabled = false;
      });
      const span = document.createElement('span');
      span.textContent = option;
      label.append(input, span);
      fieldset.append(label);
    });
    $('#quiz-next').disabled = quizDraft[questionIndex] === null;
    $('#quiz-next').textContent = questionIndex === QUESTIONS.length - 1 ? 'Показать карточку →' : 'Далее →';
    $('#quiz-back').textContent = questionIndex === 0 ? '← На главную' : '← Назад';
  }

  function nextQuestion() {
    if (quizDraft === null || quizDraft[questionIndex] === null) return;
    if (questionIndex < QUESTIONS.length - 1) {
      questionIndex += 1;
      renderQuestion();
      $('#question-title').focus({ preventScroll: true });
      return;
    }
    state.answers = [...quizDraft];
    quizDraft = null;
    saveState();
    showScreen('result');
    notify('Карточка готова. Ответы сохранены на этом устройстве.');
  }

  function previousQuestion() {
    if (questionIndex === 0) showScreen('home');
    else {
      questionIndex -= 1;
      renderQuestion();
      $('#question-title').focus({ preventScroll: true });
    }
  }

  function personalisedTips() {
    const a = state.answers;
    const tips = [SCENARIOS[a[6]].focus];
    if (a[0] === 1 || a[0] === 2) {
      tips.push('Если после умывания хочется больше комфорта, выбирай деликатный подход и привычное увлажнение. Не нужно усиливать очищение.');
    } else if (a[0] === 3) {
      tips.push('Попробуй просто замечать ощущения после умывания — без попыток самостоятельно определять состояние кожи.');
    }
    if (a[3] === 0) tips.push('Ты предпочитаешь лёгкие текстуры — ориентируйся на это ощущение комфорта при выборе увлажнения.');
    if (a[3] === 1) tips.push('Тебе нравятся более насыщенные текстуры. В базовом уходе можно ориентироваться на этот комфорт.');
    if (a[3] === 3) tips.push('С текстурой можно определиться постепенно: не обязательно менять сразу несколько привычных средств.');
    if (a[5] === 0) tips.push('Если предпочитаешь средства без отдушек, обращай внимание на информацию на упаковке.');
    if (a[5] === 1) tips.push('Твой выбор — минимум средств. Базовых шагов утром и вечером вполне достаточно для простого ритуала.');
    if (a[4] !== 0) tips.push('Чтобы легче вспоминать про SPF 30+, сделай его заметной частью утренней последовательности.');
    if (a[2] >= 2) tips.push('Если регулярного ритуала пока нет, начни с простого повторяемого порядка действий, без стремления к идеалу.');
    return tips.slice(0, 5);
  }

  function renderResult() {
    const ready = completeAnswers();
    $('#result-empty').hidden = ready;
    $('#result-content').hidden = !ready;
    if (!ready) return;
    const scenario = SCENARIOS[state.answers[6]];
    $('#scenario-title').textContent = scenario.name;
    $('#scenario-description').textContent = scenario.description;
    const tipsEl = $('#personal-tips');
    tipsEl.replaceChildren();
    personalisedTips().forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsEl.append(li);
    });
  }

  function getRitualRecord(date) {
    if (!state.rituals[date]) {
      state.rituals[date] = {
        morning: RITUAL_STEPS.morning.map(() => false),
        evening: RITUAL_STEPS.evening.map(() => false)
      };
    }
    return state.rituals[date];
  }

  function updateRitualCounts() {
    const rec = state.rituals[ritualDate];
    for (const part of ['morning', 'evening']) {
      const count = rec?.[part]?.filter(Boolean).length ?? 0;
      $(`#${part}-counter`).textContent = `Выполнено ${count} из ${RITUAL_STEPS[part].length} шагов`;
    }
  }

  function renderRitualPart(part) {
    const container = $(`#${part}-checks`);
    const record = state.rituals[ritualDate];
    container.replaceChildren();
    RITUAL_STEPS[part].forEach(([title, description], i) => {
      const label = document.createElement('label');
      label.className = 'ritual-check-label';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = record?.[part]?.[i] === true;
      checkbox.setAttribute('aria-label', `${part === 'morning' ? 'Утро' : 'Вечер'}: ${title}`);
      checkbox.addEventListener('change', () => {
        getRitualRecord(ritualDate)[part][i] = checkbox.checked;
        saveState();
        updateRitualCounts();
      });
      const texts = document.createElement('span');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = title;
      small.textContent = description;
      texts.append(strong, small);
      label.append(checkbox, texts);
      container.append(label);
    });
  }

  function renderRitual() {
    const dateInput = $('#ritual-date');
    dateInput.max = todayISO();
    dateInput.value = ritualDate;
    renderRitualPart('morning');
    renderRitualPart('evening');
    updateRitualCounts();
  }

  function selectRitualDate(value) {
    if (!isValidISO(value) || value > todayISO()) {
      $('#ritual-date').value = ritualDate;
      notify('Выбери настоящую дату не позднее сегодняшнего дня.');
      return;
    }
    ritualDate = value;
    renderRitual();
  }

  function ensureDiaryStarted() {
    if (!state.diaryStartDate) {
      state.diaryStartDate = todayISO();
      saveState();
    }
    const start = state.diaryStartDate;
    const end = plusDays(start, DIARY_DAYS - 1);
    const today = todayISO();
    const latest = today < end ? today : end;
    if (!selectedDiaryDate || !isValidISO(selectedDiaryDate) || selectedDiaryDate < start || selectedDiaryDate > latest) {
      selectedDiaryDate = latest < start ? start : latest;
    }
  }

  function diaryMoodCount() {
    return Object.values(state.diary).filter(entry => MOODS.includes(entry?.mood)).length;
  }

  function renderDiaryProgress() {
    const count = diaryMoodCount();
    $('#diary-completed').textContent = String(count);
    $('#diary-progress').setAttribute('aria-valuenow', String(count));
    $('#diary-progress-fill').style.width = `${count / DIARY_DAYS * 100}%`;
    $('#diary-period').textContent = `Период: ${prettyDate(state.diaryStartDate)} — ${prettyDate(plusDays(state.diaryStartDate, DIARY_DAYS - 1))}`;
  }

  function makeCalendarText(text, className) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  function renderDiaryCalendar() {
    const grid = $('#diary-calendar');
    grid.replaceChildren();
    WEEKDAYS.forEach(day => grid.append(makeCalendarText(day, 'calendar-weekday')));
    const offset = (dateFromISO(state.diaryStartDate).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
      const blank = makeCalendarText('', 'calendar-blank');
      blank.setAttribute('aria-hidden', 'true');
      grid.append(blank);
    }
    for (let i = 0; i < DIARY_DAYS; i++) {
      const date = plusDays(state.diaryStartDate, i);
      const d = dateFromISO(date);
      const isDone = MOODS.includes(state.diary[date]?.mood);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.disabled = date > todayISO();
      button.classList.toggle('is-done', isDone);
      button.classList.toggle('is-selected', date === selectedDiaryDate);
      button.classList.toggle('is-today', date === todayISO());
      button.setAttribute('aria-pressed', String(date === selectedDiaryDate));
      if (date === todayISO()) button.setAttribute('aria-current', 'date');
      button.setAttribute('aria-label', `День ${i + 1}, ${prettyDate(date)}. ${isDone ? 'Ощущение отмечено' : 'Без отметки'}.`);
      button.append(makeCalendarText(String(d.getDate()), 'day-number'), makeCalendarText(MONTHS_SHORT[d.getMonth()], 'day-month'));
      button.addEventListener('click', () => {
        selectedDiaryDate = date;
        renderDiaryCalendar();
        renderDiaryEntry();
      });
      grid.append(button);
    }
  }

  function renderDiaryEntry() {
    const date = selectedDiaryDate;
    const entry = state.diary[date] || { mood: null, note: '' };
    $('#diary-day-number').textContent = `ДЕНЬ ${daysBetween(state.diaryStartDate, date) + 1}`;
    $('#diary-selected-date').textContent = prettyDate(date, { weekday: 'long', day: 'numeric', month: 'long' });
    $$('input[name="diary-mood"]').forEach(input => { input.checked = input.value === entry.mood; });
    $('#diary-note').value = entry.note;
    $('#note-counter').textContent = `${entry.note.length} / ${NOTE_LIMIT}`;
    $('#diary-save-status').textContent = 'Изменения сохраняются на устройстве';
  }

  function renderDiary() {
    renderDiaryProgress();
    renderDiaryCalendar();
    renderDiaryEntry();
  }

  function updateDiary(mood, note, moodChanged = false) {
    if (!selectedDiaryDate || selectedDiaryDate > todayISO()) return;
    const current = state.diary[selectedDiaryDate] || { mood: null, note: '' };
    if (moodChanged) current.mood = MOODS.includes(mood) ? mood : null;
    else current.note = typeof note === 'string' ? note.slice(0, NOTE_LIMIT) : '';
    if (!current.mood && !current.note) delete state.diary[selectedDiaryDate];
    else state.diary[selectedDiaryDate] = current;
    const saved = saveState();
    $('#diary-save-status').textContent = saved ? 'Сохранено на устройстве' : 'Не удалось сохранить в браузере — экспортируй данные';
    renderDiaryProgress();
    renderDiaryCalendar();
  }

  function exportData() {
    try {
      const output = {
        app: 'МОЯ КОЖА PRO',
        exportedAt: new Date().toISOString(),
        ...state
      };
      const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `moya-kozha-pro-data-${todayISO()}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Файл JSON подготовлен для сохранения.');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      notify('Не удалось подготовить JSON. Проверь разрешения браузера.');
    }
  }

  function deleteAllData() {
    const confirmed = window.confirm('Удалить ВСЕ ответы анкеты, отметки ритуалов, дневник и выбранную тему в этом браузере? Это действие нельзя отменить.');
    if (!confirmed) return;
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Не удалось удалить данные:', error);
        notify('Не удалось удалить данные в браузере. Попробуй ещё раз.');
        return;
      }
    }
    state = emptyState();
    quizDraft = null;
    questionIndex = 0;
    ritualDate = todayISO();
    selectedDiaryDate = null;
    applyTheme();
    showScreen('home');
    notify(storageAvailable ? 'Данные удалены из этого браузера.' : 'Текущие записи очищены. Хранилище браузера недоступно.');
  }

  // События интерфейса: работают с клавиатуры благодаря обычным button, input и textarea.
  $$('[data-route]').forEach(button => {
    button.addEventListener('click', () => showScreen(button.dataset.route));
  });
  $$('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => {
      state.theme = button.dataset.themeChoice;
      applyTheme();
      saveState();
    });
  });
  $('#home-start').addEventListener('click', () => startQuiz(true));
  $('#result-start').addEventListener('click', () => startQuiz(true));
  $('#retake-quiz').addEventListener('click', () => startQuiz(true));
  $('#quiz-next').addEventListener('click', nextQuestion);
  $('#quiz-back').addEventListener('click', previousQuestion);
  $('#ritual-date').addEventListener('change', event => selectRitualDate(event.target.value));
  $('#ritual-today').addEventListener('click', () => selectRitualDate(todayISO()));
  $$('input[name="diary-mood"]').forEach(input => {
    input.addEventListener('change', () => updateDiary(input.value, undefined, true));
  });
  $('#diary-note').addEventListener('input', event => {
    const value = event.target.value.slice(0, NOTE_LIMIT);
    $('#note-counter').textContent = `${value.length} / ${NOTE_LIMIT}`;
    updateDiary(undefined, value, false);
  });
  $('#export-data').addEventListener('click', exportData);
  $('#delete-data').addEventListener('click', deleteAllData);

  applyTheme();
  renderHome();
})();
