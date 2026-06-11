// ===== Datadog Quest - i18n =====

const I18N_LANG_KEY = 'datadog_quest_lang';

const I18N_STRINGS = {
  ja: {
    title_subtitle: '- Datadog王国を旅して全ての謎を解け -',
    title_new: 'はじめから',
    title_continue: 'つづきから',
    title_ranking: 'ランキング',
    title_reset: 'セーブを消す',
    title_version: 'Powered by Datadog ▶ Press [はじめから]',
    lang_label: '言語',

    hud_hero: 'ゆうしゃ',
    hud_mistakes: 'まちがい',
    hud_time: 'じかん',
    hud_defeated: 'たおした',
    btn_save: 'セーブ',
    btn_back_title: 'タイトルに戻る',

    field_default: '方向キー(↑↓←→ または WASD)で移動。敵に触れるとバトル!',
    field_start: '{name} の冒険がはじまった! 全12の試練のあと、王城でDARK BITSが待つ!',
    field_continue: '{name} の冒険のつづきから...',
    field_save_done: 'セーブしました!(ローカル & サーバー)',
    field_block: '木が生い茂っていて通れない。',
    field_castle_locked: '王城は封印されている... 残り{n}体の敵を倒せ!',
    field_castle_enter: '王城に入った... DARK BITSが待ち構えている!',
    field_walking: 'Datadog王国を歩いている...',
    field_defeat_correct: '敵を倒した! 残り {n}体。 (まちがい: {m})',
    field_defeat_wrong: '敵は去っていった... 残り {n}体。 (まちがい: {m})',
    field_all_defeated: '全ての敵を退けた! 王城の封印が解かれた! 城へ向かおう。',
    field_save_cleared: 'セーブデータを消去しました。',

    intro_title: '~ プロローグ ~',
    intro_skip: '▶ スキップ',
    intro_next: '▶ 冒険にでる',
    intro_text: (name) =>
      `むかしむかし、Datadog王国には\n` +
      `「Bits」と呼ばれる ちいさな ようせいが いた。\n` +
      `Bitsは王国に メトリクスと トレースの 光を ともし、\n` +
      `人々の くらしを まもっていた。\n\n` +
      `しかし ある日―――\n\n` +
      `Bitsを 名乗る にせもの 『DARK BITS』 が\n` +
      `王の城に あらわれ、王国を のっとった。\n` +
      `本物の Bits は 城の奥深くに とらわれ、\n` +
      `観測の光は うばわれ、王国に 闇が ひろがった。\n\n` +
      `そんなとき、勇者 「${name}」 が 立ちあがった。\n` +
      `「私が DARK BITS を たおし、\n` +
      ` 本物の Bits を 助け出し、世界に 平和を とりもどす!」\n\n` +
      `さあ ${name} よ、 つるぎ を にぎりしめ、\n` +
      `Datadog王国を 旅して 12の 試練を のりこえよ。\n` +
      `その先に まちうける DARK BITS を 打ちたおし、\n` +
      `とらわれた Bits を 救い出すのだ!`,

    name_title: 'なまえを いれてください',
    name_q: 'あなたのゆうしゃの なまえは?',
    name_placeholder: 'ゆうしゃの名前 (最大16文字)',
    name_note: '※ボス撃破時にランキング登録されます',
    name_ok: 'はじめる',
    name_cancel: 'やめる',

    confirm_reset: 'セーブデータを削除します。よろしいですか?',

    battle_appeared: '{name}({lv})があらわれた! {flavor}',
    battle_boss_appeared: '{name}が立ちはだかる! {flavor}',
    battle_mode_normal: '通常戦',
    battle_lbl_correct: 'せいかい',
    battle_lbl_mistakes: 'まちがい',
    battle_lbl_mode: 'モード',
    battle_load: '問題を読み込み中...',

    modal_next: '▶ つぎへ',
    modal_correct_title: 'てきを たおした!',
    modal_correct_body: 'せいかい!\n\n【解説】\n{ex}\n\n{name}は しずかに しずんでいった...',
    modal_wrong_title: 'ふせいかい...',
    modal_wrong_body: '正解は: {ans}\n\n【解説】\n{ex}\n\nしかし冒険は続く!\n{name}は ゆうしゃの けはいに おびえて さっていった...',
    modal_boss_correct_title: 'こうげき せいこう!',
    modal_boss_correct_body: 'せいかい!\n\n【解説】\n{ex}',
    modal_boss_wrong_title: 'ふせいかい...',
    modal_boss_wrong_body: '正解は: {ans}\n\n【解説】\n{ex}\n\n気を取り直して次の問題へ!',
    modal_boss_clear_title: 'DARK BITSを倒した!',
    modal_boss_clear_body: '見事に全{total}問のうち{correct}問に正解!\nDatadog王国に光が戻った...',

    ending_title: 'Datadog王国に平和が訪れた!',
    ending_rescue_intro: 'DARK BITSが くずれおちた、その時―',
    ending_rescue_appear: '城の奥から ちいさな ひかりが ふわりと あらわれた。\nそれは ながい あいだ とらわれていた、本物の Bits だった。',
    ending_bits_line: (name) =>
      `<img src="/images/bits.png" alt="Bits" class="bits-icon" /> 「ありがとう、${name}!\n` +
      ` あなたのおかげで、わたしは じゆうになれた。\n` +
      ` Datadog王国に、ふたたび 観測の ひかりを ともそう!」`,
    ending_rescue_outro: '勇者と Bits は、ともに城を出て、\n王国の すみずみまで メトリクスと トレースの\nあたたかな ひかりを とりもどした...',
    ending_text: (name) =>
      `ゆうしゃ <strong>${name}</strong> は<br/>` +
      `Datadog王国を旅して 全ての敵を倒し<br/>` +
      `DARK BITSを 打ち破り<br/>` +
      `とらわれていた 本物の Bits を 救い出した!<br/><br/>` +
      `観測可能性(オブザーバビリティ)の光が<br/>` +
      `王国の隅々まで ふたたび 広がった...`,
    ending_back: 'タイトルへもどる',
    ending_stat_time: 'クリアタイム',
    ending_stat_defeated: '倒した敵',
    ending_stat_correct: '正解',
    ending_stat_acc: '正解率',
    ending_stat_mistakes: 'まちがい',
    ending_stat_score: 'スコア',
    ending_ranking_title: '🏆 RANKING TOP 10 🏆',

    ranking_title: '🏆 RANKING 🏆',
    ranking_help: 'スコア = (正解率×10000) - 経過秒数',
    ranking_close: '▶ とじる',
    ranking_loading: 'よみこみちゅう...',
    ranking_empty: 'まだ記録がありません。<br/>最初のクリアを目指そう!',
    ranking_col_rank: '#',
    ranking_col_name: 'なまえ',
    ranking_col_score: 'スコア',
    ranking_col_time: 'じかん',
    ranking_col_acc: 'せいかい',

    gameover_title: 'ゆうしゃは たおれた...',
    gameover_text: 'Datadog王国の旅はここで終わってしまった。<br/>もう一度挑戦しよう!',
    gameover_retry: 'もう一度',
    gameover_back: 'タイトルへ',
    no_save: 'セーブデータが見つかりません',

    default_name: 'ななしのゆうしゃ',
    boss_name: 'にせもの DARK BITS',
    boss_flavor: 'Bitsを名乗りDatadog王国を闇に染めた偽物の魔王!',
    boss_progress: 'BOSS',
    boss_category: '高度な問題',
    enemy_slime: 'スライム',
    enemy_mage: 'まほうつかい',
    enemy_skeleton: 'ガイコツ',
    enemy_bat: 'コウモリ',
    enemy_bee: 'ハチ',
    enemy_dragon: 'ドラゴン',
    flavor_slime: 'プニプニしている。',
    flavor_mage: '怪しげな呪文を唱えている...',
    flavor_skeleton: 'カタカタと骨を鳴らしている。',
    flavor_bat: 'バサバサと羽ばたいている。',
    flavor_bee: 'ブンブンと羽音をたてる!',
    flavor_dragon: '巨大な翼を広げ、火を吐く構え!',

    cat_apm_rum: 'APM & RUM',
    cat_infra: 'インフラモニタリング',
    cat_security: 'セキュリティ',
    cat_agent_obs: 'Agent Observability',
    cat_cicd: 'CI/CD',
    cat_slo: 'SLO',
    cat_integration: 'Integration & インストゥルメンテーション'
  },

  en: {
    title_subtitle: '- Travel the Datadog Kingdom and solve every mystery -',
    title_new: 'New Game',
    title_continue: 'Continue',
    title_ranking: 'Ranking',
    title_reset: 'Delete Save',
    title_version: 'Powered by Datadog ▶ Press [New Game]',
    lang_label: 'Lang',

    hud_hero: 'HERO',
    hud_mistakes: 'MISS',
    hud_time: 'TIME',
    hud_defeated: 'DEFEAT',
    btn_save: 'Save',
    btn_back_title: 'Back to Title',

    field_default: 'Use arrow keys (↑↓←→ or WASD) to move. Touch an enemy to start a battle!',
    field_start: "{name}'s adventure begins! Beat 12 trials, then face DARK BITS at the castle!",
    field_continue: "Resuming {name}'s adventure...",
    field_save_done: 'Saved! (local & server)',
    field_block: 'Trees block the way.',
    field_castle_locked: 'The castle is sealed... Defeat the remaining {n} enemies!',
    field_castle_enter: 'You enter the castle... DARK BITS lies in wait!',
    field_walking: 'Walking through the Datadog Kingdom...',
    field_defeat_correct: 'Enemy defeated! {n} remaining. (Mistakes: {m})',
    field_defeat_wrong: 'The enemy flees... {n} remaining. (Mistakes: {m})',
    field_all_defeated: 'All enemies repelled! The castle seal is broken. To the castle!',
    field_save_cleared: 'Save data deleted.',

    intro_title: '~ Prologue ~',
    intro_skip: '▶ Skip',
    intro_next: '▶ Set Out',
    intro_text: (name) =>
      `Long ago, in the Datadog Kingdom, there lived\n` +
      `a small fairy called "Bits".\n` +
      `Bits brought metrics and traces of light to the realm,\n` +
      `protecting the lives of all who dwelt there.\n\n` +
      `But one day...\n\n` +
      `An impostor calling itself "DARK BITS"\n` +
      `appeared at the king's castle and seized the realm.\n` +
      `The true Bits was imprisoned deep within the castle,\n` +
      `the light of observability was stolen,\n` +
      `and darkness spread across the kingdom.\n\n` +
      `Then a hero named "${name}" stood up.\n` +
      `"I shall defeat DARK BITS,\n` +
      ` rescue the true Bits, and restore peace!"\n\n` +
      `Now, ${name}, take up your sword,\n` +
      `travel the Datadog Kingdom, and overcome 12 trials.\n` +
      `Beyond them lies the final battle with DARK BITS.\n` +
      `Defeat the impostor and rescue the captive Bits!`,

    name_title: 'Enter Your Name',
    name_q: "What is your hero's name?",
    name_placeholder: 'Hero name (max 16 chars)',
    name_note: '* Your score will be registered when you defeat the boss.',
    name_ok: 'Begin',
    name_cancel: 'Cancel',

    confirm_reset: 'Delete the save data. Are you sure?',

    battle_appeared: 'A {name} ({lv}) appears! {flavor}',
    battle_boss_appeared: '{name} stands before you! {flavor}',
    battle_mode_normal: 'Battle',
    battle_lbl_correct: 'Correct',
    battle_lbl_mistakes: 'Miss',
    battle_lbl_mode: 'Mode',
    battle_load: 'Loading question...',

    modal_next: '▶ Next',
    modal_correct_title: 'Enemy Defeated!',
    modal_correct_body: 'Correct!\n\n[Explanation]\n{ex}\n\nThe {name} quietly fades away...',
    modal_wrong_title: 'Wrong...',
    modal_wrong_body: 'Correct answer: {ans}\n\n[Explanation]\n{ex}\n\nBut the adventure continues!\nThe {name} flees in fear of your presence...',
    modal_boss_correct_title: 'A Hit!',
    modal_boss_correct_body: 'Correct!\n\n[Explanation]\n{ex}',
    modal_boss_wrong_title: 'Wrong...',
    modal_boss_wrong_body: 'Correct answer: {ans}\n\n[Explanation]\n{ex}\n\nShake it off and on to the next question!',
    modal_boss_clear_title: 'DARK BITS is defeated!',
    modal_boss_clear_body: 'You answered {correct} out of {total} correctly!\nLight returns to the Datadog Kingdom...',

    ending_title: 'Peace returns to the Datadog Kingdom!',
    ending_rescue_intro: 'As DARK BITS crumbled to dust...',
    ending_rescue_appear: 'A small light drifted out from deep within the castle.\nIt was the true Bits, imprisoned for so long.',
    ending_bits_line: (name) =>
      `<img src="/images/bits.png" alt="Bits" class="bits-icon" /> "Thank you, ${name}!\n` +
      ` Thanks to you, I am free again.\n` +
      ` Let us bring the light of observability back to the Datadog Kingdom!"`,
    ending_rescue_outro: 'The hero and Bits left the castle together,\nand restored the warm light of metrics and traces\nto every corner of the kingdom...',
    ending_text: (name) =>
      `The hero <strong>${name}</strong><br/>` +
      `traveled the Datadog Kingdom, defeated every foe,<br/>` +
      `vanquished DARK BITS,<br/>` +
      `and rescued the true Bits!<br/><br/>` +
      `The light of observability<br/>` +
      `spreads once more across the realm...`,
    ending_back: 'Back to Title',
    ending_stat_time: 'Clear Time',
    ending_stat_defeated: 'Defeated',
    ending_stat_correct: 'Correct',
    ending_stat_acc: 'Accuracy',
    ending_stat_mistakes: 'Mistakes',
    ending_stat_score: 'Score',
    ending_ranking_title: '🏆 RANKING TOP 10 🏆',

    ranking_title: '🏆 RANKING 🏆',
    ranking_help: 'Score = (accuracy × 10000) − elapsed seconds',
    ranking_close: '▶ Close',
    ranking_loading: 'Loading...',
    ranking_empty: 'No records yet.<br/>Aim to be the first to clear!',
    ranking_col_rank: '#',
    ranking_col_name: 'Name',
    ranking_col_score: 'Score',
    ranking_col_time: 'Time',
    ranking_col_acc: 'Acc',

    gameover_title: 'The hero has fallen...',
    gameover_text: 'Your journey through the Datadog Kingdom ends here.<br/>Try again!',
    gameover_retry: 'Retry',
    gameover_back: 'Title',
    no_save: 'No save data found',

    default_name: 'Anonymous Hero',
    boss_name: 'IMPOSTOR DARK BITS',
    boss_flavor: 'An impostor calling itself Bits who plunged the Datadog Kingdom into darkness!',
    boss_progress: 'BOSS',
    boss_category: 'Advanced Questions',
    enemy_slime: 'Slime',
    enemy_mage: 'Mage',
    enemy_skeleton: 'Skeleton',
    enemy_bat: 'Bat',
    enemy_bee: 'Bee',
    enemy_dragon: 'Dragon',
    flavor_slime: 'It quivers like jelly.',
    flavor_mage: 'It is chanting a suspicious spell...',
    flavor_skeleton: 'Its bones rattle ominously.',
    flavor_bat: 'It flaps its wings noisily.',
    flavor_bee: 'It buzzes menacingly!',
    flavor_dragon: 'It spreads vast wings, ready to breathe fire!',

    cat_apm_rum: 'APM & RUM',
    cat_infra: 'Infrastructure Monitoring',
    cat_security: 'Security',
    cat_agent_obs: 'Agent Observability',
    cat_cicd: 'CI/CD',
    cat_slo: 'SLO',
    cat_integration: 'Integration & Instrumentation'
  }
};

