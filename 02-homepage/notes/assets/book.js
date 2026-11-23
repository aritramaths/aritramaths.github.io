(function(){
 const key='ad-lecture-theme';
 const root=document.documentElement;
 try{if(localStorage.getItem(key)==='dark')root.setAttribute('data-theme','dark')}catch(e){}
 document.querySelectorAll('[data-theme-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
   const dark=root.getAttribute('data-theme')!=='dark';
   if(dark)root.setAttribute('data-theme','dark');else root.removeAttribute('data-theme');
   btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
   try{localStorage.setItem(key,dark?'dark':'light')}catch(e){}
 }));
 const side=document.getElementById('toc-sidebar'),toggle=document.getElementById('toc-toggle');
 if(toggle&&side)toggle.addEventListener('click',()=>{const show=side.classList.toggle('show');toggle.setAttribute('aria-expanded',String(show))});
 const reading=document.getElementById('reader-main');
 const typeBtn=document.getElementById('type-toggle');
 if(typeBtn&&reading)typeBtn.addEventListener('click',()=>{const big=reading.classList.toggle('large-type');typeBtn.setAttribute('aria-pressed',String(big));typeBtn.textContent=big?'Smaller text':'Larger text'});
 const allProofs=document.getElementById('proof-toggle');
 if(allProofs){allProofs.addEventListener('click',()=>{const proofs=[...document.querySelectorAll('details.proof')];const open=proofs.some(p=>!p.open);proofs.forEach(p=>p.open=open);allProofs.textContent=open?'Collapse all proofs':'Expand all proofs'})}
})();
