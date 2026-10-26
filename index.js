import { getContext } from '../../../st-context.js';

// Appearance only: no chat events, request hooks, or third-party settings writes.
const KEY = 'aqua_glacier';
const INSTANCE = Symbol.for('aqua-glacier.instance');
const DEFAULTS = Object.freeze({ enabled: false, opacity: 78, brightness: 100, decoration: true, bubbles: false, size: 76 });
const root = document.documentElement;
const assetURL = new URL('./assets/penguin-otter.png', import.meta.url).href;

function normalize(value = {}) {
    const number = (key, min, max) => Number.isFinite(Number(value[key]))
        ? Math.min(max, Math.max(min, Number(value[key]))) : DEFAULTS[key];
    const bool = key => typeof value[key] === 'boolean' ? value[key] : DEFAULTS[key];
    return { enabled: bool('enabled'), opacity: number('opacity', 55, 98), brightness: number('brightness', 85, 110), decoration: bool('decoration'), bubbles: bool('bubbles'), size: number('size', 42, 110) };
}

async function initialize() {
    window[INSTANCE]?.destroy();
    const ctx = getContext();
    if (!ctx?.extensionSettings || typeof ctx.saveSettingsDebounced !== 'function') {
        console.warn('[Aqua Glacier] Settings API unavailable; theme not enabled.');
        return;
    }
    const host = document.querySelector('#extensions_settings2') || document.querySelector('#extensions_settings');
    if (!host) {
        console.warn('[Aqua Glacier] Extension settings container not found.');
        return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    let settings = normalize(ctx.extensionSettings[KEY]);
    let ready = false;
    let assetReady = false;
    let layer;
    let frame = 0;
    const initialViewport = window.visualViewport?.height || window.innerHeight;
    let largestViewport = initialViewport;
    const panel = document.createElement('details');
    panel.id = 'ag-settings';
    panel.innerHTML = `
      <summary>Aqua Glacier · 冰川海洋 <small>0.1.2</small></summary>
      <div class="ag-settings-body">
        <p>獨立外觀層；不更動黑森林設定、訊息內容或模型。</p>
        <label class="ag-check"><input type="checkbox" data-ag-setting="enabled">啟用 Aqua Glacier</label>
        <label class="ag-range">玻璃不透明度 <output data-ag-output="opacity"></output><input type="range" min="55" max="98" step="1" data-ag-setting="opacity"></label>
        <label class="ag-range">背景亮度 <output data-ag-output="brightness"></output><input type="range" min="85" max="110" step="1" data-ag-setting="brightness"></label>
        <label class="ag-check"><input type="checkbox" data-ag-setting="decoration">顯示雙動物插畫</label>
        <label class="ag-range">插畫高度 <output data-ag-output="size"></output><input type="range" min="42" max="110" step="1" data-ag-setting="size"></label>
        <label class="ag-check"><input type="checkbox" data-ag-setting="bubbles">緩慢泡泡動畫</label>
        <p class="ag-asset-status" role="status"></p>
        <p>插畫放在輸入框上方的左側裝飾列，不縮窄聊天。輸入、開啟選單或視窗太矮時暫時隱藏。</p><p class="ag-motion-status" role="status"></p>
        <button type="button" class="menu_button" data-ag-reset>重設 Aqua Glacier</button>
      </div>`;
    host.append(panel);
    const status = panel.querySelector('.ag-asset-status');
    const updateControls = () => {
        panel.querySelectorAll('[data-ag-setting]').forEach(input => {
            const key = input.dataset.agSetting;
            if (input.type === 'checkbox') input.checked = settings[key];
            else input.value = settings[key];
        });
        panel.querySelectorAll('[data-ag-output]').forEach(output => {
            const key = output.dataset.agOutput;
            output.value = `${settings[key]}${key === 'size' ? 'px' : '%'}`;
        });
    };
    function removeEffects() {
        root.removeAttribute('data-ag-theme');
        root.removeAttribute('data-ag-rail');
        root.removeAttribute('data-ag-keyboard');
        for (const name of ['--ag-glass-alpha', '--ag-brightness', '--ag-art-width', '--ag-rail-width', '--ag-input-height', '--ag-dock-height']) root.style.removeProperty(name);
        layer?.remove();
        layer = undefined;
    }
    function measure() {
        frame = 0;
        if (!settings.enabled || !layer) return;
        const viewport = window.visualViewport;
        const height = viewport?.height || window.innerHeight;
        largestViewport = Math.max(largestViewport, height);
        const isEditing = Boolean(document.activeElement?.matches('textarea, input:not([type=range]):not([type=checkbox]), [contenteditable="true"]'));
        const keyboard = isEditing && (window.innerWidth < 768 || height < largestViewport - 140);
        root.toggleAttribute('data-ag-keyboard', keyboard);
        // Never resize or reposition #sheld: st-brume and TopInfoBar own its layout.
        root.removeAttribute('data-ag-rail');
        const inputHost = document.querySelector('#form_sheld');
        if (inputHost && layer.parentElement !== inputHost) inputHost.prepend(layer);
        const floatingPanel = [...document.querySelectorAll('dialog[open], .drawer-content.openDrawer')].some(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 40 && rect.height > 40 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < height && style.visibility !== 'hidden' && Number(style.opacity) > .05;
        });
        const suppress = keyboard || floatingPanel || height < 420 || !inputHost;
        const showArt = settings.decoration && assetReady && !suppress;
        const showBubbles = settings.bubbles && !suppress;
        layer.hidden = !showArt && !showBubbles;
        layer.querySelector('.ag-art').hidden = !showArt;
        layer.querySelector('.ag-bubbles').hidden = !showBubbles;
        root.style.setProperty('--ag-dock-height', `${showArt ? Math.min(settings.size, height * .14) : 34}px`);
        layer.classList.toggle('ag-animate', settings.bubbles);
        const motion = panel.querySelector('.ag-motion-status');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const message = settings.bubbles && reduced ? '系統啟用了「減少動態」，泡泡會保留但不移動。' : '泡泡動畫僅出現在底部裝飾列，不遮住正文。';
        if (motion.textContent !== message) motion.textContent = message;
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    function apply() {
        if (!settings.enabled) { removeEffects(); return; }
        root.dataset.agTheme = 'on';
        root.style.setProperty('--ag-glass-alpha', String(settings.opacity / 100));
        root.style.setProperty('--ag-brightness', String(settings.brightness / 100));
        root.style.setProperty('--ag-art-width', `${settings.size}px`);
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'ag-decoration';
            layer.setAttribute('aria-hidden', 'true');
            layer.innerHTML = '<div class="ag-bubbles"><i></i><i></i><i></i></div>';
            const image = document.createElement('img');
            image.className = 'ag-art';
            image.alt = '';
            image.draggable = false;
            image.hidden = true;
            if (assetReady) image.src = assetURL;
            layer.append(image);
            const inputHost = document.querySelector('#form_sheld');
            if (inputHost) inputHost.prepend(layer);
            else { layer.hidden = true; document.body.append(layer); }
        }
        schedule();
    }
    const persist = () => {
        ctx.extensionSettings[KEY] = { ...settings };
        ctx.saveSettingsDebounced();
    };
    panel.addEventListener('input', event => {
        const input = event.target.closest('[data-ag-setting]');
        if (!input) return;
        settings = normalize({ ...settings, [input.dataset.agSetting]: input.type === 'checkbox' ? input.checked : Number(input.value) });
        updateControls(); apply(); persist();
    }, { signal });
    panel.querySelector('[data-ag-reset]').addEventListener('click', () => {
        settings = { ...DEFAULTS }; updateControls(); apply(); persist();
    }, { signal });
    const observer = new MutationObserver(schedule);
    // Attribute-only read observation: never writes or removes st-brume attributes.
    observer.observe(root, { attributes: true, attributeFilter: ['data-foret', 'data-foret-skin', 'data-foret-immersive', 'data-foret-tools'] });
    const bodyObserver = new MutationObserver(records => {
        if (records.some(record => record.target !== layer && !layer?.contains(record.target) && !record.target.closest?.('#chat'))) schedule();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'class'] });
    window.addEventListener('resize', schedule, { signal, passive: true });
    window.visualViewport?.addEventListener('resize', schedule, { signal, passive: true });
    document.addEventListener('click', schedule, { signal, passive: true });
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', schedule, { signal });
    document.addEventListener('focusin', schedule, { signal });
    document.addEventListener('focusout', schedule, { signal });
    const probe = new Image();
    probe.onload = () => {
        if (signal.aborted) return;
        assetReady = true;
        status.textContent = '雙動物素材已載入。';
        const image = layer?.querySelector('.ag-art');
        if (image) image.src = assetURL;
        schedule();
    };
    probe.onerror = () => {
        if (signal.aborted) return;
        status.textContent = '圖片載入失敗：請更新 Aqua Glacier 並重新整理。圖片路徑為 assets/penguin-otter.png。';
    };
    probe.src = assetURL;
    window[INSTANCE] = {
        destroy() {
            controller.abort(); observer.disconnect(); bodyObserver.disconnect();
            if (frame) cancelAnimationFrame(frame);
            probe.onload = null; probe.onerror = null;
            removeEffects(); panel.remove(); ready = false;
        },
        get ready() { return ready; },
    };
    ready = true;
    updateControls(); apply();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();
