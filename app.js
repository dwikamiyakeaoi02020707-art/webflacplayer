/**
 * WebFlacPlayer v1.0.0-alpha.tester
 * Developed & Powered by Moedev
 */

'use strict';

const NETWORK_FREE_LIMIT = 15;
const REFUND_WINDOW_MS = 4 * 24 * 60 * 60 * 1000;
const DEMO_KEYS = ['MOEDEV', 'VIBECODE', 'ALPHATESTER', 'WEBFLACPRO'];

const DEFAULT_DEMO_Cover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230b132b'/%3E%3Cstop offset='50%25' stop-color='%231c2541'/%3E%3Cstop offset='100%25' stop-color='%230077b6'/%3E%3C/linearGradient%3E%3ClinearGradient id='sun' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234fc3f7'/%3E%3Cstop offset='100%25' stop-color='%2339c5bb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='600' fill='url(%23bg)'/%3E%3Ccircle cx='300' cy='250' r='115' fill='url(%23sun)' opacity='0.88'/%3E%3Cpath d='M0 360 L600 360 L600 600 L0 600 Z' fill='%23070b19' opacity='0.82'/%3E%3Cline x1='0' y1='360' x2='600' y2='360' stroke='%234fc3f7' stroke-width='3'/%3E%3Ctext x='300' y='455' font-family='sans-serif' font-size='38' font-weight='800' fill='%23ffffff' text-anchor='middle' letter-spacing='4'%3EGLASS HORIZON%3C/text%3E%3Ctext x='300' y='505' font-family='sans-serif' font-size='20' font-weight='600' fill='%234fc3f7' text-anchor='middle' letter-spacing='8'%3EMOEDEV%3C/text%3E%3C/svg%3E";

const BUILTIN_DEMO_TRACK = {
  id: 'moedev_demo_glass_horizon',
  url: 'https://files.catbox.moe/wlhc5l.mp3',
  isYouTube: false,
  isDemoTrack: true,
  title: 'Glass Horizon',
  artist: 'Moedev',
  album: 'Moedev',
  duration: 0,
  artUrl: DEFAULT_DEMO_Cover,
  format: 'MP3 320 kbps / 44.1 kHz • MOEDEV DEMO'
};

const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_LABELS = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [8, 6, 4, 1, -2, 1, 4, 6, 8, 8],
  pop: [-2, 3, 6, 7, 5, 1, -1, 2, 4, 5],
  jazz: [6, 5, 2, 3, -2, -2, 0, 2, 5, 6],
  classical: [6, 5, 3, 2, -1, -1, 0, 3, 5, 6],
  bass: [12, 10, 7, 4, 0, 0, 0, 0, 1, 2],
  vocal: [-4, -3, 0, 4, 8, 8, 6, 3, 1, -1]
};

const VIEW_ROUTES = {
  'open-songs': 'songs-view',
  'open-album': 'album-view',
  'open-artist': 'artist-view',
  'open-folder': 'songs-view',
  'open-youtube': 'youtube-view',
  'open-favorites': 'favorites-view',
  'open-recent': 'recent-view',
  'open-playlists': 'playlists-view',
  'open-equalizer': 'equalizer-view',
  'open-settings': 'settings-view'
};

const STORAGE_KEYS = {
  FAVORITES: 'wfp_favorites',
  PLAYLISTS: 'wfp_playlists',
  RECENT: 'wfp_recent',
  VOLUME: 'wfp_volume',
  SPEED: 'wfp_speed',
  THEME: 'wfp_theme',
  ACCENT: 'wfp_accent',
  EQ_ENABLED: 'wfp_eq_enabled',
  EQ_GAINS: 'wfp_eq_gains',
  YT_HISTORY: 'wfp_yt_history',
  PRO_UNLOCKED: 'wfp_pro_unlocked',
  PRO_PURCHASE_TIME: 'wfp_pro_purchase_time',
  CUSTOM_COVERS: 'wfp_custom_covers',
  AUTO_COVER: 'wfp_auto_cover'
};

const PIPED_API_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me'
];

const state = {
  songs: [],
  currentIndex: -1,
  isPlaying: false,
  playbackIntent: false,
  shuffle: false,
  repeat: 'none',
  favorites: new Set(),
  playlists: [],
  recentIds: [],
  viewHistory: ['home-view'],
  volume: 1,
  speed: 1,
  theme: 'dark',
  accentColor: '#4fc3f7',
  eqEnabled: true,
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ytHistory: [],
  customCovers: {},
  autoFetchCover: true,
  isProUnlocked: false,
  proPurchaseTime: 0
};

let audioCtx = null;
let sourceNode = null;
let eqFilters = [];
let audioElement = null;

let ytPlayer = null;
let ytReady = false;
let pendingYtVideoId = null;
let ytProgressTimer = null;

let deferredPwaPrompt = null;

function getActiveSong() {
  return state.currentIndex >= 0 && state.songs[state.currentIndex]
    ? state.songs[state.currentIndex]
    : null;
}

function isUsingAudioElement(song) {
  if (!song || !audioElement) return false;
  if (!song.isYouTube) return true;
  return Boolean(song.usingDirectStream);
}

function initBackgroundPersistence() {
  document.addEventListener('visibilitychange', () => {
    if (audioCtx && audioCtx.state === 'suspended' && state.playbackIntent) {
      audioCtx.resume().catch(() => {});
    }

    if (!state.playbackIntent) return;
    const song = getActiveSong();
    if (!song) return;

    if (isUsingAudioElement(song)) {
      if (audioElement && audioElement.paused && !audioElement.ended) {
        audioElement.play().catch(() => {});
      }
    } else if (song.isYouTube && ytReady && ytPlayer && typeof ytPlayer.playVideo === 'function') {
      try { ytPlayer.playVideo(); } catch (_) {}
    }
  });
}

// ============================================================================
// BUILT-IN DEMO TRACK LOADER (GLASS HORIZON - MOEDEV)
// ============================================================================

function loadBuiltInDemoTrack() {
  if (state.songs.some((s) => s.id === BUILTIN_DEMO_TRACK.id)) return;

  const demoSong = {
    ...BUILTIN_DEMO_TRACK,
    artUrl: state.customCovers[BUILTIN_DEMO_TRACK.id] || BUILTIN_DEMO_TRACK.artUrl,
    isFavorite: state.favorites.has(BUILTIN_DEMO_TRACK.id)
  };

  state.songs.unshift(demoSong);

  if (state.currentIndex === -1) {
    state.currentIndex = 0;
    updateNowPlayingDisplay(demoSong);
    updateCassetteDisplay(demoSong);
    updateMiniPlayerDisplay(demoSong);
  }

  const probe = new Audio();
  probe.crossOrigin = 'anonymous';
  probe.src = demoSong.url;
  probe.addEventListener('loadedmetadata', () => {
    if (probe.duration && isFinite(probe.duration)) {
      demoSong.duration = probe.duration;
      updateSongDurationInDOM(demoSong);
    }
  });
}

// ============================================================================
// PURE 10-BAND WEBAUDIO EQUALIZER ENGINE
// ============================================================================

function initAudioContext() {
  if (!audioElement) {
    audioElement = document.getElementById('audio-element');
  }
  if (!audioElement) return;

  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  try {
    audioCtx = new AudioCtx();
    sourceNode = audioCtx.createMediaElementSource(audioElement);

    eqFilters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = audioCtx.createBiquadFilter();
      if (i === 0) {
        filter.type = 'lowshelf';
      } else if (i === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 0.95;
      }
      filter.frequency.value = freq;
      filter.gain.value = state.eqEnabled ? (Number(state.eqGains[i]) || 0) : 0;
      return filter;
    });

    let prev = sourceNode;
    for (const filter of eqFilters) {
      prev.connect(filter);
      prev = filter;
    }
    prev.connect(audioCtx.destination);

    applyEqGains();
    refreshDeviceInfo();
  } catch (err) {
    console.warn('AudioContext init error:', err);
  }
}

function applyEqGains() {
  if (!audioCtx) {
    initAudioContext();
  }
  if (!audioCtx || !eqFilters.length) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  const now = audioCtx.currentTime || 0;
  eqFilters.forEach((filter, idx) => {
    const gain = state.eqEnabled ? (Number(state.eqGains[idx]) || 0) : 0;
    filter.gain.value = gain;
    try {
      filter.gain.setTargetAtTime(gain, now, 0.015);
    } catch (_) {}
  });
}

function stopAllStreams() {
  stopYtProgressTimer();
  if (audioElement && !audioElement.paused) {
    audioElement.pause();
  }
  if (ytReady && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
    try { ytPlayer.pauseVideo(); } catch (_) {}
  }
}

function playDirectAudioUrl(url, isExternalStream = false) {
  initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  if (isExternalStream) {
    audioElement.crossOrigin = 'anonymous';
  } else {
    audioElement.removeAttribute('crossorigin');
  }

  if (audioElement.src !== url) {
    audioElement.src = url;
  }
  audioElement.playbackRate = state.speed;
  audioElement.volume = state.volume;
  applyEqGains();

  return audioElement.play().then(() => {
    state.isPlaying = true;
    updatePlayPauseIcons();
  }).catch((err) => {
    // Fallback jika server eksternal menolak header CORS pada elemen audio
    if (isExternalStream && audioElement.crossOrigin) {
      audioElement.removeAttribute('crossorigin');
      audioElement.src = url;
      return audioElement.play().then(() => {
        state.isPlaying = true;
        updatePlayPauseIcons();
      });
    }
    throw err;
  });
}

