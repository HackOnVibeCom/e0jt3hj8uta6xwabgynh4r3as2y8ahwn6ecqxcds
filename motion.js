
/* StockPilot V23 presentation motion controller. This only annotates and animates rendered UI. */
(()=>{
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const main=document.getElementById('main');
  if(!main)return;
  let raf=0;
  const progress=document.createElement('div');
  progress.id='sp-scroll-progress';
  document.body.appendChild(progress);
  const updateProgress=()=>{
    const root=document.documentElement;
    const max=Math.max(1,root.scrollHeight-window.innerHeight);
    progress.style.width=(Math.min(1,window.scrollY/max)*100)+'%';
  };
  window.addEventListener('scroll',updateProgress,{passive:true});
  window.addEventListener('resize',updateProgress,{passive:true});
  updateProgress();

  const revealSelector='.stat,.panel,.item-card,.waste-analytics-card,.report-card,.detail-top,.filters,.table-wrap,.info,.section-row';
  let observer=null;
  if('IntersectionObserver' in window&&!reduce){
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('sp-visible');observer.unobserve(entry.target);}
      });
    },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
  }

  function animateCounters(root){
    if(reduce)return;
    root.querySelectorAll('.stat-value').forEach(el=>{
      if(el.dataset.spCounted==='1')return;
      const original=(el.textContent||'').trim();
      const match=original.match(/^([^0-9-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
      if(!match)return;
      const target=Number(match[2].replace(/,/g,''));
      if(!Number.isFinite(target)||Math.abs(target)>1000000)return;
      el.dataset.spCounted='1';
      const prefix=match[1],suffix=match[3],start=performance.now(),duration=850;
      const fmt=v=>Number.isInteger(target)?Math.round(v).toLocaleString():v.toFixed(1);
      function frame(now){
        const t=Math.min(1,(now-start)/duration),e=1-Math.pow(1-t,3);
        el.textContent=prefix+fmt(target*e)+suffix;
        if(t<1)requestAnimationFrame(frame);else el.textContent=original;
      }
      el.textContent=prefix+fmt(0)+suffix;
      requestAnimationFrame(frame);
    });
  }

  function animateChart(root){
    if(reduce)return;
    root.querySelectorAll('.waste-chart-svg').forEach(svg=>{
      if(svg.dataset.spAnimated==='1')return;
      svg.dataset.spAnimated='1';
      svg.querySelectorAll('.waste-chart-actual-line,.waste-chart-forecast-line').forEach(path=>{
        try{const len=path.getTotalLength();path.style.strokeDasharray=len+' '+len;path.style.strokeDashoffset=len;path.getBoundingClientRect();path.style.transition='stroke-dashoffset 1500ms cubic-bezier(.35,.04,.2,1)';requestAnimationFrame(()=>path.style.strokeDashoffset='0');}catch(e){}
      });
      svg.querySelectorAll('.waste-chart-actual-dot,.waste-chart-forecast-dot').forEach((el,i)=>el.style.setProperty('--sp-point-index',Math.min(i,12)));
      svg.querySelectorAll('.waste-chart-value').forEach((el,i)=>el.style.setProperty('--sp-point-index',Math.min(i,12)));
    });
  }

  function prepare(root){
    if(!root)return;
    const elements=[...root.querySelectorAll(revealSelector)];
    elements.forEach((el,i)=>{
      if(el.dataset.spReveal==='1')return;
      el.dataset.spReveal='1';
      el.classList.add('sp-reveal');
      el.style.setProperty('--sp-reveal-delay',Math.min(i%8,7)*48+'ms');
      if(observer)observer.observe(el);else el.classList.add('sp-visible');
    });
    animateCounters(root);
    animateChart(root);
    if(!reduce){
      root.querySelectorAll('tbody tr').forEach((row,i)=>{
        if(row.dataset.spRow==='1')return;
        row.dataset.spRow='1';
        row.style.animation='sp-row-enter 380ms cubic-bezier(.18,.82,.22,1) both';
        row.style.animationDelay=Math.min(i,8)*24+'ms';
      });
    }
  }

  function schedule(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>prepare(main));
  }
  schedule();
  const mutation=new MutationObserver(records=>{
    if(records.some(r=>r.addedNodes&&r.addedNodes.length))schedule();
  });
  mutation.observe(main,{childList:true,subtree:true});

  // Pointer spotlight/very subtle tilt on desktop only; does not intercept clicks.
  const canHover=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(canHover&&!reduce){
    const selector='.stat,.item-card,.detail-top,.report-card,.waste-analytics-card';
    main.addEventListener('pointermove',e=>{
      const card=e.target.closest(selector);
      if(!card)return;
      const r=card.getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
      const y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
      card.style.setProperty('--sp-mx',(x*100)+'%');
      card.style.setProperty('--sp-my',(y*100)+'%');
    },{passive:true});
    main.addEventListener('pointerleave',e=>{
      const card=e.target.closest(selector);
      if(card){card.style.setProperty('--sp-mx','50%');card.style.setProperty('--sp-my','50%');}
    },true);
  }

  // Add a restrained row entrance used for dynamically rendered table records.
  const style=document.createElement('style');
  style.textContent='@keyframes sp-row-enter{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);
})();
