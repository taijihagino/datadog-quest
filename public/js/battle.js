// ===== Datadog Quest - バトル =====

const Battle = {
  state: null, // 'normal' | 'boss' | null

  // コールバック (game.js から差し込み)
  onVictory: null,        // (enemyId, { correct }) => void  ※誤答でも撃破扱いで呼ばれる
  onBossDefeated: null,   // (stats) => void  - stats: { correctCount, totalCount }
  onAnswered: null,       // ({ correct, questionId }) => void
  // 現在のセッション統計を返す関数 (game.jsからセット)
  getStats: null,         // () => { correct, total, mistakes }

  current: null, // 現在のバトルコンテキスト
  ui: {
    screen: null,
    enemySprite: null,
    enemyName: null,
    enemyLevel: null,
    enemyCategory: null,
    enemyFlavor: null,
    questionText: null,
    choicesEl: null,
    statCorrect: null,
    statMistakes: null,
    bossProgress: null,
    normalProgress: null,
    modal: null,
    modalHeader: null,
    modalBody: null,
    modalOk: null
  },

  init() {
    this.ui.screen = document.getElementById('screen-battle');
    this.ui.enemySprite = document.getElementById('enemy-sprite');
    this.ui.enemyName = document.getElementById('enemy-name');
    this.ui.enemyLevel = document.getElementById('enemy-level');
    this.ui.enemyCategory = document.getElementById('enemy-category');
    this.ui.enemyFlavor = document.getElementById('enemy-flavor');
    this.ui.questionText = document.getElementById('question-text');
    this.ui.choicesEl = document.getElementById('choices');
    this.ui.statCorrect = document.getElementById('battle-correct');
    this.ui.statMistakes = document.getElementById('battle-mistakes');
    this.ui.bossProgress = document.getElementById('boss-progress');
    this.ui.normalProgress = document.getElementById('normal-progress');
    this.ui.modal = document.getElementById('modal');
    this.ui.modalHeader = document.getElementById('modal-header');
    this.ui.modalBody = document.getElementById('modal-body');
    this.ui.modalOk = document.getElementById('modal-ok');

    this.ui.modalOk.addEventListener('click', () => this.handleModalOk());
    this.ui.modalOk.textContent = I18n.t('modal_next');
  },

  enemyName(typeKey) {
    return I18n.t('enemy_' + typeKey) || ENEMY_TYPES[typeKey].name;
  },
  enemyFlavor(typeKey) {
    return I18n.t('flavor_' + typeKey) || ENEMY_TYPES[typeKey].flavor;
  },

  // ====== 通常バトル ======
  startNormal(enemy) {
    const def = ENEMY_TYPES[enemy.type];
    const question = QuestionBank.pickForEnemy(enemy.type, enemy.level);

    this.current = {
      mode: 'normal',
      enemy,
      enemyDef: def,
      question,
      answered: false
    };

    const eName = this.enemyName(enemy.type);
    const eFlavor = this.enemyFlavor(enemy.type);
    this.ui.enemySprite.textContent = def.bigEmoji || def.emoji;
    this.ui.enemySprite.style.color = def.colorByLevel[enemy.level];
    this.ui.enemySprite.classList.remove('hit', 'defeated');
    this.ui.enemyName.textContent = eName;
    this.ui.enemyLevel.textContent = LEVEL_LABEL[enemy.level];
    this.ui.enemyCategory.textContent = I18n.t('cat_' + question.category) || QuestionBank.categoryLabel(question.category);
    this.ui.enemyFlavor.textContent = I18n.t('battle_appeared', { name: eName, lv: LEVEL_LABEL[enemy.level], flavor: eFlavor });
    this.ui.bossProgress.style.display = 'none';
    this.ui.normalProgress.style.display = 'inline';
    this.ui.normalProgress.textContent = I18n.t('battle_mode_normal');

    this.renderQuestion(question);
    this.updateStatsUi();
  },

  // ====== ボス戦 ======
  startBoss() {
    const questions = QuestionBank.pickForBoss();
    this.current = {
      mode: 'boss',
      questions,
      qIndex: 0,
      answered: false,
      correctCount: 0
    };

    const bName = I18n.t('boss_name');
    const bFlavor = I18n.t('boss_flavor');
    this.ui.enemySprite.textContent = BOSS_SPRITE.bigEmoji;
    this.ui.enemySprite.style.color = '#fff';
    this.ui.enemySprite.classList.remove('hit', 'defeated');
    this.ui.enemyName.textContent = bName;
    this.ui.enemyLevel.textContent = I18n.t('boss_progress');
    this.ui.enemyCategory.textContent = I18n.t('boss_category');
    this.ui.enemyFlavor.textContent = I18n.t('battle_boss_appeared', { name: bName, flavor: bFlavor });
    this.ui.bossProgress.style.display = 'inline';
    this.ui.normalProgress.style.display = 'none';

    this.advanceBoss();
    this.updateStatsUi();
  },

  advanceBoss() {
    const ctx = this.current;
    if (ctx.qIndex >= ctx.questions.length) {
      // 全問終了
      // ボス撃破ファンファーレ!
      SoundFX.bossDefeat();
      this.showModal({
        kind: 'win',
        title: I18n.t('modal_boss_clear_title'),
        body: I18n.t('modal_boss_clear_body', { total: ctx.questions.length, correct: ctx.correctCount }),
        onOk: () => {
          this.ui.enemySprite.classList.add('defeated');
          setTimeout(() => {
            if (this.onBossDefeated) this.onBossDefeated({ correctCount: ctx.correctCount, totalCount: ctx.questions.length });
          }, 600);
        }
      });
      return;
    }
    this.ui.bossProgress.textContent = `${ctx.qIndex + 1}/${ctx.questions.length}`;
    const q = ctx.questions[ctx.qIndex];
    this.renderQuestion(q);
  },

  renderQuestion(q) {
    this.current.answered = false;
    this.ui.questionText.textContent = q.question;
    this.ui.choicesEl.innerHTML = '';
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-num">${idx + 1}.</span><span>${escapeHtml(choice)}</span>`;
      btn.addEventListener('click', () => this.selectChoice(idx));
      this.ui.choicesEl.appendChild(btn);
    });
  },

  selectChoice(idx) {
    if (!this.current || this.current.answered) return;
    this.current.answered = true;

    const q = this.current.mode === 'boss'
      ? this.current.questions[this.current.qIndex]
      : this.current.question;

    const correct = idx === q.answer;
    const buttons = Array.from(this.ui.choicesEl.querySelectorAll('.choice-btn'));
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      else if (i === idx) b.classList.add('wrong');
    });

    if (typeof this.onAnswered === 'function') {
      this.onAnswered({ correct, questionId: q.id });
    }
    this.updateStatsUi();

    // 解答した瞬間に「攻撃」SE
    SoundFX.attack();

    if (correct) {
      this.handleCorrect(q);
    } else {
      this.handleWrong(q);
    }
  },

  handleCorrect(q) {
    this.ui.enemySprite.classList.add('hit');
    setTimeout(() => this.ui.enemySprite.classList.remove('hit'), 400);
    // 攻撃SEから少し遅らせて幸せな正解SE
    setTimeout(() => SoundFX.correct(), 220);

    if (this.current.mode === 'boss') {
      this.current.correctCount++;
      this.showModal({
        kind: 'correct',
        title: I18n.t('modal_boss_correct_title'),
        body: I18n.t('modal_boss_correct_body', { ex: q.explanation }),
        onOk: () => {
          this.current.qIndex++;
          this.advanceBoss();
        }
      });
    } else {
      const eName = this.enemyName(this.current.enemy.type);
      this.showModal({
        kind: 'correct',
        title: I18n.t('modal_correct_title'),
        body: I18n.t('modal_correct_body', { ex: q.explanation, name: eName }),
        onOk: () => {
          this.ui.enemySprite.classList.add('defeated');
          setTimeout(() => {
            if (this.onVictory) this.onVictory(this.current.enemy.id, { correct: true });
          }, 600);
        }
      });
    }
  },

  handleWrong(q) {
    // 攻撃SEから少し遅らせて「走って逃げる足音」
    setTimeout(() => SoundFX.wrong(), 220);

    if (this.current.mode === 'boss') {
      this.showModal({
        kind: 'wrong',
        title: I18n.t('modal_boss_wrong_title'),
        body: I18n.t('modal_boss_wrong_body', { ans: q.choices[q.answer], ex: q.explanation }),
        onOk: () => {
          this.current.qIndex++;
          this.advanceBoss();
        }
      });
    } else {
      const eName = this.enemyName(this.current.enemy.type);
      this.showModal({
        kind: 'wrong',
        title: I18n.t('modal_wrong_title'),
        body: I18n.t('modal_wrong_body', { ans: q.choices[q.answer], ex: q.explanation, name: eName }),
        onOk: () => {
          this.ui.enemySprite.classList.add('defeated');
          setTimeout(() => {
            if (this.onVictory) this.onVictory(this.current.enemy.id, { correct: false });
          }, 600);
        }
      });
    }
  },

  updateStatsUi() {
    if (!this.ui.statCorrect || !this.ui.statMistakes) return;
    const stats = (typeof this.getStats === 'function') ? this.getStats() : { correct: 0, total: 0, mistakes: 0 };
    this.ui.statCorrect.textContent = `${stats.correct}/${stats.total}`;
    this.ui.statMistakes.textContent = `${stats.mistakes}`;
  },

  showModal({ kind, title, body, onOk }) {
    this.ui.modal.classList.remove('hidden');
    this.ui.modalHeader.textContent = title;
    this.ui.modalHeader.className = 'modal-header ' + (kind === 'correct' ? 'correct' : (kind === 'wrong' ? 'wrong' : ''));
    this.ui.modalBody.textContent = body;
    this._modalOnOk = onOk;
  },

  handleModalOk() {
    this.ui.modal.classList.add('hidden');
    const fn = this._modalOnOk;
    this._modalOnOk = null;
    if (typeof fn === 'function') fn();
  }
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