async function resolveDirectYouTubeAudioStream(videoId) {
  if (!videoId) return null;
  for (const base of PIPED_API_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${base}/streams/${encodeURIComponent(videoId)}`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const data = await res.json();
      if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
        const sorted = data.audioStreams
          .filter((s) => s.url)
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        if (sorted.length > 0) {
          return {
            streamUrl: sorted[0].url,
            duration: data.duration || 0
          };
        }
      }
    } catch (_) {}
  }
  return null;
}

async function playSongAtIndex(index) {
  if (index < 0 || index >= state.songs.length) return;

  const song = state.songs[index];
  state.currentIndex = index;
  state.playbackIntent = true;
  song.usingDirectStream = false;

  stopAllStreams();
  updateProgressDisplays(0, song.duration || 0);

  if (song.isYouTube) {
    playYouTubeWithEqSupport(song);
  } else {
    const isRemoteMp3 = /^https?:\/\//i.test(song.url);
    playDirectAudioUrl(song.url, isRemoteMp3).catch((err) => console.warn('Playback failed:', err));
  }

  addToRecent(song.id);
  updateNowPlayingDisplay(song);
  updateCassetteDisplay(song);
  updateMiniPlayerDisplay(song);
  renderSongList();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: song.artUrl ? [{ src: song.artUrl }] : []
    });
  }
}

async function playYouTubeWithEqSupport(song) {
  const direct = await resolveDirectYouTubeAudioStream(song.ytId);
  if (direct && direct.streamUrl && getActiveSong()?.id === song.id) {
    try {
      song.usingDirectStream = true;
      if (direct.duration && !song.duration) {
        song.duration = direct.duration;
        updateSongDurationInDOM(song);
      }
      await playDirectAudioUrl(direct.streamUrl, true);
      return;
    } catch (_) {
      song.usingDirectStream = false;
    }
  }

  if (getActiveSong()?.id === song.id) {
    song.usingDirectStream = false;
    playYouTubeIframeTrack(song.ytId);
  }
}

function togglePlayPause() {
  if (!state.songs.length) return;
  if (state.currentIndex === -1) {
    playSongAtIndex(0);
    return;
  }

  const song = getActiveSong();
  if (!song) return;

  if (isUsingAudioElement(song)) {
    if (!audioElement.src || audioElement.src === window.location.href) {
      playSongAtIndex(state.currentIndex);
      return;
    }
    initAudioContext();
    if (audioElement.paused) {
      state.playbackIntent = true;
      audioElement.play().then(() => {
        state.isPlaying = true;
        updatePlayPauseIcons();
      }).catch(() => {});
    } else {
      state.playbackIntent = false;
      audioElement.pause();
      state.isPlaying = false;
      updatePlayPauseIcons();
    }
    return;
  }

  if (song.isYouTube) {
    if (!ytReady || !ytPlayer) return;
    const pState = ytPlayer.getPlayerState();
    if (pState === window.YT.PlayerState.PLAYING || pState === window.YT.PlayerState.BUFFERING) {
      state.playbackIntent = false;
      ytPlayer.pauseVideo();
      state.isPlaying = false;
    } else {
      state.playbackIntent = true;
      ytPlayer.playVideo();
      state.isPlaying = true;
    }
    updatePlayPauseIcons();
  }
}

function getCurrentPlaybackTime() {
  const song = getActiveSong();
  if (!song) return 0;
  if (isUsingAudioElement(song)) {
    return audioElement ? (audioElement.currentTime || 0) : 0;
  }
  if (song.isYouTube) {
    return ytReady && ytPlayer && typeof ytPlayer.getCurrentTime === 'function'
      ? ytPlayer.getCurrentTime()
      : 0;
  }
  return 0;
}

function getCurrentPlaybackDuration() {
  const song = getActiveSong();
  if (!song) return 0;
  if (isUsingAudioElement(song)) {
    return (audioElement && audioElement.duration && isFinite(audioElement.duration))
      ? audioElement.duration
      : (song.duration || 0);
  }
  if (song.isYouTube) {
    const dur = ytReady && ytPlayer && typeof ytPlayer.getDuration === 'function'
      ? ytPlayer.getDuration()
      : 0;
    return dur || song.duration || 0;
  }
  return 0;
}

function seekPlaybackTo(ratio) {
  const song = getActiveSong();
  const dur = getCurrentPlaybackDuration();
  if (!song || !dur || !isFinite(dur) || dur <= 0) return;

  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const targetTime = clampedRatio * dur;

  if (isUsingAudioElement(song)) {
    audioElement.currentTime = targetTime;
    updateProgressDisplays(targetTime, dur);
    return;
  }

  if (song.isYouTube && ytReady && ytPlayer && typeof ytPlayer.seekTo === 'function') {
    ytPlayer.seekTo(targetTime, true);
    updateProgressDisplays(targetTime, dur);
  }
}

function playNextSong(manual = true) {
  if (!state.songs.length) return;

  if (state.shuffle && state.songs.length > 1) {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * state.songs.length);
    } while (nextIdx === state.currentIndex);
    playSongAtIndex(nextIdx);
    return;
  }

  if (state.currentIndex < state.songs.length - 1) {
    playSongAtIndex(state.currentIndex + 1);
  } else if (state.repeat === 'all' || manual) {
    playSongAtIndex(0);
  } else {
    state.playbackIntent = false;
    stopAllStreams();
    state.isPlaying = false;
    updatePlayPauseIcons();
    updateProgressDisplays(0, getCurrentPlaybackDuration());
  }
}

function playPrevSong() {
  if (!state.songs.length) return;
  if (getCurrentPlaybackTime() > 3) {
    seekPlaybackTo(0);
    return;
  }
  if (state.currentIndex > 0) {
    playSongAtIndex(state.currentIndex - 1);
  } else {
    playSongAtIndex(state.songs.length - 1);
  }
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  ['np-shuffle-btn', 'cas-shuffle-btn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', state.shuffle);
  });
}

function cycleRepeat() {
  if (state.repeat === 'none') state.repeat = 'all';
  else if (state.repeat === 'all') state.repeat = 'one';
  else state.repeat = 'none';
  updateRepeatButtons();
}

function updateRepeatButtons() {
  ['np-repeat-btn', 'cas-repeat-btn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    let badge = btn.querySelector('.repeat-badge');

    if (state.repeat === 'none') {
      btn.classList.remove('active');
      if (badge) badge.remove();
    } else if (state.repeat === 'all') {
      btn.classList.add('active');
      if (badge) badge.remove();
    } else if (state.repeat === 'one') {
      btn.classList.add('active');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'repeat-badge';
        badge.textContent = '1';
        badge.style.cssText = 'position:absolute;font-size:9px;font-weight:bold;top:2px;right:4px;line-height:1;background:var(--accent);color:#000;padding:1px 3px;border-radius:3px;';
        btn.style.position = 'relative';
        btn.appendChild(badge);
      }
    }
  });
}

async function findFullLengthYouTubeVideoId(query, excludeVideoId = '') {
  if (!query || !query.trim()) return null;
  const searchTerms = `${query.replace(/- Topic/gi, '').trim()} Audio`;

  for (const base of PIPED_API_INSTANCES) {
    try {
      const res = await fetch(`${base}/search?q=${encodeURIComponent(searchTerms)}&filter=videos`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items || !data.items.length) continue;

      for (const item of data.items) {
        const match = (item.url || '').match(/v=([\w-]{11})/);
        const candidateId = match ? match[1] : null;
        if (candidateId && candidateId !== excludeVideoId && item.duration > 60) {
          return {
            videoId: candidateId,
            duration: item.duration
          };
        }
      }
    } catch (_) {}
  }
  return null;
}

async function searchInternetCoverArt(query, limit = 8) {
  if (!query || !query.trim()) return [];
  try {
    const clean = query.replace(/\(.*?\)|\[.*?\]|- Topic/gi, '').trim();
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(clean || query)}&entity=song&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !data.results.length) return [];

    const seen = new Set();
    const results = [];
    for (const item of data.results) {
      if (item.artworkUrl100) {
        const hiResArt = item.artworkUrl100.replace('100x100bb', '600x600bb');
        if (!seen.has(hiResArt)) {
          seen.add(hiResArt);
          results.push({
            artUrl: hiResArt,
            title: item.trackName || '',
            artist: item.artistName || '',
            album: item.collectionName || ''
          });
        }
      }
    }
    return results;
  } catch (_) {
    return [];
  }
}

async function autoFetchCoverForSong(song) {
  if (!state.autoFetchCover || !song) return;
  if (state.customCovers[song.id]) {
    song.artUrl = state.customCovers[song.id];
    updateSongDisplay(song);
    return;
  }

  const query = `${song.artist !== 'Unknown Artist' ? song.artist : ''} ${song.title}`.trim();
  const matches = await searchInternetCoverArt(query, 1);
  if (matches.length > 0 && matches[0].artUrl) {
    song.artUrl = matches[0].artUrl;
    if (song.artist === 'Unknown Artist' && matches[0].artist) {
      song.artist = matches[0].artist;
    }
    if (song.album === 'Unknown Album' && matches[0].album) {
      song.album = matches[0].album;
    }
    updateSongDisplay(song);
  }
}

function applyCustomCoverToActiveSong(newArtUrl) {
  const song = getActiveSong();
  if (!song || !newArtUrl) return;

  song.artUrl = newArtUrl;
  state.customCovers[song.id] = newArtUrl;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_COVERS, JSON.stringify(state.customCovers));
  } catch (_) {}

  const histItem = state.ytHistory.find((h) => `yt_${h.videoId}` === song.id);
  if (histItem) {
    histItem.artUrl = newArtUrl;
    saveYtHistory();
    renderYtHistory();
  }

  updateSongDisplay(song);
  closeCoverModal();
}

function openCoverModal() {
  const song = getActiveSong();
  if (!song) {
    alert('Pilih atau putar lagu terlebih dahulu untuk mengganti Cover Art.');
    return;
  }

  const modal = document.getElementById('cover-art-modal');
  const searchInput = document.getElementById('cover-search-input');
  const urlInput = document.getElementById('cover-url-input');
  if (modal) modal.classList.remove('hidden');

  const defaultQuery = `${song.artist !== 'Unknown Artist' ? song.artist.replace('- Topic', '') : ''} ${song.title}`.trim();
  if (searchInput) {
    searchInput.value = defaultQuery;
    triggerCoverSearch(defaultQuery);
  }
  if (urlInput) urlInput.value = song.artUrl || '';
}

function closeCoverModal() {
  const modal = document.getElementById('cover-art-modal');
  if (modal) modal.classList.add('hidden');
}

async function triggerCoverSearch(query) {
  const grid = document.getElementById('cover-search-results');
  if (!grid) return;
  grid.innerHTML = '<p class="dim" style="grid-column:1/-1;font-size:12px;">Searching internet artwork...</p>';

  const results = await searchInternetCoverArt(query, 8);
  grid.innerHTML = '';

  if (!results.length) {
    grid.innerHTML = '<p class="dim" style="grid-column:1/-1;font-size:12px;">No artwork found. Try another keyword or paste a direct image URL below.</p>';
    return;
  }

  results.forEach((item) => {
    const cell = document.createElement('div');
    cell.className = 'cover-result-item';
    cell.title = `${item.title} - ${item.artist}`;
    cell.innerHTML = `<img src="${escapeHtml(item.artUrl)}" alt="Cover">`;
    cell.addEventListener('click', () => {
      applyCustomCoverToActiveSong(item.artUrl);
    });
    grid.appendChild(cell);
  });
}

function getNetworkSongsCount() {
  return state.songs.filter((s) => s.isYouTube).length;
}

function canAddNetworkTrack() {
  return state.isProUnlocked || getNetworkSongsCount() < NETWORK_FREE_LIMIT;
}

function getRefundRemainingInfo() {
  if (!state.isProUnlocked || !state.proPurchaseTime) {
    return { eligible: false, text: 'No active purchase' };
  }
  const elapsed = Date.now() - state.proPurchaseTime;
  const remaining = REFUND_WINDOW_MS - elapsed;

  if (remaining <= 0) {
    return { eligible: false, text: 'Expired (Passed 4-day refund window)' };
  }

  const d = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const h = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return {
    eligible: true,
    text: `${d}d ${h}h ${m}m left (4-Day Demo Refund Policy)`
  };
}

function updateQuotaUI() {
  const count = getNetworkSongsCount();
  const badge = document.getElementById('quota-badge');
  const fill = document.getElementById('quota-bar-fill');
  const title = document.getElementById('quota-title');
  const desc = document.getElementById('quota-desc');
  const licStatus = document.getElementById('setting-license-status');
  const topProBtn = document.getElementById('open-unlock-modal-btn');

  const refundTimerRow = document.getElementById('setting-refund-timer-row');
  const refundWindowEl = document.getElementById('setting-refund-window');
  const settingRefundBtn = document.getElementById('setting-refund-btn');
  const settingResetBtn = document.getElementById('setting-reset-purchase-btn');
  const modalRefundBox = document.getElementById('modal-refund-box');
  const modalRefundText = document.getElementById('modal-refund-status-text');

  if (state.isProUnlocked) {
    const refundInfo = getRefundRemainingInfo();

    if (title) title.textContent = 'WebFlacPlayer PRO (Unlimited Network)';
    if (badge) badge.textContent = `${count} / ∞ UNLIMITED`;
    if (fill) fill.style.width = '100%';
    if (desc) desc.textContent = `PRO Active • Refund window: ${refundInfo.text}`;
    if (licStatus) licStatus.textContent = 'PRO UNLIMITED (Demo Active)';
    if (topProBtn) topProBtn.textContent = 'PRO ✓';

    if (refundTimerRow) refundTimerRow.style.display = 'flex';
    if (refundWindowEl) refundWindowEl.textContent = refundInfo.text;
    if (settingRefundBtn) settingRefundBtn.classList.remove('hidden');
    if (settingResetBtn) settingResetBtn.classList.remove('hidden');
    if (modalRefundBox) modalRefundBox.classList.remove('hidden');
    if (modalRefundText) modalRefundText.textContent = `Status: ${refundInfo.text}`;
  } else {
    const used = Math.min(count, NETWORK_FREE_LIMIT);
    const pct = Math.min(100, (used / NETWORK_FREE_LIMIT) * 100);

    if (title) title.textContent = 'Alpha Trial Network Quota';
    if (badge) badge.textContent = `${used} / ${NETWORK_FREE_LIMIT} Tracks`;
    if (fill) fill.style.width = `${pct}%`;
    if (desc) desc.textContent = 'Free trial allows 15 network songs. Donate or enter a Demo Code to unlock unlimited!';
    if (licStatus) licStatus.textContent = `ALPHA TRIAL (${used}/${NETWORK_FREE_LIMIT} Used)`;
    if (topProBtn) topProBtn.textContent = 'PRO / CODE';

    if (refundTimerRow) refundTimerRow.style.display = 'none';
    if (settingRefundBtn) settingRefundBtn.classList.add('hidden');
    if (settingResetBtn) settingResetBtn.classList.add('hidden');
    if (modalRefundBox) modalRefundBox.classList.add('hidden');
  }
}

function openUnlockModal() {
  updateQuotaUI();
  const modal = document.getElementById('unlock-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeUnlockModal() {
  const modal = document.getElementById('unlock-modal');
  if (modal) modal.classList.add('hidden');
}

function redeemDemoCode(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (DEMO_KEYS.includes(code)) {
    state.isProUnlocked = true;
    state.proPurchaseTime = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.PRO_UNLOCKED, 'true');
      localStorage.setItem(STORAGE_KEYS.PRO_PURCHASE_TIME, String(state.proPurchaseTime));
    } catch (_) {}
    updateQuotaUI();
    closeUnlockModal();
    alert(`Demo Code "${code}" activated!\n\n• Tier: PRO Unlimited (Moedev)\n• Refund Window: 4 days from activation.`);
  } else {
    alert('Invalid code. Use "MOEDEV" or "VIBECODE" for the alpha tester build.');
  }
}

function handleRefundDemo() {
  if (!state.isProUnlocked) {
    alert('No active PRO license found.');
    return;
  }

  const refundInfo = getRefundRemainingInfo();
  if (!refundInfo.eligible) {
    alert('Refund unavailable: The 4-day refund window has expired. You can still use Reset Purchase.');
    return;
  }

  if (confirm(`Request Demo Refund?\n\nRemaining window: ${refundInfo.text}\nYour account will revert to Alpha Trial (15-track limit).`)) {
    state.isProUnlocked = false;
    state.proPurchaseTime = 0;
    try {
      localStorage.removeItem(STORAGE_KEYS.PRO_UNLOCKED);
      localStorage.removeItem(STORAGE_KEYS.PRO_PURCHASE_TIME);
    } catch (_) {}
    updateQuotaUI();
    closeUnlockModal();
    alert('Demo Refund processed. Reverted to Alpha Trial mode.');
  }
}

function handleResetPurchase() {
  if (!state.isProUnlocked) return;
  if (confirm('Reset active PRO license back to Alpha Trial (15-track limit)?')) {
    state.isProUnlocked = false;
    state.proPurchaseTime = 0;
    try {
      localStorage.removeItem(STORAGE_KEYS.PRO_UNLOCKED);
      localStorage.removeItem(STORAGE_KEYS.PRO_PURCHASE_TIME);
    } catch (_) {}
    updateQuotaUI();
    closeUnlockModal();
    alert('License state reset to Alpha Trial.');
  }
}

function initYouTubeAPI() {
  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '120',
      width: '200',
      videoId: '',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1
      },
      events: {
        onReady: () => {
          ytReady = true;
          ytPlayer.setVolume(Math.round(state.volume * 100));
          if (pendingYtVideoId) {
            const vid = pendingYtVideoId;
            pendingYtVideoId = null;
            ytPlayer.loadVideoById(vid);
          }
        },
        onStateChange: onYtPlayerStateChange,
        onError: onYtPlayerError
      }
    });
  };

  if (!window.YT) {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  } else if (window.YT && window.YT.Player) {
    window.onYouTubeIframeAPIReady();
  }
}

async function onYtPlayerError() {
  const song = getActiveSong();
  if (!song || !song.isYouTube || isUsingAudioElement(song)) return;

  stopYtProgressTimer();
  if (song.triedMirrorFallback) return;
  song.triedMirrorFallback = true;

  const query = `${song.artist} ${song.title}`;
  const mirror = await findFullLengthYouTubeVideoId(query, song.ytId);
  if (mirror && mirror.videoId) {
    song.ytId = mirror.videoId;
    if (mirror.duration) {
      song.duration = mirror.duration;
      updateSongDurationInDOM(song);
    }
    playYouTubeWithEqSupport(song);
  }
}

function playYouTubeIframeTrack(videoId) {
  if (!videoId) return;
  if (!ytReady || !ytPlayer || typeof ytPlayer.loadVideoById !== 'function') {
    pendingYtVideoId = videoId;
    return;
  }

  ytPlayer.setVolume(Math.round(state.volume * 100));
  if (typeof ytPlayer.setPlaybackRate === 'function') ytPlayer.setPlaybackRate(state.speed);
  ytPlayer.loadVideoById(videoId);
  setTimeout(() => {
    try { ytPlayer.playVideo(); } catch (_) {}
  }, 150);
}

function onYtPlayerStateChange(event) {
  const song = getActiveSong();
  if (!song || !song.isYouTube || isUsingAudioElement(song)) return;
  const YTState = window.YT.PlayerState;

  if (event.data === YTState.PLAYING) {
    state.isPlaying = true;
    const dur = ytPlayer.getDuration();
    if (dur && dur > 0) {
      song.duration = dur;
      updateSongDurationInDOM(song);
    }
    updatePlayPauseIcons();
    startYtProgressTimer();
  } else if (event.data === YTState.PAUSED) {
    if (document.hidden && state.playbackIntent) {
      try { ytPlayer.playVideo(); } catch (_) {}
      return;
    }
    state.isPlaying = false;
    updatePlayPauseIcons();
    stopYtProgressTimer();
  } else if (event.data === YTState.ENDED) {
    stopYtProgressTimer();
    if (state.repeat === 'one') {
      ytPlayer.seekTo(0, true);
      ytPlayer.playVideo();
    } else {
      playNextSong(false);
    }
  }
}

function startYtProgressTimer() {
  stopYtProgressTimer();
  ytProgressTimer = setInterval(() => {
    const song = getActiveSong();
    if (!song || !song.isYouTube || isUsingAudioElement(song) || !ytReady || !ytPlayer) return;
    updateProgressDisplays(ytPlayer.getCurrentTime() || 0, ytPlayer.getDuration() || song.duration || 0);
  }, 250);
}

function stopYtProgressTimer() {
  if (ytProgressTimer) {
    clearInterval(ytProgressTimer);
    ytProgressTimer = null;
  }
}

async function fetchYouTubeMetadata(videoId) {
  let title = `YouTube Track (${videoId})`;
  let artist = 'YouTube Music';
  let artUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) artist = data.author_name;
    }

    if (state.autoFetchCover) {
      const cleanArtist = artist.replace('- Topic', '').trim();
      const searchQuery = `${cleanArtist} ${title}`.trim();
      const matches = await searchInternetCoverArt(searchQuery, 1);
      if (matches.length > 0 && matches[0].artUrl) {
        artUrl = matches[0].artUrl;
      }
    }
  } catch (_) {}

  return { title, artist, artUrl };
}

async function addAndPlayYouTubeTrack(trackId, rawUrl = '', autoPlay = true) {
  const id = `yt_${trackId}`;
  let existingIdx = state.songs.findIndex((s) => s.id === id);

  const loadBtn = document.getElementById('yt-load-btn');
  const prevBtnText = loadBtn ? loadBtn.textContent : 'Add & Play';

  if (existingIdx === -1) {
    if (!canAddNetworkTrack()) {
      openUnlockModal();
      return;
    }

    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = 'Loading...';
    }

    try {
      const meta = await fetchYouTubeMetadata(trackId);
      const song = {
        id,
        ytId: trackId,
        isYouTube: true,
        url: rawUrl || `https://youtu.be/${trackId}`,
        title: meta.title,
        artist: meta.artist,
        album: 'YouTube Music Network',
        duration: 0,
        artUrl: state.customCovers[id] || meta.artUrl,
        format: 'YOUTUBE STREAM / 10-BAND EQ READY',
        isFavorite: state.favorites.has(id)
      };
      state.songs.push(song);
      existingIdx = state.songs.length - 1;
      addToNetworkHistory(trackId, song.title, song.artist, song.artUrl, song.url);
    } finally {
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.textContent = prevBtnText;
      }
    }

    renderSongList();
    updateQuotaUI();
  }

  if (autoPlay && existingIdx !== -1) {
    playSongAtIndex(existingIdx);
    navigateTo('now-playing-view');
  }
}

