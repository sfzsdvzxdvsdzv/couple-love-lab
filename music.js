(() => {
  'use strict';

  const button = document.getElementById('sound');
  const intro = document.getElementById('musicIntro');
  const status = document.getElementById('musicStatus');
  const header = button && button.closest('header');
  const music = window.LOVE_CONFIG && window.LOVE_CONFIG.music;
  const configuredSource = typeof music === 'string' ? music : music && music.src;
  let source = 'assets/romantic-piano.mp3';
  // The soundtrack is a site asset. Share-link data never changes its source.
  if (typeof configuredSource === 'string') {
    try {
      const candidate = new URL(configuredSource, document.baseURI);
      if (candidate.origin === location.origin && /^https?:$/.test(candidate.protocol)) {
        source = candidate.href;
      }
    } catch {}
  }

  const audio = new Audio(source);
  audio.loop = true;
  audio.autoplay = true;
  audio.preload = 'metadata';
  audio.volume = 0.32;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

  let active = false;
  let loading = false;
  let everPlayed = false;
  let manualPaused = false;
  let failed = false;
  let blocked = false;
  let attempt = null;
  let generation = 0;

  function feedback(text) {
    if (!status) return;
    status.textContent = text;
    status.hidden = !text;
  }

  function render() {
    if (button) {
      button.textContent = loading ? '♫ 正在加载…' : active ? '♫ 音乐播放中' :
        failed ? '♫ 点此重试' : everPlayed ? '♫ 继续音乐' : '♫ 开启音乐';
      button.disabled = loading;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-busy', String(loading));
      button.setAttribute('aria-label', active ? '暂停浪漫背景音乐' :
        failed ? '重新加载并播放浪漫背景音乐' : '播放浪漫背景音乐');
      button.classList.toggle('is-playing', active);
    }
    if (header) header.classList.toggle('is-playing', active);
    if (intro) {
      intro.hidden = everPlayed;
      intro.disabled = loading;
      intro.setAttribute('aria-busy', String(loading));
      intro.textContent = loading ? '正在准备浪漫配乐…' :
        failed ? '点一下，重新播放浪漫配乐 ♡' : '点一下，让心动有背景音乐 ♡';
    }
  }

  function setPlaying(next) {
    if (next) {
      everPlayed = true;
      failed = false;
      blocked = false;
      feedback('');
    }
    const changed = active !== next;
    active = next;
    render();
    if (changed) {
      window.dispatchEvent(new CustomEvent('love:musicchange', {
        detail: { playing: next }
      }));
    }
  }

  function pause() {
    manualPaused = true;
    // An autoplay attribute must not restart audio after an intentional pause.
    audio.autoplay = false;
    generation += 1;
    attempt = null;
    loading = false;
    audio.pause();
    setPlaying(false);
    feedback('');
  }

  function start(explicit) {
    if (explicit) {
      manualPaused = false;
      audio.autoplay = false;
    } else if (manualPaused || failed || document.hidden) {
      return Promise.resolve(false);
    }
    if (active && !audio.paused) return Promise.resolve(true);
    if (attempt) return attempt;
    if (failed) {
      failed = false;
      audio.load();
    }
    blocked = false;
    loading = true;
    feedback('');
    render();
    const ticket = ++generation;
    // Call play synchronously while a user gesture is still active on iOS.
    let nativeAttempt;
    try {
      nativeAttempt = audio.play();
    } catch (error) {
      nativeAttempt = Promise.reject(error);
    }
    attempt = Promise.resolve(nativeAttempt).then(() => {
      if (ticket !== generation) return false;
      if (manualPaused || document.hidden) {
        pause();
        return false;
      }
      setPlaying(true);
      return true;
    }).catch(error => {
      if (ticket !== generation) return false;
      setPlaying(false);
      blocked = error && error.name === 'NotAllowedError';
      failed = !blocked;
      // A policy restriction is expected on mobile browsers, not a site error.
      feedback(blocked ? '轻触页面，开启浪漫配乐' : '配乐暂时没加载好，点「重试」再试一次。');
      return false;
    }).finally(() => {
      if (ticket !== generation) return;
      attempt = null;
      loading = false;
      render();
    });
    return attempt;
  }

  function play() { return start(true); }
  function toggle() {
    if (active || (!audio.paused && !loading)) {
      pause();
      return Promise.resolve(false);
    }
    return play();
  }

  window.LOVE_MUSIC = {
    playing: () => active && !audio.paused,
    toggle,
    play,
    pause
  };
  if (button) button.addEventListener('click', () => { void toggle(); });
  if (intro) intro.addEventListener('click', () => { void play(); });

  audio.addEventListener('playing', () => {
    if (manualPaused || document.hidden) {
      pause();
      return;
    }
    setPlaying(true);
  });
  audio.addEventListener('pause', () => { setPlaying(false); });
  audio.addEventListener('error', () => {
    generation += 1;
    attempt = null;
    loading = false;
    failed = true;
    audio.pause();
    setPlaying(false);
    feedback('配乐暂时没加载好，点「重试」再试一次。');
  });

  function firstInteraction(event) {
    // Music controls own their click: do not play here then immediately toggle off.
    if (event.target instanceof Element && event.target.closest('#sound, #musicIntro')) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    if (!everPlayed && !manualPaused && !failed) void start(false);
  }
  document.addEventListener(window.PointerEvent ? 'pointerdown' : 'touchend', firstInteraction, {
    capture: true,
    passive: true
  });
  document.addEventListener('keydown', firstInteraction, { capture: true });
  document.addEventListener('WeixinJSBridgeReady', () => {
    if (!everPlayed) void start(false);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  window.addEventListener('pagehide', pause);

  audio.id = 'backgroundMusic';
  audio.hidden = true;
  document.body.append(audio);
  render();
  void start(false);
})();
