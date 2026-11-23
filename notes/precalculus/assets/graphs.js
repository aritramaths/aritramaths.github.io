(() => {
  'use strict';
  const parents = {
    cubicV: ['0.08x³ − 0.3x + 1.1', x => .08*x**3-.3*x+1.1, 1],
    cubicH: ['x + 0.35x³', x => x+.35*x**3, .5],
    hill: ['0.15(x + 1)(x − 1)²', x => .15*(x+1)*(x-1)**2, 2],
    cubicS: ['0.4x³ − 0.8x', x => .4*x**3-.8*x, 1.5],
    cubic: ['x³', x => x**3,.5], quadratic: ['x²', x => x*x,0],
    line: ['x', x => x,1], abs: ['|x|', Math.abs,0],
    sine: ['sin x', Math.sin,Math.PI/2], exp: ['eˣ',Math.exp,0],
    asin: ['arcsin x', Math.asin,1], log: ['log₂ x',Math.log2,1],
    tails: ['2^(1 − |x|) − 1',x => 2**(1-Math.abs(x))-1,2],
    valley: ['x³/3 − x − 1',x => x**3/3-x-1,1],
    shifted: ['(x − 1)²',x => (x-1)**2,.5],
    offsetSquare: ['x² − 1',x => x*x-1,0],
    foldedExp: ['e⁻ˣ − ½',x => Math.exp(-x)-.5,0],
    peak: ['1 − (x + 1)²',x => 1-(x+1)**2,-1]
  };
  const n = v => (Math.abs(v)<.0005?'0':Number(v.toFixed(3)).toString()).replace('-','−');
  const pair = (x,y) => '('+n(x)+', '+n(y)+')';
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag,attrs,text='') {
    const node=document.createElementNS(NS,tag);
    for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);
    if(text)node.textContent=text;
    return node;
  }
  function axisStep(span,space) {
    const raw=span/Math.max(3,Math.floor(space/52)), unit=10**Math.floor(Math.log10(raw));
    return ([1,2,5,10].find(v=>v*unit>=raw) || 10)*unit;
  }
  function mount(box) {
    if(box.dataset.ready)return;
    box.dataset.ready='true';
    const mode=box.dataset.mode,[expr,f,u]=parents[box.dataset.parent];
    const svg=box.querySelector('svg'), info=box.querySelector('.point-report'), formula=box.querySelector('.live-formula');
    const inputs=[...box.querySelectorAll('input')], second=box.querySelector('.second-legend');
    const trace=['reflectX','reflectY','half','absOut','absIn','floorIn','fracIn','inverse','sum','product','maximum'].includes(mode);
    const pointRole=mode==='sum'||mode==='product'||mode==='maximum';
    const graphId=box.id+'-clip';
    function draw(){
      const a=inputs[0].valueAsNumber, k=inputs[1]?.valueAsNumber??0;
      for(const input of inputs)input.parentElement.querySelector('output').textContent=n(input.valueAsNumber);
      let g, pt=[u,f(u)],q,rule,observation,aux=[],boundaries=[];
      const shift = x => x<0?' − '+n(-x):' + '+n(x);
      if(mode==='vertical'){
        g=x=>f(x)+a;q=[u,f(u)+a];rule='g(x) = f(x)'+shift(a);
        observation=a===0?'The two graphs coincide.':'Every point moves '+n(Math.abs(a))+(Math.abs(a)===1?' unit ':' units ')+(a>0?'up.':'down.');
      } else if(mode==='horizontal'){
        g=x=>f(x+a);q=[u-a,f(u)];rule='g(x) = f(x'+shift(a)+')';
        observation=a===0?'The two graphs coincide.':'Every point moves '+n(Math.abs(a))+(Math.abs(a)===1?' unit ':' units ')+(a>0?'left.':'right.');
      } else if(mode==='vscale'){
        g=x=>a*f(x);q=[u,a*f(u)];rule='g(x) = '+n(a)+' · f(x)';
        observation='The input stays fixed. Multiply its height by '+n(a)+'.';
      } else if(mode==='hscale'){
        g=x=>f(a*x);q=a===0?null:[u/a,f(u)];rule='g(x) = f('+n(a)+'x)';
        observation=a===0?'Every input gives f(0) = '+n(f(0))+'. The point rule u/a only applies for a ≠ 0.':'Divide the old input by '+n(a)+' to keep the same height.';
      } else if(mode==='both'){
        g=x=>f(x-a)+k;q=[u+a,f(u)+k];rule='g(x) = f(x'+shift(-a)+')'+shift(k);
        observation=box.dataset.parent==='log'?'The vertical asymptote is x = '+n(a)+'. The domain is x > '+n(a)+'.':'The vertex moves horizontally by h and vertically by k.';
        if(box.dataset.parent==='log')boundaries.push(a);
      } else if(mode==='sum'||mode==='product'){
        pt=[a,a];g=mode==='sum'?x=>x+Math.sin(x):x=>x*Math.sin(x);
        aux=mode==='sum'?[x=>x-1,x=>x+1]:[x=>-Math.abs(x),Math.abs];
        q=[a,g(a)];rule=mode==='sum'?'g(x) = x + sin x':'g(x) = x sin x';
        observation=(mode==='sum'?'x − 1 ≤ g(x) ≤ x + 1.':'−|x| ≤ g(x) ≤ |x|.')+' At x = '+n(a)+', g(x) ≈ '+n(g(a))+'.';
      } else if(mode==='maximum'){
        pt=[a,Math.sin(a)];g=x=>Math.max(Math.sin(x),Math.cos(x));aux=[Math.cos];q=[a,g(a)];
        rule='g(x) = max(sin x, cos x)';observation='sin x ≈ '+n(Math.sin(a))+' and cos x ≈ '+n(Math.cos(a))+'. The upper curve has height '+n(g(a))+'.';
      } else {
        let x=a;
        if(mode==='twoFolds'){pt=[Math.abs(x),f(Math.abs(x))];q=[x,Math.abs(pt[1])];g=t=>Math.abs(f(Math.abs(t)));rule='g(x) = |f(|x|)|';observation='The input uses |x|, and the output uses the absolute height.';}
        if(mode==='floorOut'||mode==='fracOut'){const floor=mode==='floorOut';g=t=>floor?Math.floor(f(t)):f(t)-Math.floor(f(t));pt=[x,f(x)];q=[x,g(x)];rule=floor?'g(x) = ⌊f(x)⌋':'g(x) = {f(x)}';observation='At this input, f(x) ≈ '+n(f(x))+' and ⌊f(x)⌋ = '+n(Math.floor(f(x)))+'.';}
        if(mode==='absIn'){pt=[Math.abs(x),f(Math.abs(x))];q=[x,pt[1]];g=t=>f(Math.abs(t));rule='g(x) = f(|x|)';observation='Both x and −x use the parent value at |x|.';}
        if(mode==='absOut'){pt=[x,f(x)];q=[x,Math.abs(f(x))];g=t=>Math.abs(f(t));rule='g(x) = |f(x)|';observation=f(x)<0?'This negative height folds above the axis.':'This nonnegative height stays in place.';}
        if(mode==='reflectX'||mode==='reflectY'||mode==='half'){
          const sx=mode==='reflectX'?1:-1,sy=mode==='reflectY'?1:-1;pt=[x,f(x)];q=[sx*x,sy*f(x)];g=t=>sy*f(sx*t);
          rule={reflectX:'g(x) = −f(x)',reflectY:'g(x) = f(−x)',half:'g(x) = −f(−x)'}[mode];
          observation={reflectX:'The height changes sign.',reflectY:'The horizontal coordinate changes sign.',half:'Both coordinates change sign.'}[mode];
        }
        if(mode==='inverse'){pt=[x,f(x)];q=[f(x),x];g=Math.cbrt;aux=[t=>t];rule='g(x) = ∛x';observation='Reflection in y = x interchanges the two coordinates.';}
        if(mode==='floorIn'||mode==='fracIn'){
          const argument=mode==='floorIn'?Math.floor(x):x-Math.floor(x);
          pt=[argument,f(argument)];q=[x,f(argument)];
          g=mode==='floorIn'?t=>f(Math.floor(t)):t=>f(t-Math.floor(t));
          rule=mode==='floorIn'?'g(x) = f(⌊x⌋)':'g(x) = f({x})';
          observation='At x = '+n(x)+', the parent input is '+n(argument)+'. Filled endpoints are included; hollow endpoints are excluded.';
        }
      }
      formula.textContent=rule;
      info.textContent=(pointRole?'':q?'P '+pair(...pt)+' → P′ '+pair(...q)+'. ':'')+observation;
      const w=Math.max(280, Math.round(svg.getBoundingClientRect().width)||520),h=w<430?255:290;
      svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.replaceChildren();
      const pad={l:37,r:17,t:16,b:27}, pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
      let X=box.dataset.parent==='asin'?4:5,Y=3.5;
      if(box.dataset.parent==='sine'||pointRole)X=6.5;
      if(trace&&['floorIn','fracIn','absOut'].includes(mode))X=4;
      if(mode==='product'||mode==='sum')Y=7.5;
      for(const point of [pt,q].filter(Boolean)){X=Math.max(X,Math.abs(point[0])*1.12);Y=Math.max(Y,Math.abs(point[1])*1.16);}
      if(mode==='inverse'){X=Math.max(2.5,Math.abs(a**3)*1.2);Y=Math.max(X*ph/pw,Math.abs(a**3)*1.2,1.9);X=Y*pw/ph;}
      const sx=x=>pad.l+(x+X)*pw/(2*X),sy=y=>pad.t+(Y-y)*ph/(2*Y);
      const line=(x1,y1,x2,y2,cls)=>el('line',{x1,y1,x2,y2,class:cls});
      const defs=el('defs',{}),clip=el('clipPath',{id:graphId});
      clip.append(el('rect',{x:pad.l,y:pad.t,width:pw,height:ph}));defs.append(clip);svg.append(defs);
      for(let v=-Math.floor(X/axisStep(2*X,pw))*axisStep(2*X,pw);v<=X+.00001;v+=axisStep(2*X,pw)){
        svg.append(line(sx(v),pad.t,sx(v),pad.t+ph,'gridline'));
        if(Math.abs(v)>.0001)svg.append(el('text',{x:sx(v),y:pad.t+ph+18,'text-anchor':'middle',class:'tick'},n(v)));
      }
      for(let v=-Math.floor(Y/axisStep(2*Y,ph))*axisStep(2*Y,ph);v<=Y+.00001;v+=axisStep(2*Y,ph)){
        svg.append(line(pad.l,sy(v),pad.l+pw,sy(v),'gridline'));
        svg.append(el('text',{x:pad.l-8,y:sy(v)+4,'text-anchor':'end',class:'tick'},n(v)));
      }
      svg.append(line(pad.l,sy(0),pad.l+pw,sy(0),'axis'),line(sx(0),pad.t,sx(0),pad.t+ph,'axis'));
      svg.append(el('text',{x:w-12,y:sy(0)-6,class:'tick'},'x'),el('text',{x:sx(0)+6,y:13,class:'tick'},'y'));
      const layer=el('g',{'clip-path':'url(#'+graphId+')'});svg.append(layer);
      const curve=(fn,cls,start=-X,end=X,steps=Math.ceil(pw*1.35))=>{
        let path='',pen=false;
        for(let i=0;i<=steps;i++){
          const x=start+(end-start)*i/steps,y=fn(x);
          if(!Number.isFinite(y)||Math.abs(y)>Y*3){pen=false;continue;}
          path+=(pen?'L':'M')+sx(x).toFixed(2)+' '+sy(y).toFixed(2);pen=true;
        }
        if(path)layer.append(el('path',{d:path,class:'curve '+cls}));
      };
      const limitedSquare=mode==='floorIn'||mode==='floorOut';
      const left=mode==='maximum'?-Math.PI:limitedSquare?-2:-X;
      const right=mode==='maximum'?1.5*Math.PI:limitedSquare?2:X;
      curve(f,'parent-curve',left,right);
      aux.forEach(fn=>curve(fn,'guide-curve',left,right));
      boundaries.forEach(x=>layer.append(line(sx(x),pad.t,sx(x),pad.t+ph,'guide-curve')));
      if(mode==='floorIn'||mode==='fracIn'){
        const lower=mode==='floorIn'?-2:Math.floor(-X),upper=mode==='floorIn'?2:X;
        for(let i=lower;i<upper;i++){
          const piece=mode==='floorIn'?()=>f(i):t=>f(t-i);
          curve(piece,'result-curve',i,i+1,35);
          for(const [pos,closed] of [[i,true],[i+1,false]])layer.append(el('circle',{cx:sx(pos),cy:sy(piece(pos)),r:3.3,class:'end-dot '+(closed?'filled':'hollow')}));
        }
        if(mode==='floorIn')layer.append(el('circle',{cx:sx(2),cy:sy(f(2)),r:3.3,class:'end-dot filled'}));
      }else if(mode==='floorOut'||mode==='fracOut'){
        // Split exactly where x² crosses an integer. Draw each endpoint at its true height.
        const lo=mode==='floorOut'?-2:-X,hi=-lo;
        const cut=new Set([lo,hi,0]);
        for(let j=1;j<=hi*hi;j++){const root=Math.sqrt(j);if(root<hi){cut.add(root);cut.add(-root);}}
        const cuts=Array.from(cut).sort((l,r)=>l-r);
        const opened=[];
        for(let j=1;j<cuts.length;j++){
          const l=cuts[j-1],r=cuts[j],level=Math.floor(f((l+r)/2));
          const piece=t=>mode==='floorOut'?level:f(t)-level;
          curve(piece,'result-curve',l,r,24);
          for(const point of [l,r]){
            const exact=Math.round(f(point)),value=mode==='floorOut'?exact:0;
            if(Math.abs(piece(point)-value)>.1)opened.push([point,piece(point)]);
          }
        }
        for(const [x,y] of opened)layer.append(el('circle',{cx:sx(x),cy:sy(y),r:3,class:'end-dot hollow'}));
        for(const x of cuts){
          if(mode==='fracOut'&&Math.abs(f(x)-Math.round(f(x)))>1e-8)continue;
          layer.append(el('circle',{cx:sx(x),cy:sy(mode==='floorOut'?Math.round(f(x)):0),r:2.9,class:'end-dot filled'}));
        }
      }else if(mode==='inverse'){
        const maxU=Math.cbrt(X);
        let d='';for(let i=0;i<=500;i++){const t=-maxU+2*maxU*i/500;d+=(i?'L':'M')+sx(t**3).toFixed(2)+' '+sy(t).toFixed(2);}
        layer.append(el('path',{d,class:'curve result-curve'}));
      }else {
        curve(g,'result-curve',left,right);
        if(mode==='maximum')for(const x of [left,right]){
          for(const y of [Math.sin(x),Math.cos(x)])layer.append(el('circle',{cx:sx(x),cy:sy(y),r:3.5,class:'end-dot hollow'}));
        }
      }
      if(box.dataset.parent==='asin'){
        for(const end of [-1,1]){
          const y=f(end);const newPoint=mode==='horizontal'?[end-a,y]:mode==='vertical'?[end,y+a]:mode==='hscale'&&a!==0?[end/a,y]:null;
          layer.append(el('circle',{cx:sx(end),cy:sy(y),r:3,class:'parent-point'}));
          if(newPoint)layer.append(el('circle',{cx:sx(newPoint[0]),cy:sy(newPoint[1]),r:3,class:'result-point'}));
        }
      }
      if(q){layer.append(line(sx(pt[0]),sy(pt[1]),sx(q[0]),sy(q[1]),'correspondence'));}
      layer.append(el('circle',{cx:sx(pt[0]),cy:sy(pt[1]),r:5,class:'parent-point'}));
      if(q)layer.append(el('circle',{cx:sx(q[0]),cy:sy(q[1]),r:3.8,class:'result-point'}));
      if(second){
        second.hidden=!aux.length&&!boundaries.length;
        second.textContent=mode==='maximum'?'cos x':mode==='inverse'?'y = x':boundaries.length?'Asymptote':aux.length===2?'Bounds':'Guide';
      }
    }
    inputs.forEach(input=>input.addEventListener('input',draw));
    box.querySelector('.reset').addEventListener('click',()=>{inputs.forEach(i=>i.value=i.defaultValue);draw()});
    new ResizeObserver(draw).observe(svg.parentElement);
    draw();
  }
  const panels=document.querySelectorAll('.graph-lab');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(items=>items.forEach(item=>{if(item.isIntersecting){mount(item.target);observer.unobserve(item.target)}}),{rootMargin:'350px'});
    panels.forEach(p=>observer.observe(p));
  }else panels.forEach(mount);
})();