function addToNetworkHistory(videoId, title, artist, artUrl, url) {
  state.ytHistory = [
    {
      type: 'yt',
      videoId,
      title: title || `YouTube Track (${videoId})`,
      artist: artist || 'YouTube Music',
      artUrl: artUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url,
      timestamp: Date.now()
    },
    ...state.ytHistory.filter((item) => item.videoId !== videoId)
  ].slice(0, 40);

  saveYtHistory();
  renderYtHistory();
}

function saveYtHistory() {
  try {
    localStorage.setItem(STORAGE_KEYS.YT_HISTORY, JSON.stringify(state.ytHistory));
  } catch (_) {}
}

function loadYtHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.YT_HISTORY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    state.ytHistory = parsed.filter((item) => {
      if (item.type === 'sp') return false;
      if (item.url && item.url.includes('spotify.com')) return false;
      if (item.videoId && item.videoId.length === 22) return false;
      return true;
    });

    state.ytHistory.forEach((item) => {
      const id = `yt_${item.videoId}`;
      if (!state.songs.some((s) => s.id === id)) {
        state.songs.push({
          id,
          ytId: item.videoId,
          isYouTube: true,
          url: item.url || `https://youtu.be/${item.videoId}`,
          title: item.title,
          artist: item.artist || 'YouTube Music',
          album: 'YouTube Music Network',
          duration: 0,
          artUrl: state.customCovers[id] || item.artUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
          format: 'YOUTUBE STREAM / 10-BAND EQ READY',
          isFavorite: state.favorites.has(id)
        });
      }
    });

    saveYtHistory();
  } catch (_) {}
}

