// ===== Datadog Quest - メインゲームロジック =====

const Game = {
  screen: 'title',
  initialized: false,

  // プレイヤー & 統計
  playerName: '',
  startTimeMs: 0,
  totalAnswered: 0,
  correctAnswered: 0,
  rankingSubmittedId: null,

  _timerInterval: null,

  async init() {
    I18n.init();
    SaveSystem.init();
    FieldMap.init();
    Battle.init();
    I18n.onChange(() => this.applyI18n());
    try {
      await QuestionBank.load();
    } catch (e) {
      alert('問題データの読み込みに失敗しました: ' + e.message);
      return;
    }

    Battle.onVictory = (enemyId, info) => this.handleEnemyDefeated(enemyId, info);
    Battle.onBossDefeated = (stats) => this.showEnding(stats);
    Battle.onAnswered = ({ correct }) => this.recordAnswer(correct);
    Battle.getStats = () => ({
      correct: this.correctAnswered,
      total: this.totalAnswered,
      mistakes: Math.max(0, this.totalAnswered - this.correctAnswered)
    });

    this.bindButtons();
    this.bindKeyboard();
    this.bindNameModal();
    this.bindRankingModal();
    this.bindIntro();
    this.bindLangToggle();
    this.applyI18n();

    const hasSave = await SaveSystem.hasSave();
    document.getElementById('continue-btn').disabled = !hasSave;
    document.getElementById('reset-btn').disabled = !hasSave;

    this.showScreen('title');
    this.initialized = true;
  },

  bindButtons() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        this.handleAction(action);
      });
    });
  },

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // 名前入力中はキーボード移動を無効化
      if (!document.getElementById('name-modal').classList.contains('hidden')) return;
      if (!document.getElementById('ranking-modal').classList.contains('hidden')) return;
      if (this.screen !== 'field') return;
      if (!document.getElementById('modal').classList.contains('hidden')) return;

      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dy = -1; break;
        case 'ArrowDown': case 's': case 'S': dy = 1; break;
        case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
        case 'ArrowRight': case 'd': case 'D': dx = 1; break;
        default: return;
      }
      e.preventDefault();
      this.attemptMove(dx, dy);
    });
  },

  bindNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('name-input');
    document.getElementById('name-ok').addEventListener('click', () => {
      const name = (input.value || '').trim().slice(0, 16) || I18n.t('default_name');
      modal.classList.add('hidden');
      this.startNewGameWithName(name);
    });
    document.getElementById('name-cancel').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('name-ok').click();
    });
  },

  bindRankingModal() {
    document.getElementById('ranking-close').addEventListener('click', () => {
      document.getElementById('ranking-modal').classList.add('hidden');
    });
  },

  bindLangToggle() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        I18n.set(lang);
      });
    });
  },

  // data-i18n属性を持つ要素にI18nの文字列を適用
  applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const txt = I18n.t(key);
      if (txt && txt !== key) el.textContent = txt;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const txt = I18n.t(key);
      if (txt && txt !== key) el.innerHTML = txt;
    });
    // 言語ボタンのactive状態
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const l = btn.getAttribute('data-lang');
      btn.classList.toggle('active', l === I18n.lang);
    });
    // モーダル/フィールド等、JSが直接textを書いた箇所も更新
    if (this.screen === 'field') {
      this.updateHud();
      this.setFieldMessage(I18n.t('field_default'));
    }
    // 名前入力モーダル(JSで開かれた時はtextが上書きされるので、HTML側はdata-i18n依存)
    const nameTitleEl = document.querySelector('#name-modal .modal-header');
    if (nameTitleEl) nameTitleEl.textContent = I18n.t('name_title');
    const nameQEl = document.querySelector('#name-modal .modal-body p');
    if (nameQEl) nameQEl.textContent = I18n.t('name_q');
    const nameInput = document.getElementById('name-input');
    if (nameInput) nameInput.placeholder = I18n.t('name_placeholder');
    const nameNote = document.querySelector('#name-modal .modal-body p:last-of-type');
    if (nameNote && nameNote !== nameQEl) nameNote.textContent = I18n.t('name_note');
    const nameOk = document.getElementById('name-ok');
    if (nameOk) nameOk.textContent = I18n.t('name_ok');
    const nameCancel = document.getElementById('name-cancel');
    if (nameCancel) nameCancel.textContent = I18n.t('name_cancel');
    // ランキングモーダル
    const rankH = document.querySelector('#ranking-modal .modal-header');
    if (rankH) rankH.textContent = I18n.t('ranking_title');
    const rankHelp = document.querySelector('#ranking-modal .ranking-help');
    if (rankHelp) rankHelp.textContent = I18n.t('ranking_help');
    const rankClose = document.getElementById('ranking-close');
    if (rankClose) rankClose.textContent = I18n.t('ranking_close');
    // ゲームオーバー(画面要素として残しているもの)
    const goTitle = document.querySelector('#screen-gameover .ending-title');
    if (goTitle) goTitle.textContent = I18n.t('gameover_title');
    const goText = document.querySelector('#screen-gameover .ending-text');
    if (goText) goText.innerHTML = I18n.t('gameover_text');
    // ヘッダラベル(モーダル等)
    document.title = I18n.lang === 'ja' ? 'Datadog Quest' : 'Datadog Quest';
  },

  _introTimer: null,
  _introFullText: '',

  bindIntro() {
    document.getElementById('intro-skip').addEventListener('click', () => this.finishIntroTyping());
    document.getElementById('intro-next').addEventListener('click', () => this.startAdventureAfterIntro());
  },

  showIntro() {
    const name = this.playerName || (I18n.lang === 'en' ? 'Hero' : 'ゆうしゃ');
    const text = I18n.t('intro_text', name);

    this.showScreen('intro');
    this._introFullText = text;
    const el = document.getElementById('intro-text');
    el.textContent = '';
    document.getElementById('intro-next').style.display = 'none';
    document.getElementById('intro-skip').style.display = '';

    // タイピング演出
    let i = 0;
    if (this._introTimer) clearInterval(this._introTimer);
    this._introTimer = setInterval(() => {
      if (i >= text.length) {
        this.finishIntroTyping();
        return;
      }
      el.textContent = text.slice(0, i + 1);
      i++;
    }, 30);
  },

  finishIntroTyping() {
    if (this._introTimer) {
      clearInterval(this._introTimer);
      this._introTimer = null;
    }
    document.getElementById('intro-text').textContent = this._introFullText;
    document.getElementById('intro-skip').style.display = 'none';
    document.getElementById('intro-next').style.display = '';
  },

  startAdventureAfterIntro() {
    this.startTimeMs = Date.now();
    this.enterField();
    this.setFieldMessage(I18n.t('field_start', { name: this.playerName }));
  },

  async handleAction(action) {
    switch (action) {
      case 'new-game':
        this.openNameModal();
        break;
      case 'continue':
        await this.continueGame();
        break;
      case 'reset':
        if (confirm(I18n.t('confirm_reset'))) {
          await SaveSystem.clear();
          document.getElementById('continue-btn').disabled = true;
          document.getElementById('reset-btn').disabled = true;
        }
        break;
      case 'show-ranking':
        await this.openRankingModal();
        break;
      case 'save':
        await this.saveNow();
        break;
      case 'back-title':
        this.stopTimer();
        this.showScreen('title');
        SaveSystem.hasSave().then(has => {
          document.getElementById('continue-btn').disabled = !has;
          document.getElementById('reset-btn').disabled = !has;
        });
        break;
      case 'retry':
        this.openNameModal();
        break;
    }
  },

  openNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('name-input');
    // 直前にプレイした名前を初期値として保持
    input.value = this.playerName || localStorage.getItem('datadog_quest_last_name') || '';
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
  },

  async startNewGameWithName(name) {
    this.playerName = name || I18n.t('default_name');
    localStorage.setItem('datadog_quest_last_name', name);

    this.startTimeMs = 0; // フィールド表示後にセット
    this.totalAnswered = 0;
    this.correctAnswered = 0;
    this.rankingSubmittedId = null;

    FieldMap.reset();
    QuestionBank.reset();
    await SaveSystem.clear();
    this.showIntro();
  },

  async continueGame() {
    const data = await SaveSystem.load();
    if (!data) {
      alert(I18n.t('no_save'));
      return;
    }
    this.playerName = data.playerName || I18n.t('default_name');
    this.startTimeMs = data.startTimeMs || Date.now();
    this.totalAnswered = data.totalAnswered || 0;
    this.correctAnswered = data.correctAnswered || 0;
    this.rankingSubmittedId = data.rankingSubmittedId || null;

    FieldMap.restoreState(data.field);
    QuestionBank.restoreAsked(data.asked || []);
    this.enterField();
    this.setFieldMessage(I18n.t('field_continue', { name: this.playerName }));
  },

  enterField() {
    this.showScreen('field');
    FieldMap.render();
    this.updateHud();
    this.startTimer();
  },

  startTimer() {
    this.stopTimer();
    this._timerInterval = setInterval(() => this.updateTimeHud(), 1000);
    this.updateTimeHud();
  },

  stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  elapsedSec() {
    if (!this.startTimeMs) return 0;
    return Math.floor((Date.now() - this.startTimeMs) / 1000);
  },

  updateTimeHud() {
    const el = document.getElementById('hud-time');
    if (el) el.textContent = formatTime(this.elapsedSec());
  },

  async attemptMove(dx, dy) {
    const result = FieldMap.tryMove(dx, dy);

    if (result.entered === 'enemy') {
      this.startBattle(result.target);
      return;
    }
    if (result.entered === 'castle') {
      this.setFieldMessage(I18n.t('field_castle_enter'));
      FieldMap.render();
      this.updateHud();
      setTimeout(() => this.startBoss(), 800);
      return;
    }
    if (result.reason === 'castle_locked') {
      this.setFieldMessage(I18n.t('field_castle_locked', { n: 12 - FieldMap.defeatedCount() }));
      return;
    }
    if (result.reason === 'block') {
      this.setFieldMessage(I18n.t('field_block'));
      FieldMap.render();
      return;
    }
    if (result.reason === 'out') {
      return;
    }

    FieldMap.render();
    this.setFieldMessage(I18n.t('field_walking'));
  },

  startBattle(enemy) {
    this.showScreen('battle');
    Battle.startNormal(enemy);
  },

  startBoss() {
    this.showScreen('battle');
    Battle.startBoss();
  },

  recordAnswer(correct) {
    this.totalAnswered++;
    if (correct) this.correctAnswered++;
  },

  async handleEnemyDefeated(enemyId, info = {}) {
    FieldMap.markEnemyDefeated(enemyId);
    this.showScreen('field');
    FieldMap.render();
    this.updateHud();
    const remain = 12 - FieldMap.defeatedCount();
    const mistakes = this.totalAnswered - this.correctAnswered;
    const key = info.correct ? 'field_defeat_correct' : 'field_defeat_wrong';
    this.setFieldMessage(I18n.t(key, { n: remain, m: mistakes }));
    await this.autoSave();

    if (FieldMap.allEnemiesDefeated()) {
      this.setFieldMessage(I18n.t('field_all_defeated'));
    }
  },

  async saveNow() {
    await this.autoSave();
    this.setFieldMessage(I18n.t('field_save_done'));
  },

  async autoSave() {
    const state = {
      playerName: this.playerName,
      startTimeMs: this.startTimeMs,
      totalAnswered: this.totalAnswered,
      correctAnswered: this.correctAnswered,
      rankingSubmittedId: this.rankingSubmittedId,
      field: FieldMap.exportState(),
      asked: QuestionBank.getAskedIds()
    };
    await SaveSystem.save(state);
  },

  setFieldMessage(msg) {
    const el = document.getElementById('field-message');
    if (el) el.innerHTML = `<p>${escapeHtml(msg)}</p>`;
  },

  updateHud() {
    document.getElementById('hero-name').textContent = this.playerName || '-';
    const mistakes = Math.max(0, this.totalAnswered - this.correctAnswered);
    const acc = this.totalAnswered > 0 ? Math.round((this.correctAnswered / this.totalAnswered) * 100) : 100;
    const hudMis = document.getElementById('hud-mistakes');
    if (hudMis) hudMis.textContent = `${mistakes} (${acc}%)`;
    document.getElementById('hud-defeated').textContent = FieldMap.defeatedCount();
    this.updateTimeHud();
  },

  showScreen(name) {
    this.screen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
  },

  async showEnding(bossStats) {
    this.stopTimer();
    FieldMap.bossDefeated = true;

    // ボスの正解数を統計には含めず、ランキング登録時に合算
    // (recordAnswerでBattle.onAnsweredが呼ばれるので含まれている想定)
    const totalSec = this.elapsedSec();
    const total = this.totalAnswered;
    const correct = this.correctAnswered;
    const accuracy = total > 0 ? (correct / total) : 0;
    const score = Math.round(accuracy * 10000 - totalSec);

    // ランキング登録(セーブで多重登録を抑止)
    if (!this.rankingSubmittedId) {
      const entry = await SaveSystem.submitRanking({
        playerName: this.playerName,
        timeSec: totalSec,
        correctCount: correct,
        totalCount: total
      });
      if (entry) this.rankingSubmittedId = entry.id;
    }
    await this.autoSave();

    const defeated = FieldMap.defeatedCount();
    const safeName = escapeHtml(this.playerName);
    const rescueEl = document.getElementById('rescue-scene');
    if (rescueEl) {
      rescueEl.innerHTML =
        `<span class="narrator">${I18n.t('ending_rescue_intro')}</span>\n\n` +
        `${I18n.t('ending_rescue_appear')}\n\n` +
        `<span class="bits-line">${I18n.t('ending_bits_line', safeName)}</span>\n\n` +
        `<span class="narrator">${I18n.t('ending_rescue_outro')}</span>`;
    }

    document.getElementById('ending-text').innerHTML = I18n.t('ending_text', safeName);

    document.getElementById('ending-stats').innerHTML =
      `<div>${I18n.t('ending_stat_time')}: <strong>${formatTime(totalSec)}</strong></div>` +
      `<div>${I18n.t('ending_stat_defeated')}: ${defeated} / 12 + BOSS</div>` +
      `<div>${I18n.t('ending_stat_correct')}: ${correct} / ${total} (${I18n.t('ending_stat_acc')} ${Math.round(accuracy * 100)}%)</div>` +
      `<div>${I18n.t('ending_stat_mistakes')}: ${total - correct}</div>` +
      `<div>${I18n.t('ending_stat_score')}: <strong>${score}</strong></div>`;
    const endingRankTitle = document.querySelector('.ending-ranking-title');
    if (endingRankTitle) endingRankTitle.textContent = I18n.t('ending_ranking_title');
    const endingBack = document.querySelector('#screen-ending [data-action="back-title"]');
    if (endingBack) endingBack.textContent = I18n.t('ending_back');
    const endingTitleEl = document.querySelector('#screen-ending .ending-title');
    if (endingTitleEl) endingTitleEl.textContent = I18n.t('ending_title');

    await this.renderRankingList('ending-ranking-list', { highlightId: this.rankingSubmittedId, limit: 10 });

    this.showScreen('ending');
  },

  async openRankingModal() {
    document.getElementById('ranking-modal').classList.remove('hidden');
    await this.renderRankingList('ranking-list', { highlightId: this.rankingSubmittedId, limit: 20 });
  },

  async renderRankingList(elementId, { highlightId, limit } = {}) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `<p style="text-align:center;padding:20px;">${I18n.t('ranking_loading')}</p>`;
    const entries = await SaveSystem.getRanking(limit || 20);
    if (entries.length === 0) {
      el.innerHTML = `<div class="ranking-empty">${I18n.t('ranking_empty')}</div>`;
      return;
    }
    const rows = [];
    rows.push(
      `<div class="ranking-row header">` +
        `<span class="rank-rank">${I18n.t('ranking_col_rank')}</span>` +
        `<span class="rank-name">${I18n.t('ranking_col_name')}</span>` +
        `<span class="rank-score">${I18n.t('ranking_col_score')}</span>` +
        `<span class="rank-time">${I18n.t('ranking_col_time')}</span>` +
        `<span class="rank-acc">${I18n.t('ranking_col_acc')}</span>` +
      `</div>`
    );
    entries.forEach((e, i) => {
      const isSelf = highlightId && e.id === highlightId;
      const accPct = Math.round((e.accuracy || 0) * 100);
      rows.push(
        `<div class="ranking-row${isSelf ? ' self' : ''}">` +
          `<span class="rank-rank">${i + 1}</span>` +
          `<span class="rank-name">${escapeHtml(e.playerName || '?')}</span>` +
          `<span class="rank-score">${e.score}</span>` +
          `<span class="rank-time">${formatTime(e.timeSec || 0)}</span>` +
          `<span class="rank-acc">${accPct}%</span>` +
        `</div>`
      );
    });
    el.innerHTML = rows.join('');
  }
};

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
