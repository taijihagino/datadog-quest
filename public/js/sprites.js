// ===== Datadog Quest - スプライト & キャラクター定義 =====

// 敵タイプ: emoji + レベル別の色ヒント(背景色)
const ENEMY_TYPES = {
  slime: {
    name: 'スライム',
    emoji: '🟢',
    bigEmoji: '🟢',
    flavor: 'プニプニしている。',
    colorByLevel: { 1: '#7ed957', 2: '#a55eea' }
  },
  mage: {
    name: 'まほうつかい',
    emoji: '🧙',
    bigEmoji: '🧙‍♂️',
    flavor: '怪しげな呪文を唱えている...',
    colorByLevel: { 1: '#5390e2', 2: '#c0392b' }
  },
  skeleton: {
    name: 'ガイコツ',
    emoji: '💀',
    bigEmoji: '💀',
    flavor: 'カタカタと骨を鳴らしている。',
    colorByLevel: { 1: '#dcdcdc', 2: '#8a8aa3' }
  },
  bat: {
    name: 'コウモリ',
    emoji: '🦇',
    bigEmoji: '🦇',
    flavor: 'バサバサと羽ばたいている。',
    colorByLevel: { 1: '#9b6b3a', 2: '#2a2a3a' }
  },
  bee: {
    name: 'ハチ',
    emoji: '🐝',
    bigEmoji: '🐝',
    flavor: 'ブンブンと羽音をたてる!',
    colorByLevel: { 1: '#f6c453', 2: '#e67e22' }
  },
  dragon: {
    name: 'ドラゴン',
    emoji: '🐲',
    bigEmoji: '🐲',
    flavor: '巨大な翼を広げ、火を吐く構え!',
    colorByLevel: { 1: '#6ad36a', 2: '#c0392b' }
  }
};

// レベルに応じた色強調用接頭辞 (UI 上のラベル)
const LEVEL_LABEL = {
  1: 'Lv.1',
  2: 'Lv.2',
  3: 'Lv.3'
};

// プレイヤー(ゆうしゃ)
const PLAYER_SPRITE = {
  emoji: '🧝',
  name: 'ゆうしゃ DOG-KNIGHT'
};

// ボス(犬)
const BOSS_SPRITE = {
  emoji: '🐕',
  bigEmoji: '🐕‍🦺',
  name: 'にせもの DARK BITS',
  flavor: 'Bitsを名乗りDatadog王国を闇に染めた偽物の魔王!'
};

// 本物のBits(囚われていた王国の妖精) - エンディングで救出される
const TRUE_BITS = {
  emoji: '🐶',
  bigEmoji: '🐶✨',
  name: 'まことの BITS',
  flavor: 'DARK BITSに長い間とらわれていた本物のBits。光をとりもどした!'
};

// 各カテゴリにあてはまる敵のカテゴリヒント(出題時に使う)
const CATEGORY_BY_ENEMY = {
  slime: 'apm_rum',
  mage: 'security',
  skeleton: 'infra',
  bat: 'agent_obs',
  bee: 'integration',
  dragon: 'cicd'
};

// SLOカテゴリは全敵タイプから一定確率で出題される横断カテゴリ扱い
const CROSS_CATEGORY_POOL = ['slo'];
