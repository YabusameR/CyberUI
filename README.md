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

npm 未公開のため、ほかのプロジェクトからは GitHub を指定してインストールします。インストール時に `prepare` スクリプトでビルドされ、`dist/` が入ります。

```bash
npm install github:YabusameR/CyberUI#<コミットのハッシュ>
```

```tsx
import { FuiGridProvider, HudFrame, CyberButton } from '@fui-ui/react';

export function Panel() {
  return (
    <FuiGridProvider theme="cyan" animationMode="balanced">
      <HudFrame className="p-6" animatedBorder>
        <CyberButton variant="danger" soundOnClick onClick={() => console.log('override')}>
          EMERGENCY OVERRIDE
        </CyberButton>
      </HudFrame>
    </FuiGridProvider>
  );
}
```

スタイルはコンポーネントの初回描画時に自動で `<head>` に注入されるため、CSSのimportは不要です。
SSRで初回HTMLに含めたい場合は `fuiStyles`（CSS文字列）を `<style>` に出力するか、`@fui-ui/react/styles.css` を読み込んでください。

## サンプル（demo/）
ブラウザの実測値を表示する **Runtime Monitor** です。
- FPS・最悪フレーム時間（rAFで実測）、ストレステストで劣化を再現
- 自オリジンへのレイテンシ計測（レーダーに12サンプルを表示）、オンライン/オフライン検知
- JSヒープ・DOMノード数、ページロードのナビゲーションタイミング
- Long Task・タブ切替・設定変更などの実イベントログ（`DataStreamTicker` の controlled モード）

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
- `HudToggle` は `role="switch"`。ON/OFF の文字は飾りで状態は `aria-checked` で伝えるため、**`label` か `aria-label` / `aria-labelledby` が必須**です（型で必須にしています）。
- `CircularGauge` は `role="meter"`。`aria-valuetext` で単位付きの値（例：`60 fps`）を読み上げます。名前は `label` から付きます。
- `StatusBadge` は `live` を付けたときだけ `role="status"`（変化を読み上げるライブリージョン）になります。変わらないバッジはライブリージョンにしません。
- `DataStreamTicker` は縦型が `role="log"`（`live` 指定で読み上げ）。横に流れる型はポインタを乗せるかフォーカスすると止まります（WCAG 2.2.2：動き続けるものは止められること）。
- `FuiGridItem` は `coordinate` か `label` があるとき、その名前の付いたグループ（`role="group"`）になります。ランドマーク（`<section>`）にはしないので、パネルが多くてもランドマーク一覧が埋まりません。
- `Typewriter` のカーソルは 5 回点滅したら点灯したままになります（WCAG 2.2.2：点滅は 5 秒以内に止める）。
- `CyberButton` はキーボードフォーカス時（`:focus-visible`）にターゲットレティクルを出し、ホバーと同じく枠が光ります。無効（`disabled`）のときはホバーにも反応しません。
- Windows のコントラストテーマ（`forced-colors: active`）では、ボタンとトグルにシステム色の枠とフォーカス枠を付けます（`clip-path` で描いた背景はこのモードで消えるため）。
- 文字選択とスクロールバーはアクセント色になります。

## 効果音
Web Audio API の `AudioContext` で正弦波・矩形波・ノイズをその場で合成するため、音声ファイルは不要です。
`<CyberButton soundOnClick>`（`"click" | "confirm" | "alert" | "hover" | "noise"` も指定可）。
