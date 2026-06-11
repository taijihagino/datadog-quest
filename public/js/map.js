// ===== Datadog Quest - フィールドマップ =====

const TILE_SIZE = 32;
const MAP_W = 15;
const MAP_H = 12;

// マップタイル定義: g=grass, T=tree, P=path, W=water, F=flower
// マップ周囲は木で囲み、中央に城へ続く道
const MAP_DATA = [
  'TTTTTTTTTTTTTTT',
  'TggggTgggggTggT',
  'TgFggggggggggCT',
  'TggggTggTgggggT',
  'TgggggggggggTgT',
  'TgTggggggFggggT',
  'TggggFggggggggT',
  'TggTggggggTgggT',
  'TggggggggggggFT',
  'TgFggTggggggggT',
  'TggggggggFgggTT',
  'TTTTTTTTTTTTTTT'
];

const PLAYER_START = { x: 2, y: 6 };
const CASTLE_POS = { x: 13, y: 2 };

// 敵の出現リスト(位置は新規ゲーム開始時にランダム決定)
const ENEMY_ROSTER = [
  { type: 'slime',    level: 1 },
  { type: 'slime',    level: 2 },
  { type: 'mage',     level: 1 },
  { type: 'mage',     level: 2 },
  { type: 'skeleton', level: 1 },
  { type: 'skeleton', level: 2 },
  { type: 'bat',      level: 1 },
  { type: 'bat',      level: 2 },
  { type: 'bee',      level: 1 },
  { type: 'bee',      level: 2 },
  { type: 'dragon',   level: 1 },
  { type: 'dragon',   level: 2 }
];