function renderYtHistory() {
  const container = document.getElementById('yt-history-list');
  if (!container) return;
  container.innerHTML = '';

  if (!state.ytHistory.length) {
    container.innerHTML = '<p class="dim" style="font-size:13px;padding:8px 0;">No saved YouTube tracks yet</p>';
    return;
  }

  state.ytHistory.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'song-item';
    div.innerHTML = `
      ${item.artUrl
        ? `<img class="song-art" src="${escapeHtml(item.artUrl)}" alt="">`
        : `<div class="song-art"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg></div>`}
      <div class="song-meta">
        <p class="song-name"><span class="yt-badge">YT</span>${escapeHtml(item.title)}</p>
        <p class="song-artist-name">${escapeHtml(item.artist || '')}</p>
      </div>
      <button type="button" class="yt-hist-del header-action-btn" title="Remove">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    `;

    div.addEventListener('click', (e) => {
      if (e.target.closest('.yt-hist-del')) return;
      addAndPlayYouTubeTrack(item.videoId, item.url, true);
    });

    div.querySelector('.yt-hist-del').addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = `yt_${item.videoId}`;
      state.ytHistory.splice(idx, 1);
      const songIdx = state.songs.findIndex((s) => s.id === targetId);
      if (songIdx !== -1) state.songs.splice(songIdx, 1);
      saveYtHistory();
      renderYtHistory();
      renderSongList();
      updateQuotaUI();
    });

    container.appendChild(div);
  });
}

function handleNetworkLoad() {
  const input = document.getElementById('yt-url-input');
  if (!input) return;
  const url = input.value.trim();
  if (!url) return;

  const ytId = extractYouTubeId(url);
  if (ytId) {
    input.value = '';
    addAndPlayYouTubeTrack(ytId, url, true);
    return;
  }

  alert('Masukkan link YouTube atau YouTube Music yang valid.');
}

function loadFiles(fileList) {
  if (!fileList || !fileList.length) return;

  const files = Array.from(fileList);
  const supportedExts = ['mp3', 'flac', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'wma', 'ape', 'alac', 'webm'];
  let addedCount = 0;
  let firstNewIndex = -1;

  files.forEach((file) => {
    const ext = getFileExtension(file.name);
    if (!supportedExts.includes(ext) && file.type && !file.type.startsWith('audio/')) return;

    const id = generateSongId(file);
    if (state.songs.some((s) => s.id === id)) return;

    const url = URL.createObjectURL(file);
    const song = {
      id,
      file,
      url,
      isYouTube: false,
      title: cleanTitle(file.name),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      artUrl: state.customCovers[id] || '',
      format: detectFormat(file),
      isFavorite: state.favorites.has(id)
    };

    if (firstNewIndex === -1) firstNewIndex = state.songs.length;
    state.songs.push(song);
    addedCount++;

    const probe = new Audio();
    probe.src = url;
    probe.addEventListener('loadedmetadata', () => {
      if (probe.duration && isFinite(probe.duration)) {
        song.duration = probe.duration;
        updateSongDurationInDOM(song);
      }
    });

    if (window.jsmediatags && typeof window.jsmediatags.read === 'function') {
      try {
        window.jsmediatags.read(file, {
          onSuccess: (tag) => {
            const tags = tag.tags || {};
            if (tags.title && tags.title.trim()) song.title = tags.title.trim();
            if (tags.artist && tags.artist.trim()) song.artist = tags.artist.trim();
            if (tags.album && tags.album.trim()) song.album = tags.album.trim();
            if (tags.picture && !state.customCovers[id]) {
              song.artUrl = pictureToDataUrl(tags.picture);
            }
            updateSongDisplay(song);
            if (!song.artUrl) autoFetchCoverForSong(song);
          },
          onError: () => {
            if (!song.artUrl) autoFetchCoverForSong(song);
          }
        });
      } catch (_) {
        if (!song.artUrl) autoFetchCoverForSong(song);
      }
    } else if (!song.artUrl) {
      autoFetchCoverForSong(song);
    }
  });

  if (addedCount > 0) {
    renderSongList();
    if (!state.isPlaying && firstNewIndex !== -1) {
      playSongAtIndex(firstNewIndex);
    }
  }
}

function getSongBadgeHtml(song) {
  if (song.isYouTube) return '<span class="yt-badge">YT</span>';
  if (song.isDemoTrack) return '<span class="yt-badge" style="background:var(--accent-subtle);color:var(--accent);border-color:var(--accent);">DEMO</span>';
  return '';
}

