# Datadog Quest

Datadog王国を旅して、Datadogのスキル(APM/RUM・インフラ・セキュリティ・Agent Observability・CI/CD・SLO・Integration)を試すNES風レトロRPG。
ブラウザで動作し、Node.js + Expressのシンプル構成。

![mode](https://img.shields.io/badge/style-NES%20retro-yellow)
![lang](https://img.shields.io/badge/lang-Japanese-blue)
![node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen)

## 🎮 ゲームの概要

- 偽物の魔王 **DARK BITS** に乗っ取られた Datadog王国を救う冒険RPG
- ドラゴンクエスト風のタイルベースフィールドを移動
- 敵に触れるとバトル開始 → Datadog関連の四択クイズに正解で撃破
- 6種類×Lv1/Lv2、合計12体の敵を倒すと王城の封印が解け、**DARK BITS** との決戦に挑める
- ボス戦は高難度問題が5問

### 出題カテゴリ

| カテゴリ | 説明 |
| -- | -- |
| APM & RUM | 分散トレーシング、Span、RUM Core Web Vitals 等 |
| インフラ | Agent、Kubernetes、Autodiscovery、Cluster Agent 等 |
| セキュリティ | Cloud SIEM、ASM、CSM、CWS、SDS 等 |
| Agent Observability | LLM Observability、Quality Evaluations、RAG計装 等 |
| CI/CD | CI Visibility、Test Optimization、ITR、Deployment Tracking 等 |
| SLO | SLI/SLO/Error Budget、Burn Rate、Multi-window 等 |
| Integration & 計装 | OTel、AWS、Lambda、Admission Controller、SSI 等 |

### 敵キャラ(レベルは色で表現)

- スライム / まほうつかい / ガイコツ / コウモリ / ハチ / ドラゴン
- ボス: 🐕 **DARK BITS**(Bitsを名乗る偽物の魔王)

### 機能

- タイルベース移動(矢印キー / WASD)
- 12体の敵はゲーム開始時にランダム配置
- 正解選択肢の表示順序もランダム化
- プレイヤー名入力 → イントロムービー → 冒険開始
- HUDにHP/プレイ時間/撃破数を表示
- セーブはlocalStorage + サーバー側JSONの二重化(同一プレイヤーIDで継続)
- スコア = `(正解率 × 10000) − 経過秒数`
- タイトル & エンディングからランキング閲覧(上位20件)

## 🚀 ローカル起動

### 必要環境

- Node.js 18 以上
- npm

### 手順

```bash
npm install
npm start
```

ブラウザで `http://localhost:3000` を開いて遊べます。

ポート変更したい場合:

```bash
PORT=8080 npm start
```

## 🎯 ゲームコントロール

| 入力 | 動作 |
| -- | -- |
| ↑↓←→ / WASD | プレイヤー移動 |
| クリック | 選択肢を選ぶ / ボタン |
| Enter | 名前入力モーダル確定 |

## 🐳 Dockerでの起動

```bash
docker build -t datadog-quest .
docker run -p 3000:3000 -v $(pwd)/data:/app/data datadog-quest
```

または `docker compose`:

```bash
docker compose up --build
```

> `data/` をボリュームマウントすることで、コンテナ再作成後もセーブとランキングが残ります。

## ☁️ クラウドへのデプロイ

### 共通の注意 - 永続化

このアプリはセーブとランキングを **ファイルシステム(`data/`)** に保存します。
FSが揮発する環境(Cloud Run, AWS Lambda, ECS Fargate without EFS など)では
インスタンス再起動でデータが消えます。本格運用では以下のいずれかを推奨:

- 永続ボリュームをマウントする(EFS / Persistent Disk / Render Disk 等)
- 外部ストア(Redis、Postgres、Datadog KVなど)に移行する

### Cloud Run へのデプロイ例

```bash
# build & push
gcloud builds submit --tag gcr.io/$PROJECT_ID/datadog-quest

# deploy (※デモ用途・永続化なし)
gcloud run deploy datadog-quest \
  --image gcr.io/$PROJECT_ID/datadog-quest \
  --region asia-northeast1 \
  --allow-unauthenticated
```

永続化が必要なら **GCS FUSE** をマウント、または Cloud Run Volumes を利用。

### AWS ECS Fargate へのデプロイ概要

1. ECRにイメージをpush
2. ECS Task Definitionで `data/` をEFSにマウント
3. ALBまたはPublic IPで公開

### Render / Railway / Fly.io

`Dockerfile` をそのまま検出してデプロイ可能。Persistent Disk を有効化して `data/` をマウントしてください。

## 📁 ディレクトリ構成

```
.
├── server.js              # Express サーバー(API + 静的配信)
├── package.json
├── Dockerfile
├── docker-compose.yml
├── data/
│   ├── questions.json     # 問題バンク
│   ├── ranking.json       # ランキング(自動生成・gitignore)
│   └── saves/             # プレイヤー別セーブ(自動生成・gitignore)
└── public/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── game.js        # メイン状態機
        ├── map.js         # フィールドマップ
        ├── battle.js      # バトル & 出題
        ├── questions.js   # 問題管理 & ランダム選択
        ├── save.js        # セーブ & ランキングAPI
        └── sprites.js     # キャラ定義
```

## 🔌 APIエンドポイント

| Method | Path | 説明 |
| -- | -- | -- |
| GET  | `/api/questions` | 問題バンクを返す |
| GET  | `/api/save/:playerId` | セーブを返す(存在しなければ `{exists:false}`) |
| POST | `/api/save/:playerId` | セーブを保存 |
| DELETE | `/api/save/:playerId` | セーブを削除 |
| GET  | `/api/ranking?limit=20` | ランキング上位を返す |
| POST | `/api/ranking` | スコアを登録 |

## 🛠 問題を追加・編集する

`data/questions.json` を編集してください。フォーマット:

```json
{
  "id": "apm_2_x",
  "category": "apm_rum",
  "level": 2,
  "question": "問題文",
  "choices": ["A", "B", "C", "D"],
  "answer": 0,
  "explanation": "解説"
}
```

- `level`: 1=Lv1, 2=Lv2, 3=ボス用(`id` を `boss_*` にすると専用プールに)
- `answer`: `choices` 内の正解 index(クライアント側で順序をランダム化するので0でOK)

## 📜 ライセンス

[MIT](./LICENSE)
