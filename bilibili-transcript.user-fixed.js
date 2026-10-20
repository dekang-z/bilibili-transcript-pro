// ==UserScript==
// @name         B站字幕提取器
// @namespace    https://blog.qitongtingyu.online/
// @version      1.3.2
// @description  从B站视频页面提取字幕文本，支持单个/分P合集批量下载，多种字幕导出格式，字幕搜索定位，自定义保存路径
// @author       栖桐听雨
// @match        https://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @connect      api.bilibili.com
// @connect      aisubtitle.hdslb.com
// @run-at       document-end
// @license      MIT
// ==/UserScript==
(function () {
    'use strict';
    const CONFIG = {
        CACHE_MAX_SIZE: 50,
        CACHE_MAX_AGE: 3600000,
        REQUEST_TIMEOUT: 10000,
        REQUEST_RETRIES: 2,
        REQUEST_RETRY_DELAY: 1000,
        STORAGE_KEYS: {
            CUSTOM_EXTENSIONS: 'bili_transcript_custom_extensions',
            DOWNLOAD_SETTINGS: 'bili_transcript_download_settings'
        },
        PRESET_EXTENSIONS: [
            { name: 'TXT', value: 'txt', mimeType: 'text/plain' },
            { name: 'MD', value: 'md', mimeType: 'text/markdown' },
            { name: 'CSV', value: 'csv', mimeType: 'text/csv' },
            { name: 'XML', value: 'xml', mimeType: 'application/xml' },
            { name: 'HTML', value: 'html', mimeType: 'text/html' },
            { name: 'SRT', value: 'srt', mimeType: 'text/x-subrip' },
            { name: 'VTT', value: 'vtt', mimeType: 'text/vtt' },
            { name: 'ASS', value: 'ass', mimeType: 'text/x-ass' },
            { name: 'LRC', value: 'lrc', mimeType: 'text/lrc' },
            { name: 'JSON', value: 'json', mimeType: 'application/json' }
        ],
        DEFAULT_DOWNLOAD_SETTINGS: {
            format: 'txt',
            downloadMethod: 'direct',
            includeBV: false,
            includeTimestamp: false,
            includeDuration: false,
            includeSubtitleTime: false,
            savePath: '',
            askBeforeSave: false,
            batchUseCollectionFolder: true,
            batchFolderTipShown: false
        }
    };

    // 通用SVG图标
    const ICONS = {
        doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>',
        settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
        download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        batch: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4M12 17h.01"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };

    // ===== 存储管理 =====
    const StorageManager = {
        getCustomExtensions() {
            try {
                const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_EXTENSIONS);
                return saved ? JSON.parse(saved) : [];
            } catch (e) { return []; }
        },
        saveCustomExtensions(ext) {
            try { localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_EXTENSIONS, JSON.stringify(ext)); } catch (e) {}
        },
        getDownloadSettings() {
            try {
                const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DOWNLOAD_SETTINGS);
                return saved ? JSON.parse(saved) : CONFIG.DEFAULT_DOWNLOAD_SETTINGS;
            } catch (e) { return CONFIG.DEFAULT_DOWNLOAD_SETTINGS; }
        },
        saveDownloadSettings(s) {
            try { localStorage.setItem(CONFIG.STORAGE_KEYS.DOWNLOAD_SETTINGS, JSON.stringify(s)); } catch (e) {}
        }
    };

    let state = {
        currentVideo: { bvid: '', cid: '', title: '', duration: 0 },
        videoList: [],
        videoListType: 'single',
        subtitleList: [],
        subtitleDetails: [],
        modalOpenCount: 0,
        searchResults: [],
        currentSearchIndex: -1
    };

    // ===== 工具函数 =====
    function showToast(msg, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `bili-transcript-toast bili-transcript-toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${ICONS[type]}</span><span class="toast-message">${msg}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function sanitizeInput(s) {
        if (typeof s !== 'string') return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
    }

    function escapeCSV(v) {
        if (typeof v !== 'string') return '';
        return v.includes(',') || v.includes('"') || v.includes('\n')
            ? '"' + v.replace(/"/g, '""') + '"' : v;
    }

    function getHeaders() {
        const cookies = Object.fromEntries(
            document.cookie.split(';').map(c => c.trim().split('=')).filter(([k, v]) => k && v)
        );
        const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
        return {
            'Referer': 'https://www.bilibili.com',
            'User-Agent': navigator.userAgent,
            'Cookie': cookieStr.trim()
        };
    }

    async function request(url, options = {}) {
        const { timeout = CONFIG.REQUEST_TIMEOUT, retries = CONFIG.REQUEST_RETRIES, retryDelay = CONFIG.REQUEST_RETRY_DELAY, raw = false } = options;
        return new Promise((resolve, reject) => {
            let attempts = 0;
            function attempt() {
                attempts++;
                const timer = setTimeout(() => {
                    attempts <= retries ? setTimeout(attempt, retryDelay) : reject(new Error('请求超时'));
                }, timeout);
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url: url,
                    headers: options.headers || getHeaders(),
                    timeout: timeout,
                    onload: (res) => {
                        clearTimeout(timer);
                        if (raw) return resolve(res.responseText);
                        try {
                            const data = JSON.parse(res.responseText);
                            data.code === 0 ? resolve(data) : reject(new Error(data.message || 'API请求失败'));
                        } catch (e) { reject(new Error('响应格式错误')); }
                    },
                    onerror: () => {
                        clearTimeout(timer);
                        attempts <= retries ? setTimeout(attempt, retryDelay) : reject(new Error('网络请求失败'));
                    }
                });
            }
            attempt();
        });
    }

    async function getVideoInfo(bvid) {
        try { return await request(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`); }
        catch (e) {
            const title = document.querySelector('.video-title')?.textContent;
            const cid = window.__INITIAL_STATE__?.videoData?.cid;
            if (title && cid) return { data: { title, cid } };
            throw e;
        }
    }

    async function getVideoPages(bvid) {
        try {
            const res = await request(`https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`);
            return res.data || [];
        } catch (e) { return []; }
    }

    async function fetchSubtitles(bvid, cid) {
        const url = `https://api.bilibili.com/x/player/wbi/v2?bvid=${bvid}&cid=${cid}`;
        const res = await request(url, {
            headers: { 'Referer': `https://www.bilibili.com/video/${bvid}/`, 'Origin': 'https://www.bilibili.com' }
        });
        return res.data?.subtitle?.subtitles?.map(s => ({
            id: s.id,
            lan: s.lan_doc || s.lan,
            url: s.subtitle_url || s.url || ''
        })) || [];
    }

    async function getSubtitleContent(url, bvid, cid) {
        if (!url) return [];
        const fullUrl = url.startsWith('//') ? `https:${url}` : url;
        try {
            const res = await request(fullUrl, { raw: true });
            const data = JSON.parse(res);
            return data.body || [];
        } catch (e) { return []; }
    }

    function formatTime(seconds, format = 'srt') {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        if (format === 'srt') {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
        }
        if (format === 'ass') {
            return `${h.toString().padStart(1, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
        }
        if (format === 'lrc') {
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
        }
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // ===== 格式转换 =====
    function convertToSRT(content) {
        return content.map((item, i) => {
            const from = formatTime(item.from, 'srt');
            const to = formatTime(item.to, 'srt');
            return `${i + 1}\n${from} --> ${to}\n${item.content}\n`;
        }).join('\n');
    }
    function convertToTXT(content, includeTime = false) {
        return content.map(item => includeTime ? `${formatTime(item.from)} ${item.content}` : item.content).join('\n');
    }
    function convertToJSON(content) { return JSON.stringify(content, null, 2); }
    function convertToVTT(content) {
        let vtt = 'WEBVTT\n\n';
        content.forEach((item, i) => {
            const from = formatTime(item.from).replace(',', '.');
            const to = formatTime(item.to).replace(',', '.');
            vtt += `${i + 1}\n${from} --> ${to}\n${item.content}\n\n`;
        });
        return vtt;
    }
    function convertToCSV(content) {
        let csv = '序号,开始时间,结束时间,字幕内容\n';
        content.forEach((item, i) => {
            csv += `${i + 1},${escapeCSV(formatTime(item.from))},${escapeCSV(formatTime(item.to))},${escapeCSV(item.content)}\n`;
        });
        return csv;
    }
    function convertToASS(content, title = 'B站字幕') {
        let ass = `[Script Info]
Title: ${title}
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
[V4+ Styles]
Style: Default,微软雅黑,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,20,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
        content.forEach(item => {
            ass += `Dialogue: 0,${formatTime(item.from, 'ass')},${formatTime(item.to, 'ass')},Default,,0,0,0,,${item.content}\n`;
        });
        return ass;
    }
    function convertToLRC(content) {
        return content.map(item => `[${formatTime(item.from, 'lrc')}]${item.content}\n`).join('');
    }

    // ===== 下载核心 =====
    function buildFullPath(filename, subFolder = '') {
        const settings = StorageManager.getDownloadSettings();
        const parts = [];
        if (settings.savePath?.trim()) {
            parts.push(settings.savePath.trim().replace(/^[\\/]+|[\\/]+$/g, ''));
        }
        if (subFolder?.trim()) {
            parts.push(subFolder.trim().replace(/[\\/:*?"<>|]/g, '_'));
        }
        parts.push(filename);
        return parts.join('/');
    }

    function downloadFile(content, filename, subFolder = '', useSaveAs = false) {
        const fullPath = buildFullPath(filename, subFolder);
        const blob = new Blob(['\uFEFF' + content], { type: 'text/plain' });
        
        return new Promise(resolve => {
            if (typeof GM_download !== 'undefined') {
                const url = URL.createObjectURL(blob);
                GM_download({
                    url, name: fullPath, saveAs: useSaveAs,
                    onload: () => { URL.revokeObjectURL(url); resolve(true); },
                    onerror: () => { URL.revokeObjectURL(url); fallbackDownload(blob, fullPath); resolve(true); }
                });
            } else {
                fallbackDownload(blob, fullPath);
                resolve(true);
            }
        });
    }

    function fallbackDownload(blob, fullPath) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fullPath;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // ===== 视频信息获取 =====
    function getCurrentVideoInfo() {
        const url = window.location.href;
        const bvidMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
        const bvid = bvidMatch ? bvidMatch[1] : '';
        let cid = window.player?.getCurrentVideo?.().cid?.toString() || '';
        if (!cid) cid = new URLSearchParams(window.location.search).get('cid') || '';
        const title = document.querySelector('.video-title')?.textContent?.trim() || '';
        const duration = document.querySelector('video')?.duration ? Math.floor(document.querySelector('video').duration) : 0;
        return { bvid, cid, title, duration };
    }

    function getVideoList() {
        const result = [];
        const bvid = state.currentVideo.bvid;
        
        try {
            const pages = window.__INITIAL_STATE__?.videoData?.pages;
            if (Array.isArray(pages) && pages.length > 0) {
                pages.forEach(p => {
                    result.push({ bvid, cid: p.cid?.toString() || '', title: p.part || `P${p.page}` });
                });
                if (result.length > 0) return result;
            }
        } catch (e) {}

        const pod = document.querySelector('.video-pod__body');
        if (pod) {
            pod.querySelectorAll('.video-pod__item, .pod-item').forEach((item, i) => {
                const link = item.querySelector('a');
                const titleEl = item.querySelector('.title .title-txt') || item.querySelector('.video-title');
                let itemBvid = '';
                if (link) {
                    const m = link.getAttribute('href')?.match(/BV[a-zA-Z0-9]+/);
                    itemBvid = m ? m[0] : '';
                }
                const title = titleEl?.textContent?.trim() || `视频 ${i + 1}`;
                if (itemBvid) result.push({ bvid: itemBvid, title, cid: '' });
            });
            if (result.length > 0) return result;
        }
        return result;
    }

    async function getVideoCID(bvid) {
        try {
            const info = await getVideoInfo(bvid);
            return info.data?.cid || '';
        } catch (e) { return ''; }
    }

    function sortSubtitles(subtitles) {
        return [...subtitles].filter(s => s.url?.trim()).sort((a, b) => {
            const aSum = a.lan.includes('摘要') ? 2 : (a.lan.includes('AI') ? 1 : 0);
            const bSum = b.lan.includes('摘要') ? 2 : (b.lan.includes('AI') ? 1 : 0);
            if (aSum !== bSum) return aSum - bSum;
            if (a.lan.includes('中文') !== b.lan.includes('中文')) return a.lan.includes('中文') ? -1 : 1;
            return 0;
        });
    }

    // ===== 字幕加载 =====
    async function loadSubtitles() {
        state.subtitleDetails = [];
        state.subtitleList = [];
        let { bvid, cid } = state.currentVideo;
        
        if (!bvid) { showToast('无法获取视频信息', 'error'); return; }
        if (!cid) {
            cid = await getVideoCID(bvid);
            if (!cid) { showToast('无法获取视频信息', 'error'); return; }
            state.currentVideo.cid = cid;
        }

        showToast('正在加载字幕...', 'info');
        try {
            let subtitles = await fetchSubtitles(bvid, cid);
            if (subtitles.length === 0) {
                showNoSubtitles();
                return;
            }
            state.subtitleList = subtitles;
            
            // 渲染分P选择器
            showVideoListSelector();
            showSubtitlesSelector(subtitles);

            const sorted = sortSubtitles(subtitles);
            let content = [];
            for (const sub of sorted) {
                const c = await getSubtitleContent(sub.url, bvid, cid);
                if (c.length > 0) { content = c; break; }
            }

            state.subtitleDetails = content;
            renderSubtitles(content);
            updateVideoInfo();
            showToast('字幕加载完成', 'success');
        } catch (e) {
            showToast('加载字幕失败', 'error');
        }
    }

    function showNoSubtitles() {
        const container = document.getElementById('subtitle-content');
        if (!container) return;
        container.innerHTML = `
            <div class="no-subtitles">
                <h3>未找到字幕</h3>
                <p>当前视频没有可用的字幕</p>
                <ul class="no-subtitles-tips">
                    <li>视频未上传字幕</li>
                    <li>需要登录才能查看字幕</li>
                    <li>字幕正在生成中</li>
                </ul>
            </div>`;
    }

    // ===== 分P选择器（核心恢复功能） =====
    function showVideoListSelector() {
        const container = document.getElementById('video-list-selector');
        if (!container) return;
        const list = state.videoList;
        if (!list || list.length <= 1) { container.innerHTML = ''; return; }

        const currentCid = state.currentVideo.cid;
        const options = list.map((v, i) => {
            const sel = v.cid === currentCid ? 'selected' : '';
            return `<option value="${v.cid}" ${sel}>${i + 1}. ${sanitizeInput(v.title).substring(0, 30)}${v.title.length > 30 ? '...' : ''}</option>`;
        }).join('');
        
        container.innerHTML = `
            <label class="selector-label">选择分P：</label>
            <select id="video-select" class="video-select">${options}</select>`;
        
        // 切换分P事件
        document.getElementById('video-select').addEventListener('change', async e => {
            const cid = e.target.value;
            const video = list.find(v => v.cid === cid);
            if (video) {
                state.currentVideo.cid = cid;
                state.currentVideo.title = video.title;
                state.currentVideo.duration = 0;
                // 重新加载对应分P的字幕
                await loadSubtitles();
            }
        });
    }

    function showSubtitlesSelector(subtitles) {
        const container = document.getElementById('subtitle-selector');
        if (!container) return;
        if (!subtitles || subtitles.length <= 1) { container.innerHTML = ''; return; }

        const options = subtitles.map((s, i) => 
            `<div class="custom-select-option" data-value="${i}">${s.lan}</div>`
        ).join('');
        
        container.innerHTML = `
            <label class="selector-label">字幕语言：</label>
            <div class="custom-select">
                <div class="custom-select-trigger" id="subtitle-select-trigger">
                    <span class="custom-select-value">${subtitles[0].lan}</span>
                    <span class="custom-select-icon-wrapper"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </div>
                <div class="custom-select-dropdown" id="subtitle-select-dropdown">${options}</div>
            </div>`;

        const trigger = document.getElementById('subtitle-select-trigger');
        const dropdown = document.getElementById('subtitle-select-dropdown');
        const valueSpan = trigger.querySelector('.custom-select-value');
        
        trigger.addEventListener('click', () => dropdown.classList.toggle('active'));
        document.addEventListener('click', e => {
            if (!container.contains(e.target)) dropdown.classList.remove('active');
        });
        dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.addEventListener('click', async () => {
                const idx = parseInt(opt.dataset.value);
                const sub = subtitles[idx];
                if (sub?.url) {
                    valueSpan.textContent = sub.lan;
                    dropdown.classList.remove('active');
                    const content = await getSubtitleContent(sub.url, state.currentVideo.bvid, state.currentVideo.cid);
                    state.subtitleDetails = content;
                    renderSubtitles(content);
                }
            });
        });
    }

    function renderSubtitles(content) {
        const container = document.getElementById('subtitle-content');
        if (!container) return;
        if (!content?.length) { showNoSubtitles(); return; }

        const html = content.map((item, i) => `
            <div class="subtitle-item" data-index="${i}" data-time="${item.from}">
                <span class="subtitle-time">[${formatTime(item.from)}]</span>
                <span class="subtitle-text">${sanitizeInput(item.content)}</span>
            </div>`).join('');
        
        container.innerHTML = `<div class="subtitle-list">${html}</div>`;
        document.querySelectorAll('.subtitle-item').forEach(item => {
            item.addEventListener('click', () => {
                const video = document.querySelector('video');
                const t = parseFloat(item.dataset.time);
                if (video && !isNaN(t)) { video.currentTime = t; video.play(); }
            });
        });
    }

    function updateVideoInfo() {
        const { bvid, cid, title, duration } = state.currentVideo;
        document.getElementById('video-title').textContent = sanitizeInput(title) || '未知标题';
        document.getElementById('video-bvid').textContent = bvid || '未知';
        document.getElementById('video-cid').textContent = cid || '未知';
        document.getElementById('video-duration').textContent = duration ? formatTime(duration) : '未知';
    }

    // ===== 主面板 =====
    function createModal() {
        removeModal('bili-transcript-modal');
        const modal = document.createElement('div');
        modal.id = 'bili-transcript-modal';
        modal.className = 'bili-transcript-modal';
        modal.innerHTML = `
            <div class="modal-overlay" id="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${ICONS.doc} 字幕提取器</h2>
                    <button id="close-modal" class="close-btn">${ICONS.close}</button>
                </div>
                <div class="modal-body">
                    <div class="video-info">
                        <div class="info-row"><span class="info-label">标题</span><span id="video-title" class="info-value">加载中...</span></div>
                        <div class="info-row"><span class="info-label">BV号</span><span id="video-bvid" class="info-value">加载中...</span></div>
                        <div class="info-row"><span class="info-label">CID</span><span id="video-cid" class="info-value">加载中...</span></div>
                        <div class="info-row"><span class="info-label">时长</span><span id="video-duration" class="info-value">加载中...</span></div>
                    </div>
                    
                    <div id="video-list-selector" class="selector-container"></div>
                    <div id="subtitle-selector" class="selector-container"></div>
                    
                    <div class="search-container">
                        <div class="search-input-wrapper">
                            <span class="search-icon">${ICONS.search}</span>
                            <input type="text" id="subtitle-search" class="search-input" placeholder="搜索字幕内容...">
                        </div>
                    </div>
                    <div class="subtitle-content-wrapper">
                        <div id="subtitle-content" class="subtitle-content"><div class="loading">加载中...</div></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="settings-btn" class="btn-secondary">${ICONS.settings} 设置</button>
                    <button id="copy-text" class="btn-primary">${ICONS.copy} 复制</button>
                    <button id="download-txt" class="btn-secondary">${ICONS.download} 下载</button>
                    <button id="batch-download" class="btn-primary">${ICONS.batch} 批量</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        setupModalClose(modal, 'close-modal', 'modal-overlay');

        document.getElementById('copy-text').addEventListener('click', async () => {
            try {
                await GM_setClipboard(convertToTXT(state.subtitleDetails));
                showToast('复制成功', 'success');
            } catch (e) { showToast('复制失败', 'error'); }
        });
        document.getElementById('download-txt').addEventListener('click', showDownloadConfirm);
        document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
        document.getElementById('batch-download').addEventListener('click', showBatchDownloadModal);
        
        const searchInput = document.getElementById('subtitle-search');
        searchInput.addEventListener('input', e => searchSubtitles(e.target.value));

        loadSubtitles();
    }

    function removeModal(id) {
        document.getElementById(id)?.remove();
    }

    function setupModalClose(modal, btnId, overlayId) {
        const close = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        };
        document.getElementById(btnId)?.addEventListener('click', close);
        document.getElementById(overlayId)?.addEventListener('click', close);
    }

    // ===== 搜索功能 =====
    function searchSubtitles(keyword) {
        if (!keyword?.trim()) {
            renderSubtitles(state.subtitleDetails);
            return;
        }
        const lower = keyword.toLowerCase();
        const container = document.getElementById('subtitle-content');
        if (!container) return;

        const html = state.subtitleDetails.map((item, i) => {
            const match = item.content.toLowerCase().includes(lower);
            const highlighted = item.content.replace(
                new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<span class="highlight">$1</span>'
            );
            return `
                <div class="subtitle-item ${match ? 'search-match' : ''}" data-index="${i}" data-time="${item.from}">
                    <span class="subtitle-time">[${formatTime(item.from)}]</span>
                    <span class="subtitle-text">${highlighted}</span>
                </div>`;
        }).join('');
        container.innerHTML = `<div class="subtitle-list">${html}</div>`;
    }

    // ===== 单个下载确认 =====
    function showDownloadConfirm() {
        const settings = StorageManager.getDownloadSettings();
        const title = state.currentVideo.title.replace(/[\\/:*?"<>|]/g, '_') || 'subtitle';
        const modal = document.createElement('div');
        modal.id = 'bili-transcript-download-modal';
        modal.className = 'bili-transcript-modal';
        modal.innerHTML = `
            <div class="modal-overlay" id="download-overlay"></div>
            <div class="modal-content download-modal">
                <div class="modal-header">
                    <h2>${ICONS.download} 下载字幕</h2>
                    <button id="close-download-modal" class="close-btn">${ICONS.close}</button>
                </div>
                <div class="modal-body">
                    <div class="download-section">
                        <label class="download-label">文件名：</label>
                        <input type="text" id="download-filename" value="${sanitizeInput(title)}" class="download-input">
                    </div>
                    <div class="download-section">
                        <label class="download-label">输出格式：</label>
                        <div class="download-format-display">${settings.format.toUpperCase()} <span class="format-hint">（可在设置中修改）</span></div>
                    </div>
                    <p class="mime-hint">${settings.askBeforeSave ? '将弹出保存位置选择框，可在设置中关闭' : '文件将自动保存到浏览器默认下载目录'}</p>
                </div>
                <div class="modal-footer">
                    <button id="download-settings-btn" class="btn-secondary">${ICONS.settings} 设置</button>
                    <button id="confirm-download" class="btn-primary">确认下载</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        setupModalClose(modal, 'close-download-modal', 'download-overlay');

        document.getElementById('download-settings-btn').addEventListener('click', () => {
            modal.remove();
            showSettingsModal();
        });
        document.getElementById('confirm-download').addEventListener('click', async () => {
            const filename = document.getElementById('download-filename').value + '.' + settings.format;
            const content = convertByFormat(settings.format, state.subtitleDetails, state.currentVideo.title);
            modal.remove();
            const ok = await downloadFile(content, filename, '', settings.askBeforeSave);
            showToast(ok ? '下载完成' : '下载已取消', ok ? 'success' : 'info');
        });
    }

    function convertByFormat(format, content, title) {
        switch (format) {
            case 'srt': return convertToSRT(content);
            case 'vtt': return convertToVTT(content);
            case 'json': return convertToJSON(content);
            case 'csv': return convertToCSV(content);
            case 'ass': return convertToASS(content, title);
            case 'lrc': return convertToLRC(content);
            default: return convertToTXT(content);
        }
    }

    // ===== 设置面板 =====
    function showSettingsModal() {
        const settings = StorageManager.getDownloadSettings();
        const modal = document.createElement('div');
        modal.id = 'bili-transcript-settings-modal';
        modal.className = 'bili-transcript-modal';
        modal.innerHTML = `
            <div class="modal-overlay" id="settings-overlay"></div>
            <div class="modal-content settings-modal">
                <div class="modal-header">
                    <h2>${ICONS.settings} 下载设置</h2>
                    <button id="close-settings-modal" class="close-btn">${ICONS.close}</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h3>输出格式</h3>
                        <div class="format-list">
                            ${CONFIG.PRESET_EXTENSIONS.map(ext => `
                                <div class="format-item ${settings.format === ext.value ? 'selected' : ''}" data-value="${ext.value}">
                                    <span class="format-name">${ext.name}</span>
                                </div>`).join('')}
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>字幕内容设置</h3>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="set-time" ${settings.includeSubtitleTime ? 'checked' : ''}>
                            <span>包含字幕时间轴</span>
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>文件名设置</h3>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="set-bv" ${settings.includeBV ? 'checked' : ''}>
                            <span>文件名包含BV号</span>
                        </label>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="set-ts" ${settings.includeTimestamp ? 'checked' : ''}>
                            <span>文件名包含时间戳</span>
                        </label>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="set-duration" ${settings.includeDuration ? 'checked' : ''}>
                            <span>文件名包含视频时长</span>
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>保存路径设置</h3>
                        <input type="text" id="set-path" value="${settings.savePath || ''}" class="download-input" placeholder="例如：B站字幕，留空则保存到默认下载目录">
                        <p class="mime-hint">文件将保存到浏览器默认下载目录下的该文件夹中，自动创建子目录</p>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="set-ask" ${settings.askBeforeSave ? 'checked' : ''}>
                            <span>单个文件下载时弹出保存位置选择</span>
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>批量下载设置</h3>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="set-folder" ${settings.batchUseCollectionFolder ? 'checked' : ''}>
                            <span>批量下载时使用合集标题作为子文件夹</span>
                        </label>
                        <p class="mime-hint">开启后批量下载的字幕会自动归类到对应合集名称的文件夹中</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="reset-settings" class="btn-secondary">恢复默认</button>
                    <button id="save-settings" class="btn-primary">保存设置</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        setupModalClose(modal, 'close-settings-modal', 'settings-overlay');

        document.querySelectorAll('.format-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.format-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                settings.format = item.dataset.value;
            });
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            settings.includeSubtitleTime = document.getElementById('set-time').checked;
            settings.includeBV = document.getElementById('set-bv').checked;
            settings.includeTimestamp = document.getElementById('set-ts').checked;
            settings.includeDuration = document.getElementById('set-duration').checked;
            settings.savePath = document.getElementById('set-path').value.trim();
            settings.askBeforeSave = document.getElementById('set-ask').checked;
            settings.batchUseCollectionFolder = document.getElementById('set-folder').checked;
            StorageManager.saveDownloadSettings(settings);
            modal.remove();
            showToast('设置已保存', 'success');
        });

        document.getElementById('reset-settings').addEventListener('click', () => {
            Object.assign(settings, CONFIG.DEFAULT_DOWNLOAD_SETTINGS);
            StorageManager.saveDownloadSettings(settings);
            modal.remove();
            showSettingsModal();
            showToast('已恢复默认设置', 'success');
        });
    }

    // ===== 批量下载 =====
    function showBatchDownloadModal() {
        let list = state.videoList;
        
        if (!list || list.length <= 1) {
            const bvid = state.currentVideo.bvid;
            if (bvid) {
                showToast('正在加载分P列表...', 'info');
                getVideoPages(bvid).then(pages => {
                    if (pages?.length > 0) {
                        list = pages.map(p => ({
                            bvid, cid: p.cid?.toString() || '', title: p.part || `P${p.page}`
                        }));
                        state.videoList = list;
                        renderBatchModal(list);
                    } else {
                        showToast('没有可批量下载的分P视频', 'warning');
                    }
                });
                return;
            }
        }
        renderBatchModal(list);
    }

    function renderBatchModal(list) {
        const modal = document.createElement('div');
        modal.id = 'batch-download-modal';
        modal.className = 'bili-transcript-modal';
        modal.innerHTML = `
            <div class="modal-overlay" id="batch-overlay"></div>
            <div class="modal-content batch-modal">
                <div class="modal-header">
                    <h2>${ICONS.batch} 批量下载字幕</h2>
                    <button id="close-batch-modal" class="close-btn">${ICONS.close}</button>
                </div>
                <div class="modal-body">
                    <div class="batch-section">
                        <div class="batch-header">
                            <h3>选择视频（共 ${list.length} 个）</h3>
                            <div class="batch-actions">
                                <button id="select-all" class="btn-small">全选</button>
                                <button id="deselect-all" class="btn-small">取消全选</button>
                            </div>
                        </div>
                        <div id="video-checkboxes" class="checkbox-list"></div>
                    </div>
                    <div class="batch-section">
                        <h3>注意事项</h3>
                        <div class="batch-tip">
                            <p>• 文件将自动保存到下载目录对应文件夹中</p>
                            <p>• 浏览器可能弹出「是否允许此站点下载多个文件」提示，请点击「允许」</p>
                            <p>• 可在设置中修改保存路径与合集文件夹选项</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="start-batch-download" class="btn-primary">开始下载</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        setupModalClose(modal, 'close-batch-modal', 'batch-overlay');

        const box = document.getElementById('video-checkboxes');
        list.forEach((v, i) => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `<input type="checkbox" value="${v.cid}" data-bvid="${v.bvid}" checked> ${i+1}. ${sanitizeInput(v.title).substring(0,40)}${v.title.length>40?'...':''}`;
            box.appendChild(label);
        });

        document.getElementById('select-all').onclick = () => 
            document.querySelectorAll('#video-checkboxes input').forEach(cb => cb.checked = true);
        document.getElementById('deselect-all').onclick = () => 
            document.querySelectorAll('#video-checkboxes input').forEach(cb => cb.checked = false);

        document.getElementById('start-batch-download').onclick = startBatch;
    }

    async function startBatch() {
        const selected = Array.from(document.querySelectorAll('#video-checkboxes input:checked'))
            .map(cb => ({ bvid: cb.dataset.bvid, cid: cb.value }));
        
        if (selected.length === 0) {
            showToast('请选择至少一个视频', 'warning');
            return;
        }

        const settings = StorageManager.getDownloadSettings();
        let collectionTitle = '';
        
        if (settings.batchUseCollectionFolder) {
            try {
                const info = await getVideoInfo(selected[0].bvid);
                collectionTitle = info.data?.title || '';
            } catch (e) {}
        }

        // 下载前确认
        const confirmMsg = [
            `即将下载 ${selected.length} 个字幕文件`,
            collectionTitle ? `保存路径：下载目录/${collectionTitle}/` : '保存路径：浏览器默认下载目录',
            '',
            '浏览器可能会询问是否允许下载多个文件，请点击「允许」',
            '',
            '是否继续下载？'
        ].join('\n');
        
        if (!confirm(confirmMsg)) {
            showToast('下载已取消', 'info');
            return;
        }

        showToast(`开始下载 ${selected.length} 个字幕...`, 'info');
        let ok = 0, fail = 0;

        for (const v of selected) {
            try {
                const item = state.videoList.find(x => x.cid === v.cid);
                const title = item?.title || v.bvid;
                const res = await downloadOneSubtitle(v.bvid, v.cid, title, settings, collectionTitle);
                res ? ok++ : fail++;
                await new Promise(r => setTimeout(r, 300));
            } catch (e) { fail++; }
        }

        removeModal('batch-download-modal');
        if (fail === 0) {
            showToast(`批量下载完成，共 ${ok} 个文件`, 'success');
        } else {
            showToast(`下载完成：成功 ${ok} 个，失败 ${fail} 个`, 'warning');
        }
    }

    async function downloadOneSubtitle(bvid, cid, title, settings, subFolder) {
        if (!cid) cid = await getVideoCID(bvid);
        if (!cid) return false;

        const subtitles = await fetchSubtitles(bvid, cid);
        if (subtitles.length === 0) return false;

        const sub = subtitles.find(s => !s.lan.includes('摘要') && !s.lan.includes('AI') && s.lan.includes('中文')) || subtitles[0];
        if (!sub.url) return false;

        const content = await getSubtitleContent(sub.url, bvid, cid);
        if (content.length === 0) return false;

        let filename = title.replace(/[\\/:*?"<>|]/g, '_');
        if (settings.includeBV) filename += `_${bvid}`;
        if (settings.includeTimestamp) {
            const d = new Date();
            filename += `_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
        }
        if (settings.includeDuration) {
            try {
                const info = await getVideoInfo(bvid);
                const dur = info.data?.duration || 0;
                if (dur > 0) {
                    const durStr = formatDuration(dur);
                    filename += `_${durStr}`;
                }
            } catch (e) {}
        }

        const converted = convertByFormat(settings.format, content, title);
        return await downloadFile(converted, `${filename}.${settings.format}`, subFolder, false);
    }

    function formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')}` : `${m}-${String(s).padStart(2, '0')}`;
    }

    // ===== 悬浮按钮 =====
    function createFloatButton() {
        const btn = document.createElement('button');
        btn.id = 'bili-transcript-btn';
        btn.className = 'bili-transcript-btn';
        btn.innerHTML = ICONS.doc;
        btn.title = '提取字幕';
        btn.addEventListener('click', createModal);
        document.body.appendChild(btn);
    }

    // ===== 样式注入 =====
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
:root {
    --primary: #fb7299;
    --primary-dark: #e85580;
    --bg-primary: #ffffff;
    --bg-surface: #f6f7f8;
    --bg-secondary: #f1f2f3;
    --text-primary: #18191c;
    --text-secondary: #61666d;
    --text-muted: #9499a0;
    --border: #e3e5e7;
    --success: #52c41a;
    --error: #ff4d4f;
    --warning: #faad14;
    --info: #1890ff;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
.bili-transcript-modal, .bili-transcript-toast, .bili-transcript-btn {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 悬浮按钮 */
.bili-transcript-btn {
    position: fixed; right: 24px; bottom: 24px;
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--primary); color: #ffffff;
    border: none; font-size: 24px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(251,114,153,.4);
    z-index: 9999;
    transition: transform .2s ease;
    display: flex; align-items: center; justify-content: center;
}
.bili-transcript-btn:hover { transform: scale(1.1); }

/* Toast提示 */
.bili-transcript-toast {
    position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
    padding: 10px 20px; border-radius: 8px;
    background: rgba(0,0,0,.75); color: #ffffff;
    z-index: 10000; font-size: 14px;
    display: flex; align-items: center; gap: 8px;
    animation: slideDown .3s ease;
}
@keyframes slideDown {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}
@keyframes slideUp {
    from { opacity: 1; transform: translate(-50%, 0); }
    to { opacity: 0; transform: translate(-50%, -20px); }
}
.toast-icon { flex-shrink: 0; display: flex; align-items: center; }

/* 模态框通用 */
.bili-transcript-modal {
    position: fixed; inset: 0; z-index: 9998;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.4);
    animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-content {
    width: 92%; max-width: 560px; max-height: 85vh;
    background: var(--bg-primary);
    border-radius: 12px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 10px 40px rgba(0,0,0,.2);
}
.modal-header {
    padding: 16px 20px;
    background: var(--primary); color: #ffffff;
    display: flex; justify-content: space-between; align-items: center;
}
.modal-header h2 { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.close-btn {
    width: 28px; height: 28px; border: none;
    background: rgba(255,255,255,.2); color: #ffffff;
    border-radius: 6px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
}
.modal-body {
    padding: 20px;
    flex: 1; overflow-y: auto;
    display: flex; flex-direction: column; gap: 16px;
}
.modal-footer {
    padding: 14px 20px;
    border-top: 1px solid var(--border);
    display: flex; gap: 10px; justify-content: flex-end;
}

/* 按钮样式 */
.btn-primary, .btn-secondary, .btn-small {
    padding: 8px 18px; border-radius: 8px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    border: none; transition: all .2s ease;
    display: inline-flex; align-items: center; gap: 6px;
}
.btn-primary { background: var(--primary); color: #ffffff; }
.btn-primary:hover { opacity: .9; transform: translateY(-1px); }
.btn-secondary { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--bg-secondary); }
.btn-small { padding: 6px 12px; font-size: 12px; background: var(--bg-surface); border: 1px solid var(--border); }

/* 视频信息 */
.video-info {
    padding: 14px 16px;
    background: var(--bg-surface);
    border-radius: 8px;
    font-size: 13px;
}
.info-row { display: flex; margin-bottom: 8px; align-items: flex-start; }
.info-row:last-child { margin-bottom: 0; }
.info-label { width: 50px; color: var(--text-secondary); flex-shrink: 0; }
.info-value { color: var(--text-primary); word-break: break-all; line-height: 1.5; }

/* 选择器 */
.selector-container {
    display: flex; align-items: center; gap: 10px;
}
.selector-label {
    font-size: 13px; color: var(--text-secondary);
    flex-shrink: 0; width: 70px;
}
.video-select {
    flex: 1; padding: 8px 12px;
    border: 1px solid var(--border); border-radius: 8px;
    background: #ffffff; font-size: 14px;
    outline: none; cursor: pointer;
}
.video-select:focus { border-color: var(--primary); }

.custom-select { position: relative; flex: 1; }
.custom-select-trigger {
    padding: 8px 12px; border: 1px solid var(--border);
    border-radius: 8px; background: #ffffff;
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; font-size: 14px;
}
.custom-select-dropdown {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0;
    background: #ffffff; border: 1px solid var(--border);
    border-radius: 8px; max-height: 200px; overflow-y: auto;
    display: none; z-index: 10;
}
.custom-select-dropdown.active { display: block; }
.custom-select-option {
    padding: 10px 12px; cursor: pointer; font-size: 14px;
}
.custom-select-option:hover { background: var(--bg-secondary); }

/* 搜索框 */
.search-input-wrapper {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--border); border-radius: 8px;
    background: #ffffff;
}
.search-icon { flex-shrink: 0; color: var(--text-muted); display: flex; }
.search-input {
    flex: 1; border: none; background: transparent;
    font-size: 14px; outline: none; color: var(--text-primary);
}

/* 字幕列表 */
.subtitle-content {
    height: 320px; overflow-y: auto;
    border: 1px solid var(--border); border-radius: 8px;
    padding: 8px;
}
.subtitle-item {
    padding: 8px 10px; border-radius: 6px;
    display: flex; gap: 12px;
    cursor: pointer; font-size: 14px;
    transition: background .15s ease;
}
.subtitle-item:hover { background: var(--bg-secondary); }
.subtitle-time {
    color: var(--primary); font-size: 12px;
    flex-shrink: 0; width: 80px; text-align: right;
    font-family: 'SF Mono', Monaco, monospace;
}
.subtitle-text { color: var(--text-primary); line-height: 1.5; }
.highlight { background: #fff3cd; padding: 0 2px; border-radius: 2px; }
.search-match { background: #e6f7ff; }
.loading, .no-subtitles {
    text-align: center; padding: 40px 20px;
    color: var(--text-muted); font-size: 14px;
}
.no-subtitles h3 { margin-bottom: 10px; color: var(--text-primary); }
.no-subtitles p { margin-bottom: 16px; }
.no-subtitles-tips {
    list-style: none; text-align: left;
    padding: 0 20px;
}
.no-subtitles-tips li {
    margin-bottom: 6px; font-size: 13px;
    padding-left: 16px; position: relative;
}
.no-subtitles-tips li::before {
    content: ''; position: absolute; left: 0; top: 6px;
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--primary);
}

/* 设置面板 */
.settings-section h3 {
    font-size: 14px; margin-bottom: 10px;
    color: var(--text-primary);
}
.format-list {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
}
.format-item {
    padding: 8px; text-align: center;
    border: 1px solid var(--border); border-radius: 6px;
    cursor: pointer; font-size: 13px;
}
.format-item.selected {
    border-color: var(--primary);
    background: #fff0f6;
    color: var(--primary);
}
.settings-checkbox {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0; cursor: pointer;
    font-size: 14px; color: var(--text-primary);
}
.settings-checkbox input { width: 16px; height: 16px; accent-color: var(--primary); }
.download-input {
    width: 100%; padding: 10px 12px;
    border: 1px solid var(--border); border-radius: 8px;
    font-size: 14px; outline: none;
}
.download-input:focus { border-color: var(--primary); }
.mime-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; line-height: 1.6; }

/* 批量下载 */
.batch-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
}
.batch-actions { display: flex; gap: 8px; }
.checkbox-list {
    max-height: 240px; overflow-y: auto;
    border: 1px solid var(--border); border-radius: 8px;
    padding: 4px;
}
.checkbox-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-radius: 6px;
    cursor: pointer; font-size: 14px;
}
.checkbox-item:hover { background: var(--bg-secondary); }
.checkbox-item input { width: 16px; height: 16px; accent-color: var(--primary); }
.batch-tip {
    padding: 12px 14px;
    background: var(--bg-surface); border-radius: 8px;
    font-size: 13px; line-height: 1.8;
    color: var(--text-secondary);
}

/* 下载弹窗 */
.download-section { margin-bottom: 14px; }
.download-label {
    display: block; font-size: 13px;
    color: var(--text-secondary); margin-bottom: 6px;
}
.download-format-display {
    padding: 10px 12px; background: var(--bg-surface);
    border-radius: 8px; font-size: 14px;
}
.format-hint { color: var(--text-muted); font-size: 12px; margin-left: 8px; }

/* 滚动条美化 */
.subtitle-content::-webkit-scrollbar,
.checkbox-list::-webkit-scrollbar,
.modal-body::-webkit-scrollbar {
    width: 6px;
}
.subtitle-content::-webkit-scrollbar-track,
.checkbox-list::-webkit-scrollbar-track,
.modal-body::-webkit-scrollbar-track {
    background: transparent;
}
.subtitle-content::-webkit-scrollbar-thumb,
.checkbox-list::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb {
    background: #cccccc; border-radius: 3px;
}

/* 响应式适配 */
@media (max-width: 480px) {
    .modal-footer { flex-direction: column; }
    .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
    .format-list { grid-template-columns: repeat(3, 1fr); }
    .selector-container { flex-direction: column; align-items: stretch; gap: 6px; }
    .selector-label { width: auto; }
}
        `;
        document.head.appendChild(style);
    }

    // ===== 初始化 =====
    function init() {
        state.currentVideo = getCurrentVideoInfo();
        state.videoList = getVideoList();
        injectStyles();
        createFloatButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
