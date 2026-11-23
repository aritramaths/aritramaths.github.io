(() => {
  'use strict';
  const dialog=document.querySelector('#figure-viewer');
  if(dialog){
    const image=dialog.querySelector('img'), area=dialog.querySelector('.zoom-area'), caption=dialog.querySelector('.zoom-caption');
    const magnify=dialog.querySelector('.magnify');
    let trigger;
    document.addEventListener('click',e=>{
      const plate=e.target.closest('.plate');if(!plate)return;
      trigger=plate;
      const original=plate.querySelector('img');
      image.src=original.src;image.alt=original.alt;
      image.style.aspectRatio=original.width+' / '+original.height;
      caption.textContent=original.alt;area.classList.remove('zoomed');magnify.textContent='Magnify';
      dialog.showModal();
    });
    magnify.addEventListener('click',()=>{const big=area.classList.toggle('zoomed');magnify.textContent=big?'Fit diagram':'Magnify';});
    dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>trigger?.focus({preventScroll:true}));
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  }
  const showTarget=()=>{
    let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
    const target=document.getElementById(id);
    if(!target)return;
    let node=target.closest('details');
    while(node){node.open=true;node=node.parentElement?.closest('details')}
    if(target.closest('details'))target.scrollIntoView();
  };
  window.addEventListener('hashchange',showTarget);showTarget();
  document.querySelectorAll('.on-this-page a,.section-menu a').forEach(a=>a.addEventListener('click',()=>{
    const menu=a.closest('.section-menu');if(menu)menu.open=false;
  }));
})();