function updateSongDurationInDOM(song) {
  const durEl = document.querySelector(`.song-item[data-id="${song.id}"] .song-duration`);
  if (durEl) durEl.textContent = formatTime(song.duration);
  const active = getActiveSong();
  if (active && active.id === song.id) {
    const npTot = document.getElementById('np-total-time');
    const casTot = document.getElementById('cas-total-time');
    if (npTot) npTot.textContent = formatTime(song.duration);
    if (casTot) casTot.textContent = formatTime(song.duration);
  }
}

function updateSongDisplay(song) {
  const item = document.querySelector(`.song-item[data-id="${song.id}"]`);
  if (item) {
    const titleEl = item.querySelector('.song-name');
    const artistEl = item.querySelector('.song-artist-name');
    if (titleEl) titleEl.innerHTML = `${getSongBadgeHtml(song)}${escapeHtml(song.title)}`;
    if (artistEl) artistEl.textContent = song.artist;

    if (song.artUrl) {
      const artContainer = item.querySelector('.song-art');
      if (artContainer) {
        if (artContainer.tagName === 'IMG') {
          artContainer.src = song.artUrl;
        } else {
          const img = document.createElement('img');
          img.className = 'song-art';
          img.src = song.artUrl;
          artContainer.replaceWith(img);
        }
      }
    }
  }

  const active = getActiveSong();
  if (active && active.id === song.id) {
    updateNowPlayingDisplay(song);
    updateCassetteDisplay(song);
    updateMiniPlayerDisplay(song);
  }
}

function renderSongList() {
  const container = document.getElementById('song-list');
  const dropZone = document.getElementById('drop-zone');
  if (!container) return;

  if (!state.songs.length) {
    if (dropZone) dropZone.style.display = 'flex';
    container.innerHTML = '';
    return;
  }

  if (dropZone) dropZone.style.display = 'none';
  container.innerHTML = '';

  state.songs.forEach((song, idx) => {
    const item = document.createElement('div');
    const isPlaying = state.currentIndex === idx;
    item.className = 'song-item' + (isPlaying ? ' playing active' : '');
    item.dataset.id = song.id;

    const artHtml = song.artUrl
      ? `<img class="song-art" src="${escapeHtml(song.artUrl)}" alt="">`
      : `<div class="song-art"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg></div>`;

    item.innerHTML = `
      ${artHtml}
      <div class="song-meta">
        <p class="song-name">${getSongBadgeHtml(song)}${escapeHtml(song.title)}</p>
        <p class="song-artist-name">${escapeHtml(song.artist)}</p>
      </div>
      <span class="song-duration">${song.duration ? formatTime(song.duration) : '--:--'}</span>
    `;

    item.addEventListener('click', () => {
      playSongAtIndex(idx);
      navigateTo('now-playing-view');
    });

    container.appendChild(item);
  });
}

function updateNowPlayingDisplay(song) {
  if (!song) return;

  const npTitle = document.getElementById('np-title');
  const npArtist = document.getElementById('np-artist');
  const npAlbum = document.getElementById('np-album');
  const npArt = document.getElementById('np-art');
  const npArtPlaceholder = document.getElementById('np-art-placeholder');
  const npFormat = document.getElementById('np-format-info');
  const npSpeed = document.getElementById('np-speed');
  const sbQuality = document.getElementById('sb-quality');

  if (npTitle) npTitle.textContent = song.title;
  if (npArtist) npArtist.textContent = song.artist;
  if (npAlbum) npAlbum.textContent = song.album;
  if (npFormat) npFormat.textContent = song.format;
  if (npSpeed) npSpeed.textContent = `${state.speed % 1 === 0 ? state.speed.toFixed(1) : state.speed}×`;

  if (sbQuality) {
    if (song.isYouTube) sbQuality.textContent = 'YT';
    else if (song.format.includes('FLAC') || song.format.includes('WAV')) sbQuality.textContent = 'HR';
    else sbQuality.textContent = 'HD';
  }

  if (song.artUrl) {
    if (npArt) {
      npArt.src = song.artUrl;
      npArt.style.display = 'block';
    }
    if (npArtPlaceholder) npArtPlaceholder.style.display = 'none';
  } else {
    if (npArt) {
      npArt.src = '';
      npArt.style.display = 'none';
    }
    if (npArtPlaceholder) npArtPlaceholder.style.display = 'flex';
  }

  updateFavoriteBtnState(song.id);
}

function updateCassetteDisplay(song) {
  if (!song) return;
  const casTitle = document.getElementById('cas-title');
  const casArtist = document.getElementById('cas-artist');
  const casAlbum = document.getElementById('cas-album');

  if (casTitle) casTitle.textContent = song.title.toUpperCase();
  if (casArtist) casArtist.textContent = song.artist.toUpperCase();
  if (casAlbum) casAlbum.textContent = song.album.toUpperCase();
}

function updateMiniPlayerDisplay(song) {
  if (!song) return;
  const miniTitle = document.getElementById('mini-title');
  const miniArtist = document.getElementById('mini-artist');
  const miniArt = document.getElementById('mini-art');
  const miniPlaceholder = document.getElementById('mini-art-placeholder');

  if (miniTitle) miniTitle.textContent = song.title;
  if (miniArtist) miniArtist.textContent = song.artist;

  if (song.artUrl) {
    if (miniArt) {
      miniArt.src = song.artUrl;
      miniArt.style.display = 'block';
    }
    if (miniPlaceholder) miniPlaceholder.style.display = 'none';
  } else {
    if (miniArt) {
      miniArt.src = '';
      miniArt.style.display = 'none';
    }
    if (miniPlaceholder) miniPlaceholder.style.display = 'flex';
  }

  updateMiniPlayerVisibility();
}

function updateMiniPlayerVisibility(currentViewId) {
  const miniPlayer = document.getElementById('mini-player');
  if (!miniPlayer) return;

  const activeView = currentViewId || (document.querySelector('.view.active') ? document.querySelector('.view.active').id : 'home-view');
  const isFullPlayerView = activeView === 'now-playing-view' || activeView === 'cassette-view';
  const hasLoadedSong = state.songs.length > 0 && state.currentIndex >= 0;

  miniPlayer.classList.toggle('hidden', !(hasLoadedSong && !isFullPlayerView));
}

function updatePlayPauseIcons() {
  const song = getActiveSong();
  let isPlaying = state.isPlaying;
  if (song && isUsingAudioElement(song) && audioElement) {
    isPlaying = !audioElement.paused && !audioElement.ended;
    state.isPlaying = isPlaying;
  }

  ['np-play-btn', 'cas-play-btn', 'mini-play-btn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const playIcon = btn.querySelector('.icon-play');
    const pauseIcon = btn.querySelector('.icon-pause');
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'inline-block';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? 'inline-block' : 'none';
  });

  const casWrapper = document.querySelector('.cassette-wrapper');
  const casBody = document.querySelector('.cassette-body');
  if (casWrapper) casWrapper.classList.toggle('playing', isPlaying);
  if (casBody) casBody.classList.toggle('playing', isPlaying);
}

function updateProgressDisplays(current, duration) {
  const safeCur = isFinite(current) && current > 0 ? current : 0;
  const safeDur = isFinite(duration) && duration > 0 ? duration : 0;
  const timeStr = formatTime(safeCur);
  const totalStr = formatTime(safeDur);

  let rawRatio = safeDur > 0 ? safeCur / safeDur : 0;
  if (!isFinite(rawRatio) || isNaN(rawRatio)) rawRatio = 0;
  const clampedRatio = Math.min(1, Math.max(0, rawRatio));
  const pct = `${(clampedRatio * 100).toFixed(2)}%`;

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setEl('np-current-time', timeStr);
  setEl('np-total-time', totalStr);
  setEl('cas-current-time', timeStr);
  setEl('cas-total-time', totalStr);

  const npFill = document.getElementById('np-progress-fill');
  const npThumb = document.getElementById('np-progress-thumb');
  const casFill = document.getElementById('cas-progress-fill');
  const casThumb = document.getElementById('cas-progress-thumb');
  const miniFill = document.getElementById('mini-progress-fill');

  if (npFill) npFill.style.width = pct;
  if (npThumb) npThumb.style.left = pct;
  if (casFill) casFill.style.width = pct;
  if (casThumb) casThumb.style.left = pct;
  if (miniFill) miniFill.style.width = pct;

  const leftTape = document.getElementById('cas-tape-left');
  const rightTape = document.getElementById('cas-tape-right');
  const leftSize = Math.max(40, 90 - clampedRatio * 40);
  const rightSize = Math.min(90, 50 + clampedRatio * 40);

  if (leftTape) {
    leftTape.style.width = `${leftSize}px`;
    leftTape.style.height = `${leftSize}px`;
  }
  if (rightTape) {
    rightTape.style.width = `${rightSize}px`;
    rightTape.style.height = `${rightSize}px`;
  }
}

