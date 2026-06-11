// ===== Datadog Quest - メインゲームロジック =====

const Game = {
  hero: { hp: 10, maxHp: 10 },
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
    SaveSystem.init();
    FieldMap.init();
    Battle.init();
    try {
      await QuestionBank.load();
    } catch (e) {
      alert('問題データの読み込みに失敗しました: ' + e.message);
      return;
    }

    Battle.onVictory = (enemyId) => this.handleEnemyDefeated(enemyId);
    Battle.onDefeat = ({ retreat } = {}) => this.showGameOver();
    Battle.onBossDefeated = (stats) => this.showEnding(stats);
    Battle.onAnswered = ({ correct }) => this.recordAnswer(correct);

    this.bindButtons();
    this.bindKeyboard();
    this.bindNameModal();
    this.bindRankingModal();
    this.bindIntro();

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
      const name = (input.value || '').trim().slice(0, 16) || 'ななしのゆうしゃ';
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

  _introTimer: null,
  _introFullText: '',

  bindIntro() {
    document.getElementById('intro-skip').addEventListener('click', () => this.finishIntroTyping());
    document.getElementById('intro-next').addEventListener('click', () => this.startAdventureAfterIntro());
  },

  showIntro() {
    const name = this.playerName || 'ゆうしゃ';
    const text =
      `むかしむかし、Datadog王国には\n` +
      `「Bits」と呼ばれる ちいさな ようせいが いた。\n` +
      `Bitsは王国に メトリクスと トレースの 光を ともし、\n` +
      `人々の くらしを まもっていた。\n\n` +
      `しかし ある日―――\n\n` +
      `Bitsを 名乗る にせもの 『DARK BITS』 が\n` +
      `王の城に あらわれ、王国を のっとった。\n` +
      `観測の光は うばわれ、王国に 闇が ひろがった。\n\n` +
      `そんなとき、勇者 「${name}」 が 立ちあがった。\n` +
      `「私が DARK BITS を たおし、世界に 平和を とりもどす!」\n\n` +
      `さあ ${name} よ、 つるぎ を にぎりしめ、\n` +
      `Datadog王国を 旅して、 12の 試練を のりこえよ。\n` +
      `その先に まちうける DARK BITS との 決戦こそ、\n` +
      `観測可能性(オブザーバビリティ)の 光を とりもどす かぎだ!`;

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
    // フィールド表示の瞬間からプレイ時間計測開始
    this.startTimeMs = Date.now();
    this.enterField();
    this.setFieldMessage(`${this.playerName} の冒険がはじまった! 全12の試練のあと、王城でDARK BITSが待つ!`);
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
        if (confirm('セーブデータを削除します。よろしいですか?')) {
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
    this.playerName = name;
    localStorage.setItem('datadog_quest_last_name', name);

    this.hero = { hp: 10, maxHp: 10 };
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
      alert('セーブデータが見つかりません');
      return;
    }
    this.playerName = data.playerName || 'ななしのゆうしゃ';
    this.hero = data.hero || { hp: 10, maxHp: 10 };
    this.startTimeMs = data.startTimeMs || Date.now();
    this.totalAnswered = data.totalAnswered || 0;
    this.correctAnswered = data.correctAnswered || 0;
    this.rankingSubmittedId = data.rankingSubmittedId || null;

    FieldMap.restoreState(data.field);
    QuestionBank.restoreAsked(data.asked || []);
    this.enterField();
    this.setFieldMessage(`${this.playerName} の冒険のつづきから...`);
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
      this.setFieldMessage('王城に入った... 魔王ワン公が待ち構えている!');
      FieldMap.render();
      this.updateHud();
      setTimeout(() => this.startBoss(), 800);
      return;
    }
    if (result.reason === 'castle_locked') {
      this.setFieldMessage(`王城は封印されている... 残り${12 - FieldMap.defeatedCount()}体の敵を倒せ!`);
      return;
    }
    if (result.reason === 'block') {
      this.setFieldMessage('木が生い茂っていて通れない。');
      FieldMap.render();
      return;
    }
    if (result.reason === 'out') {
      return;
    }

    FieldMap.render();
    this.setFieldMessage('Datadog王国を歩いている...');
  },

  startBattle(enemy) {
    this.showScreen('battle');
    Battle.startNormal(enemy, this.hero);
  },

  startBoss() {
    this.showScreen('battle');
    this.hero.hp = this.hero.maxHp; // ボス戦前回復
    Battle.startBoss(this.hero);
  },

  recordAnswer(correct) {
    this.totalAnswered++;
    if (correct) this.correctAnswered++;
  },

  async handleEnemyDefeated(enemyId) {
    FieldMap.markEnemyDefeated(enemyId);
    this.showScreen('field');
    FieldMap.render();
    this.updateHud();
    this.setFieldMessage(`敵を倒した! 残り ${12 - FieldMap.defeatedCount()}体。`);
    await this.autoSave();

    if (FieldMap.allEnemiesDefeated()) {
      this.setFieldMessage('全ての敵を倒した! 王城の封印が解かれた! 城へ向かおう。');
    }
  },

  async saveNow() {
    await this.autoSave();
    this.setFieldMessage('セーブしました!(ローカル & サーバー)');
  },

  async autoSave() {
    const state = {
      playerName: this.playerName,
      hero: this.hero,
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
    document.getElementById('hud-hp').textContent = `${this.hero.hp}/${this.hero.maxHp}`;
    document.getElementById('hud-defeated').textContent = FieldMap.defeatedCount();
    this.updateTimeHud();
  },

  showScreen(name) {
    this.screen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
  },

  showGameOver() {
    this.stopTimer();
    this.showScreen('gameover');
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
    document.getElementById('ending-text').innerHTML =
      `ゆうしゃ <strong>${escapeHtml(this.playerName)}</strong> は<br/>` +
      `Datadog王国を旅して 全ての敵を倒し<br/>` +
      `魔王ワン公の野望を打ち砕いた!<br/><br/>` +
      `観測可能性(オブザーバビリティ)の光が<br/>` +
      `王国の隅々まで広がった...`;

    document.getElementById('ending-stats').innerHTML =
      `<div>クリアタイム: <strong>${formatTime(totalSec)}</strong></div>` +
      `<div>倒した敵: ${defeated} / 12 + BOSS</div>` +
      `<div>HP: ${this.hero.hp} / ${this.hero.maxHp}</div>` +
      `<div>正解: ${correct} / ${total} (正解率 ${Math.round(accuracy * 100)}%)</div>` +
      `<div>スコア: <strong>${score}</strong></div>`;

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
    el.innerHTML = '<p style="text-align:center;padding:20px;">よみこみちゅう...</p>';
    const entries = await SaveSystem.getRanking(limit || 20);
    if (entries.length === 0) {
      el.innerHTML = '<div class="ranking-empty">まだ記録がありません。<br/>最初のクリアを目指そう!</div>';
      return;
    }
    const rows = [];
    rows.push(
      `<div class="ranking-row header">` +
        `<span class="rank-rank">#</span>` +
        `<span class="rank-name">なまえ</span>` +
        `<span class="rank-score">スコア</span>` +
        `<span class="rank-time">じかん</span>` +
        `<span class="rank-acc">せいかい</span>` +
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
