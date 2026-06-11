// ===== Datadog Quest - セーブシステム (localStorage + サーバー保存) =====

const SAVE_KEY = 'datadog_quest_save_v1';
const PLAYER_ID_KEY = 'datadog_quest_player_id';

const SaveSystem = {
  playerId: null,

  init() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = 'p' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    this.playerId = id;
  },

  async save(state) {
    // ローカル
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
    // サーバー
    try {
      await fetch(`/api/save/${this.playerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (e) {
      console.warn('server save failed', e);
    }
  },

  async load() {
    // まずサーバー側を確認(最新)
    try {
      const res = await fetch(`/api/save/${this.playerId}`);
      if (res.ok) {
        const j = await res.json();
        if (j.exists) return j.data;
      }
    } catch (e) {
      console.warn('server load failed', e);
    }
    // フォールバック: ローカル
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('localStorage load failed', e);
    }
    return null;
  },

  async clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    try {
      await fetch(`/api/save/${this.playerId}`, { method: 'DELETE' });
    } catch (e) {}
  },

  async hasSave() {
    const data = await this.load();
    return !!data;
  },

  // ====== ランキング ======
  async getRanking(limit = 20) {
    try {
      const res = await fetch(`/api/ranking?limit=${limit}`);
      if (!res.ok) return [];
      const j = await res.json();
      return j.entries || [];
    } catch (e) {
      console.warn('ranking load failed', e);
      return [];
    }
  },

  async submitRanking({ playerName, timeSec, correctCount, totalCount }) {
    try {
      const res = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, timeSec, correctCount, totalCount })
      });
      if (!res.ok) return null;
      const j = await res.json();
      return j.entry || null;
    } catch (e) {
      console.warn('ranking submit failed', e);
      return null;
    }
  }
};