function refreshDeviceInfo() {
  const setDev = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows OS';
  else if (/Android/i.test(ua)) os = 'Android Mobile';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS / iPadOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux System';

  let browser = 'Web Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge (Chromium)';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome (Blink)';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox (Gecko)';
  else if (/Safari\//i.test(ua)) browser = 'Apple Safari (WebKit)';

  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : 'Multi-Core CPU';
  const ram = navigator.deviceMemory ? `~${navigator.deviceMemory} GB RAM` : 'Dynamic Shared RAM';
  const screenRes = `${window.screen.width} × ${window.screen.height} (@${window.devicePixelRatio || 1}x)`;
  const sampleRate = audioCtx ? `${audioCtx.sampleRate} Hz (32-bit Float)` : '48000 Hz (Hi-Res Ready)';
  const netInfo = navigator.onLine
    ? (navigator.connection && navigator.connection.effectiveType ? `Online (${navigator.connection.effectiveType.toUpperCase()})` : 'Online (Connected)')
    : 'Offline Mode';

  setDev('dev-os', os);
  setDev('dev-browser', browser);
  setDev('dev-cpu', cores);
  setDev('dev-ram', ram);
  setDev('dev-screen', screenRes);
  setDev('dev-audio-hz', sampleRate);
  setDev('dev-net', netInfo);
}

function toggleFavoriteCurrentSong() {
  const song = getActiveSong();
  if (!song) return;

  if (state.favorites.has(song.id)) {
    state.favorites.delete(song.id);
    song.isFavorite = false;
  } else {
    state.favorites.add(song.id);
    song.isFavorite = true;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(state.favorites)));
  } catch (_) {}

  updateFavoriteBtnState(song.id);
  renderFavorites();
}

function updateFavoriteBtnState(songId) {
  const favBtn = document.getElementById('np-fav-btn');
  if (favBtn) favBtn.classList.toggle('active', state.favorites.has(songId));
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) state.favorites = new Set(JSON.parse(raw));
  } catch (_) {}
}

function renderFavorites() {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  const favSongs = state.songs.filter((s) => state.favorites.has(s.id));

  if (!favSongs.length) {
    container.innerHTML = '<div class="empty-state"><p>No favorites yet</p></div>';
    return;
  }

  container.innerHTML = '';
  favSongs.forEach((song) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      ${song.artUrl ? `<img class="song-art" src="${escapeHtml(song.artUrl)}" alt="">` : `<div class="song-art">♪</div>`}
      <div class="song-meta">
        <p class="song-name">${getSongBadgeHtml(song)}${escapeHtml(song.title)}</p>
        <p class="song-artist-name">${escapeHtml(song.artist)}</p>
      </div>
    `;
    item.addEventListener('click', () => {
      const idx = state.songs.findIndex((s) => s.id === song.id);
      if (idx !== -1) {
        playSongAtIndex(idx);
        navigateTo('now-playing-view');
      }
    });
    container.appendChild(item);
  });
}

function addToRecent(songId) {
  state.recentIds = [songId, ...state.recentIds.filter((id) => id !== songId)].slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(state.recentIds));
  } catch (_) {}
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    if (raw) state.recentIds = JSON.parse(raw);
  } catch (_) {}
}

function renderRecent() {
  const container = document.getElementById('recent-list');
  if (!container) return;
  const recentSongs = state.recentIds.map((id) => state.songs.find((s) => s.id === id)).filter(Boolean);

  if (!recentSongs.length) {
    container.innerHTML = '<div class="empty-state"><p>No recent tracks</p></div>';
    return;
  }

  container.innerHTML = '';
  recentSongs.forEach((song) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      ${song.artUrl ? `<img class="song-art" src="${escapeHtml(song.artUrl)}" alt="">` : `<div class="song-art">♪</div>`}
      <div class="song-meta">
        <p class="song-name">${getSongBadgeHtml(song)}${escapeHtml(song.title)}</p>
        <p class="song-artist-name">${escapeHtml(song.artist)}</p>
      </div>
    `;
    item.addEventListener('click', () => {
      const idx = state.songs.findIndex((s) => s.id === song.id);
      if (idx !== -1) {
        playSongAtIndex(idx);
        navigateTo('now-playing-view');
      }
    });
    container.appendChild(item);
  });
}

function savePlaylists() {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(state.playlists));
  } catch (_) {}
}

function loadPlaylists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    if (raw) state.playlists = JSON.parse(raw);
  } catch (_) {}
}

function renderPlaylists() {
  const container = document.getElementById('playlists-container');
  if (!container) return;
  if (!state.playlists.length) {
    container.innerHTML = '<div class="empty-state"><p>No playlists yet</p></div>';
    return;
  }

  container.innerHTML = '';
  state.playlists.forEach((pl, idx) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    const count = pl.songIds ? pl.songIds.length : 0;
    item.innerHTML = `
      <div class="song-art">☰</div>
      <div class="song-meta">
        <p class="song-name">${escapeHtml(pl.name)}</p>
        <p class="song-artist-name">${count} tracks</p>
      </div>
      <div style="display:flex;gap:6px;">
        <button type="button" class="pl-add header-action-btn" title="Add Current Song">+</button>
        <button type="button" class="pl-del header-action-btn" title="Delete">&times;</button>
      </div>
    `;

    item.querySelector('.pl-add').addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = getActiveSong();
      if (cur && !pl.songIds.includes(cur.id)) {
        pl.songIds.push(cur.id);
        savePlaylists();
        renderPlaylists();
      }
    });

    item.querySelector('.pl-del').addEventListener('click', (e) => {
      e.stopPropagation();
      state.playlists.splice(idx, 1);
      savePlaylists();
      renderPlaylists();
    });

    item.addEventListener('click', () => {
      const first = state.songs.find((s) => pl.songIds.includes(s.id));
      if (first) {
        playSongAtIndex(state.songs.indexOf(first));
        navigateTo('now-playing-view');
      }
    });
    container.appendChild(item);
  });
}

function renderAlbums() {
  const container = document.getElementById('album-list');
  if (!container) return;
  if (!state.songs.length) {
    container.innerHTML = '<div class="empty-state"><p>No albums loaded</p></div>';
    return;
  }
  container.innerHTML = '';
  const map = {};
  state.songs.forEach((s) => {
    const name = s.album || 'Unknown Album';
    if (!map[name]) map[name] = { name, artist: s.artist, artUrl: s.artUrl, songs: [] };
    if (!map[name].artUrl && s.artUrl) map[name].artUrl = s.artUrl;
    map[name].songs.push(s);
  });
  Object.values(map).forEach((alb) => {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.innerHTML = `
      ${alb.artUrl ? `<img class="album-art" src="${escapeHtml(alb.artUrl)}" alt="">` : `<div class="album-art">💿</div>`}
      <p class="album-name">${escapeHtml(alb.name)}</p>
      <p class="album-artist-name">${escapeHtml(alb.artist)}</p>
    `;
    card.addEventListener('click', () => {
      const idx = state.songs.indexOf(alb.songs[0]);
      if (idx !== -1) {
        playSongAtIndex(idx);
        navigateTo('now-playing-view');
      }
    });
    container.appendChild(card);
  });
}

