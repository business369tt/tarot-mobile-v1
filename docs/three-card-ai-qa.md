# 三張牌 AI 驗收

最後更新：2026-04-09

這份文件只針對目前正式主線的 `直答三張牌`。
目標不是擴功能，而是把三張牌的主解讀與追問品質固定成可重複驗收的流程。

## 驗收腳本

- `npm run validate:three-card`
  - 跑單一案例。
- `npm run validate:three-card:suite`
  - 跑 5 組預設案例。
- `npm run validate:three-card:suite:live`
  - 跑 5 組預設案例，要求一定要有真實 MiniMax 回應，並套用最低分數門檻。

## 使用方式

### 1. 列出可用案例

```powershell
npm run validate:three-card -- --list-presets
```

### 2. 跑單一案例

```powershell
npm run validate:three-card -- --preset career-collab
```

### 3. 覆寫問題、分類、牌組與追問

```powershell
npm run validate:three-card -- --question "我應不應該在這個月主動提出合作邀請？" --category career --cards the-hermit,eight-of-swords,ace-of-wands --followup "如果我真的主動提出合作邀請，第一句最適合怎麼說？"
```

### 4. 只驗主解讀，不驗追問

```powershell
npm run validate:three-card -- --preset self-burnout --no-followup
```

### 5. 輸出 JSON 結果

```powershell
npm run validate:three-card:suite -- --json
```

## 真實 MiniMax 驗收

本地若沒有 `MINIMAX_API_KEY`，腳本只會跑 fallback 結構驗證，不算完成 AI 驗收。

要做真實 AI 驗收時，請先確認環境變數有值，再跑：

```powershell
npm run validate:three-card:suite:live
```

目前預設門檻：

- 主解讀最低分數：`90`
- 追問最低分數：`88`

如果要更嚴格，也可以直接加參數：

```powershell
npm run validate:three-card:suite -- --require-live --min-reading-score 92 --min-followup-score 90 --fail-on-issues
```

## 通過標準

- 每個案例都要進入 `live` 狀態，而不是 `fallback-only`
- 主解讀分數不得低於門檻
- 追問分數不得低於門檻
- 若加上 `--fail-on-issues`，則 `qualityIssueCodes` 必須為空

## 預設案例

- `career-collab`
  - 事業合作邀請
- `love-reconnect`
  - 感情重新聯絡
- `self-burnout`
  - 自我狀態調整
- `decision-offer`
  - 抉擇是否接受
- `timing-next-step`
  - 時機與節奏

## 建議流程

1. 先跑 `npm run validate:three-card:suite`
2. 確認本地 fallback 結構、牌位、段落標題都正常
3. 補上 `MINIMAX_API_KEY`
4. 跑 `npm run validate:three-card:suite:live`
5. 若有 fail，優先回修 `src/lib/minimax-reading.ts`
6. 回修後重新跑 `lint`、`build`、`validate:three-card:suite:live`
