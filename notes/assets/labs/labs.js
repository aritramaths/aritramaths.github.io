/* Interactive mathematics for the three lecture books. All calculations run locally. */
(() => {
  'use strict';
  const lectures = {};
  const tau = 2 * Math.PI;
  const blue = 'var(--lab-blue)', rose = 'var(--lab-rose)', green = 'var(--lab-green)', gold = 'var(--lab-gold)';
  const round = (value, digits = 3) => Number(value.toFixed(digits)).toString();
  const percent = value => round(value * 100, 2) + '%';
  const scalar = (label, min, max, step, value, unit = '') => ({label, min, max, step, value, unit});
  const opts = (label, options, value) => ({label, options, value});
  const coord = p => '(' + round(p[0]) + ', ' + round(p[1]) + ')';
  const width = 540, height = 300;
  function element(tag, cls, content) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function line(x1, y1, x2, y2, color, weight = 2, extra = '') {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${weight}" ${extra}/>`;
  }
  function poly(points, color, weight = 2, extra = '') {
    return `<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linejoin="round" ${extra}/>`;
  }
  function dot(x, y, color, size = 4) {
    return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" />`;
  }
  function txt(x, y, label, anchor = 'middle', kind = '') {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${kind}">${label}</text>`;
  }
  function arrow(a, b, color, weight = 2.5) {
    const d = Math.hypot(b[1]-a[1],b[0]-a[0]);
    if (d < 1) return '';
    const x = (b[0]-a[0])/d, y = (b[1]-a[1])/d, l = Math.min(10,d/3);
    const head = [b,[b[0]-l*x+l*.39*y,b[1]-l*y-l*.39*x],[b[0]-l*x-l*.39*y,b[1]-l*y+l*.39*x]];
    return line(...a,...b,color,weight) + `<polygon points="${head.map(p=>p.join(',')).join(' ')}" fill="${color}"/>`;
  }
  // Use one physical unit for both axes on every geometric plot.
  function plane(points, step = 1, showAxes = true) {
    const xs = points.map(p=>p[0]), ys = points.map(p=>p[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const s = Math.min((width-78)/Math.max(.4,xmax-xmin),(height-51)/Math.max(.4,ymax-ymin));
    const ox = width/2-s*(xmin+xmax)/2, oy = height/2+s*(ymin+ymax)/2;
    const at = p=>[ox+s*p[0], oy-s*p[1]];
    let grid = '';
    if (showAxes) {
      for (let x=Math.ceil(-ox/s/step)*step; x<=(width-ox)/s; x+=step)
        grid += line(ox+s*x,0,ox+s*x,height,'var(--lab-line)',1);
      for (let y=Math.ceil((oy-height)/s/step)*step; y<=oy/s; y+=step)
        grid += line(0,oy-s*y,width,oy-s*y,'var(--lab-line)',1);
      grid += line(0,oy,width,oy,'var(--lab-axis)',1.25)+line(ox,0,ox,height,'var(--lab-axis)',1.25);
      if (oy > 9 && oy < height-2) grid += txt(width-10, Math.max(15,oy-6),'x','end','lab-small');
      if (ox > 3 && ox < width-15) grid += txt(ox+7,15,'y','start','lab-small');
    }
    return {at,s,grid};
  }
  function angleArc(at, centre, radius, start, angle, color) {
    if (!angle) return '';
    const points = [];
    const count = Math.max(2,Math.ceil(Math.abs(angle)*12));
    for (let i=0; i<=count; i++) {
      const a = start+angle*i/count;
      points.push(at([centre[0]+radius*Math.cos(a),centre[1]+radius*Math.sin(a)]));
    }
    return poly(points,color,2) + arrow(points[Math.max(0,count-3)],points[count],color,1.75);
  }
  function labels(items) {
    // Combine coincident vertices in the identity case. Place other labels without overlap.
    const groups = [];
    for (const [p,name,dx,dy] of items) {
      const same = groups.find(g=>Math.hypot(p[0]-g.p[0],p[1]-g.p[1])<1.5);
      if (same) same.name += ' = ' + name;
      else groups.push({p,name,dx,dy});
    }
    const boxes = [];
    return groups.map(({p,name,dx,dy})=>{
      const labelWidth = name.length*8.6 + 6;
      const offsets = [[dx,dy],[10,-10],[10,19],[-labelWidth-5,-8],[-labelWidth-5,18],[7,32],[-labelWidth-5,-24]];
      const candidates = offsets.map(([x,y])=>({x:Math.min(width-labelWidth-3,Math.max(3,p[0]+x)),y:Math.min(height-3,Math.max(16,p[1]+y))}));
      const {x,y} = candidates.find(q=>boxes.every(b=>q.x+labelWidth<b.x || b.x+b.w<q.x || q.y+3<b.y-14 || b.y+3<q.y-14)) || candidates[0];
      boxes.push({x,y,w:labelWidth});
      return txt(x,y,name,'start','lab-annotation');
    }).join('');
  }
  function tag(plot, description, body) {
    plot.innerHTML = `<svg class="lab-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${description}">${body}</svg>`;
  }
  function legend(parent, items) {
    const node = element('div','lab-legend');
    for (const [color,name] of items) {
      const item = element('span');
      const swatch = element('i');
      swatch.setAttribute('aria-hidden','true');
      swatch.style.setProperty('--swatch',color);
      item.append(swatch,document.createTextNode(name)); node.append(item);
    }
    parent.append(node);
  }
  async function copyCode(button, text) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error();
      await navigator.clipboard.writeText(text);
    } catch {
      const field = element('textarea');
      field.value=text; field.style.position='fixed'; field.style.opacity='0';
      document.body.append(field);field.select();
      const copied=document.execCommand('copy');field.remove();button.focus();
      if (!copied) {
        const area = button.parentNode.querySelector('code'), selection = getSelection(), range = document.createRange();
        range.selectNodeContents(area); selection.removeAllRanges(); selection.addRange(range);
        button.textContent='Selected · use Ctrl/Cmd+C'; return;
      }
    }
    button.textContent='Copied'; setTimeout(()=>{button.textContent='Copy Python'},1400);
  }
  function mount(host, def, index) {
    const state = {}, widgets = {};
    const head = element('div','lab-head'), title = element('h3','',def.title);
    title.id = 'lab-heading-'+index;
    host.setAttribute('role','region'); host.setAttribute('aria-labelledby',title.id);
    head.append(title,element('p','',def.intro));
    const controls = element('div','lab-controls'), plot = element('div','lab-stage');
    const bottom = element('div','lab-bottom'), stats = element('div','lab-stats'), caption = element('p','lab-caption');
    bottom.append(stats,caption);
    if (def.legend) legend(bottom,def.legend);
    const actions=element('div','lab-actions'), details=element('details','lab-code'), summary=element('summary','','Python for this experiment');
    const copy=element('button','lab-button','Copy Python'), reset=element('button','lab-button','Reset');
    const code=element('code'), pre=element('pre');
    pre.setAttribute('data-own-copy',''); pre.append(code);
    copy.type='button'; reset.type='button';
    details.append(summary,element('p','',def.note || 'Run this example with Python 3. The parameters follow the controls above.'),copy,pre);
    actions.append(details,reset);host.append(head,controls,plot,bottom,actions);
    for (const [key,spec] of Object.entries(def.controls)) {
      state[key]=spec.value;
      const wrap=element('div','lab-control'), id='lab-'+index+'-'+key, label=element('label','lab-name',spec.label);
      label.htmlFor=id;wrap.append(label);
      let input,readout,number;
      if (spec.options) {
        input=element('select');
        for(const [value,name] of Object.entries(spec.options)) {
          const option=element('option','',name);option.value=value;input.append(option);
        }
      } else {
        input=element('input');
        if(spec.number) input.type='number';
        else {
          input.type='range';
          if (!spec.dual) {readout=element('output','lab-value'); readout.htmlFor=id; label.append(readout)}
        }
        input.min=spec.log ? 0 : spec.min;
        if(spec.log) input.max=1000;
        input.step=spec.log ? 1 : spec.step;
      }
      input.id=id;
      if (spec.dual) {
        const row=element('div','lab-dual'); number=element('input');number.type='number';
        number.min=spec.min;number.max=spec.max;number.step=spec.step;
        number.setAttribute('aria-label',spec.label+' exact value');
        row.append(input,number);wrap.append(row);
        number.addEventListener('input',()=>{if(number.value!=='' && number.validity.valid){state[key]=Number(number.value);update()}});
        number.addEventListener('change',()=>update());
      } else wrap.append(input);
      controls.append(wrap);widgets[key]={input,number,readout};
      input.addEventListener('input',()=>{
        if (spec.number && (input.value==='' || !input.validity.valid)) return;
        state[key]=spec.options ? input.value : spec.log ? Math.round(Math.exp(Math.log(spec.max)*Number(input.value)/1000)) : Number(input.value);
        update();
      });
      if(spec.number) input.addEventListener('change',()=>update());
      if(spec.log) input.addEventListener('keydown',event=>{
        const direction={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[event.key];
        if(!direction) return;
        event.preventDefault();
        state[key]+=direction*Math.max(1,Math.round(state[key]*.012));
        update();
      });
    }
    function update() {
      for (const [key,spec] of Object.entries(def.controls)) {
        const {input,number,readout}=widgets[key];
        if(!spec.options) {
          const max=typeof spec.max==='function' ? spec.max(state) : spec.max;
          state[key]=Math.max(spec.min,Math.min(max,state[key]));
          input.max=spec.log ? 1000 : max;
        }
        input.value=spec.log ? Math.round(1000*Math.log(state[key])/Math.log(spec.max)) : state[key];
        if(number && number.value!==String(state[key])) number.value=state[key];
        if(readout) readout.textContent=state[key]+(spec.unit||'');
        if(!spec.options && !spec.number) input.setAttribute('aria-valuetext',state[key]+(spec.unit||''));
      }
      const result=def.render(plot,state);
      stats.replaceChildren(...result.stats.map(([label,value])=>{
        const block=element('div','lab-stat');
        block.append(element('span','',label),element('strong','',String(value)));return block;
      }));
      caption.textContent=result.caption;
      code.textContent=result.code.trim()+'\n';
    }
    copy.addEventListener('click',()=>copyCode(copy,code.textContent));
    reset.addEventListener('click',()=>{for(const [key,s] of Object.entries(def.controls)) state[key]=s.value; update()});
    if(def.redrawTheme) new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    update();
  }
  const fernMaps=[
    [0,0,0,.16,0,0], [.85,.04,-.04,.85,0,1.6],
    [.2,-.26,.23,.22,0,1.6], [-.15,.28,.26,.24,0,.44]
  ];
  const fernWeights={usual:[1,85,7,7],equal:[1,1,1,1],omit:[1,85,7,0]};
  lectures.fern={
    title:'Grow a Barnsley fern',
    intro:'Start with a few random moves. Increase n to reveal the leaf while keeping the earlier points in place.',
    note:'Python 3 with Matplotlib. The same 32-bit generator, seed and rule order reproduce the points in this panel.',
    controls:{
      n:{...scalar('Number of moves n',1,150000,1,5000),dual:true,log:true},
      seed:{...scalar('Random seed',0,4294967295,1,2026),number:true},
      mix:opts('Rule probabilities',{usual:'Original fern',equal:'Four equal weights',omit:'Omit rule 4'},'usual')
    },redrawTheme:true,
    render(plot,{n,seed,mix}){
      const weights=fernWeights[mix], total=weights.reduce((a,b)=>a+b,0);
      const cut=[weights[0],weights[0]+weights[1],total-weights[3]].map(v=>v/total);
      if (!plot.querySelector('canvas')) {
        const layout=element('div','lab-fern-layout'), canvas=element('canvas','lab-fern');
        canvas.width=520;canvas.height=620;canvas.setAttribute('role','img');
        const table=element('table','lab-frequencies');
        table.innerHTML='<caption>Rule frequencies</caption><thead><tr><th scope="col">Rule</th><th scope="col">Chance</th><th scope="col">Draws</th></tr></thead><tbody></tbody>';
        layout.append(canvas,table); plot.append(layout);
      }
      const canvas=plot.querySelector('canvas'), ctx=canvas.getContext('2d');
      const dark=document.documentElement.dataset.theme==='dark';
      const colors=dark ? ['#daca83','#90d8ad','#9ec1f0','#f39fae'] : ['#845d15','#27664d','#245699','#b03c56'];
      ctx.clearRect(0,0,canvas.width,canvas.height);
      let x=0,y=0,s=seed>>>0;const counts=[0,0,0,0];
      for (let i=0;i<n;i++) {
        s=(Math.imul(1664525,s)+1013904223)>>>0;
        const u=s/4294967296, rule=u<cut[0]?0:u<cut[1]?1:u<cut[2]?2:3;
        const [a,b,c,d,e,f]=fernMaps[rule];
        [x,y]=[a*x+b*y+e,c*x+d*y+f];counts[rule]++;
        ctx.fillStyle=colors[rule];
        ctx.fillRect(248+57*x,598-57*y,n<1000?3.6:2.4,n<1000?3.6:2.4);
      }
      canvas.setAttribute('aria-label',`Barnsley fern after ${n} moves with seed ${seed}. Points are coloured by the last rule.`);
      plot.querySelector('tbody').innerHTML=counts.map((c,i)=>`<tr><th scope="row"><i style="background:${colors[i]}"></i>f<sub>${i+1}</sub></th><td>${percent(weights[i]/total)}</td><td>${c.toLocaleString('en-US')}</td></tr>`).join('');
      return {
        stats:[['Plotted points',n.toLocaleString('en-US')],['Last point Pₙ',coord([x,y])],['Observed rule 2',percent(counts[1]/n)]],
        caption:'Each dot is one iterate. Its colour identifies the last affine map applied. Keep the seed fixed to compare prefixes of one orbit.',
        code:`import matplotlib.pyplot as plt

n, state = ${n}, ${seed}
weights = ${JSON.stringify(weights)}
maps = [(0, 0, 0, .16, 0, 0), (.85, .04, -.04, .85, 0, 1.60),
        (.20, -.26, .23, .22, 0, 1.60), (-.15, .28, .26, .24, 0, .44)]
palette = ["#845d15", "#27664d", "#245699", "#b03c56"]
total = sum(weights)
cutoffs = [sum(weights[:i + 1]) / total for i in range(3)]
x, y = 0.0, 0.0
xs, ys, colours, counts = [], [], [], [0] * 4
for _ in range(n):
    state = (1664525 * state + 1013904223) % (2 ** 32)
    u = state / (2 ** 32)
    rule = next((i for i, cutoff in enumerate(cutoffs) if u < cutoff), 3)
    a, b, c, d, e, f = maps[rule]
    x, y = a*x + b*y + e, c*x + d*y + f
    xs.append(x)
    ys.append(y)
    colours.append(palette[rule])
    counts[rule] += 1
print("Rule counts:", counts, "Last point:", (x, y))
plt.scatter(xs, ys, c=colours, s=1, linewidths=0)
plt.gca().set_aspect("equal")
plt.axis("off")
plt.show()`
      };
    }
  };
  function choose(n,k) {
    if(k<0 || k>n) return 0;
    let c=1;
    for(let j=1;j<=Math.min(k,n-k);j++) c=c*(n-j+1)/j;
    return Math.round(c);
  }
  lectures.paths={
    title:'Count the shortest routes',
    intro:'Every route moves one block east or north. Read the count at each crossing and select a route to trace it.',
    controls:{p:scalar('Eastward blocks',1,8,1,4),q:scalar('Northward blocks',1,8,1,3),rank:scalar('Route number',1,s=>choose(s.p+s.q,s.p),1,1)},
    render(plot,{p,q,rank}) {
      const at=(x,y)=>[38+x*(width-76)/p,height-27-y*(height-58)/q];
      let body='',x=0,y=0,r=rank,path=[[0,0]],moves='';
      while (x<p || y<q) {
        const east=x<p?choose(p-x+q-y-1,q-y):0;
        if(r<=east){x++;moves+='E'}else{r-=east;y++;moves+='N'}
        path.push([x,y]);
      }
      for(let a=0;a<=p;a++) body+=line(...at(a,0),...at(a,q),'var(--lab-axis)',1);
      for(let b=0;b<=q;b++) body+=line(...at(0,b),...at(p,b),'var(--lab-axis)',1);
      body+=poly(path.map(([a,b])=>at(a,b)),rose,4.5);
      for(let a=0;a<=p;a++)for(let b=0;b<=q;b++) {
        const [px,py]=at(a,b),v=choose(a+b,b);
        body+=dot(px,py,green,3)+txt(px,py-7,String(v),'middle','lab-annotation');
      }
      tag(plot,`${p} by ${q} grid with route ${rank} picked out. Route steps ${moves}.`,body);
      return {stats:[['Shortest routes',choose(p+q,p)],['Steps per route',p+q],['Selected moves',moves]],
        caption:'At an interior crossing, add the counts immediately to its west and south. The highlighted route is indexed by taking east before north.',
        code:`from math import comb

p, q, rank = ${p}, ${q}, ${rank}
print("Shortest routes:", comb(p + q, p))
x = y = 0
moves = []
while x < p or y < q:
    east = comb(p - x + q - y - 1, q - y) if x < p else 0
    if rank <= east:
        moves.append("E")
        x += 1
    else:
        rank -= east
        moves.append("N")
        y += 1
print("Selected route:", "".join(moves))`};
    }
  };
  lectures.binomial={
    title:'Explore a binomial distribution',
    intro:'Set the number of independent trials and the chance of success. Choose k to inspect the probability of exactly k successes.',
    controls:{n:scalar('Trials n',1,30,1,8),p:scalar('Success chance p',0,1,.01,.5),k:scalar('Successes k',0,s=>s.n,1,4)},
    render(plot,{n,p,k}) {
      const probs=Array.from({length:n+1},(_,j)=>choose(n,j)*p**j*(1-p)**(n-j));
      const peak=Math.max(...probs), ceiling=Math.min(1,Math.max(.1,Math.ceil(peak*10)/10)), l=54,r=width-14,t=25,b=height-35,step=(r-l)/(n+1);
      let body='';
      for(let j=0;j<=4;j++){
        const v=ceiling*j/4,y=b-(b-t)*j/4;
        body+=line(l,y,r,y,'var(--lab-line)',1)+txt(l-5,y+5,percent(v),'end','lab-small');
      }
      probs.forEach((v,j)=>{
        const x=l+step*(j+.1),h=(b-t)*v/ceiling;
        body+=`<rect x="${x}" y="${b-h}" width="${.8*step}" height="${h}" fill="${j===k?rose:blue}"/>`;
        if(n<=15 || j%Math.ceil(n/10)===0 || j===k || j===n) body+=txt(l+step*(j+.5),b+19,j,'middle','lab-small');
      });
      body+=line(l,b,r,b,'var(--lab-axis)',1.5);
      tag(plot,`Binomial probability bars for ${n} trials. P of ${k} successes is ${percent(probs[k])}.`,body);
      return {stats:[['P(X = '+k+')',probs[k] && probs[k]<1e-4 ? probs[k].toExponential(2) : round(probs[k],5)],['Mean np',round(n*p)],['Variance np(1 − p)',round(n*p*(1-p))]],
        caption:'Bar height gives probability. The highlighted bar combines all ways to place the chosen number of successes.',
        code:`from math import comb

n, p, k = ${n}, ${p}, ${k}
mass = [comb(n, j) * p**j * (1-p)**(n-j) for j in range(n+1)]
print("P(X = k):", mass[k])
print("Mean:", n*p, "Variance:", n*p*(1-p))
for j, prob in enumerate(mass):
    print(j, f"{prob:.6g}")`};
    }
  };
  const angle = value=>scalar('Directed turn θ',-180,180,1,value,'°');
  const scale = value=>scalar('Scale factor k',.25,2.5,.05,value);
  function turn(p,k,rad,centre=[0,0]) {
    const x=p[0]-centre[0],y=p[1]-centre[1],cos=Math.cos(rad),sin=Math.sin(rad);
    return [centre[0]+k*(x*cos-y*sin),centre[1]+k*(x*sin+y*cos)];
  }
  function triangle(points,color) {
    return `<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${color}" fill-opacity=".11" stroke="${color}" stroke-width="1.8"/>`;
  }
  lectures.spiral={
    title:'A spiral similarity in motion',
    intro:'Rotate and dilate the directed segment AB about O. Follow A to C and B to D as the two triangles turn together.',
    note:'Python 3 with Matplotlib. Run the code to draw the two triangles at the selected angle and scale.',
    controls:{theta:angle(65),k:scale(1.2)},
    legend:[[blue,'Original triangle OAB'],[rose,'Image triangle OCD'],[gold,'Turn from OA to OC'],[green,'Turn from OB to OD']],
    render(plot,{theta,k}) {
      const rad=theta*Math.PI/180, o=[0,0],a=[1.8,0],b=[2.5,.85],c=turn(a,k,rad),d=turn(b,k,rad);
      const {at,grid}=plane([[-1,-.75],[2.8,2.7],a,b,c,d]);
      const [O,A,B,C,D]=[o,a,b,c,d].map(at);
      const body=grid+triangle([O,A,B],blue)+triangle([O,C,D],rose)+
        arrow(A,B,blue,3.25)+arrow(C,D,rose,3.25)+
        angleArc(at,o,.48,0,rad,gold)+angleArc(at,o,.92,Math.atan2(.85,2.5),rad,green)+
        dot(...A,blue)+dot(...B,blue)+dot(...C,rose)+dot(...D,rose)+dot(...O,'var(--lab-text)')+
        labels([[O,'O',-17,18],[A,'A',2,19],[B,'B',8,-6],[C,'C',8,-6],[D,'D',5,-9]]);
      tag(plot,`Triangle OAB maps to OCD by a turn of ${theta} degrees and a dilation of ${k}. C is ${coord(c)} and D is ${coord(d)}.`,body);
      return {stats:[['C = image of A',coord(c)],['D = image of B',coord(d)],['Length ratio CD/AB',round(Math.hypot(d[0]-c[0],d[1]-c[1])/Math.hypot(.7,.85))]],
        caption:`Both rays turn through ${theta}°. Both lengths from O are multiplied by ${round(k)}. Each grid interval measures one unit.`,
        code:`import cmath
from math import radians
import matplotlib.pyplot as plt

k, theta = ${k}, ${theta}
O, A, B = 0j, 1.8+0j, 2.5+0.85j
u = k * cmath.exp(1j * radians(theta))
C, D = u*A, u*B

for vertices, colour in [((O, A, B, O), "#265ba3"), ((O, C, D, O), "#ac3d53")]:
    plt.plot([z.real for z in vertices], [z.imag for z in vertices],
             marker="o", color=colour)
for name, z in zip("OABCD", (O, A, B, C, D)):
    plt.annotate(name, (z.real, z.imag), xytext=(4, 5), textcoords="offset points")
plt.axis("equal")
plt.grid()
print("C, D:", C, D, "Length ratio:", abs(D-C)/abs(B-A))
plt.show()`};
    }
  };
  lectures.centre={
    title:'A turn about an arbitrary centre',
    intro:'Work through the three stages for P = (2, 1) and A = (3, 2). The blue arrow represents the starting displacement.',
    controls:{stage:opts('Construction stage',{shift:'1 · Subtract P',multiply:'2 · Apply the multiplier',restore:'3 · Add P back'},'restore'),theta:angle(90),k:scale(2)},
    legend:[[blue,'Original displacement'],[rose,'Transformed displacement']],
    render(plot,{stage,theta,k}) {
      const p=[2,1],a=[3,2],o=[0,0],v=[1,1],w=turn(v,k,theta*Math.PI/180),z=[p[0]+w[0],p[1]+w[1]];
      const central=stage==='restore'?p:o, before=stage==='restore'?a:v, after=stage==='restore'?z:w;
      const pts=stage==='shift'?[o,p,a,v]:[o,central,before,after];
      const {at,grid}=plane([[-.8,-.5],[3.5,3.2],...pts]);
      const O=at(o),P=at(p),A=at(a),V=at(v),C=at(central),B=at(before),E=at(after);
      let body=grid, desc;
      if(stage==='shift'){
        body+=arrow(P,A,blue)+arrow(O,V,blue)+line(...P,...O,'var(--lab-axis)',1.75,'stroke-dasharray="5 5"')+
          line(...A,...V,'var(--lab-axis)',1.75,'stroke-dasharray="5 5"');
        for(const pt of [O,P,A,V]) body+=dot(...pt,blue,3.5);
        body+=labels([[O,'0',-15,18],[P,'P',6,18],[A,'A',7,-8],[V,'A − P',6,-8]]);
        desc='Translate the entire original arrow by −P. Its tail reaches the origin and its head becomes (1, 1).';
      }else{
        body+=arrow(C,B,blue,3)+arrow(C,E,rose,3)+angleArc(at,central,.45,Math.PI/4,theta*Math.PI/180,gold);
        for(const [pt,col] of [[C,'var(--lab-text)'],[B,blue],[E,rose]]) body+=dot(...pt,col,3.5);
        body+=labels(stage==='restore'?[[O,'0',-14,17],[C,'P',5,18],[B,'A',5,-8],[E,'A′',5,-8]]:[[O,'0',-14,17],[B,'A − P',5,-8],[E,'U(A − P)',5,-8]]);
        desc=stage==='restore'?'Place the two arrows back at P. The transformed head is A′ = P + U(A − P).':'Multiply the arrow at the origin by U = k(cos θ + i sin θ). Change the length and direction together.';
      }
      tag(plot,desc+' Final image '+coord(z)+'.',body);
      return {stats:[['A − P',coord(v)],['U(A − P)',coord(w)],['A′ = P + U(A − P)',coord(z)]],caption:desc,
        code:`import cmath
from math import radians

P, A = 2+1j, 3+2j
k, theta = ${k}, ${theta}
U = k * cmath.exp(1j * radians(theta))
v = A - P
w = U * v
image = P + w
for label, z in [("A-P", v), ("U(A-P)", w), ("Image", image)]:
    print(label, (round(z.real, 6), round(z.imag, 6)))`};
    }
  };
  lectures.roots={
    title:'Walk around the roots of unity',
    intro:'Change the order n and select a power j. Each new power of ω advances by one equal turn around the unit circle.',
    controls:{n:scalar('Order n',2,20,1,6),j:scalar('Power j',0,s=>s.n-1,1,1)},
    legend:[[blue,'n equally spaced roots'],[rose,'Selected root ωʲ']],
    render(plot,{n,j}){
      const phase=tau*j/n,z=[Math.cos(phase),Math.sin(phase)];
      const {at,s,grid}=plane([[-1.16,-1.16],[1.16,1.16]],1);
      const o=at([0,0]),pts=Array.from({length:n},(_,i)=>at([Math.cos(tau*i/n),Math.sin(tau*i/n)]));
      let body=grid+`<circle cx="${o[0]}" cy="${o[1]}" r="${s}" fill="none" stroke="var(--lab-axis)" stroke-width="1.35"/>`+
        poly([...pts,pts[0]],blue,2)+angleArc(at,[0,0],.4,0,phase,gold)+arrow(o,pts[j],rose);
      for(let i=0;i<n;i++) {
        body+=dot(...pts[i],i===j?rose:blue,i===j?5:3.5);
        const a=tau*i/n,[x,y]=at([1.15*Math.cos(a),1.15*Math.sin(a)]);
        body+=txt(x,y+4,String(i),'middle','lab-small');
      }
      tag(plot,`The ${n}th roots of unity with power ${j} at ${coord(z)}.`,body);
      return {stats:[['Angle from 1',round(360*j/n,2)+'°'],['Real part',round(z[0],5)],['Imaginary part',round(z[1],5)]],
        caption:'The labels are exponents. After n steps the next vertex is 1 again, so exponents repeat modulo n.',
        code:`import cmath
from math import tau

n, j = ${n}, ${j}
roots = [cmath.exp(1j * tau * m / n) for m in range(n)]
for m, z in enumerate(roots):
    print(m, round(z.real, 6), round(z.imag, 6))
print("Selected:", roots[j])
print("Distance from its nth power to 1:", abs(roots[j]**n - 1))`};
    }
  };
  lectures.cauchy={
    title:'When does Cauchy–Schwarz become equality?',
    intro:'Turn one vector while keeping the other on the horizontal axis. The dashed segment shows how far the moving vector reaches above that axis.',
    controls:{theta:scalar('Angle between vectors',0,180,1,55,'°'),r:scalar('Length of a',.5,4,.1,3),s:scalar('Length of b',.5,4,.1,2)},
    legend:[[blue,'Vector a'],[rose,'Vector b'],[green,'Perpendicular component']],
    render(plot,{theta,r,s}) {
      const rad=theta*Math.PI/180,a=[r,0],b=[s*Math.cos(rad),s*Math.sin(rad)],foot=[b[0],0];
      const {at,grid}=plane([[-1,-.45],[3.5,2.8],a,b]);
      const [O,A,B,F]=[[0,0],a,b,foot].map(at);
      const upper=r*r*s*s,dot2=(r*b[0])**2,gap=(r*b[1])**2;
      let body=grid+line(...B,...F,green,2,'stroke-dasharray="6 4"')+angleArc(at,[0,0],.41,0,rad,gold)+
        arrow(O,A,blue,4.5)+arrow(O,B,rose,2.75)+dot(...O,'var(--lab-text)',3)+
        labels([[O,'O',-16,17],[A,'a',4,17],[B,'b',5,-9]]);
      if(theta===0 && Math.abs(r-s)<1e-6) body=grid+arrow(O,A,blue,5.5)+arrow(O,B,rose,2)+labels([[O,'O',-15,17],[B,'a = b',6,-9]]);
      tag(plot,`Two vectors form a ${theta} degree angle. The squared Cauchy–Schwarz gap is ${round(gap)}.`,body);
      return {stats:[['(a · b)²',round(dot2,4)],['‖a‖² ‖b‖²',round(upper,4)],['Difference',round(gap,4)]],
        caption:theta===0 || theta===180 ? 'The vectors are proportional. Their perpendicular component vanishes and the two sides agree.' : 'The difference is ‖a‖² ‖b‖² sin² θ. Try 0° and 180° to reach equality in both parallel directions.',
        code:`from math import cos, sin, radians

r, s, theta = ${r}, ${s}, radians(${theta})
a = (r, 0)
b = (s*cos(theta), s*sin(theta))
dot = sum(x*y for x, y in zip(a, b))
bound = sum(x*x for x in a) * sum(y*y for y in b)
print("Squared dot product:", dot**2)
print("Bound:", bound)
print("Gap:", (r*s*sin(theta))**2)`};
    }
  };
  const pairA=[1,2,3,4], pairB=[2,4,7,9];
  function swaps() {
    const permutations=[[3,2,1,0]],p=permutations[0].slice();
    while(true) {
      const i=p.findIndex((v,j)=>j+1<p.length && v>p[j+1]);
      if(i<0) return permutations;
      [p[i],p[i+1]]=[p[i+1],p[i]];permutations.push(p.slice());
    }
  }
  const orders=swaps();
  lectures.pairing={
    title:'Exchange an inverted pair',
    intro:'Read the lines as pairings between the two ordered rows. Each step swaps one adjacent inversion. Watch the product sum as the lines uncross.',
    controls:{step:scalar('Exchange step',0,orders.length-1,1,0)},
    legend:[[blue,'Current pairing'],[rose,'Pair that changes next']],
    render(plot,{step}) {
      const p=orders[step],next=orders[step+1],sum=p.reduce((total,j,i)=>total+pairA[i]*pairB[j],0);
      const inv=p.reduce((total,v,i)=>total+p.slice(i+1).filter(w=>w<v).length,0);
      const pos=i=>87+i*122;
      let body=txt(36,70,'x','start','lab-annotation')+txt(36,244,'y','start','lab-annotation');
      p.forEach((v,i)=>{body+=line(pos(i),74,pos(v),224,next && p[i]!==next[i]?rose:blue,next && p[i]!==next[i]?3.5:2)});
      for(let i=0;i<4;i++){
        body+=dot(pos(i),74,blue,5)+dot(pos(i),224,blue,5)+txt(pos(i),55,String(pairA[i]),'middle','lab-annotation')+txt(pos(i),252,String(pairB[i]),'middle','lab-annotation');
      }
      const sequence=p.map(j=>pairB[j]);
      tag(plot,`Pair ${pairA.join(', ')} in order with ${sequence.join(', ')}. ${inv} inversions remain.`,body);
      const gain=next ? next.reduce((t,j,i)=>t+pairA[i]*pairB[j],0)-sum : 0;
      return {stats:[['Current product sum',sum],['Inversions',inv],['Gain at next exchange',next?'+'+gain:'Complete']],
        caption:next ? 'The highlighted lines cross. Exchanging their lower endpoints raises the sum and removes one inversion.' : 'The two rows now have the same order. Their product sum is maximal.',
        code:`x, y = [1, 2, 3, 4], [2, 4, 7, 9]
order = list(reversed(range(len(y))))
for _ in range(${step}):
    i = next(i for i in range(len(y)-1) if order[i] > order[i+1])
    order[i], order[i+1] = order[i+1], order[i]
paired = [y[i] for i in order]
print("Paired row:", paired)
print("Product sum:", sum(a*b for a, b in zip(x, paired)))
print("Inversions:", sum(u > v for i, u in enumerate(order) for v in order[i+1:]))`};
    }
  };
  lectures.means={
    title:'Compare the weighted means',
    intro:'Trace the same weight t along the arithmetic and geometric means. Change either input to examine when the curves meet.',
    controls:{a:scalar('Positive value a',.25,10,.25,8),b:scalar('Positive value b',.25,10,.25,2),t:scalar('Weight t on a',0,1,.01,.5)},
    legend:[[blue,'Arithmetic · ta + (1 − t)b'],[rose,'Geometric · aᵗ b⁽¹⁻ᵗ⁾'],[green,'Difference at t']],
    render(plot,{a,b,t}){
      const lo=Math.max(0,Math.floor(Math.min(a,b)-.5)),hi=Math.ceil(Math.max(a,b)+.5);
      const at=(x,y)=>[46+x*(width-68),height-33-(height-55)*(y-lo)/(hi-lo)];
      const am=x=>x*a+(1-x)*b,gm=x=>a**x*b**(1-x);
      let body='';
      for(let j=0;j<=4;j++){
        const q=lo+j*(hi-lo)/4,pos=at(0,q);
        body+=line(...pos,...at(1,q),'var(--lab-line)',1)+txt(pos[0]-7,pos[1]+4,round(q,2),'end','lab-small');
        const x=j/4,bot=at(x,lo);
        body+=line(...bot,...at(x,hi),'var(--lab-line)',1)+txt(bot[0],bot[1]+19,round(x),'middle','lab-small');
      }
      body+=txt(width-5,height-13,'t','end','lab-small');
      const points=Array.from({length:101},(_,i)=>at(i/100,gm(i/100)));
      body+=line(...at(0,b),...at(1,a),blue,3.7)+poly(points,rose,2.4)+
        line(...at(t,lo),...at(t,am(t)),'var(--lab-axis)',1.5,'stroke-dasharray="5 4"')+
        line(...at(t,gm(t)),...at(t,am(t)),green,4)+dot(...at(t,am(t)),blue,5)+dot(...at(t,gm(t)),rose,3.5);
      const ar=am(t),geo=gm(t);
      tag(plot,`Weighted arithmetic mean ${round(ar)}, weighted geometric mean ${round(geo)}, at t = ${t}.`,body);
      return {stats:[['Arithmetic mean',round(ar,4)],['Geometric mean',round(geo,4)],['Difference',round(Math.max(0,ar-geo),4)]],
        caption:t===0 || t===1 ? 'At an endpoint the entire weight falls on one input. Both means equal that input.' : a===b ? 'Equal inputs give equal means at every weight.' : 'For unequal positive inputs and an interior weight, the arithmetic mean lies strictly above the geometric mean.',
        code:`a, b, t = ${a}, ${b}, ${t}
assert a > 0 and b > 0 and 0 <= t <= 1
arithmetic = t*a + (1-t)*b
geometric = a**t * b**(1-t)
print("Weighted arithmetic mean:", arithmetic)
print("Weighted geometric mean:", geometric)
print("Difference:", arithmetic - geometric)`};
    }
  };
  function start() {
    document.querySelectorAll('.math-lab[data-lab]').forEach((node,index)=>{
      if(lectures[node.dataset.lab] && !node.dataset.mounted) {
        mount(node,lectures[node.dataset.lab],index);
        node.dataset.mounted='true';
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