function renderArtists() {
  const container = document.getElementById('artist-list');
  if (!container) return;
  if (!state.songs.length) {
    container.innerHTML = '<div class="empty-state"><p>No artists loaded</p></div>';
    return;
  }
  container.innerHTML = '';
  const map = {};
  state.songs.forEach((s) => {
    const name = s.artist || 'Unknown Artist';
    if (!map[name]) map[name] = { name, songs: [], artUrl: s.artUrl };
    if (!map[name].artUrl && s.artUrl) map[name].artUrl = s.artUrl;
    map[name].songs.push(s);
  });
  Object.values(map).forEach((art) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      ${art.artUrl
        ? `<img class="song-art" src="${escapeHtml(art.artUrl)}" alt="" style="border-radius:50%;">`
        : `<div class="song-art" style="border-radius:50%;">🎤</div>`}
      <div class="song-meta">
        <p class="song-name">${escapeHtml(art.name)}</p>
        <p class="song-artist-name">${art.songs.length} tracks</p>
      </div>
    `;
    item.addEventListener('click', () => {
      const idx = state.songs.indexOf(art.songs[0]);
      if (idx !== -1) {
        playSongAtIndex(idx);
        navigateTo('now-playing-view');
      }
    });
    container.appendChild(item);
  });
}

function buildEqualizerUI() {
  const container = document.getElementById('eq-sliders');
  const eqToggle = document.getElementById('eq-toggle');
  if (eqToggle) eqToggle.checked = state.eqEnabled;
  if (!container) return;
  container.innerHTML = '';

  EQ_FREQUENCIES.forEach((_, idx) => {
    const gain = Number(state.eqGains[idx]) || 0;
    const band = document.createElement('div');
    band.className = 'eq-band';
    band.innerHTML = `
      <span class="eq-val" id="eq-val-${idx}">${gain > 0 ? '+' : ''}${gain}dB</span>
      <input type="range" min="-15" max="15" value="${gain}" step="1" orient="vertical" data-band="${idx}">
      <span class="eq-freq">${EQ_LABELS[idx]}</span>
    `;
    band.querySelector('input').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      state.eqGains[idx] = val;
      const label = document.getElementById(`eq-val-${idx}`);
      if (label) label.textContent = `${val > 0 ? '+' : ''}${val}dB`;
      document.querySelectorAll('.eq-preset').forEach((b) => b.classList.remove('active'));
      applyEqGains();
      saveEq();
    });
    container.appendChild(band);
  });
}

function updateEqSliders() {
  const eqToggle = document.getElementById('eq-toggle');
  if (eqToggle) eqToggle.checked = state.eqEnabled;

  EQ_FREQUENCIES.forEach((_, idx) => {
    const gain = Number(state.eqGains[idx]) || 0;
    const input = document.querySelector(`input[data-band="${idx}"]`);
    const valLabel = document.getElementById(`eq-val-${idx}`);
    if (input) input.value = gain;
    if (valLabel) valLabel.textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
  });
}

function saveEq() {
  try {
    localStorage.setItem(STORAGE_KEYS.EQ_ENABLED, JSON.stringify(state.eqEnabled));
    localStorage.setItem(STORAGE_KEYS.EQ_GAINS, JSON.stringify(state.eqGains));
  } catch (_) {}
}

function loadEq() {
  try {
    const rawE = localStorage.getItem(STORAGE_KEYS.EQ_ENABLED);
    if (rawE !== null) state.eqEnabled = JSON.parse(rawE);
    const rawG = localStorage.getItem(STORAGE_KEYS.EQ_GAINS);
    if (rawG) {
      const parsed = JSON.parse(rawG);
      if (Array.isArray(parsed) && parsed.length === 10) {
        state.eqGains = parsed.map((v) => Number(v) || 0);
      }
    }
  } catch (_) {}
}

function setVolume(vol) {
  state.volume = Math.max(0, Math.min(1, vol));
  if (audioElement) audioElement.volume = state.volume;
  if (ytReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
    ytPlayer.setVolume(Math.round(state.volume * 100));
  }
  const pct = Math.round(state.volume * 100);
  const volRange = document.getElementById('setting-volume');
  const volVal = document.getElementById('volume-val');
  if (volRange) volRange.value = pct;
  if (volVal) volVal.textContent = `${pct}%`;
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(state.volume));
  } catch (_) {}
}

function setPlaybackSpeed(spd) {
  state.speed = spd;
  if (audioElement) audioElement.playbackRate = state.speed;
  if (ytReady && ytPlayer && typeof ytPlayer.setPlaybackRate === 'function') {
    ytPlayer.setPlaybackRate(state.speed);
  }
  const spdSelect = document.getElementById('setting-speed');
  const npSpeed = document.getElementById('np-speed');
  if (spdSelect) spdSelect.value = String(state.speed);
  if (npSpeed) npSpeed.textContent = `${state.speed % 1 === 0 ? state.speed.toFixed(1) : state.speed}×`;
  try {
    localStorage.setItem(STORAGE_KEYS.SPEED, String(state.speed));
  } catch (_) {}
}

function applyTheme(theme, autoSyncAccent = true) {
  state.theme = theme;
  document.body.classList.remove(
    'theme-miku',
    'theme-teto',
    'theme-midnight',
    'theme-amoled',
    'theme-forest',
    'theme-crimson',
    'theme-purple'
  );

  if (theme !== 'dark') {
    document.body.classList.add(`theme-${theme}`);
  }

  if (autoSyncAccent) {
    if (theme === 'miku') applyAccentColor('#39c5bb');
    else if (theme === 'teto') applyAccentColor('#e12885');
  }

  const themeSelect = document.getElementById('setting-theme');
  if (themeSelect) themeSelect.value = theme;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (_) {}
}

function applyAccentColor(hexColor) {
  if (!hexColor) return;
  state.accentColor = hexColor;
  const rgb = hexToRgb(hexColor);
  const root = document.documentElement;
  root.style.setProperty('--accent', hexColor);
  root.style.setProperty('--accent-hover', hexColor);
  root.style.setProperty('--cassette-stripe', hexColor);

  if (rgb) {
    root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`);
    root.style.setProperty('--accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
  }

  const colorInput = document.getElementById('setting-accent-color');
  const hexLabel = document.getElementById('accent-hex-label');
  if (colorInput) colorInput.value = hexColor;
  if (hexLabel) hexLabel.textContent = hexColor.toUpperCase();

  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === hexColor.toLowerCase());
  });

  try {
    localStorage.setItem(STORAGE_KEYS.ACCENT, hexColor);
  } catch (_) {}
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function updateStatusBarTime() {
  const timeEl = document.getElementById('sb-time');
  if (!timeEl) return;
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  timeEl.textContent = `${hours}:${minutes} ${ampm}`;
}

function initBattery() {
  if (!navigator.getBattery) return;
  navigator.getBattery().then((battery) => {
    const update = () => {
      const pctEl = document.getElementById('sb-battery-pct');
      const fillEl = document.getElementById('battery-fill');
      const devBat = document.getElementById('dev-battery');
      const level = Math.round(battery.level * 100);
      if (pctEl) pctEl.textContent = `${level}%`;
      if (fillEl) fillEl.setAttribute('width', Math.max(1, Math.round(18 * battery.level)));
      if (devBat) devBat.textContent = `${level}% (${battery.charging ? 'Charging ⚡' : 'Discharging'})`;
    };
    update();
    battery.addEventListener('levelchange', update);
    battery.addEventListener('chargingchange', update);
  }).catch(() => {});
}

function navigateTo(viewId, pushHistory = true) {
  const targetView = document.getElementById(viewId);
  if (!targetView) return;

  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  targetView.classList.add('active');

  if (pushHistory) {
    const currentTop = state.viewHistory[state.viewHistory.length - 1];
    if (currentTop !== viewId) state.viewHistory.push(viewId);
  }

  updateMiniPlayerVisibility(viewId);

  if (viewId === 'songs-view') renderSongList();
  if (viewId === 'favorites-view') renderFavorites();
  if (viewId === 'recent-view') renderRecent();
  if (viewId === 'album-view') renderAlbums();
  if (viewId === 'artist-view') renderArtists();
  if (viewId === 'playlists-view') renderPlaylists();
  if (viewId === 'youtube-view') updateQuotaUI();
  if (viewId === 'equalizer-view') updateEqSliders();
  if (viewId === 'settings-view') {
    refreshDeviceInfo();
    updateQuotaUI();
  }
}

function goBack() {
  if (state.viewHistory.length > 1) {
    state.viewHistory.pop();
    navigateTo(state.viewHistory[state.viewHistory.length - 1], false);
  } else {
    navigateTo('home-view', false);
  }
}

function attachProgressBar(barId, thumbId) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  const thumb = thumbId ? document.getElementById(thumbId) : null;
  let isDragging = false;

  function performSeek(clientX) {
    const rect = bar.getBoundingClientRect();
    if (!rect.width || rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekPlaybackTo(ratio);
  }

  bar.addEventListener('click', (e) => performSeek(e.clientX));
  if (thumb) {
    thumb.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isDragging = true;
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) performSeek(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getFileExtension(filename) {
  if (!filename) return '';
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.slice(idx + 1).toLowerCase() : '';
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=)|music\.youtube\.com\/watch\?v=)([\w-]{11})/);
  return match ? match[1] : null;
}

function pictureToDataUrl(picture) {
  try {
    if (!picture || !picture.data) return '';
    const { data, format } = picture;
    let binary = '';
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.byteLength; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, bytes.byteLength)));
    }
    return `data:${format || 'image/jpeg'};base64,${btoa(binary)}`;
  } catch (_) {
    return '';
  }
}

function generateSongId(file) {
  return `song_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${file.size}`;
}

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cleanTitle(filename) {
  if (!filename) return 'Unknown Track';
  const dotIdx = filename.lastIndexOf('.');
  const baseName = dotIdx !== -1 ? filename.slice(0, dotIdx) : filename;
  return baseName.replace(/^[\d\s._-]+/, '').replace(/_/g, ' ').trim() || baseName;
}

function detectFormat(file) {
  const ext = getFileExtension(file.name).toUpperCase();
  if (ext === 'FLAC') return 'FLAC 96 kHz / 24-bit Lossless';
  if (ext === 'WAV') return 'WAV 44.1 kHz / 16-bit PCM';
  if (ext === 'MP3') return 'MP3 320 kbps / 44.1 kHz';
  return `${ext || 'AUDIO'} / Hi-Res Engine`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toggleFullScreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function triggerPwaInstall() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then(() => {
      deferredPwaPrompt = null;
      const topInstallBtn = document.getElementById('pwa-install-top-btn');
      if (topInstallBtn) topInstallBtn.classList.add('hidden');
    });
  } else {
    alert('Untuk menginstal aplikasi atau membuat pintasan layar penuh:\n\n• Di Chrome / Edge HP: Klik ikon titik tiga (⋮) di pojok browser -> pilih "Tambahkan ke layar utama" -> pilih "Instal".\n• Di Chrome / Edge PC: Klik ikon Install (+) di sebelah kanan kolom URL.');
  }
}

function initPwaAndFullscreen() {
  const fsTopBtn = document.getElementById('fullscreen-toggle-btn');
  const fsSettingBtn = document.getElementById('setting-fullscreen-btn');
  const installTopBtn = document.getElementById('pwa-install-top-btn');
  const installSettingBtn = document.getElementById('setting-install-pwa-btn');

  if (fsTopBtn) fsTopBtn.addEventListener('click', toggleFullScreen);
  if (fsSettingBtn) fsSettingBtn.addEventListener('click', toggleFullScreen);
  if (installTopBtn) installTopBtn.addEventListener('click', triggerPwaInstall);
  if (installSettingBtn) installSettingBtn.addEventListener('click', triggerPwaInstall);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (installTopBtn) installTopBtn.classList.remove('hidden');
  });

  if ('serviceWorker' in navigator) {
    const isLocalhost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
    } else {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }
}