const FieldMap = {
  canvas: null,
  ctx: null,
  player: { x: PLAYER_START.x, y: PLAYER_START.y, facing: 'down' },
  enemies: [],
  bossDefeated: false,

  init() {
    this.canvas = document.getElementById('field-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.reset();
  },

  reset() {
    this.player = { x: PLAYER_START.x, y: PLAYER_START.y, facing: 'down' };
    const positions = this.generateRandomPositions(ENEMY_ROSTER.length);
    this.enemies = ENEMY_ROSTER.map((e, idx) => ({
      type: e.type,
      level: e.level,
      id: `enemy_${idx}`,
      x: positions[idx].x,
      y: positions[idx].y,
      defeated: false
    }));
    this.bossDefeated = false;
  },

  // 草タイル(g)から重複なしでランダム位置を返す。プレイヤー開始位置は除外。
  generateRandomPositions(count) {
    const valid = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = MAP_DATA[y][x];
        if (ch !== 'g') continue;
        if (x === PLAYER_START.x && y === PLAYER_START.y) continue;
        valid.push({ x, y });
      }
    }
    // Fisher-Yates
    for (let i = valid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [valid[i], valid[j]] = [valid[j], valid[i]];
    }
    return valid.slice(0, count);
  },

  restoreState(state) {
    if (!state) return;
    if (state.player) this.player = { ...this.player, ...state.player };
    if (state.enemies && Array.isArray(state.enemies)) {
      // 保存された位置を尊重(なければrosterから埋める)
      this.enemies = state.enemies.map((saved, idx) => {
        const roster = ENEMY_ROSTER[idx] || {};
        return {
          type: saved.type || roster.type,
          level: saved.level || roster.level,
          id: saved.id || `enemy_${idx}`,
          x: typeof saved.x === 'number' ? saved.x : (this.enemies[idx] && this.enemies[idx].x),
          y: typeof saved.y === 'number' ? saved.y : (this.enemies[idx] && this.enemies[idx].y),
          defeated: !!saved.defeated
        };
      });
    }
    this.bossDefeated = !!state.bossDefeated;
  },

  exportState() {
    return {
      player: this.player,
      enemies: this.enemies.map(e => ({
        id: e.id, type: e.type, level: e.level,
        x: e.x, y: e.y, defeated: e.defeated
      })),
      bossDefeated: this.bossDefeated
    };
  },

  defeatedCount() {
    return this.enemies.filter(e => e.defeated).length;
  },

  allEnemiesDefeated() {
    return this.enemies.every(e => e.defeated);
  },

  // 移動: 1タイル分。戻り値: { entered: 'enemy'|'castle'|null, target?: ... }
  tryMove(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    if (dx === -1) this.player.facing = 'left';
    if (dx === 1)  this.player.facing = 'right';
    if (dy === -1) this.player.facing = 'up';
    if (dy === 1)  this.player.facing = 'down';

    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return { entered: null, reason: 'out' };

    const tile = MAP_DATA[ny][nx];

    // 木は通れない
    if (tile === 'T') {
      return { entered: null, reason: 'block' };
    }

    // 城: ボス突入チェック
    if (tile === 'C') {
      if (!this.allEnemiesDefeated()) {
        return { entered: null, reason: 'castle_locked' };
      }
      this.player.x = nx;
      this.player.y = ny;
      return { entered: 'castle' };
    }

    // 敵タイル
    const enemyHere = this.enemies.find(e => !e.defeated && e.x === nx && e.y === ny);
    if (enemyHere) {
      // 移動はせず、戦闘突入
      return { entered: 'enemy', target: enemyHere };
    }

    this.player.x = nx;
    this.player.y = ny;
    return { entered: null };
  },

  markEnemyDefeated(enemyId) {
    const e = this.enemies.find(x => x.id === enemyId);
    if (e) e.defeated = true;
  },

  // ====== レンダリング ======
  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // タイル描画
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = MAP_DATA[y][x];
        this.drawTile(ctx, x, y, ch);
      }
    }

    // 敵描画
    for (const e of this.enemies) {
      if (e.defeated) continue;
      this.drawEnemy(ctx, e);
    }

    // プレイヤー描画
    this.drawPlayer(ctx);

    // 城がロックされている場合の表示
    if (!this.allEnemiesDefeated()) {
      this.drawLockOverlay(ctx);
    }
  },

  drawTile(ctx, x, y, ch) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    // 地面ベース(草)
    ctx.fillStyle = '#2a8a3a';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // 草テクスチャ
    ctx.fillStyle = '#37a046';
    for (let i = 0; i < 4; i++) {
      const tx = px + ((x * 7 + i * 11) % TILE_SIZE);
      const ty = py + ((y * 5 + i * 13) % TILE_SIZE);
      ctx.fillRect(tx, ty, 3, 3);
    }

    if (ch === 'T') {
      // 木
      this.drawEmoji(ctx, '🌲', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 26);
    } else if (ch === 'F') {
      // 花
      this.drawEmoji(ctx, '🌸', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 20);
    } else if (ch === 'C') {
      // 城
      ctx.fillStyle = '#6c3a1a';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      this.drawEmoji(ctx, '🏰', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 28);
    }
  },

  drawEnemy(ctx, e) {
    const def = ENEMY_TYPES[e.type];
    const color = def.colorByLevel[e.level] || '#888';
    const px = e.x * TILE_SIZE;
    const py = e.y * TILE_SIZE;

    // レベルカラーの背景輪郭
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 敵のemoji
    this.drawEmoji(ctx, def.emoji, px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 22);

    // レベルバッジ
    ctx.fillStyle = '#000';
    ctx.fillRect(px + TILE_SIZE - 14, py + TILE_SIZE - 12, 12, 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.level, px + TILE_SIZE - 8, py + TILE_SIZE - 7);
  },

  drawPlayer(ctx) {
    const px = this.player.x * TILE_SIZE;
    const py = this.player.y * TILE_SIZE;

    // プレイヤーの輪郭
    ctx.fillStyle = '#f6c453';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    this.drawEmoji(ctx, PLAYER_SPRITE.emoji, px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 24);
  },

  drawLockOverlay(ctx) {
    const px = CASTLE_POS.x * TILE_SIZE;
    const py = CASTLE_POS.y * TILE_SIZE;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    this.drawEmoji(ctx, '🔒', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 18);
  },

  drawEmoji(ctx, emoji, cx, cy, size) {
    ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(emoji, cx, cy);
  }
};
