(() => {
  'use strict';
  const names = {cards:'01 · Переключатель в карточке',inspector:'02 · Картинка и крупный просмотр',review:'03 · Вкладка «Оживлённые»'};
  const variant = new URLSearchParams(location.search).get('variant') in names ? new URLSearchParams(location.search).get('variant') : 'inspector';
  const key = `publication-animation-concept-v2-${variant}`;
  const $ = s => document.querySelector(s);
  const esc = x => String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.8c0-.8.8-1.2 1.4-.8l12 7.2c.6.4.6 1.2 0 1.6l-12 7.2c-.6.4-1.4 0-1.4-.8z"/></svg>';
  const defaultTitles = ['Как выбрать место, в котором хочется жить','Новые впечатления начинаются рядом с домом','Что делает повседневную жизнь комфортнее'];
  const initial = scenario => {
    const images = [
      {id:'courtyard',name:'Двор и архитектура',image:'assets/image-1.jpg',video:'assets/animation-1.mp4',ready:'ready',use:true,live:true,star:true},
      {id:'keys',name:'Ключи от новой квартиры',image:'assets/image-2.jpg',video:'assets/animation-2.mp4',ready:'ready',use:true,live:false},
      {id:'balloon',name:'Воздушный шар',image:'assets/image-3.jpg',video:'assets/animation-3.mp4',ready:'ready',use:true,live:true},
      {id:'bear',name:'Медвежонок',image:'assets/bear.jpg',ready:'none',use:true,live:false}
    ];
    if(scenario==='none') images.forEach(x=>{x.ready='none';x.live=false;});
    if(scenario==='ready') images[3]={...images[3],image:'assets/image-1.jpg',video:'assets/animation-1.mp4',ready:'ready',name:'Двор — дополнительный кадр'};
    if(scenario==='states'){
      images[2].ready='processing';images[2].live=false;
      images[3].ready='error';images[3].live=false;
    }
    if(scenario==='many') for(let i=4;i<12;i++) images.push({...images[i%3],id:`extra-${i}`,name:`${images[i%3].name} · ${i+1}`,star:false,live:i%2===0});
    return {images,titles:defaultTitles,description:'Посмотрите, как небольшие детали меняют впечатление о месте.',scenario};
  };
  let saved;
  try {saved=JSON.parse(localStorage.getItem(key));} catch {}
  if(!saved?.images?.length) saved=initial('mixed');
  let draft=clone(saved), selected=draft.images[0].id, tab=variant==='review'?'animations':'ads',onlyStatic=false, showAllPreviews=false;
  $('#concept-name').textContent=names[variant];
  document.title=`${names[variant]} — Настройка объявлений`;
  $('#scenario').insertAdjacentHTML('beforeend','<option value="states">Генерируется / ошибка</option>');
  $('#scenario').value=draft.scenario;
  const current=()=>draft.images.find(x=>x.id===selected)||draft.images[0];
  const dirty=()=>JSON.stringify(draft)!==JSON.stringify(saved);
  const usable=()=>draft.images.filter(x=>x.use&&!x.deleted);
  const readyCount=()=>draft.images.filter(x=>x.ready==='ready'&&!x.deleted).length;
  const liveCount=()=>usable().filter(x=>x.ready==='ready'&&x.live).length;
  let toastTimer;
  const toast=message=>{clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3400);};
  const statusText=x=>x.deleted?'Изображение удалено':x.ready==='ready'?(x.live?'Живое · 0:05':'Статичное · видео готово'):x.ready==='processing'?'Оживление готовится':x.ready==='error'?'Оживление недоступно':'Нет готового видео';
  const updateSaveState=()=>{
    const el=$('#save-state');el.textContent=dirty()?'Есть несохранённые изменения':'Все изменения сохранены';el.classList.toggle('dirty',dirty());
    $('#save').disabled=!dirty();
  };
  const mode=x=>`<div class="mode" role="radiogroup" aria-label="Версия: ${esc(x.name)}"><button role="radio" data-action="static" data-id="${x.id}" aria-label="Статичное — ${esc(x.name)}" aria-checked="${!x.live}" ${!x.use||x.deleted?'disabled':''}>Статичное</button><button class="live" role="radio" data-action="live" data-id="${x.id}" aria-label="Живое — ${esc(x.name)}" aria-checked="${x.live}" ${x.ready!=='ready'||!x.use||x.deleted?'disabled':''}>✦ Живое</button></div>`;
  const thumb=(x,options={})=>`<div class="thumb ${!x.use||x.deleted?'is-off':''} ${options.selected?'selected':''}"><img src="${esc(x.image)}" alt="${esc(x.name)}"><button class="thumb-picker" data-action="select" data-id="${x.id}" aria-label="Настроить ${esc(x.name)}"></button>${!x.deleted?`<button class="circle use-image" data-action="use" data-id="${x.id}" aria-label="Использовать изображение ${esc(x.name)} в объявлениях" aria-pressed="${x.use}">${x.use?'✓':''}</button>`:''}<button class="circle remove" data-action="delete" data-id="${x.id}" aria-label="${x.deleted?'Восстановить':'Удалить'} ${esc(x.name)}">${x.deleted?'↶':'×'}</button>${x.ready==='ready'&&!x.deleted&&options.play?`<button class="play-round" data-action="play" data-id="${x.id}" aria-label="Посмотреть видео: ${esc(x.name)}">${playIcon}</button>`:''}${x.ready==='ready'&&!x.deleted?`<span class="media-badge">${x.live?'✦ Живое':'Видео готово'}</span>`:''}${x.star&&!x.deleted?'<span class="circle brand-star" title="Основное изображение">☆</span>':''}</div>`;
  const cards=()=>`<div class="images-grid ${variant==='cards'?'with-modes':''}">${draft.images.map(x=>`<article class="media-card">${thumb(x,{play:variant==='cards',selected:variant==='inspector'&&x.id===selected})}${variant==='cards'?`<div class="card-name">${esc(x.name)}</div>${mode(x)}<div class="card-status">${x.ready==='ready'?(x.deleted?'Удалено':x.use?'Готовое видео · 5 сек':'Не участвует в объявлениях'):statusText(x)}</div>`:''}</article>`).join('')}</div>`;
  const titles=()=>`<section class="section"><div class="section-title"><h3>Заголовки</h3><span class="small muted">${draft.titles.length} варианта</span></div><p class="section-description">Заинтересуйте читателя и покажите пользу статьи.</p><div class="title-fields">${draft.titles.map((x,i)=>`<div class="title-field"><input aria-label="Заголовок ${i+1}" data-title="${i}" value="${esc(x)}" maxlength="56">${i===0?'<span class="star" title="Основной заголовок">☆</span>':''}</div>`).join('')}</div></section>`;
  const imageSection=()=>`<section class="section"><h3>Изображения для объявлений РСЯ</h3><p class="section-description">Можно выбрать изображения, загруженные в статью, или добавить новые. <a href="https://yandex.ru/support/promopages/ru/promo-page/cover#image" target="_blank" rel="noreferrer">Требования к изображениям</a></p><div class="info"><span>✦</span><span>${readyCount()?`Готовы оживлённые версии: ${readyCount()}. Выберите, какие использовать в объявлениях.`:'Пока нет готовых оживлённых версий. Можно использовать статичные изображения.'}</span></div><div class="upload"><span>Перетащите сюда файлы или выберите вручную</span><button class="button" data-action="upload">Выбрать файлы</button><input id="upload" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></div>${cards()}<p class="summary-line">Изображений выбрано: ${usable().length} · оживлённых версий включено: ${liveCount()}</p>${variant==='inspector'?'<p class="selected-note">Нажмите на картинку, чтобы настроить её версию и посмотреть видео справа.</p>':''}</section>`;
  const lower=()=>`<details class="lower-block"><summary>Видео для объявлений РСЯ</summary><p>Отдельные рекламные видеоролики от 5 до 60 секунд. Оживлённые версии изображений настраиваются в блоке изображений.</p><div class="mini-video"><button class="add-video" data-action="video-help"><b>＋</b><span>Добавить<br>видео</span></button><span class="small muted">Независимый рекламный ролик</span></div></details><details class="lower-block"><summary>Описание</summary><p>Этот текст отображается под основным заголовком.</p><textarea aria-label="Описание объявления" id="description">${esc(draft.description)}</textarea></details><details class="lower-block"><summary>Быстрые ссылки</summary><p>В этом примере быстрые ссылки не добавлены.</p></details><details class="lower-block"><summary>Описание для ЕРИР</summary><p>Формировать описание автоматически</p></details>`;
  const banner=(x,i=0,interactive=false)=>`<article class="banner"><div class="banner-media">${x?`<img src="${esc(x.image)}" alt="${esc(x.name)}">`:'<div class="empty-preview">Выберите изображение</div>'}<span class="ad-mark">РЕКЛАМА</span><span class="dots">⋮</span>${x?.ready==='ready'&&interactive?`<button class="play-round" data-action="play" data-id="${x.id}" aria-label="Посмотреть видео: ${esc(x.name)}">${playIcon}</button>`:''}</div><div class="banner-copy"><div class="brand-line"><span class="brand-dot"></span>promo.page</div><h4>${esc(draft.titles[i%draft.titles.length]||defaultTitles[0])}</h4><p>${esc(draft.description)}</p><span class="banner-cta">Узнать больше</span></div></article>`;
  const previews=()=>`<aside class="preview-side"><h3 class="preview-heading">Предпросмотр объявлений</h3><div class="preview-board">${usable().length?`<div class="banner-grid">${usable().slice(0,4).map((x,i)=>`<div>${banner(x,i,true)}<p class="banner-type">${x.ready==='ready'&&x.live?'Живая версия включена':'Статичное изображение'}</p></div>`).join('')}</div>`:'<div class="empty-preview">Выберите хотя бы одно изображение для объявления.</div>'}</div><p class="summary-line">Изображения и заголовки могут сочетаться по-разному.</p></aside>`;
  const inspector=()=>{
    const x=current();
    return `<aside class="preview-side"><div class="inspector-title"><h3 class="preview-heading" style="margin:0">Предпросмотр объявления</h3>${variant==='inspector'?'<button class="quiet" data-action="all-previews">Все примеры</button>':''}</div><div class="preview-board"><div class="row spread" style="margin-bottom:13px"><strong class="small">${esc(x.name)}</strong><span class="small muted">${draft.images.indexOf(x)+1} / ${draft.images.length}</span></div><div class="control-panel"><label>Версия в объявлениях</label>${mode(x)}<p>${x.ready==='ready'?'Видео уже создано. Переключение только меняет версию в объявлениях.':x.ready==='processing'?'Когда видео будет готово, здесь появится просмотр и выбор живой версии.':'Для этого изображения нет доступного готового видео. Доступна статичная версия.'}</p>${x.ready==='ready'?`<button class="button watch-button" data-action="play" data-id="${x.id}">▶ Посмотреть видео · 5 сек</button>`:''}${!x.use||x.deleted?'<p>Изображение сейчас не участвует в объявлениях. Его видео можно посмотреть.</p>':''}</div><div class="inspector-ad">${banner(x,0,true)}</div></div><p class="selected-note">${!x.use||x.deleted?'Изображение сейчас не участвует в объявлениях.':x.live&&x.ready==='ready'?'В объявлении будет использоваться живая версия.':'В объявлении будет использоваться статичное изображение.'} Просмотр видео не меняет этот выбор.</p></aside>`;
  };
  const review=()=>{
    const items=draft.images.filter(x=>!x.deleted&&x.ready!=='none'&&(!onlyStatic||!x.live||!x.use));
    return `<div class="columns"><div class="form-side"><div class="review-head"><h3>Готовые оживления для ваших изображений</h3><p class="section-description" style="margin-top:10px">Посмотрите видео и решите, какие версии использовать в объявлениях. Исходные изображения сохранятся.</p><div class="info"><span>✦</span><span>Готово ${readyCount()} видео · включено в объявлениях ${liveCount()}</span></div></div>${readyCount()?`<div class="review-tools"><button class="button compact" data-action="enable-all">Включить готовые</button><button class="quiet" data-action="disable-all">Выключить все</button><label><input type="checkbox" id="only-static" ${onlyStatic?'checked':''}> Не включены</label></div>`:''}${items.length?items.map(x=>`<article class="review-row ${x.id===selected?'active':''}">${thumb(x,{play:false})}<div><div class="row spread"><h4>${esc(x.name)}</h4>${x.ready==='ready'?`<button class="quiet" data-action="play" data-id="${x.id}">Смотреть · 0:05</button>`:''}</div><div class="card-status">${!x.use?'Не участвует в объявлениях':statusText(x)}</div>${mode(x)}</div></article>`).join(''):`<div class="review-empty"><h3>${onlyStatic?'Все готовые видео включены':'Готовых оживлений пока нет'}</h3><p>${onlyStatic?'Можно снять фильтр и посмотреть всю подборку.':'Статичные изображения остаются в объявлениях. Когда готовые видео появятся, здесь можно будет их посмотреть и включить.'}</p><button class="button" data-action="${onlyStatic?'clear-filter':'to-images'}">${onlyStatic?'Показать все':'К изображениям'}</button></div>`}<p class="summary-line">Изображения без готового видео доступны на вкладке «Объявления».</p></div>${readyCount()?inspector():previews()}</div>`;
  };
  const render=()=>{
    document.querySelectorAll('video').forEach(v=>v.pause());
    $('#tabs').className='tabs';$('#tabs').innerHTML=[['ads','Объявления'],...(variant==='review'?[['animations','Оживлённые']]:[]),['pixels','Пиксели']].map(([id,label])=>`<button class="tab ${tab===id?'active':''}" role="tab" aria-selected="${tab===id}" data-action="tab" data-tab="${id}">${label}${id==='animations'?`<span class="count">${readyCount()}</span>`:''}</button>`).join('');
    $('#tabs').setAttribute('role','tablist');
    $('#modal-content').innerHTML=tab==='pixels'?'<section class="pixels"><h3>Пиксели</h3><p style="margin-top:16px">Пиксели позволяют отслеживать действия читателей. Эта область остаётся прежней во всех трёх концептах.</p><label>Пиксель просмотра статьи<input disabled placeholder="Не настроен"></label></section>':tab==='animations'?review():`<div class="columns"><div class="form-side">${variant==='cards'||variant==='inspector'?imageSection()+titles():titles()+imageSection()}${lower()}</div>${variant==='inspector'&&!showAllPreviews?inspector():previews()}</div>`;
    updateSaveState();
    $('#upload')?.addEventListener('change',e=>addFiles(e.target.files));
    const drop=$('.upload');if(drop){drop.addEventListener('dragover',e=>e.preventDefault());drop.addEventListener('drop',e=>{e.preventDefault();addFiles(e.dataTransfer.files);});}
  };
  const play=x=>{
    if(!x||x.ready!=='ready')return;
    document.querySelectorAll('video').forEach(v=>v.pause());
    if(variant==='cards'||showAllPreviews){
      const p=$('#player');p.src=x.video;p.poster=x.image;$('#video-title').textContent=x.name;$('#video-caption').textContent=x.live?'Живая версия включена в объявлениях':'В объявлениях выбрано статичное изображение';$('#video-error').hidden=true;$('#video-dialog').showModal();p.play().catch(()=>toast('Нажмите ▶ в плеере, чтобы начать просмотр.'));
    }else{
      selected=x.id;render();
      const surface=$('.inspector-ad .banner-media');
      surface.innerHTML=`<video class="inline-preview" id="inline-player" src="${esc(x.video)}" poster="${esc(x.image)}" aria-label="Видео: ${esc(x.name)}" controls playsinline muted preload="metadata"></video>`;
      const p=$('#inline-player');p.addEventListener('error',()=>toast('Не удалось загрузить видео. Попробуйте открыть его снова.'));p.play().catch(()=>toast('Нажмите ▶ в плеере, чтобы начать просмотр.'));
    }
  };
  const save=()=>{
    if(!usable().length){toast('Выберите хотя бы одно изображение для объявления.');return;}
    const nextSaved=clone(draft);try{localStorage.setItem(key,JSON.stringify(nextSaved));}catch{toast('Браузер не смог сохранить настройки. Выбор остаётся на этой странице.');return;}
    saved=nextSaved;
    updateSaveState();toast('Настройки сохранены в демо');
  };
  const cancel=()=>{draft=clone(saved);if(!draft.images.some(x=>x.id===selected))selected=draft.images[0].id;render();toast('Изменения отменены. Восстановлены сохранённые настройки.');};
  $('#save').addEventListener('click',save);$('#cancel').addEventListener('click',cancel);
  $('#close').addEventListener('click',()=>{if(dirty()){cancel();}else location.href='index.html';});
  $('#reset').addEventListener('click',()=>{saved=initial($('#scenario').value);draft=clone(saved);selected=draft.images[0].id;onlyStatic=false;localStorage.removeItem(key);render();toast('Демо восстановлено');});
  $('#scenario').addEventListener('change',e=>{saved=initial(e.target.value);draft=clone(saved);selected=draft.images[0].id;onlyStatic=false;showAllPreviews=false;render();toast('Загружен демонстрационный сценарий');});
  $('#video-close').addEventListener('click',()=>$('#video-dialog').close());
  $('#video-dialog').addEventListener('close',()=>$('#player').pause());
  $('#player').addEventListener('error',()=>$('#video-error').hidden=false);
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const action=b.dataset.action,x=draft.images.find(i=>i.id===b.dataset.id);
    if(action==='tab'){tab=b.dataset.tab;render();return;}
    if(action==='play'){play(x);return;}
    if(action==='select'){selected=x.id;if(variant==='cards'){play(x);}else{showAllPreviews=false;render();}return;}
    if(action==='upload'){$('#upload').click();return;}
    if(action==='video-help'){toast('Загрузка отдельного рекламного ролика остаётся в существующей модалке.');return;}
    if(action==='all-previews'){showAllPreviews=true;render();return;}
    if(action==='clear-filter'){onlyStatic=false;render();return;}
    if(action==='to-images'){tab='ads';render();return;}
    if(action==='enable-all'||action==='disable-all'){
      draft.images.forEach(i=>{if(i.ready==='ready'&&i.use&&!i.deleted)i.live=action==='enable-all';});render();toast(action==='enable-all'?'Готовые видео включены для выбранных изображений':'Оживлённые версии выключены. Видео сохранены.');return;
    }
    if(!x)return;
    if(action==='static'||action==='live'){
      if(!x.use||x.deleted||(action==='live'&&x.ready!=='ready'))return;
      x.live=action==='live';selected=x.id;render();return;
    }
    if(action==='use'){x.use=!x.use;render();return;}
    if(action==='delete'){x.deleted=!x.deleted;render();toast(x.deleted?'Изображение исключено. Нажмите ↶ на карточке, чтобы вернуть.':'Изображение восстановлено.');}
  });
  document.addEventListener('input',e=>{
    if(e.target.dataset.title!==undefined){draft.titles[Number(e.target.dataset.title)]=e.target.value;updateSaveState();}
    if(e.target.id==='description'){draft.description=e.target.value;updateSaveState();}
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='only-static'){onlyStatic=e.target.checked;render();}
    if(e.target.dataset.title!==undefined||e.target.id==='description')render();
  });
  async function addFiles(files){
    for(const file of files){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){toast('Выберите JPG, PNG или WEBP до 10 МБ.');continue;}
      const image=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file);});
      const id=`upload-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      draft.images.push({id,name:file.name,image,ready:'none',use:true,live:false});selected=id;
    }
    render();toast('Изображения добавлены. Для них доступны статичные версии.');
  }
  window.addEventListener('pagehide',()=>document.querySelectorAll('video').forEach(v=>v.pause()));
  render();
})();
