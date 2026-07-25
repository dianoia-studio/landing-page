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
    "the thinking is the important part.",
    "practice does not make perfect —\ndeliberate practice does.",
    "what if it could watch\nthe canvas unfold?"
  ];
  const line = document.getElementById('chalkLine');
  const smudge = document.getElementById('smudge');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pi = 0;

  function setPhrase(text){
    line.classList.remove('erasing');
    line.innerHTML = '';
    text.split('\n').forEach((seg, i)=>{
      if(i>0) line.appendChild(document.createElement('br'));
      seg.split(' ').forEach(word=>{
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = word;
        line.appendChild(s);
      });
    });
  }

  function writeLoop(){
    setPhrase(phrases[pi]);
    const words = line.querySelectorAll('.w');
    words.forEach((w, i)=> setTimeout(()=> w.classList.add('on'), 120 + i*170));
    const writeTime = 120 + words.length*170;
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
