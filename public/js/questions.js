// ===== Datadog Quest - 問題ロジック =====

const QuestionBank = {
  ja: null,
  en: null,
  asked: new Set(),

  async load() {
    const res = await fetch('/api/questions');
    if (!res.ok) throw new Error('問題データの読み込みに失敗しました');
    const j = await res.json();
    this.ja = j.ja;
    this.en = j.en;
    return j;
  },

  reset() {
    this.asked.clear();
  },

  restoreAsked(askedIds) {
    this.asked = new Set(askedIds || []);
  },

  // 言語に応じて問題のテキスト部分を差し替える
  localize(q) {
    const lang = (typeof I18n !== 'undefined' && I18n.lang) || 'ja';
    if (lang === 'en' && this.en && this.en.questions && this.en.questions[q.id]) {
      const tr = this.en.questions[q.id];
      return { ...q, question: tr.question, choices: tr.choices, explanation: tr.explanation };
    }
    return q;
  },

  shuffleChoices(q) {
    const indices = q.choices.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const newChoices = indices.map(i => q.choices[i]);
    const newAnswer = indices.indexOf(q.answer);
    return { ...q, choices: newChoices, answer: newAnswer };
  },

  pickForEnemy(enemyTypeKey, level) {
    const all = this.ja.questions;
    const primaryCat = CATEGORY_BY_ENEMY[enemyTypeKey];

    let categoryPool = [primaryCat];
    if (Math.random() < 0.25) {
      categoryPool = categoryPool.concat(CROSS_CATEGORY_POOL);
    }

    const candidates = all.filter(q =>
      categoryPool.includes(q.category) &&
      q.level === level &&
      !q.id.startsWith('boss_')
    );

    const fresh = candidates.filter(q => !this.asked.has(q.id));
    const pickFrom = fresh.length > 0 ? fresh : candidates;

    if (pickFrom.length === 0) {
      const fallback = all.filter(q => q.level === level && !q.id.startsWith('boss_'));
      const fb = fallback.filter(q => !this.asked.has(q.id));
      const choice = (fb.length > 0 ? fb : fallback)[Math.floor(Math.random() * (fb.length > 0 ? fb : fallback).length)];
      this.asked.add(choice.id);
      return this.shuffleChoices(this.localize(choice));
    }

    const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    this.asked.add(chosen.id);
    return this.shuffleChoices(this.localize(chosen));
  },

  pickForBoss(count = 5) {
    const pool = this.ja.questions.filter(q => q.id.startsWith('boss_'));
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length)).map(q => this.shuffleChoices(this.localize(q)));
  },

  categoryLabel(catKey) {
    if (typeof I18n !== 'undefined') {
      const v = I18n.t('cat_' + catKey);
      if (v && v !== 'cat_' + catKey) return v;
    }
    const lang = (typeof I18n !== 'undefined' && I18n.lang) || 'ja';
    if (lang === 'en' && this.en && this.en.categories) {
      return this.en.categories[catKey] || catKey;
    }
    return this.ja?.categories?.[catKey] || catKey;
  },

  getAskedIds() {
    return Array.from(this.asked);
  }
};
