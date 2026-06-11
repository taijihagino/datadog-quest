// ===== Datadog Quest - 問題ロジック =====

const QuestionBank = {
  data: null,
  asked: new Set(),

  async load() {
    const res = await fetch('/api/questions');
    if (!res.ok) throw new Error('問題データの読み込みに失敗しました');
    this.data = await res.json();
    return this.data;
  },

  reset() {
    this.asked.clear();
  },

  restoreAsked(askedIds) {
    this.asked = new Set(askedIds || []);
  },

  /**
   * 選択肢の順序をシャッフルし正解indexを更新したコピーを返す。
   */
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

  /**
   * 敵のカテゴリヒントとレベルに合致する問題を1問選ぶ。
   * 一度出題された問題はなるべく避ける。
   */
  pickForEnemy(enemyTypeKey, level) {
    const all = this.data.questions;
    const primaryCat = CATEGORY_BY_ENEMY[enemyTypeKey];

    // 一定確率でSLO等の横断カテゴリも混ぜる
    let categoryPool = [primaryCat];
    if (Math.random() < 0.25) {
      categoryPool = categoryPool.concat(CROSS_CATEGORY_POOL);
    }

    const candidates = all.filter(q =>
      categoryPool.includes(q.category) &&
      q.level === level &&
      !q.id.startsWith('boss_')
    );

    // 未出題のものを優先
    const fresh = candidates.filter(q => !this.asked.has(q.id));
    const pickFrom = fresh.length > 0 ? fresh : candidates;

    if (pickFrom.length === 0) {
      // フォールバック: 同レベルの何でも
      const fallback = all.filter(q => q.level === level && !q.id.startsWith('boss_'));
      const fb = fallback.filter(q => !this.asked.has(q.id));
      const choice = (fb.length > 0 ? fb : fallback)[Math.floor(Math.random() * (fb.length > 0 ? fb : fallback).length)];
      this.asked.add(choice.id);
      return this.shuffleChoices(choice);
    }

    const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    this.asked.add(chosen.id);
    return this.shuffleChoices(chosen);
  },

  /**
   * ボス用の問題プールからランダムに5問を返す
   */
  pickForBoss(count = 5) {
    const pool = this.data.questions.filter(q => q.id.startsWith('boss_'));
    // Fisher-Yatesで配列をシャッフル
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length)).map(q => this.shuffleChoices(q));
  },

  categoryLabel(catKey) {
    return this.data?.categories?.[catKey] || catKey;
  },

  getAskedIds() {
    return Array.from(this.asked);
  }
};
