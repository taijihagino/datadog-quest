// ===== Datadog Quest - バトル =====

const Battle = {
  state: null, // 'normal' | 'boss' | null

  // コールバック (game.js から差し込み)
  onVictory: null,        // (enemyId) => void
  onDefeat: null,         // () => void
  onBossDefeated: null,   // (stats) => void  - stats: { correctCount, totalCount }
  onAnswered: null,       // ({ correct, questionId }) => void

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
    hpBar: null,
    hpText: null,
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
    this.ui.hpBar = document.getElementById('hp-bar-fill');
    this.ui.hpText = document.getElementById('battle-hp');
    this.ui.bossProgress = document.getElementById('boss-progress');
    this.ui.normalProgress = document.getElementById('normal-progress');
    this.ui.modal = document.getElementById('modal');
    this.ui.modalHeader = document.getElementById('modal-header');
    this.ui.modalBody = document.getElementById('modal-body');
    this.ui.modalOk = document.getElementById('modal-ok');

    this.ui.modalOk.addEventListener('click', () => this.handleModalOk());
  },

  // ====== 通常バトル ======
  startNormal(enemy, hero) {
    const def = ENEMY_TYPES[enemy.type];
    const question = QuestionBank.pickForEnemy(enemy.type, enemy.level);

    this.current = {
      mode: 'normal',
      enemy,
      enemyDef: def,
      question,
      hero,
      answered: false
    };

    this.ui.enemySprite.textContent = def.bigEmoji || def.emoji;
    this.ui.enemySprite.style.color = def.colorByLevel[enemy.level];
    this.ui.enemySprite.classList.remove('hit', 'defeated');
    this.ui.enemyName.textContent = def.name;
    this.ui.enemyLevel.textContent = LEVEL_LABEL[enemy.level];
    this.ui.enemyCategory.textContent = QuestionBank.categoryLabel(question.category);
    this.ui.enemyFlavor.textContent = `${def.name}(${LEVEL_LABEL[enemy.level]})があらわれた! ${def.flavor}`;
    this.ui.bossProgress.style.display = 'none';
    this.ui.normalProgress.style.display = 'inline';
    this.ui.normalProgress.textContent = '通常戦';

    this.renderQuestion(question);
    this.updateHpUi();
  },

  // ====== ボス戦 ======
  startBoss(hero) {
    const questions = QuestionBank.pickForBoss();
    this.current = {
      mode: 'boss',
      questions,
      qIndex: 0,
      hero,
      answered: false,
      correctCount: 0
    };

    this.ui.enemySprite.textContent = BOSS_SPRITE.bigEmoji;
    this.ui.enemySprite.style.color = '#fff';
    this.ui.enemySprite.classList.remove('hit', 'defeated');
    this.ui.enemyName.textContent = BOSS_SPRITE.name;
    this.ui.enemyLevel.textContent = 'BOSS';
    this.ui.enemyCategory.textContent = '高度な問題';
    this.ui.enemyFlavor.textContent = `${BOSS_SPRITE.name}が立ちはだかる! ${BOSS_SPRITE.flavor}`;
    this.ui.bossProgress.style.display = 'inline';
    this.ui.normalProgress.style.display = 'none';

    this.advanceBoss();
    this.updateHpUi();
  },

  advanceBoss() {
    const ctx = this.current;
    if (ctx.qIndex >= ctx.questions.length) {
      // 全問終了
      this.showModal({
        kind: 'win',
        title: '魔王ワン公を倒した!',
        body: `見事に全${ctx.questions.length}問のうち${ctx.correctCount}問に正解!\nDatadog王国に光が戻った...`,
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

    if (correct) {
      this.handleCorrect(q);
    } else {
      this.handleWrong(q);
    }
  },

  handleCorrect(q) {
    this.ui.enemySprite.classList.add('hit');
    setTimeout(() => this.ui.enemySprite.classList.remove('hit'), 400);

    if (this.current.mode === 'boss') {
      this.current.correctCount++;
      this.showModal({
        kind: 'correct',
        title: 'こうげき せいこう!',
        body: `せいかい!\n\n【解説】\n${q.explanation}`,
        onOk: () => {
          this.current.qIndex++;
          this.advanceBoss();
        }
      });
    } else {
      this.showModal({
        kind: 'correct',
        title: 'てきを たおした!',
        body: `せいかい!\n\n【解説】\n${q.explanation}\n\n${this.current.enemyDef.name}は しずかに しずんでいった...`,
        onOk: () => {
          this.ui.enemySprite.classList.add('defeated');
          setTimeout(() => {
            if (this.onVictory) this.onVictory(this.current.enemy.id);
          }, 600);
        }
      });
    }
  },

  handleWrong(q) {
    this.current.hero.hp = Math.max(0, this.current.hero.hp - 1);
    this.updateHpUi();

    if (this.current.hero.hp <= 0) {
      this.showModal({
        kind: 'wrong',
        title: 'ゆうしゃ たおれる...',
        body: `ふせいかい!\n正解は: ${this.current.mode === 'boss'
          ? this.current.questions[this.current.qIndex].choices[q.answer]
          : q.choices[q.answer]}\n\n【解説】\n${q.explanation}\n\nHPが0になった...`,
        onOk: () => {
          if (this.onDefeat) this.onDefeat();
        }
      });
      return;
    }

    if (this.current.mode === 'boss') {
      this.showModal({
        kind: 'wrong',
        title: 'ボスの こうげき!',
        body: `ふせいかい!\n正解は: ${q.choices[q.answer]}\n\n【解説】\n${q.explanation}\n\nHP -1`,
        onOk: () => {
          this.current.qIndex++;
          this.advanceBoss();
        }
      });
    } else {
      this.showModal({
        kind: 'wrong',
        title: 'てきの こうげき!',
        body: `ふせいかい!\n正解は: ${q.choices[q.answer]}\n\n【解説】\n${q.explanation}\n\n敵は反撃した! HP -1`,
        onOk: () => {
          // 通常戦は1問しかないので、敗北扱いで脱出
          if (this.onDefeat) this.onDefeat({ retreat: true });
        }
      });
    }
  },

  updateHpUi() {
    const hp = this.current.hero.hp;
    const max = this.current.hero.maxHp;
    const pct = Math.max(0, (hp / max) * 100);
    this.ui.hpBar.style.width = `${pct}%`;
    if (pct <= 30) this.ui.hpBar.classList.add('low');
    else this.ui.hpBar.classList.remove('low');
    this.ui.hpText.textContent = `${hp}/${max}`;
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
