# @fui-ui/react v3.0

SF映画・ゲームの **FUI / HUD / ホログラムUI** をReactで実現するコンポーネントライブラリ。
アニメーションは `transform` / `opacity` と `requestAnimationFrame` だけで駆動し、`prefers-reduced-motion` に完全対応しています。

## セットアップ

```bash
npm install
npm run dev         # ショーケース (demo/) を起動
npm run build       # dist/ にライブラリ (ESM + CSS + 型定義) を出力
npm run build:demo  # dist-demo/ に静的デモを出力
```

```tsx
import { FuiGridProvider, HudFrame, CyberButton } from '@fui-ui/react';
import '@fui-ui/react/styles.css';
```

## アニメーションモード

`<FuiGridProvider animationMode="...">`（または単体の `<AnimationProvider mode="...">`）で全体を切り替えます。

| モード | 挙動 |
| --- | --- |
| `cinematic` | 全エフェクト（SVGグロー、強いブラー、シマー、色収差グリッチ）を有効 |
| `balanced` (既定) | CSS/GPU駆動のモーションのみ。SVGフィルター系は抑制 |
| `minimal` | 起動・遷移モーションのみ。走査線・フリッカー・回転スイープなどのループを停止 |
| `reduced-motion` | OSの `prefers-reduced-motion: reduce` を検知すると自動適用。移動・明滅をすべて停止 |

`respectReducedMotion={false}` でOS設定の自動適用を無効化できます。`sound={false}` で効果音を全体ミュート。

## コンポーネント

| 分類 | コンポーネント |
| --- | --- |
| Layout & Grid | `FuiGridProvider`, `FuiGrid`, `FuiCol`, `FuiGridItem`, `HudFrame`, `HolographicPanel` |
| Motion | `BootSequence` (`StaggerContainer`), `DataScrambleText`, `Typewriter`, `AnimatedNumber`, `ScanlineOverlay`, `HolographicFlicker`, `GlitchBox` |
| Controls & Indicators | `CyberButton`, `HudToggle`, `StatusBadge`, `DataStreamTicker`, `CircularGauge`, `HudRadar` |
| Utilities | `useAnimation`, `useBootStep`, `useAnimatedNumber`, `useRafLoop`, `playSound`, `playBeep`, `playNoise` |

### 起動シーケンス
`<BootSequence staggerDelay={0.12}>` の内側にある起動対応コンポーネント（GridItem / Frame / Panel / Button / Badge / Gauge / Radar / Ticker）は、**DOM順**に段階的に出現します。
フレームはSVGの `stroke-dashoffset` で線を描画 → パネルは中央線から展開 → 内側の `DataScrambleText triggerOnMount` / `Typewriter` は親のステップ完了に合わせて開始します。
自作コンポーネントも `useBootStep(ref)` で参加できます。

### グリッド
- `span={8}` はデスクトップ (≥768px) で8カラム、それ未満では全幅で縦積み。
- `span={{ base: 12, md: 6, lg: 4 }}` でブレークポイントごとに指定可能。
- `coordinate="SEC-01:A"` で `[SEC-01:A]` タグ、`<FuiGrid crosshairs>` で角レティクル、`showGridLines` で12カラムのガイド線を表示。

### テーマ
`theme="cyan" | "magenta" | "amber"`。個別要素は `tone` / `variant`（`cyan` `magenta` `amber` `danger` `success`）で上書き可能。
色はすべて `--fui-*-rgb` のCSS変数（RGBトリプレット）なので、`:root` で上書きすればブランドカラーに差し替えられます。

## アクセシビリティ
- `DataScrambleText` / `Typewriter` / `AnimatedNumber` は、スクリーンリーダー向けに最終値のみを読み上げ、アニメーション中の文字は `aria-hidden` にしています。
- `HudToggle` は `role="switch"`、`CircularGauge` は `role="meter"`、`StatusBadge` は `role="status"`、`DataStreamTicker` は `role="log"`（`live` 指定で読み上げ）。
- `CyberButton` はキーボードフォーカス時（`:focus-visible`）にターゲットレティクルを表示します。

## 効果音
Web Audio API の `AudioContext` で正弦波・矩形波・ノイズをその場で合成するため、音声ファイルは不要です。
`<CyberButton soundOnClick>`（`"click" | "confirm" | "alert" | "hover" | "noise"` も指定可）。
