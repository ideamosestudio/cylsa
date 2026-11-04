const form=document.querySelector('[data-survey-form][data-endpoint]');
if(form){
 const find=k=>form.querySelector('[data-survey-'+k+']');
 const steps=[...form.querySelectorAll('[data-survey-step]')], indicators=[...document.querySelectorAll('[data-survey-indicator]')];
 const back=find('back'),next=find('next'),actions=find('actions'),progress=find('progress'),error=find('error'),complete=find('complete');
 let current=0,busy=false; const ticket=crypto.randomUUID();
 function show(i){current=i;steps.forEach((s,j)=>s.hidden=j!==i);
 indicators.forEach((el,j)=>{el.classList.toggle('is-done',j<i);if(j===i)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 back.hidden=i===0; setNextLabel(i===steps.length-1?'Enviar encuesta':'Siguiente');
 progress.textContent='Paso '+(i+1)+' de '+steps.length;error.hidden=true;steps[i].querySelector('h2')?.focus();}
 function validate(i){for(const c of steps[i].querySelectorAll('input,select,textarea')){
 c.setCustomValidity(c.required && c.type!=='radio' && !c.value.trim()?'Completá este campo.':'');
 if(!c.checkValidity()){show(i);c.reportValidity();return false;}}return true;}
 back.addEventListener('click',()=>!busy&&show(Math.max(0,current-1)));
 form.querySelectorAll('[data-clear-rating]').forEach(b=>b.addEventListener('click',()=>{for(const e of form.elements)if(e.name===b.dataset.clearRating)e.checked=false;}));
 form.addEventListener('input',e=>{e.target.setCustomValidity?.('');error.hidden=true;});
 form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!validate(current))return;
 if(current<steps.length-1){show(current+1);return;}
 for(let i=0;i<steps.length;i++)if(!validate(i))return;
 const body=new FormData(form);body.set('action','cyl_enc_submit');body.set('ticket',ticket);body.set('token',form.dataset.token);
 busy=true;back.disabled=next.disabled=true;setNextLabel('Enviando…');error.hidden=true;
 try{const res=await fetch(form.dataset.endpoint,{method:'POST',body,credentials:'same-origin',signal:AbortSignal.timeout(25000)});
 const reply=await res.json();if(!res.ok||reply.success!==true)throw Error(reply.data?.message||'No se pudo confirmar el envío.');
 form.reset();steps.forEach(s=>s.hidden=true);actions.hidden=true;progress.textContent='Encuesta enviada';complete.hidden=false;complete.querySelector('button')?.remove();complete.querySelector('h2')?.focus();
 }catch(err){error.textContent=(err.message||'No se pudo confirmar el envío.')+' Tus respuestas siguen acá. Podés volver a intentar.';error.hidden=false;setNextLabel('Enviar encuesta');}
 finally{busy=false;back.disabled=next.disabled=false;}});
 function setNextLabel(label){(next.querySelector('[data-next-label]') || next).textContent=label;}
}