const I18n = {
  lang: 'ja',
  _listeners: [],

  init() {
    // 常に日本語をデフォルト(ユーザー指定)。localStorageにあればそれを優先
    const saved = localStorage.getItem(I18N_LANG_KEY);
    if (saved === 'en' || saved === 'ja') {
      this.lang = saved;
    } else {
      this.lang = 'ja';
    }
  },

  set(lang) {
    if (lang !== 'ja' && lang !== 'en') return;
    if (this.lang === lang) return;
    this.lang = lang;
    try { localStorage.setItem(I18N_LANG_KEY, lang); } catch (e) {}
    this._listeners.forEach(fn => { try { fn(lang); } catch (e) { console.warn(e); } });
  },

  toggle() {
    this.set(this.lang === 'ja' ? 'en' : 'ja');
  },

  onChange(fn) {
    this._listeners.push(fn);
  },

  t(key, params) {
    const strings = I18N_STRINGS[this.lang] || I18N_STRINGS.ja;
    let v = strings[key];
    if (v == null) v = I18N_STRINGS.ja[key];
    if (typeof v === 'function') return v(params || '');
    if (typeof v !== 'string') return key;
    if (params && typeof params === 'object') {
      v = v.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? params[k] : `{${k}}`));
    }
    return v;
  }
};