function setupEventListeners() {
  document.querySelectorAll('.menu-item[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetView = VIEW_ROUTES[btn.dataset.action];
      if (targetView) navigateTo(targetView);
    });
  });

  document.querySelectorAll('.back-btn[data-back]').forEach((btn) => {
    btn.addEventListener('click', goBack);
  });

  const bindClick = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  bindClick('cassette-mode-btn', () => navigateTo('cassette-view'));
  bindClick('digital-mode-btn', () => navigateTo('now-playing-view'));

  bindClick('open-cover-modal-btn', openCoverModal);
  bindClick('np-art-trigger', openCoverModal);
  bindClick('close-cover-modal', closeCoverModal);

  bindClick('cover-search-btn', () => {
    const q = document.getElementById('cover-search-input')?.value;
    if (q) triggerCoverSearch(q);
  });

  const coverSearchInput = document.getElementById('cover-search-input');
  if (coverSearchInput) {
    coverSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerCoverSearch(coverSearchInput.value);
    });
  }

  bindClick('cover-url-apply-btn', () => {
    const url = document.getElementById('cover-url-input')?.value.trim();
    if (url) applyCustomCoverToActiveSong(url);
  });

  const coverFileInput = document.getElementById('cover-file-input');
  bindClick('cover-upload-btn', () => coverFileInput && coverFileInput.click());
  if (coverFileInput) {
    coverFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          applyCustomCoverToActiveSong(reader.result);
        }
      };
      reader.readAsDataURL(file);
      coverFileInput.value = '';
    });
  }

  const autoCoverToggle = document.getElementById('setting-auto-cover');
  if (autoCoverToggle) {
    autoCoverToggle.checked = state.autoFetchCover;
    autoCoverToggle.addEventListener('change', () => {
      state.autoFetchCover = autoCoverToggle.checked;
      try {
        localStorage.setItem(STORAGE_KEYS.AUTO_COVER, JSON.stringify(state.autoFetchCover));
      } catch (_) {}
    });
  }

  const fileInput = document.getElementById('file-input');
  bindClick('add-files-btn', () => fileInput && fileInput.click());
  bindClick('browse-files-btn', () => fileInput && fileInput.click());
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        loadFiles(e.target.files);
        fileInput.value = '';
      }
    });
  }

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evtName) => {
    document.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  document.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files);
  });

  bindClick('np-play-btn', togglePlayPause);
  bindClick('np-prev-btn', playPrevSong);
  bindClick('np-next-btn', () => playNextSong(true));
  bindClick('np-shuffle-btn', toggleShuffle);
  bindClick('np-repeat-btn', cycleRepeat);
  bindClick('np-fav-btn', toggleFavoriteCurrentSong);

  bindClick('cas-play-btn', togglePlayPause);
  bindClick('cas-prev-btn', playPrevSong);
  bindClick('cas-next-btn', () => playNextSong(true));
  bindClick('cas-shuffle-btn', toggleShuffle);
  bindClick('cas-repeat-btn', cycleRepeat);

  bindClick('mini-play-btn', togglePlayPause);
  bindClick('mini-prev-btn', playPrevSong);
  bindClick('mini-next-btn', () => playNextSong(true));

  const miniTap = document.getElementById('mini-player-tap');
  if (miniTap) {
    miniTap.addEventListener('click', (e) => {
      if (!e.target.closest('.mini-controls')) navigateTo('now-playing-view');
    });
  }

  attachProgressBar('np-progress-bar', 'np-progress-thumb');
  attachProgressBar('cas-progress-bar', 'cas-progress-thumb');
  attachProgressBar('mini-progress-bar', null);

  const eqToggle = document.getElementById('eq-toggle');
  if (eqToggle) {
    eqToggle.addEventListener('change', () => {
      state.eqEnabled = eqToggle.checked;
      applyEqGains();
      saveEq();
    });
  }

  bindClick('eq-reset-btn', () => {
    state.eqGains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    document.querySelectorAll('.eq-preset').forEach((b) => {
      b.classList.toggle('active', b.dataset.preset === 'flat');
    });
    updateEqSliders();
    applyEqGains();
    saveEq();
  });

  document.querySelectorAll('.eq-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      if (EQ_PRESETS[p]) {
        state.eqEnabled = true;
        if (eqToggle) eqToggle.checked = true;
        state.eqGains = [...EQ_PRESETS[p]];
        document.querySelectorAll('.eq-preset').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updateEqSliders();
        applyEqGains();
        saveEq();
      }
    });
  });

  bindClick('yt-load-btn', handleNetworkLoad);
  const ytInput = document.getElementById('yt-url-input');
  if (ytInput) {
    ytInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleNetworkLoad();
    });
  }

  bindClick('open-unlock-modal-btn', openUnlockModal);
  bindClick('unlock-pro-inline-btn', openUnlockModal);
  bindClick('setting-open-modal-btn', openUnlockModal);
  bindClick('close-unlock-modal', closeUnlockModal);

  bindClick('redeem-code-btn', () => {
    const codeInput = document.getElementById('demo-code-input');
    if (codeInput) redeemDemoCode(codeInput.value);
  });

  bindClick('autofill-demo-btn', () => {
    const codeInput = document.getElementById('demo-code-input');
    if (codeInput) {
      codeInput.value = 'MOEDEV';
      redeemDemoCode('MOEDEV');
    }
  });

  bindClick('simulate-donate-btn', () => {
    alert('Thank you for supporting Moedev (Demo Mode)!\n\nYour complimentary Pro Key: MOEDEV\n(Includes 4-Day Demo Refund Policy)');
    redeemDemoCode('MOEDEV');
  });

  bindClick('setting-refund-btn', handleRefundDemo);
  bindClick('modal-refund-btn', handleRefundDemo);
  bindClick('setting-reset-purchase-btn', handleResetPurchase);
  bindClick('modal-reset-purchase-btn', handleResetPurchase);

  bindClick('create-playlist-btn', () => {
    const name = prompt('Enter playlist name:', 'My Playlist');
    if (name && name.trim()) {
      const cur = getActiveSong();
      state.playlists.push({
        id: generateId('pl'),
        name: name.trim(),
        songIds: cur ? [cur.id] : []
      });
      savePlaylists();
      renderPlaylists();
    }
  });

  const speedSelect = document.getElementById('setting-speed');
  if (speedSelect) speedSelect.addEventListener('change', (e) => setPlaybackSpeed(parseFloat(e.target.value)));

  const volInput = document.getElementById('setting-volume');
  if (volInput) volInput.addEventListener('input', (e) => setVolume(parseInt(e.target.value, 10) / 100));

  const themeSelect = document.getElementById('setting-theme');
  if (themeSelect) themeSelect.addEventListener('change', (e) => applyTheme(e.target.value, true));

  const accentColorInput = document.getElementById('setting-accent-color');
  if (accentColorInput) accentColorInput.addEventListener('input', (e) => applyAccentColor(e.target.value));

  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => applyAccentColor(swatch.dataset.color));
  });
}

function setupAudioElementListeners() {
  audioElement = document.getElementById('audio-element');
  if (!audioElement) return;

  audioElement.addEventListener('timeupdate', () => {
    const s = getActiveSong();
    if (!s || !isUsingAudioElement(s)) return;
    updateProgressDisplays(audioElement.currentTime, audioElement.duration || s.duration || 0);
  });

  audioElement.addEventListener('loadedmetadata', () => {
    const s = getActiveSong();
    if (!s || !isUsingAudioElement(s)) return;
    if (audioElement.duration && isFinite(audioElement.duration)) {
      s.duration = audioElement.duration;
      updateSongDurationInDOM(s);
    }
    updateProgressDisplays(audioElement.currentTime, audioElement.duration || s.duration || 0);
  });

  audioElement.addEventListener('play', () => {
    const s = getActiveSong();
    if (!s || !isUsingAudioElement(s)) return;
    initAudioContext();
    applyEqGains();
    state.isPlaying = true;
    updatePlayPauseIcons();
  });

  audioElement.addEventListener('pause', () => {
    const s = getActiveSong();
    if (!s || !isUsingAudioElement(s)) return;

    if (document.hidden && state.playbackIntent && !audioElement.ended) {
      audioElement.play().catch(() => {});
      return;
    }

    state.isPlaying = false;
    updatePlayPauseIcons();
  });

  audioElement.addEventListener('ended', () => {
    const s = getActiveSong();
    if (!s || !isUsingAudioElement(s)) return;
    if (state.repeat === 'one') {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    } else {
      playNextSong(false);
    }
  });
}

function init() {
  initBackgroundPersistence();
  setupAudioElementListeners();
  setupEventListeners();
  initPwaAndFullscreen();

  try {
    const rawCovers = localStorage.getItem(STORAGE_KEYS.CUSTOM_COVERS);
    if (rawCovers) state.customCovers = JSON.parse(rawCovers);

    const rawAutoCover = localStorage.getItem(STORAGE_KEYS.AUTO_COVER);
    if (rawAutoCover !== null) state.autoFetchCover = JSON.parse(rawAutoCover);

    if (localStorage.getItem(STORAGE_KEYS.PRO_UNLOCKED) === 'true') {
      state.isProUnlocked = true;
    }
    const savedPurchaseTime = localStorage.getItem(STORAGE_KEYS.PRO_PURCHASE_TIME);
    if (savedPurchaseTime) {
      state.proPurchaseTime = parseInt(savedPurchaseTime, 10) || Date.now();
    } else if (state.isProUnlocked) {
      state.proPurchaseTime = Date.now();
      localStorage.setItem(STORAGE_KEYS.PRO_PURCHASE_TIME, String(state.proPurchaseTime));
    }
  } catch (_) {}

  loadFavorites();
  loadPlaylists();
  loadRecent();
  loadEq();
  loadBuiltInDemoTrack();
  loadYtHistory();

  try {
    const savedVol = localStorage.getItem(STORAGE_KEYS.VOLUME);
    if (savedVol !== null) setVolume(parseFloat(savedVol));
    const savedSpeed = localStorage.getItem(STORAGE_KEYS.SPEED);
    if (savedSpeed !== null) setPlaybackSpeed(parseFloat(savedSpeed));
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) applyTheme(savedTheme, false);
    const savedAccent = localStorage.getItem(STORAGE_KEYS.ACCENT);
    if (savedAccent) applyAccentColor(savedAccent);
  } catch (_) {}

  buildEqualizerUI();
  updateEqSliders();
  initYouTubeAPI();
  renderYtHistory();
  renderSongList();
  updateQuotaUI();
  refreshDeviceInfo();

  updateStatusBarTime();
  setInterval(updateStatusBarTime, 1000);
  initBattery();

  navigateTo('home-view', false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}