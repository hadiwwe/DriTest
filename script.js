

let currentExam = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let bookmarkedQuestions = new Set();
let timerInterval = null;
let remainingSeconds = 1200;

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  renderHomeScreen();
});

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}

function renderHomeScreen() {
  const grid = document.getElementById('examGrid');
  grid.innerHTML = '';

  const exams = window.availableExams || [];
  exams.forEach(exam => {
    const savedResult = localStorage.getItem(`exam_result_${exam.id}`);
    let statusTag = `<span class="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2.5 py-1 rounded-full font-medium">شروع نشده</span>`;
    
    if (savedResult) {
      const res = JSON.parse(savedResult);
      if (res.passed) {
        statusTag = `<span class="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-200/50">قبول شده (${res.score}٪)</span>`;
      } else {
        statusTag = `<span class="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-bold border border-red-200/50">مردود (${res.score}٪)</span>`;
      }
    }

    const card = document.createElement('div');
    card.className = "bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition active:scale-[0.99] cursor-pointer space-y-3";
    card.onclick = () => startExam(exam.id);
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">${exam.title}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">${exam.description}</p>
        </div>
        ${statusTag}
      </div>
      <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <span class="flex items-center gap-1"><i data-lucide="help-circle" class="w-3.5 h-3.5"></i> ${exam.questions.length} سوال</span>
        <span class="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold">شروع آزمون <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i></span>
      </div>
    `;
    grid.appendChild(card);
  });
  lucide.createIcons();
}

function startExam(examId) {
  const exams = window.availableExams || [];
  currentExam = exams.find(e => e.id === examId);
  currentQuestionIndex = 0;
  userAnswers = {};
  bookmarkedQuestions.clear();
  remainingSeconds = 1200;

  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.remove('hidden');
  document.getElementById('quizFooter').classList.remove('hidden');
  document.getElementById('headerHomeBtn').classList.remove('hidden');

  startTimer();
  renderQuestion();
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerUI();
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerUI();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      confirmFinishExam();
    }
  }, 1000);
}

function updateTimerUI() {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  document.getElementById('timerText').textContent = 
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function renderQuestion() {
  const q = currentExam.questions[currentQuestionIndex];
  
  document.getElementById('currentQIndexLabel').textContent = (currentQuestionIndex + 1).toString();
  document.getElementById('qCategoryBadge').textContent = q.category;

  const isBookmarked = bookmarkedQuestions.has(q.id);
  const bBtn = document.getElementById('bookmarkBtn');
  const bBadge = document.getElementById('qSavedBadge');
  if (isBookmarked) {
    bBtn.classList.add('text-amber-500', 'border-amber-300', 'bg-amber-50');
    bBadge.classList.remove('hidden');
  } else {
    bBtn.classList.remove('text-amber-500', 'border-amber-300', 'bg-amber-50');
    bBadge.classList.add('hidden');
  }

  document.getElementById('qText').textContent = q.text;
  const imgContainer = document.getElementById('qImageContainer');
  const img = document.getElementById('qImage');
  if (q.image) {
    img.src = q.image;
    imgContainer.classList.remove('hidden');
  } else {
    imgContainer.classList.add('hidden');
  }

  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const isSelected = userAnswers[q.id] === idx;
    const btn = document.createElement('button');
    
    let classes = "w-full text-right p-3.5 rounded-2xl border transition flex items-start gap-3 active:scale-[0.98] ";
    if (isSelected) {
      classes += "border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold shadow-sm";
    } else {
      classes += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50";
    }
    btn.className = classes;
    btn.onclick = () => selectOption(q.id, idx);

    let optionContent = '';
    if (typeof opt === 'object' && opt.image) {
      optionContent = `
        <div class="flex-1 space-y-2">
          <span class="text-xs font-bold">${idx + 1}. ${opt.text || ''}</span>
          <img src="${opt.image}" class="max-h-24 rounded-lg object-contain border border-slate-200 dark:border-slate-700">
        </div>
      `;
    } else {
      optionContent = `<span class="text-sm font-medium leading-relaxed">${opt}</span>`;
    }

    btn.innerHTML = `
      <div class="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 mt-0.5 ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-400'}">
        ${idx + 1}
      </div>
      ${optionContent}
    `;
    optionsContainer.appendChild(btn);
  });

  renderPalette();
  updateNavButtons();
}

function selectOption(qId, optionIdx) {
  userAnswers[qId] = optionIdx;
  renderQuestion();
}

function toggleBookmarkCurrentQuestion() {
  const qId = currentExam.questions[currentQuestionIndex].id;
  if (bookmarkedQuestions.has(qId)) {
    bookmarkedQuestions.delete(qId);
  } else {
    bookmarkedQuestions.add(qId);
  }
  renderQuestion();
}

function renderPalette() {
  const pal = document.getElementById('qPalette');
  pal.innerHTML = '';
  currentExam.questions.forEach((q, idx) => {
    const dot = document.createElement('button');
    const isCurrent = idx === currentQuestionIndex;
    const isAnswered = userAnswers[q.id] !== undefined;

    let classes = "w-8 h-8 rounded-xl font-bold text-xs shrink-0 transition flex items-center justify-center ";
    if (isCurrent) {
      classes += "bg-brand-600 text-white ring-2 ring-brand-500/30 scale-105";
    } else if (isAnswered) {
      classes += "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40";
    } else {
      classes += "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700";
    }
    dot.className = classes;
    dot.textContent = (idx + 1).toString();
    dot.onclick = () => {
      currentQuestionIndex = idx;
      renderQuestion();
    };
    pal.appendChild(dot);
  });
}

function updateNavButtons() {
  document.getElementById('prevQBtn').disabled = currentQuestionIndex === 0;
  document.getElementById('prevQBtn').style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
}

function nextQuestion() {
  if (currentQuestionIndex < currentExam.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    finishExamPrompt();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

function confirmExitToHome() {
  if (confirm("آیا می‌خواهید از آزمون خارج شوید؟ پاسخ‌های شما ثبت نخواهد شد.")) {
    clearInterval(timerInterval);
    showHomeScreen();
  }
}

function finishExamPrompt() {
  const unanswered = currentExam.questions.length - Object.keys(userAnswers).length;
  const statusEl = document.getElementById('finishModalStatus');
  
  if (unanswered > 0) {
    statusEl.textContent = `توجه: شما ${unanswered} سوال را بدون پاسخ رها کرده‌اید!`;
    statusEl.className = "text-xs font-bold text-amber-600 dark:text-amber-400";
  } else {
    statusEl.textContent = "شما به تمامی سوالات پاسخ داده‌اید.";
    statusEl.className = "text-xs text-slate-500 dark:text-slate-400";
  }

  document.getElementById('finishModal').classList.remove('hidden');
}

function closeFinishModal() {
  document.getElementById('finishModal').classList.add('hidden');
}

function confirmFinishExam() {
  closeFinishModal();
  clearInterval(timerInterval);

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const categoryStatsMap = {};

  currentExam.questions.forEach(q => {
    const cat = q.category;
    if (!categoryStatsMap[cat]) {
      categoryStatsMap[cat] = { total: 0, correct: 0 };
    }
    categoryStatsMap[cat].total++;

    const userAns = userAnswers[q.id];
    if (userAns === undefined) {
      unansweredCount++;
    } else if (userAns === q.correct) {
      correctCount++;
      categoryStatsMap[cat].correct++;
    } else {
      wrongCount++;
    }
  });

  const total = currentExam.questions.length;
  const passed = correctCount >= 26;
  const scorePct = Math.round((correctCount / total) * 100);

  localStorage.setItem(`exam_result_${currentExam.id}`, JSON.stringify({
    passed,
    score: scorePct,
    correct: correctCount
  }));

  const banner = document.getElementById('resultBanner');
  const statusBadge = document.getElementById('resultStatusBadge');
  
  if (passed) {
    banner.className = "rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden space-y-3 bg-gradient-to-br from-emerald-600 to-teal-700";
    statusBadge.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-200"></i> قبول شده در آزمون`;
    document.getElementById('resultTitle').textContent = "تبریک! عملکرد شما عالی بود 🎉";
  } else {
    banner.className = "rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden space-y-3 bg-gradient-to-br from-red-600 to-rose-700";
    statusBadge.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-rose-200"></i> نیاز به تمرین بیشتر (مردود)`;
    document.getElementById('resultTitle').textContent = "متأسفانه حد نصاب قبولی کسب نشد ❌";
  }

  document.getElementById('scorePercentage').textContent = `${scorePct}٪`;
  document.getElementById('scoreTextSubtitle').textContent = `پاسخ صحیح: ${correctCount} از ${total} (حد نصاب: ۲۶)`;
  document.getElementById('resCorrectCount').textContent = correctCount;
  document.getElementById('resWrongCount').textContent = wrongCount;
  document.getElementById('resUnansweredCount').textContent = unansweredCount;

  const catContainer = document.getElementById('categoryStats');
  catContainer.innerHTML = '';
  Object.keys(categoryStatsMap).forEach(cat => {
    const item = categoryStatsMap[cat];
    const pct = Math.round((item.correct / item.total) * 100);
    
    const row = document.createElement('div');
    row.className = "space-y-1";
    row.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-700 dark:text-slate-300">${cat}</span>
        <span class="text-slate-500 font-mono">${item.correct}/${item.total} (${pct}٪)</span>
      </div>
      <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}" style="width: ${pct}%"></div>
      </div>
    `;
    catContainer.appendChild(row);
  });

  document.getElementById('quizScreen').classList.add('hidden');
  document.getElementById('quizFooter').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');

  filterReview('all');
  lucide.createIcons();
}

function filterReview(filterType) {
  ['All', 'Wrong', 'Bookmark'].forEach(t => {
    const tab = document.getElementById(`tabFilter${t}`);
    if (tab) tab.className = "flex-1 py-1.5 rounded-xl transition text-slate-500 font-medium";
  });
  const activeTab = document.getElementById(`tabFilter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
  if (activeTab) {
    activeTab.className = "flex-1 py-1.5 rounded-xl transition font-bold bg-white dark:bg-slate-800 shadow-sm text-brand-600 dark:text-brand-400";
  }

  const container = document.getElementById('reviewListContainer');
  container.innerHTML = '';

  currentExam.questions.forEach((q, idx) => {
    const userAns = userAnswers[q.id];
    const isCorrect = userAns === q.correct;
    const isWrong = userAns !== undefined && userAns !== q.correct;
    const isBookmarked = bookmarkedQuestions.has(q.id);

    if (filterType === 'wrong' && isCorrect) return;
    if (filterType === 'bookmarked' && !isBookmarked) return;

    const card = document.createElement('div');
    card.className = "p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3";
    
    let statusBadge = `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">بدون پاسخ</span>`;
    if (userAns !== undefined) {
      if (isCorrect) statusBadge = `<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">پاسخ صحیح</span>`;
      else statusBadge = `<span class="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold">پاسخ نادرست</span>`;
    }

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200">${idx + 1}. ${q.text}</h4>
        ${statusBadge}
      </div>

      ${q.image ? `<img src="${q.image}" class="max-h-28 rounded-lg object-contain bg-white dark:bg-slate-800 p-1 border">` : ''}

      <div class="space-y-1.5 text-xs pt-1">
        <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/40 flex items-center gap-1.5">
          <i data-lucide="check" class="w-3.5 h-3.5 shrink-0"></i>
          <span>پاسخ صحیح: <strong>${getOptionText(q.options[q.correct])}</strong></span>
        </div>

        ${isWrong ? `
          <div class="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200/40 flex items-center gap-1.5">
            <i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i>
            <span>پاسخ شما: <strong>${getOptionText(q.options[userAns])}</strong></span>
          </div>
        ` : ''}
      </div>

      ${q.explanation ? `
        <div class="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 text-[11px] leading-relaxed border border-blue-100 dark:border-blue-900/40 space-y-1">
          <span class="font-bold block flex items-center gap-1 text-brand-600 dark:text-brand-400">
            <i data-lucide="lightbulb" class="w-3.5 h-3.5"></i> تحلیل آموزشی:
          </span>
          <p>${q.explanation}</p>
        </div>
      ` : ''}
    `;

    container.appendChild(card);
  });

  lucide.createIcons();
}

function getOptionText(option) {
  if (typeof option === 'object') return option.text || "گزینه تصویری";
  return option;
}

function showHomeScreen() {
  document.getElementById('quizScreen').classList.add('hidden');
  document.getElementById('quizFooter').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('headerHomeBtn').classList.add('hidden');
  document.getElementById('homeScreen').classList.remove('hidden');
  renderHomeScreen();
}
