// ===== Datadog Quest - Sound FX (chiptune via Web Audio API) =====

const MUTE_KEY = 'datadog_quest_muted';

const SoundFX = {
  ctx: null,
  enabled: true,
  _activeNodes: [],
  _endingInterval: null,
  _endingStarted: false,

  init() {
    const muted = localStorage.getItem(MUTE_KEY) === 'true';
    this.enabled = !muted;
  },

  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  setEnabled(on) {
    this.enabled = !!on;
    try { localStorage.setItem(MUTE_KEY, String(!this.enabled)); } catch (e) {}
    if (!this.enabled) this.stopAll();
    return this.enabled;
  },

  toggle() {
    return this.setEnabled(!this.enabled);
  },

  stopAll() {
    this.stopEndingMusic();
    this._activeNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    this._activeNodes = [];
  },

  // 1音(オシレータベース)
  _tone({ freq, dur = 0.1, when = 0, type = 'square', gain = 0.15, attack = 0.005, release = 0.03, freqEnd = null }) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    }

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.setValueAtTime(gain, Math.max(t0 + attack, t0 + dur - release));
    g.gain.linearRampToValueAtTime(0, t0 + dur);

    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    this._activeNodes.push(osc);
  },

  // ノイズ系(刀の風切り音など)
  _noise({ dur = 0.2, when = 0, gain = 0.25, filterStart = 3000, filterEnd = 500, q = 5 }) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;

    const size = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterStart, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, filterEnd), t0 + dur);
    filter.Q.value = q;

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    this._activeNodes.push(src);
  },

  // ====== 各イベントSE ======

  // 敵エンカウント:不協和な低音 + 高音トライトーン
  encounter() {
    if (!this.enabled) return;
    // 低音の半音差(minor 2nd)で不気味さを出す
    this._tone({ freq: 110, dur: 0.55, type: 'sawtooth', gain: 0.12 });
    this._tone({ freq: 116.5, dur: 0.55, type: 'sawtooth', gain: 0.12 });
    // 少し後で tritone(増4度)を重ねる
    this._tone({ freq: 233, dur: 0.4, when: 0.15, type: 'sawtooth', gain: 0.09 });
    this._tone({ freq: 311, dur: 0.4, when: 0.15, type: 'sawtooth', gain: 0.09 });
    // 最後に低音をスライドダウンさせて不安感
    this._tone({ freq: 175, freqEnd: 90, dur: 0.5, when: 0.55, type: 'sawtooth', gain: 0.1 });
  },

  // 攻撃(刀で切る音):金属クリック + ノイズスウィープ
  attack() {
    if (!this.enabled) return;
    // メタリックなクリック(高音→急降下)
    this._tone({ freq: 2400, freqEnd: 600, dur: 0.07, type: 'square', gain: 0.12 });
    // 風切り音(ノイズをバンドパスでスイープ)
    this._noise({ dur: 0.22, gain: 0.28, filterStart: 4000, filterEnd: 400, q: 6 });
  },

  // 正解:幸せな上昇アルペジオ(Cメジャー)
  correct() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      this._tone({ freq: f, dur: 0.12, when: i * 0.07, type: 'square', gain: 0.15 });
      // 5度上をうっすら重ねて明るく
      this._tone({ freq: f * 1.5, dur: 0.12, when: i * 0.07, type: 'triangle', gain: 0.05 });
    });
  },

  // 不正解:走って逃げる足音
  wrong() {
    if (!this.enabled) return;
    // 6個の足音thud。attack音と被らないよう少し遅らせ、聞こえやすい周波数帯に
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const when = 0.06 + i * 0.13 + (i * i) * 0.005;
      const vol = 0.58 * (1 - i / (steps + 1));        // 0.38 → 0.58 にUP
      const baseFreq = 160 + (i % 2 === 0 ? 0 : 30);   // 少し高めへ
      this._tone({ freq: baseFreq, freqEnd: baseFreq * 0.5, dur: 0.11, when, type: 'sine', gain: vol });
      this._noise({ dur: 0.08, when, gain: vol * 1.0, filterStart: 1400, filterEnd: 350, q: 1.5 });
    }
  },

  // 城ロック解除:鍵カチャ→ガチャン→明るいチャイム
  unlockCastle() {
    if (!this.enabled) return;
    // 鍵を回す「カチカチ」(高音の連続クリック)
    this._tone({ freq: 2800, freqEnd: 2200, dur: 0.04, when: 0.00, type: 'square', gain: 0.14 });
    this._tone({ freq: 2800, freqEnd: 2200, dur: 0.04, when: 0.09, type: 'square', gain: 0.14 });
    this._tone({ freq: 2800, freqEnd: 2200, dur: 0.04, when: 0.18, type: 'square', gain: 0.14 });
    // 重い「ガチャン」(ロック解除の鋼の音)
    this._tone({ freq: 180, freqEnd: 70, dur: 0.22, when: 0.30, type: 'sine', gain: 0.28 });
    this._noise({ dur: 0.18, when: 0.30, gain: 0.20, filterStart: 900, filterEnd: 200, q: 2 });
    // 解除成功を示す明るいチャイム(3度・5度・8度のメジャー)
    this._tone({ freq: 1046.5, dur: 0.45, when: 0.60, type: 'triangle', gain: 0.14 });
    this._tone({ freq: 1318.5, dur: 0.45, when: 0.70, type: 'triangle', gain: 0.12 });
    this._tone({ freq: 1568.0, dur: 0.55, when: 0.80, type: 'triangle', gain: 0.12 });
  },

  // ボス撃破:ファンファーレ(タタタターン!)
  bossDefeat() {
    if (!this.enabled) return;
    const sq = (freq, when, dur, gain = 0.18) => {
      this._tone({ freq, dur, when, type: 'square', gain });
      // 5度harmonyで厚みを足す
      this._tone({ freq: freq * 1.498, dur, when, type: 'triangle', gain: gain * 0.4 });
    };
    // タタタタ
    sq(523.25, 0.00, 0.13);   // C5
    sq(523.25, 0.15, 0.13);   // C5
    sq(523.25, 0.30, 0.13);   // C5
    sq(523.25, 0.45, 0.50);   // C5 (sustained)
    // 半拍休み
    // ターーーーン!(上昇)
    sq(659.25, 1.05, 0.18);   // E5
    sq(783.99, 1.25, 0.18);   // G5
    sq(1046.5, 1.45, 1.10, 0.20); // C6 sustained
    sq(1318.5, 1.45, 1.10, 0.10); // E6 sustained(3度上で重ねる)
  },

  // エンディング音楽:幸せなループメロディ
  startEndingMusic() {
    if (!this.enabled) return;
    if (this._endingStarted) return;
    this._endingStarted = true;

    // C major のシンプルなメロディ(8拍)
    const melody = [
      // [周波数, 長さ(拍)]
      [523.25, 1], // C5
      [659.25, 1], // E5
      [783.99, 1], // G5
      [659.25, 1], // E5
      [698.46, 1], // F5
      [659.25, 1], // E5
      [587.33, 1], // D5
      [523.25, 1]  // C5
    ];
    const bass = [
      [130.81, 4], // C3 - 4拍
      [196.00, 4]  // G3 - 4拍
    ];

    const beat = 0.32; // 1拍 320ms

    const playPhrase = (offsetSec) => {
      // メロディ
      let t = offsetSec;
      melody.forEach(([f, len]) => {
        this._tone({ freq: f, dur: beat * len * 0.92, when: t, type: 'square', gain: 0.13 });
        // オクターブ下を薄く
        this._tone({ freq: f / 2, dur: beat * len * 0.92, when: t, type: 'triangle', gain: 0.05 });
        t += beat * len;
      });
      // ベース
      let tb = offsetSec;
      bass.forEach(([f, len]) => {
        this._tone({ freq: f, dur: beat * len * 0.95, when: tb, type: 'triangle', gain: 0.16 });
        tb += beat * len;
      });
    };

    // 即時開始
    playPhrase(0);
    const phraseDur = beat * 8;

    // ループ
    this._endingInterval = setInterval(() => {
      if (!this.enabled) {
        this.stopEndingMusic();
        return;
      }
      playPhrase(0);
    }, phraseDur * 1000);
  },

  stopEndingMusic() {
    if (this._endingInterval) {
      clearInterval(this._endingInterval);
      this._endingInterval = null;
    }
    this._endingStarted = false;
  }
};
