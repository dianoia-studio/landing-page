  /* stage cover-scaling */
  const stage = document.getElementById('stage');
  const W = 1600, H = 1000;
  function fit(){
    const s = Math.max(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  fit();
  window.addEventListener('resize', fit);

  /* chalk write / erase loop */
  const phrases = [
    "intelligence that lives on the chalkboard",
    "keeps track of every stroke",
    "always observing, in the background"
  ];
  const line = document.getElementById('chalkLine');
  const smudge = document.getElementById('smudge');
  const chalkSound = document.getElementById('chalkSound');
  const bgMusic = document.getElementById('bgMusic');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pi = 0;

  chalkSound.volume = 0.18;
  const MUSIC_VOLUME = 0.07;
  const LOOP_FADE = 1.0; /* seconds of fade in/out around the loop seam */
  bgMusic.volume = MUSIC_VOLUME;

  const SONG_TITLE = 'お父さんの、本…！';


  /* smooth loop: crossfade the seam instead of an abrupt restart */
  bgMusic.addEventListener('timeupdate', () => {
    if(!bgMusic.duration || !isFinite(bgMusic.duration)) return;
    const t = bgMusic.currentTime;
    const remaining = bgMusic.duration - t;
    if(t < LOOP_FADE){
      bgMusic.volume = MUSIC_VOLUME * (t / LOOP_FADE);
    } else if(remaining < LOOP_FADE){
      bgMusic.volume = MUSIC_VOLUME * Math.max(0, remaining / LOOP_FADE);
    } else {
      bgMusic.volume = MUSIC_VOLUME;
    }
  });
  bgMusic.addEventListener('ended', () => {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(()=>{});
  });

  /* mute toggle, persisted across visits — kills both the chalk sound and the music */
  const muteBtn = document.getElementById('muteBtn');
  let muted = localStorage.getItem('dianoia-muted') === '1';
  function applyMuted(){
    chalkSound.muted = muted;
    bgMusic.muted = muted;
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }
  applyMuted();
  muteBtn.addEventListener('click', ()=>{
    muted = !muted;
    localStorage.setItem('dianoia-muted', muted ? '1' : '0');
    applyMuted();
  });

  /* browsers block audio until a user gesture — prime the chalk sound on the first one */
  function unlockAudio(){
    chalkSound.play().then(()=>{
      chalkSound.pause();
      chalkSound.currentTime = 0;
    }).catch(()=>{});
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  }
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  /* cassette: click to play, click again to pause — plus a little "now playing" tooltip */
  const radioBtn = document.querySelector('.hotspot--radio');
  const musicToast = document.getElementById('musicToast');
  let toastTimer = null;
  if(radioBtn && musicToast){
    radioBtn.addEventListener('click', ()=>{
      if(bgMusic.paused) bgMusic.play().catch(()=>{});
      else bgMusic.pause();

      musicToast.textContent = `music — ${SONG_TITLE}`;
      musicToast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(()=> musicToast.classList.remove('show'), 3200);
    });
  }

  function setPhrase(text){
    line.classList.remove('erasing');
    line.innerHTML = '';
    text.split('\n').forEach((seg, i)=>{
      if(i>0) line.appendChild(document.createElement('br'));
      const words = seg.split(' ');
      words.forEach((word, wi)=>{
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        word.split('').forEach(ch=>{
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = ch;
          wordSpan.appendChild(s);
        });
        line.appendChild(wordSpan);
        if(wi < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
    });
  }

  function writeLoop(){
    setPhrase(phrases[pi]);
    const words = line.querySelectorAll('.w');
    words.forEach((w, i)=> setTimeout(()=> w.classList.add('on'), 100 + i*24));
    const writeTime = 100 + words.length*24;

    chalkSound.pause();
    chalkSound.currentTime = 0;
    /* match the clip's length to the write animation, but keep the cap gentle so it never turns into a chipmunk speedup */
    chalkSound.playbackRate = Math.min(1.8, Math.max(0.85, chalkSound.duration && isFinite(chalkSound.duration) ? chalkSound.duration / (writeTime/1000) : 1));
    chalkSound.play().catch(()=>{});
    setTimeout(()=> chalkSound.pause(), writeTime);

    setTimeout(()=>{
      smudge.classList.remove('sweep');
      void smudge.offsetWidth;
      smudge.classList.add('sweep');
      setTimeout(()=> line.classList.add('erasing'), 150);
      setTimeout(()=>{
        pi = (pi + 1) % phrases.length;
        writeLoop();
      }, 1250);
    }, writeTime + 3600);
  }

  if(reduced){
    setPhrase(phrases[0]);
    line.querySelectorAll('.w').forEach(w=> w.classList.add('on'));
  } else {
    writeLoop();
  }

  /* lamp toggle — the data-attribute state trick */
  const lampBtn = document.getElementById('lampBtn');
  lampBtn.addEventListener('click', ()=>{
    const off = stage.classList.toggle('lamp-off');
    lampBtn.setAttribute('aria-pressed', String(off));
  });

  /* overlays */
  let lastFocus = null;
  function openOverlay(name){
    const ov = document.getElementById('ov-' + name);
    if(!ov) return;
    lastFocus = document.activeElement;
    ov.classList.add('open');
    ov.querySelector('.close').focus();
  }
  function closeOverlay(ov){
    ov.classList.remove('open');
    if(lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.hotspot[data-overlay]').forEach(btn=>{
    btn.addEventListener('click', ()=> openOverlay(btn.dataset.overlay));
  });

  /* hourglass: each click drains the sand once, then it snaps back with no animation */
  const hourglassBtn = document.querySelector('.hotspot--hourglass');
  if(hourglassBtn){
    let resetTimer = null;
    hourglassBtn.addEventListener('click', ()=>{
      clearTimeout(resetTimer);
      hourglassBtn.classList.remove('pouring');
      void hourglassBtn.offsetWidth;
      hourglassBtn.classList.add('pouring');
      resetTimer = setTimeout(()=> hourglassBtn.classList.remove('pouring'), 3000);
    });
  }
  document.querySelectorAll('.overlay').forEach(ov=>{
    ov.addEventListener('click', e=>{ if(e.target === ov) closeOverlay(ov); });
    ov.querySelector('.close').addEventListener('click', ()=> closeOverlay(ov));
  });
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){
      const open = document.querySelector('.overlay.open');
      if(open) closeOverlay(open);
    }
  });
