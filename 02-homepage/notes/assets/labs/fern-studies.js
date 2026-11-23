/* Aritra Dey — illustrations for the probability chapter. */
(() => {
  'use strict';
  const weights=[.01,.85,.07,.07];
  const colours=['#a25d13','#1c694e','#3c70a1','#894d92'];
  const names=['Stem','Main copy','Left leaflet','Right leaflet'];
  const studies={
    growth:['Watch the fern emerge','Increase n to extend the same orbit, one point at a time.'],
    frequency:['How often was each rule chosen?','Each measured frequency is its count divided by n. The vertical tick on each bar marks its target probability.'],
    start:['Two starting points, one sequence of rules','Follow P₀ = (0, 0) and Q₀ = (20, −10) through the same moves. Their distance is shown on a base-ten logarithmic scale.'],
    pieces:['The four affine copies','Select a map to see where it sends every point of a sampled fern.'],
    weights:['Keep the maps and change the probabilities','The two panels use the same random numbers. Their different probability thresholds select different rules.'],
    seeds:['Three histories of the same length','All three runs use the same probabilities. Only the seed changes.'],
    lines:['Plot the orbit, then connect its points','Compare the same sequence of points drawn in two ways. A segment records the jump between two moves.']
  };
  function map(i,x,y) {
    switch(i){
      case 0:return [0,.16*y];
      case 1:return [.85*x+.04*y,-.04*x+.85*y+1.6];
      case 2:return [.20*x-.26*y,.23*x+.22*y+1.6];
      default:return [-.15*x+.28*y,.26*x+.24*y+.44];
    }
  }
  function generate(n,seed=2026,ps=weights) {
    const xs=new Float64Array(n),ys=new Float64Array(n),ids=new Uint8Array(n),counts=[0,0,0,0];
    let x=0,y=0,s=seed>>>0;
    for(let j=0;j<n;j++){
      s=(Math.imul(1664525,s)+1013904223)>>>0;
      const u=s/4294967296;
      const i=u<ps[0]?0:u<ps[0]+ps[1]?1:u<ps[0]+ps[1]+ps[2]?2:3;
      [x,y]=map(i,x,y);xs[j]=x;ys[j]=y;ids[j]=i;counts[i]++;
    }
    return {xs,ys,ids,counts,n};
  }
  function dom(tag,attributes={},content='') {
    const e=document.createElement(tag);Object.entries(attributes).forEach(([k,v])=>e.setAttribute(k,v));
    if(content)e.textContent=content;return e;
  }
  function titleLabel(s){return dom('p',{class:'fern-sublabel'},s);}
  function cloud(run,title,options={}) {
    const f=dom('figure'),c=dom('canvas',{width:330,height:292,role:'img','aria-label':title+' at n = '+run.n});const ctx=c.getContext('2d');
    ctx.fillStyle='#fafcf5';ctx.fillRect(0,0,c.width,c.height);
    const X=x=>164+x*26,Y=y=>278-y*26;
    if(options.lines){ctx.beginPath();ctx.moveTo(X(0),Y(0));}
    for(let k=0;k<run.n;k++){
      let x=run.xs[k],y=run.ys[k];
      if(options.mapping!==undefined)[x,y]=map(options.mapping,x,y);
      if(options.lines)ctx.lineTo(X(x),Y(y));
      else{
        ctx.fillStyle=options.mapping===undefined?'#205b43':colours[options.mapping];
        const radius=run.n<=60?4:run.n<=1000?2.1:1.12;
        ctx.fillRect(X(x)-radius/2,Y(y)-radius/2,radius,radius);
      }
    }
    if(options.lines){ctx.strokeStyle='#496f70';ctx.lineWidth=.65;ctx.stroke();}
    f.append(c,dom('figcaption',{},title));return f;
  }
  const format=n=>new Intl.NumberFormat('en').format(n);
  function freq(run){
    const container=dom('div',{class:'fern-bars'});
    run.counts.forEach((count,i)=>{
      const row=dom('div',{class:'fern-row'}), track=dom('div',{class:'fern-track'});
      const fill=dom('span',{class:'fern-fill'});fill.style.width=count/run.n*100+'%';fill.style.background=colours[i];
      const tick=dom('i');tick.style.left=weights[i]*100+'%';track.append(fill,tick);
      row.append(titleLabel('f'+['₁','₂','₃','₄'][i]+' · '+names[i]),track,dom('span',{class:'fern-num'},format(count)+' / '+format(run.n)+' = '+(100*count/run.n).toFixed(2)+'%  (target '+Math.round(100*weights[i])+'%)'));container.append(row);
    });return container;
  }
  function contraction(run){
    // Advance the difference vector directly so subtraction of two nearly equal coordinates does not erase it.
    let dx=20,dy=-10;const values=[Math.log10(Math.hypot(dx,dy))];
    const matrices=[[0,0,0,.16],[.85,.04,-.04,.85],[.2,-.26,.23,.22],[-.15,.28,.26,.24]];
    for(const i of run.ids){
      const [aa,ab,ba,bb]=matrices[i];
      [dx,dy]=[aa*dx+ab*dy,ba*dx+bb*dy];values.push(Math.log10(Math.max(1e-300,Math.hypot(dx,dy))));
    }
    const c=dom('canvas',{width:760,height:285,role:'img','aria-label':'Logarithm of the distance against the number of moves'}),ctx=c.getContext('2d');
    ctx.fillStyle='#fafcf6';ctx.fillRect(0,0,760,285);
    const top=2,bottom=Math.min(-2,Math.floor(values.at(-1))), y=v=>229-(v-bottom)*199/(top-bottom),x=i=>59+650*i/Math.max(1,run.n);
    ctx.font='15px system-ui';ctx.fillStyle='#35483d';
    for(let j=0;j<=4;j++){const v=bottom+(top-bottom)*j/4;
      ctx.strokeStyle='#dce5db';ctx.beginPath();ctx.moveTo(59,y(v));ctx.lineTo(710,y(v));ctx.stroke();ctx.fillText(Number(v.toFixed(1)),8,y(v)+5);}
    ctx.fillText('log₁₀ distance',10,17);ctx.fillText('moves',354,278);
    for(let j=0;j<=4;j++){const i=Math.round(run.n*j/4);ctx.fillText(i,x(i)-5,254);}
    ctx.beginPath();values.forEach((v,i)=>{if(i)ctx.lineTo(x(i),y(v));else ctx.moveTo(x(i),y(v));});ctx.lineWidth=2.7;ctx.strokeStyle=colours[1];ctx.stroke();ctx.fillStyle=colours[1];ctx.beginPath();ctx.arc(x(run.n),y(values.at(-1)),4,0,2*Math.PI);ctx.fill();
    const f=dom('figure');f.append(c,dom('figcaption',{},'Distance after '+run.n+' moves: '+Math.hypot(dx,dy).toExponential(4)+'.'));return f;
  }
  function render(e){
    if(e.dataset.fernReady)return;e.dataset.fernReady='true';
    const key=e.dataset.fernStudy, [title,intro]=studies[key], label=dom('label'),out=dom('output'),max=key==='start'?80:key==='lines'?500:150000;
    const range=dom('input',{type:'range',min:0,max:key==='start'||key==='lines'?max:1000,value:key==='start'?14:key==='lines'?45:600,'aria-label':'Number of moves for '+title});
    const precise=dom('input',{type:'number',min:key==='start'?0:1,max,step:1,'aria-label':'Exact number of moves for '+title});
    const init=key==='start'?14:key==='lines'?45:3500;
    const controls=dom('div',{class:'fern-controls'}),extra=dom('div',{class:'fern-extra'}),plot=dom('div',{class:'fern-output'});
    let which=1,n=init;
    const picker=dom('select',{'aria-label':'Affine copy'});
    if(key==='pieces'){names.forEach((s,i)=>{picker.add(new Option('f'+['₁','₂','₃','₄'][i]+' · '+s,i));});picker.value='1';extra.append(picker);picker.onchange=()=>{which=Number(picker.value);draw();};}
    const calc=()=>key==='start'||key==='lines'?Number(range.value):Math.round(Math.exp(Math.log(max)*Number(range.value)/1000));
    const sync=()=>{range.value=key==='start'||key==='lines'?n:Math.round(Math.log(n)/Math.log(max)*1000);precise.value=n;};
    function draw(){
      out.textContent=format(n);range.setAttribute('aria-valuetext',format(n)+' moves');
      const data=generate(n);const group=dom('div',{class:'fern-plots'});
      if(key==='growth')group.append(cloud(data,'First '+format(n)+' points · seed 2026'));
      if(key==='start')group.append(contraction(data));
      if(key==='frequency')group.append(freq(data));
      if(key==='pieces')group.append(cloud(data,'Sample of F'),cloud(data,'Image of the sample under f'+['₁','₂','₃','₄'][which],{mapping:which}));
      if(key==='weights')group.append(cloud(data,'Standard · 1%, 85%, 7%, 7%'),cloud(generate(n,2026,[.25,.25,.25,.25]),'Uniform · 25% per rule'));
      if(key==='seeds')for(const seed of [2026,17,903])group.append(cloud(seed===2026?data:generate(n,seed),'Seed '+seed));
      if(key==='lines')group.append(cloud(data,'Separate points'),cloud(data,'Successive points joined',{lines:true}));
      plot.replaceChildren(group);
    }
    label.append(dom('span',{},'Moves n'),range,out);
    controls.append(label,dom('span',{class:'fern-exact'},'Exact n'),precise);
    range.min=(key==='lines'?1:0);sync();
    let scheduled;const paint=()=>{if(scheduled)cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(draw);};
    range.oninput=()=>{n=calc();precise.value=n;out.textContent=format(n);paint();};
    precise.onchange=()=>{const v=precise.valueAsNumber;if(!Number.isFinite(v)){sync();return;}
      n=Math.max(key==='start'?0:1,Math.min(max,Math.round(v)));sync();paint();};
    e.append(dom('h4',{},title),dom('p',{},intro),controls,extra,plot);draw();
  }
  const nodes=document.querySelectorAll('[data-fern-study]');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(rs=>rs.forEach(r=>{if(r.isIntersecting){render(r.target);observer.unobserve(r.target);}}),{rootMargin:'450px'});
    nodes.forEach(n=>observer.observe(n));
  }else nodes.forEach(render);
})();
