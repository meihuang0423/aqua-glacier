# Aqua Glacier 0.1.0｜獨立手機美化擴充

這是獨立的 SillyTavern 外觀擴充，不是 st-brume 的修改版。
預設關閉。請先將先前試貼的 Aqua CSS 複製保存，再從「自訂 CSS」中移除；不要刪除不屬於本次美化的其他 CSS。
保留黑森林啟用及其功能設定。Aqua Glacier 啟用時疊加外層介面，停用時恢復原外觀。

## 檔案

```
public/scripts/extensions/third-party/aqua-glacier/
  manifest.json
  index.js
  style.css
  assets/README.md
  assets/penguin-otter.png   ← 需補原始透明圖，套件尚未包含
```

## 安裝位置（兩種擇一，不要安裝兩份）

標準程式根目錄安裝：
`<SillyTavern>/public/scripts/extensions/third-party/aqua-glacier/`

Railway 官方 Docker 建議使用每使用者擴充目錄，讓檔案隨永久磁碟保存：
`/home/node/app/data/default-user/extensions/aqua-glacier/`

注意：後者底下不要再加 third-party/。它與 public/scripts/extensions/third-party 的實體位置不同，但由酒館以相同 URL 方式提供檔案。本次測試採程式根目錄安裝；Railway 實際使用者路徑與部署尚未執行。

下載安裝包後解壓縮，將完整 aqua-glacier 資料夾放入其中一個位置，再重新整理酒館。這不是角色卡，不要用角色匯入。ZIP 也不能直接當 GitHub 擴充網址使用。

若要用「安裝擴充功能」按鈕安裝，需將 aqua-glacier 裡的 manifest.json、index.js、style.css、assets 放在獨立 GitHub 儲存庫根目錄，再用該儲存庫網址安裝。自動更新預設關閉。

## 啟用

1. 開「擴充功能」，找到 Aqua Glacier · 冰川海洋。
2. 展開設定，勾「啟用 Aqua Glacier」。黑森林保持啟用。
3. 調整玻璃不透明度（55–98%）、背景亮度（85–110%）。
4. 插畫可顯示／隱藏、寬度可調（42–110px）；泡泡動畫預設關閉。
5. 變更透過 extensionSettings.aqua_glacier 與 saveSettingsDebounced 保存，會跟隨目前酒館使用者；不是僅存瀏覽器 localStorage。

停用主題時移除主題屬性、插畫與泡泡 DOM 及 Aqua 自己的 inline 變數；Aqua 設定區保留，以便重新開啟。資料仍保留，不會改黑森林設定。

## 雙動物插畫

請將對話中選定的「同一張直式企鵝＋亞洲小爪水獺」原始透明 PNG 放在 `assets/penguin-otter.png`。
目前工作區沒有該原始檔。已有 RAR 只有分開的動物素材，所以本版沒有擅自拼圖或用其他插畫代替。
請確認透明 alpha，而非將灰白棋盤格畫進圖片。建議寬480–800px，小於2MB。

圖片缺少時仍可使用主題，面板會顯示提示，不顯示破圖或 Emoji。
圖片有了之後，手機 >=375px 會在右側預留最多螢幕22%的窄欄，避免壓在文字、頭像和輸入框上；會減少聊天可用寬度，可自行關閉。360px自動隱藏。手機輸入框聚焦時預先隱藏（比單靠鍵盤偵測更保守），彈窗和角色側欄開啟時隱藏。

## 安全與相容性

- 不修改、刪除、搬移 st-brume 檔案；不寫它的設定、屬性、Skin 或變數。
- 不讀寫角色、聊天、模型金鑰、token、世界書、記憶或生成請求。
- 不重建酒館現有節點，不攔截既有按鈕事件。只建立 Aqua 自己的設定區及裝飾層。
- CSS 不使用 .mes/.mes_text 規則，不重設訊息內 HTML、圖片、按鈕、iframe 或樣式。
- 黑森林的原始聊天訊息風格保留；本版重點是外層 UI。這是為保護角色卡自訂內容所作的限制。
- 不覆蓋 #bg1/#bg_custom 的背景圖片。海洋漸層畫在背景圖片下方，已選的不透明背景會遮住它。亮度只調 Aqua 自己的漸層，不處理原背景圖片或整頁文字。
- 為避免讓 fixed 側欄改變定位，不在頂部工具列套 backdrop-filter；以半透明水光背景呈現。磨砂只放在輸入框，面板提高不透明度以保可讀。
- 所有變數使用 ag-；loading_order 200（黑森林100），另以主題作用域＋少量必要 !important 覆寫其強制外層樣式，不依賴載入先後保證。
- 切換黑森林 Skin 保留其功能，外層仍由 Aqua 配色。關掉 Aqua 即看回該 Skin 原貌。
- 不改黑森林管理的 theme-color（手機狀態列／PWA 系統列可能仍保留黑森林色）。
- 既有擴充內部深色卡片、特殊世界書編輯器、第三方 iframe 不強制染色；無法安全套色的部分保留。
- 支援 prefers-reduced-motion；動畫只用 transform/opacity，預設不開啟。
- 未承諾與未來酒館及黑森林版本永遠相容。

## 移除／復原

先取消 Aqua 的啟用勾選即可復原。要完全移除，可只刪除 aqua-glacier 資料夾後重新整理；不要刪除 data 或 st-brume。保存的 aqua_glacier 設定不會自動刪除（避免誤動使用者設定檔）。

## 測試

詳見 TEST-REPORT.md。測試用官方1.19.0與公開黑森林3.26.3的副本，沒有連到你的Railway正式資料。沒有實際手機鍵盤或模型呼叫測試。
