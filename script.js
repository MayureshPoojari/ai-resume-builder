(function(){
  const SECTIONS = [
    {id:'contact', label:'Contact'},
    {id:'summary', label:'Summary'},
    {id:'experience', label:'Experience'},
    {id:'education', label:'Education'},
    {id:'skills', label:'Skills'}
  ];

  const PLATFORMS = [
    {value:'linkedin', label:'LinkedIn'},
    {value:'github', label:'GitHub'},
    {value:'portfolio', label:'Portfolio'},
    {value:'leetcode', label:'LeetCode'},
    {value:'hackerrank', label:'HackerRank'},
    {value:'twitter', label:'Twitter / X'},
    {value:'other', label:'Other'}
  ];
  const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map(p => [p.value, p.label]));

  const COLOR_THEMES = {
    brass:  {accent:'#A9773F', soft:'#E7D8BE', bg:'#F6EFE1'},
    blue:   {accent:'#2F5AA8', soft:'#C9D8EF', bg:'#EAF0FA'},
    green:  {accent:'#3B7A57', soft:'#CFE3D6', bg:'#EAF4EE'},
    purple: {accent:'#6E4F9E', soft:'#DCD3EC', bg:'#F2EEF8'},
    black:  {accent:'#1B2A4A', soft:'#C9CDD6', bg:'#EEF0F3'},
    red:    {accent:'#A9443A', soft:'#EAC8C3', bg:'#F8ECEA'}
  };

  const FONT_STACKS = {
    inter:      "'Inter', -apple-system, sans-serif",
    roboto:     "'Roboto', -apple-system, sans-serif",
    poppins:    "'Poppins', -apple-system, sans-serif",
    newsreader: "'Newsreader', Georgia, serif",
    georgia:    "Georgia, 'Times New Roman', serif",
    times:      "'Times New Roman', Times, serif"
  };

  let state = {
    name:'', target:'', email:'', phone:'', location:'',
    links:[],
    photo:'',
    summary:'',
    experience:[],
    education:[],
    skills:'',
    template:'classic',
    colorTheme:'brass',
    font:'default'
  };

  let saveTimer = null;

  function uid(){ return Math.random().toString(36).slice(2,10); }

  function newExperience(){
    return { id:uid(), company:'', role:'', location:'', start:'', end:'', current:false, bullets:'' };
  }
  function newEducation(){
    return { id:uid(), school:'', degree:'', location:'', start:'', end:'', details:'' };
  }
  function newLink(){
    return { id:uid(), platform:'linkedin', label:'', url:'' };
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function toHref(url){
    const u = (url || '').trim();
    if(!u) return '';
    return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u;
  }

  const STORAGE_KEY = 'resume-builder-data';
  const API_KEY_STORAGE = 'resume-builder-api-key';

  function debounceSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }catch(e){ console.error('Save failed', e); }
    }, 400);
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        state = Object.assign(state, parsed);
      }
    }catch(e){
      /* no saved data yet, or storage unavailable */
    }
    if(state.link && (!state.links || !state.links.length)){
      state.links = [{ id:uid(), platform:'portfolio', label:'', url:state.link }];
    }
    delete state.link;
    if(!Array.isArray(state.links)) state.links = [];
    if(!state.colorTheme || !COLOR_THEMES[state.colorTheme]) state.colorTheme = 'brass';
    if(!state.font) state.font = 'default';
    if(typeof state.photo !== 'string') state.photo = '';
  }

  function getApiKey(){
    try{ return localStorage.getItem(API_KEY_STORAGE) || ''; }catch(e){ return ''; }
  }
  function setApiKey(key){
    try{ localStorage.setItem(API_KEY_STORAGE, key); }catch(e){}
  }
  function clearApiKey(){
    try{ localStorage.removeItem(API_KEY_STORAGE); }catch(e){}
  }

  // ---------- bind simple fields ----------
  function bindSimple(id, key){
    const el = document.getElementById(id);
    el.value = state[key] || '';
    el.addEventListener('input', () => {
      state[key] = el.value;
      debounceSave();
      renderPreview();
      renderSpine();
    });
  }

  // ---------- experience ----------
  function renderExperienceList(){
    const wrap = document.getElementById('experienceList');
    wrap.innerHTML = '';
    state.experience.forEach((exp) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <div class="entry-card-head">
          <span class="eyebrow">Role</span>
          <button class="icon-btn" data-remove-exp="${exp.id}" aria-label="Remove this role">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
        <div class="grid2">
          <div class="field"><label>Company</label><input type="text" data-exp="${exp.id}" data-field="company" value="${escapeHtml(exp.company)}" placeholder="Enter company name"></div>
          <div class="field"><label>Title</label><input type="text" data-exp="${exp.id}" data-field="role" value="${escapeHtml(exp.role)}" placeholder="Enter job title"></div>
        </div>
        <div class="field"><label>Location</label><input type="text" data-exp="${exp.id}" data-field="location" value="${escapeHtml(exp.location)}" placeholder="Enter work location"></div>
        <div class="grid2">
          <div class="field"><label>Start</label><input type="text" data-exp="${exp.id}" data-field="start" value="${escapeHtml(exp.start)}" placeholder="Enter start date (e.g., Jan 2022)"></div>
          <div class="field"><label>End</label><input type="text" data-exp="${exp.id}" data-field="end" value="${escapeHtml(exp.end)}" placeholder="Enter end date (e.g., Mar 2024)" ${exp.current ? 'disabled' : ''}></div>
        </div>
        <div class="row-inline">
          <label><input type="checkbox" data-exp="${exp.id}" data-field="current" ${exp.current ? 'checked' : ''}> Currently working here</label>
        </div>
        <div class="field" style="margin-top:10px;">
          <label>Highlights, one per line</label>
          <textarea data-exp="${exp.id}" data-field="bullets" placeholder="Add your achievements or responsibilities, one per line">${escapeHtml(exp.bullets)}</textarea>
        </div>
        <div class="ai-row">
          <span class="ai-status" id="expStatus-${exp.id}"></span>
          <button class="btn ai" data-enhance-exp="${exp.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>
            Strengthen bullets with AI
          </button>
        </div>
      `;
      wrap.appendChild(card);
    });

    wrap.querySelectorAll('[data-exp]').forEach(el => {
      const id = el.getAttribute('data-exp');
      const field = el.getAttribute('data-field');
      el.addEventListener('input', () => {
        const entry = state.experience.find(x => x.id === id);
        if(!entry) return;
        if(field === 'current'){
          entry.current = el.checked;
          const endInput = wrap.querySelector(`[data-exp="${id}"][data-field="end"]`);
          if(endInput){ endInput.disabled = el.checked; if(el.checked){ endInput.value=''; entry.end=''; } }
        } else {
          entry[field] = el.value;
        }
        debounceSave();
        renderPreview();
        renderSpine();
      });
    });

    wrap.querySelectorAll('[data-remove-exp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-exp');
        state.experience = state.experience.filter(x => x.id !== id);
        renderExperienceList();
        debounceSave();
        renderPreview();
        renderSpine();
      });
    });

    wrap.querySelectorAll('[data-enhance-exp]').forEach(btn => {
      btn.addEventListener('click', () => enhanceExperience(btn.getAttribute('data-enhance-exp')));
    });
  }

  // ---------- education ----------
  function renderEducationList(){
    const wrap = document.getElementById('educationList');
    wrap.innerHTML = '';
    state.education.forEach((ed) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <div class="entry-card-head">
          <span class="eyebrow">School</span>
          <button class="icon-btn" data-remove-edu="${ed.id}" aria-label="Remove this school">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
        <div class="grid2">
          <div class="field"><label>School</label><input type="text" data-edu="${ed.id}" data-field="school" value="${escapeHtml(ed.school)}" placeholder="Enter school name"></div>
          <div class="field"><label>Degree</label><input type="text" data-edu="${ed.id}" data-field="degree" value="${escapeHtml(ed.degree)}" placeholder="Enter degree or field of study"></div>
        </div>
        <div class="grid2">
          <div class="field"><label>Location</label><input type="text" data-edu="${ed.id}" data-field="location" value="${escapeHtml(ed.location)}" placeholder="Enter school location"></div>
          <div class="field"><label>Graduated</label><input type="text" data-edu="${ed.id}" data-field="end" value="${escapeHtml(ed.end)}" placeholder="Enter graduation year"></div>
        </div>
        <div class="field"><label>Notes (optional)</label><input type="text" data-edu="${ed.id}" data-field="details" value="${escapeHtml(ed.details)}" placeholder="Add any relevant notes"></div>
      `;
      wrap.appendChild(card);
    });

    wrap.querySelectorAll('[data-edu]').forEach(el => {
      const id = el.getAttribute('data-edu');
      const field = el.getAttribute('data-field');
      el.addEventListener('input', () => {
        const entry = state.education.find(x => x.id === id);
        if(!entry) return;
        entry[field] = el.value;
        debounceSave();
        renderPreview();
        renderSpine();
      });
    });

    wrap.querySelectorAll('[data-remove-edu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-edu');
        state.education = state.education.filter(x => x.id !== id);
        renderEducationList();
        debounceSave();
        renderPreview();
        renderSpine();
      });
    });
  }

  // ---------- social links ----------
  function renderLinksList(){
    const wrap = document.getElementById('linksList');
    wrap.innerHTML = '';
    state.links.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'link-row';
      const isOther = l.platform === 'other';
      row.innerHTML = `
        <select data-link="${l.id}" data-field="platform" aria-label="Link type">
          ${PLATFORMS.map(p => `<option value="${p.value}" ${l.platform === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
        </select>
        ${isOther ? `<input type="text" data-link="${l.id}" data-field="label" value="${escapeHtml(l.label)}" placeholder="Label">` : ''}
        <input type="url" data-link="${l.id}" data-field="url" value="${escapeHtml(l.url)}" placeholder="Enter ${isOther ? 'the URL' : PLATFORM_LABEL[l.platform] + ' URL'}">
        <button class="icon-btn" data-remove-link="${l.id}" aria-label="Remove this link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      `;
      wrap.appendChild(row);
    });

    wrap.querySelectorAll('select[data-link]').forEach(sel => {
      sel.addEventListener('change', () => {
        const id = sel.getAttribute('data-link');
        const entry = state.links.find(x => x.id === id);
        if(!entry) return;
        entry.platform = sel.value;
        renderLinksList();
        debounceSave();
        renderPreview();
      });
    });

    wrap.querySelectorAll('input[data-link]').forEach(el => {
      const id = el.getAttribute('data-link');
      const field = el.getAttribute('data-field');
      el.addEventListener('input', () => {
        const entry = state.links.find(x => x.id === id);
        if(!entry) return;
        entry[field] = el.value;
        debounceSave();
        renderPreview();
      });
    });

    wrap.querySelectorAll('[data-remove-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-link');
        state.links = state.links.filter(x => x.id !== id);
        renderLinksList();
        debounceSave();
        renderPreview();
        renderSpine();
      });
    });
  }

  // ---------- profile photo ----------
  function resizeImageFile(file, maxDim, quality){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if(width > height){
            if(width > maxDim){ height = Math.round(height * maxDim / width); width = maxDim; }
          } else {
            if(height > maxDim){ width = Math.round(width * maxDim / height); height = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Could not read that image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Could not read that file'));
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoPreview(){
    const preview = document.getElementById('photoPreview');
    const removeBtn = document.getElementById('removePhotoBtn');
    if(state.photo){
      preview.style.backgroundImage = `url("${state.photo}")`;
      removeBtn.hidden = false;
    } else {
      preview.style.backgroundImage = '';
      removeBtn.hidden = true;
    }
  }

  async function handlePhotoChange(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){
      alert('Please choose an image file.');
      e.target.value = '';
      return;
    }
    try{
      state.photo = await resizeImageFile(file, 360, 0.85);
      renderPhotoPreview();
      debounceSave();
      renderPreview();
    }catch(err){
      console.error('Photo processing failed', err);
      alert('Could not process that image. Try a different file.');
    }
    e.target.value = '';
  }

  function removePhoto(){
    state.photo = '';
    renderPhotoPreview();
    debounceSave();
    renderPreview();
  }

  // ---------- preview ----------
  function dateRange(start, end, current){
    const e = current ? 'Present' : end;
    if(!start && !e) return '';
    if(start && !e) return start;
    if(!start && e) return e;
    return `${start} – ${e}`;
  }

  const TEMPLATES = ['classic', 'modern', 'minimal', 'sidebar'];

  function renderPreview(){
    const paper = document.getElementById('paper');
    const tpl = TEMPLATES.includes(state.template) ? state.template : 'classic';
    paper.className = 'paper tpl-' + tpl;
    applyColorTheme(paper);
    applyFont(paper);

    const skillsArr = (state.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const stacked = tpl === 'sidebar';

    const nameHtml = `<h1 class="r-name">${escapeHtml(state.name) || 'Your name'}</h1>`;
    const roleHtml = state.target ? `<p class="r-role">${escapeHtml(state.target)}</p>` : '';
    const classicHeaderHtml = state.photo
      ? `<div class="r-header-flex"><img class="r-photo-circle-sm" src="${state.photo}" alt=""><div class="r-header-text">${nameHtml}${roleHtml}</div></div>`
      : `${nameHtml}${roleHtml}`;

    const contactBits = [state.email, state.phone, state.location].filter(Boolean).map(escapeHtml);
    const linkBits = (state.links || [])
      .filter(l => l.url && l.url.trim())
      .map(l => {
        const label = l.platform === 'other' ? (l.label.trim() || 'Link') : PLATFORM_LABEL[l.platform];
        return `<a href="${escapeHtml(toHref(l.url))}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
      });
    const allContactBits = contactBits.concat(linkBits);
    let contactHtml = '';
    if(allContactBits.length){
      contactHtml = stacked
        ? `<div class="r-contact">${allContactBits.map(b => `<div>${b}</div>`).join('')}</div>`
        : `<div class="r-contact">${allContactBits.join('<span style="color:var(--line)">&nbsp;</span>')}</div>`;
    }

    let summaryHtml = '';
    if(state.summary){
      summaryHtml = `<div class="r-section"><h2 class="r-h">Summary</h2><p class="r-summary">${escapeHtml(state.summary)}</p></div>`;
    }

    let experienceHtml = '';
    if(state.experience.length){
      const rows = state.experience.map(exp => {
        if(!exp.company && !exp.role && !exp.bullets) return '';
        const bullets = (exp.bullets || '').split('\n').map(b => b.trim()).filter(Boolean);
        return `<div class="r-entry">
          <div class="r-entry-top">
            <span class="r-entry-title">${escapeHtml(exp.role) || 'Role'}${exp.company ? ', ' + escapeHtml(exp.company) : ''}</span>
            <span class="r-entry-dates">${escapeHtml(dateRange(exp.start, exp.end, exp.current))}</span>
          </div>
          ${exp.location ? `<div class="r-entry-sub">${escapeHtml(exp.location)}</div>` : ''}
          ${bullets.length ? `<ul class="r-bullets">${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
        </div>`;
      }).join('');
      if(rows) experienceHtml = `<div class="r-section"><h2 class="r-h">Experience</h2>${rows}</div>`;
    }

    let educationHtml = '';
    if(state.education.length){
      const rows = state.education.map(ed => {
        if(!ed.school && !ed.degree) return '';
        return `<div class="r-entry">
          <div class="r-entry-top">
            <span class="r-entry-title">${escapeHtml(ed.degree) || 'Degree'}${ed.school ? ', ' + escapeHtml(ed.school) : ''}</span>
            <span class="r-entry-dates">${escapeHtml(ed.end)}</span>
          </div>
          ${ed.details ? `<div class="r-entry-sub">${escapeHtml(ed.details)}</div>` : ''}
        </div>`;
      }).join('');
      if(rows) educationHtml = `<div class="r-section"><h2 class="r-h">Education</h2>${rows}</div>`;
    }

    let skillsHtml = '';
    if(skillsArr.length){
      skillsHtml = stacked
        ? `<div class="r-section"><h2 class="r-h">Skills</h2><div class="r-skills-stack">${skillsArr.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div></div>`
        : `<div class="r-section"><h2 class="r-h">Skills</h2><div class="r-skills">${skillsArr.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div></div>`;
    }

    const isEmpty = !state.name && !state.summary && !state.experience.length && !state.education.length && !skillsArr.length;
    const emptyHtml = isEmpty ? `<p class="r-empty">Fill in the form on the left — your resume takes shape here as you type.</p>` : '';

    const sidebarPhotoHtml = state.photo
      ? `<div class="r-sidebar-photo"><img src="${state.photo}" alt=""></div>`
      : '';
    const modernPhotoHtml = state.photo
      ? `<div class="r-photo-wrap"><img class="r-photo-circle" src="${state.photo}" alt=""></div>`
      : '';

    if(tpl === 'sidebar'){
      paper.innerHTML = `<div class="r-sidebar-layout">
        <aside class="r-sidebar">
          ${sidebarPhotoHtml}${nameHtml}${roleHtml}${contactHtml}${skillsHtml}
        </aside>
        <div class="r-main">${summaryHtml}${experienceHtml}${educationHtml}${emptyHtml}</div>
      </div>`;
    } else if(tpl === 'modern'){
      paper.innerHTML = modernPhotoHtml + nameHtml + roleHtml + contactHtml + summaryHtml + experienceHtml + educationHtml + skillsHtml + emptyHtml;
    } else {
      paper.innerHTML = classicHeaderHtml + contactHtml + summaryHtml + experienceHtml + educationHtml + skillsHtml + emptyHtml;
    }
  }

  // ---------- spine / progress ----------
  function sectionDone(id){
    if(id === 'contact') return !!(state.name && state.email);
    if(id === 'summary') return !!state.summary;
    if(id === 'experience') return state.experience.some(e => e.company && e.role);
    if(id === 'education') return state.education.some(e => e.school);
    if(id === 'skills') return !!(state.skills && state.skills.trim());
    return false;
  }

  function renderSpine(){
    const track = document.getElementById('spineTrack');
    const fill = document.getElementById('spineFill');
    const doneCount = SECTIONS.filter(s => sectionDone(s.id)).length;
    const pct = Math.round((doneCount / SECTIONS.length) * 100);
    fill.style.height = pct + '%';
    document.getElementById('completenessLabel').textContent = pct + '% complete';

    track.querySelectorAll('.spine-node').forEach(n => n.remove());
    SECTIONS.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = 'spine-node' + (sectionDone(s.id) ? ' done' : '');
      btn.setAttribute('aria-label', s.label + (sectionDone(s.id) ? ' (complete)' : ' (incomplete)'));
      btn.innerHTML = `<span class="spine-label">${s.label}</span>`;
      btn.addEventListener('click', () => {
        const target = document.getElementById('sec-' + s.id);
        if(target) target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: no-preference)').matches ? 'smooth' : 'auto', block:'start'});
      });
      track.appendChild(btn);
    });
  }

  // ---------- AI ----------
  async function callClaude(system, prompt){
    const key = getApiKey();
    if(!key){
      const err = new Error('No API key');
      err.code = 'NO_KEY';
      throw err;
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:1000,
        system: system,
        messages:[{role:'user', content:prompt}]
      })
    });
    if(!res.ok){
      const err = new Error('Request failed');
      err.code = res.status === 401 ? 'BAD_KEY' : 'REQUEST_FAILED';
      throw err;
    }
    const data = await res.json();
    return (data.content || []).map(b => b.text || '').join('\n').trim();
  }

  function stripFences(s){
    return s.replace(/^```(json)?/i, '').replace(/```$/,'').trim();
  }

  async function enhanceSummary(){
    const btn = document.getElementById('summaryAiBtn');
    const status = document.getElementById('summaryStatus');
    const el = document.getElementById('f-summary');
    const current = el.value.trim();
    if(!state.name && !current && !state.target){
      status.textContent = 'Add a name, target role, or draft first';
      status.classList.add('error');
      return;
    }
    btn.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Sharpening…';
    try{
      const system = 'You rewrite resume summaries. Return ONLY the improved summary text, 2 to 3 sentences, no preamble, no quotes, no markdown.';
      const prompt = `Target role: ${state.target || 'not specified'}\nSkills: ${state.skills || 'not specified'}\nCurrent draft: ${current || 'none, write from scratch using the role and skills'}\n\nRewrite this into a punchy, specific, achievement-oriented professional summary. Avoid generic filler like "hardworking team player".`;
      const result = await callClaude(system, prompt);
      el.value = stripFences(result);
      state.summary = el.value;
      debounceSave();
      renderPreview();
      renderSpine();
      status.textContent = 'Updated';
      setTimeout(() => { status.textContent=''; }, 2000);
    }catch(e){
      status.classList.add('error');
      status.textContent = e.code === 'NO_KEY' ? 'Add an API key in AI settings' :
                            e.code === 'BAD_KEY' ? 'API key was rejected — check AI settings' :
                            "Couldn't reach AI — try again";
    }finally{
      btn.disabled = false;
    }
  }

  async function enhanceExperience(id){
    const entry = state.experience.find(x => x.id === id);
    if(!entry) return;
    const btn = document.querySelector(`[data-enhance-exp="${id}"]`);
    const status = document.getElementById('expStatus-' + id);
    const textarea = document.querySelector(`[data-exp="${id}"][data-field="bullets"]`);
    const current = (entry.bullets || '').trim();
    if(!entry.role && !entry.company && !current){
      status.textContent = 'Add a title or company first';
      status.classList.add('error');
      return;
    }
    btn.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Strengthening…';
    try{
      const system = 'You rewrite resume bullet points. Return ONLY a JSON array of strings, no markdown fences, no explanation. 3 to 5 bullets, each starting with a strong past-tense action verb, specific and quantified where plausible, under 20 words each.';
      const prompt = `Role: ${entry.role || 'not specified'}\nCompany: ${entry.company || 'not specified'}\nCurrent bullets:\n${current || 'none, invent plausible, modest, realistic bullets based on the role title'}\n\nRewrite/expand these into strong resume bullets.`;
      const result = await callClaude(system, prompt);
      let bullets;
      try{
        bullets = JSON.parse(stripFences(result));
      }catch(_){
        bullets = stripFences(result).split('\n').map(s => s.replace(/^[-*]\s*/,'').trim()).filter(Boolean);
      }
      entry.bullets = bullets.join('\n');
      textarea.value = entry.bullets;
      debounceSave();
      renderPreview();
      renderSpine();
      status.textContent = 'Updated';
      setTimeout(() => { status.textContent=''; }, 2000);
    }catch(e){
      status.classList.add('error');
      status.textContent = e.code === 'NO_KEY' ? 'Add an API key in AI settings' :
                            e.code === 'BAD_KEY' ? 'API key was rejected — check AI settings' :
                            "Couldn't reach AI — try again";
    }finally{
      btn.disabled = false;
    }
  }

  // ---------- docx export ----------
  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function dataUrlToUint8Array(dataUrl){
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i++){ bytes[i] = binary.charCodeAt(i); }
    return bytes;
  }

  async function exportDocx(){
    if(!window.docx){
      alert("The DOCX export library didn't load — check your connection and try again.");
      return;
    }
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = window.docx;
    const theme = COLOR_THEMES[state.colorTheme] || COLOR_THEMES.brass;
    const accentHex = theme.accent.replace('#', '');
    const mutedHex = '5B6472';

    const children = [];

    if(state.photo){
      try{
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing:{ after:160 },
          children:[ new ImageRun({ data: dataUrlToUint8Array(state.photo), transformation:{ width:88, height:88 } }) ]
        }));
      }catch(e){ /* skip the photo if it can't be embedded */ }
    }

    children.push(new Paragraph({
      children:[ new TextRun({ text: state.name || 'Your name', bold:true, size:44 }) ]
    }));

    if(state.target){
      children.push(new Paragraph({
        spacing:{ after:80 },
        children:[ new TextRun({ text: state.target.toUpperCase(), size:20, color: accentHex }) ]
      }));
    }

    const contactBits = [state.email, state.phone, state.location].filter(Boolean);
    const linkBits = (state.links || [])
      .filter(l => l.url && l.url.trim())
      .map(l => {
        const label = l.platform === 'other' ? (l.label.trim() || 'Link') : PLATFORM_LABEL[l.platform];
        return `${label}: ${toHref(l.url)}`;
      });
    const allContact = contactBits.concat(linkBits);
    if(allContact.length){
      children.push(new Paragraph({
        spacing:{ after:220 },
        children:[ new TextRun({ text: allContact.join('   |   '), size:18, color: mutedHex }) ]
      }));
    }

    function sectionHeading(text){
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing:{ before:220, after:110 },
        children:[ new TextRun({ text: text.toUpperCase(), bold:true, size:20, color: accentHex }) ]
      });
    }

    if(state.summary){
      children.push(sectionHeading('Summary'));
      children.push(new Paragraph({ spacing:{ after:120 }, children:[ new TextRun({ text: state.summary, size:22 }) ] }));
    }

    const expEntries = state.experience.filter(e => e.company || e.role || e.bullets);
    if(expEntries.length){
      children.push(sectionHeading('Experience'));
      expEntries.forEach(exp => {
        const title = `${exp.role || 'Role'}${exp.company ? ', ' + exp.company : ''}`;
        const dates = dateRange(exp.start, exp.end, exp.current);
        children.push(new Paragraph({
          children:[
            new TextRun({ text: title, bold:true, size:22 }),
            new TextRun({ text: dates ? '     ' + dates : '', size:18, color: mutedHex })
          ]
        }));
        if(exp.location){
          children.push(new Paragraph({
            children:[ new TextRun({ text: exp.location, italics:true, size:20, color: accentHex }) ]
          }));
        }
        (exp.bullets || '').split('\n').map(b => b.trim()).filter(Boolean).forEach(b => {
          children.push(new Paragraph({ text:b, bullet:{ level:0 }, spacing:{ after:40 } }));
        });
        children.push(new Paragraph({ text:'', spacing:{ after:80 } }));
      });
    }

    const eduEntries = state.education.filter(ed => ed.school || ed.degree);
    if(eduEntries.length){
      children.push(sectionHeading('Education'));
      eduEntries.forEach(ed => {
        const title = `${ed.degree || 'Degree'}${ed.school ? ', ' + ed.school : ''}`;
        children.push(new Paragraph({
          children:[
            new TextRun({ text: title, bold:true, size:22 }),
            new TextRun({ text: ed.end ? '     ' + ed.end : '', size:18, color: mutedHex })
          ]
        }));
        if(ed.details){
          children.push(new Paragraph({
            spacing:{ after:100 },
            children:[ new TextRun({ text: ed.details, size:20, color: mutedHex }) ]
          }));
        }
      });
    }

    const skillsArr = (state.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    if(skillsArr.length){
      children.push(sectionHeading('Skills'));
      children.push(new Paragraph({ children:[ new TextRun({ text: skillsArr.join('   ·   '), size:22 }) ] }));
    }

    const doc = new Document({ sections:[{ properties:{}, children }] });
    const blob = await Packer.toBlob(doc);
    const filename = (state.name ? state.name.trim().replace(/\s+/g, '-') : 'resume') + '.docx';
    downloadBlob(blob, filename);
  }

  // ---------- color theme ----------
  function applyColorTheme(paper){
    const theme = COLOR_THEMES[state.colorTheme] || COLOR_THEMES.brass;
    paper.style.setProperty('--r-accent', theme.accent);
    paper.style.setProperty('--r-accent-soft', theme.soft);
    paper.style.setProperty('--r-accent-bg', theme.bg);
  }
  function updateColorSwatchActive(){
    document.querySelectorAll('#colorSwatches .color-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === state.colorTheme);
    });
  }
  function setupColorSwatches(){
    document.querySelectorAll('#colorSwatches .color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        state.colorTheme = btn.getAttribute('data-theme');
        updateColorSwatchActive();
        debounceSave();
        renderPreview();
      });
    });
    updateColorSwatchActive();
  }

  // ---------- font selector ----------
  function applyFont(paper){
    const stack = FONT_STACKS[state.font];
    if(state.font && state.font !== 'default' && stack){
      paper.classList.add('font-override');
      paper.style.setProperty('--r-font', stack);
    } else {
      paper.classList.remove('font-override');
      paper.style.removeProperty('--r-font');
    }
  }
  function setupFontSelect(){
    const sel = document.getElementById('fontSelect');
    sel.value = state.font || 'default';
    sel.addEventListener('change', () => {
      state.font = sel.value;
      debounceSave();
      renderPreview();
    });
  }

  // ---------- template picker ----------
  function updateTemplatePickerActive(){
    document.querySelectorAll('#templatePicker .tpl-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tpl') === state.template);
    });
  }
  function setupTemplatePicker(){
    document.querySelectorAll('#templatePicker .tpl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.template = btn.getAttribute('data-tpl');
        updateTemplatePickerActive();
        debounceSave();
        renderPreview();
      });
    });
    updateTemplatePickerActive();
  }

  // ---------- ATS score checker ----------
  function computeATSScore(){
    const skillsArr = (state.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const experienceEntries = (state.experience || []).filter(e => e.company && e.role);
    const educationEntries = (state.education || []).filter(e => e.school || e.degree);
    const suggestions = [];
    const breakdown = [];

    // Contact information — 15 pts
    (function(){
      const max = 15;
      const fields = [state.name, state.email, state.phone, state.location];
      const present = fields.filter(f => f && f.trim()).length;
      const earned = Math.round(max * (present / fields.length));
      breakdown.push({ label:'Contact information', earned, max });
      if(!state.phone || !state.phone.trim()) suggestions.push('Missing phone number');
      if(!state.email || !state.email.trim()) suggestions.push('Missing email address');
      if(!state.location || !state.location.trim()) suggestions.push('Missing location');
    })();

    // Professional summary — 10 pts
    (function(){
      const max = 10;
      const summary = (state.summary || '').trim();
      let earned = 0;
      if(summary.length >= 40) earned = max;
      else if(summary.length > 0) earned = Math.round(max * 0.5);
      breakdown.push({ label:'Professional summary', earned, max });
      if(!summary) suggestions.push('Missing summary section');
      else if(summary.length < 40) suggestions.push('Summary is too short — aim for 2-3 sentences');
    })();

    // Education — 10 pts
    (function(){
      const max = 10;
      const complete = educationEntries.filter(e => e.school && e.degree);
      let earned = 0;
      if(complete.length) earned = max;
      else if(educationEntries.length) earned = Math.round(max * 0.5);
      breakdown.push({ label:'Education', earned, max });
      if(!educationEntries.length) suggestions.push('Education section is incomplete');
      else if(!complete.length) suggestions.push('Add a degree name to your education entry');
    })();

    // Experience — 20 pts
    (function(){
      const max = 20;
      let earned = 0;
      if(experienceEntries.length){
        earned += Math.round(max * 0.6);
        const withDetail = experienceEntries.filter(e => e.bullets && e.bullets.trim().length >= 20);
        if(withDetail.length) earned += Math.round(max * 0.4);
      }
      breakdown.push({ label:'Experience', earned, max });
      if(!experienceEntries.length) suggestions.push('Experience section is incomplete');
      else if(!experienceEntries.some(e => e.bullets && e.bullets.trim().length >= 20)) suggestions.push('Add detail bullets to your experience entries');
    })();

    // Skills — 15 pts
    (function(){
      const max = 15;
      let earned = 0;
      if(skillsArr.length >= 8) earned = max;
      else if(skillsArr.length >= 5) earned = Math.round(max * 0.67);
      else if(skillsArr.length >= 1) earned = Math.round(max * 0.33);
      breakdown.push({ label:'Skills', earned, max });
      if(skillsArr.length === 0) suggestions.push('Not enough skills — none added yet');
      else if(skillsArr.length < 8) suggestions.push('Not enough skills — aim for 8 or more');
    })();

    // Projects — 10 pts (not yet a field in this builder)
    (function(){
      const max = 10;
      breakdown.push({ label:'Projects', earned:0, max });
      suggestions.push('No projects added');
    })();

    // Certifications — 10 pts (not yet a field in this builder)
    (function(){
      const max = 10;
      breakdown.push({ label:'Certifications', earned:0, max });
      suggestions.push('Missing certifications');
    })();

    // Proper section headings & structure — 10 pts
    (function(){
      const max = 10;
      const sectionsPresent = [
        !!(state.name && state.name.trim()),
        !!(state.summary && state.summary.trim()),
        experienceEntries.length > 0,
        educationEntries.length > 0,
        skillsArr.length > 0
      ].filter(Boolean).length;
      const earned = Math.round(max * (sectionsPresent / 5));
      breakdown.push({ label:'Section structure', earned, max });
      if(sectionsPresent < 5) suggestions.push('Fill in all standard sections for a cleaner ATS structure');
    })();

    const total = breakdown.reduce((sum, b) => sum + b.earned, 0);
    return { total, breakdown, suggestions };
  }

  function renderATSScore(){
    const result = computeATSScore();
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - result.total / 100);
    const fill = document.getElementById('atsCircleFill');
    fill.style.strokeDasharray = String(circumference);
    fill.style.strokeDashoffset = String(offset);
    fill.style.stroke = result.total >= 70 ? '#3B7A57' : (result.total >= 40 ? 'var(--r-accent)' : 'var(--danger)');
    document.getElementById('atsScoreNumber').textContent = String(result.total);

    const breakdownEl = document.getElementById('atsBreakdown');
    breakdownEl.innerHTML = result.breakdown.map(b => `
      <div class="ats-bar-row">
        <div class="ats-bar-top"><span>${escapeHtml(b.label)}</span><span>${b.earned}/${b.max}</span></div>
        <div class="ats-bar-track"><div class="ats-bar-fill" style="width:${Math.round((b.earned / b.max) * 100)}%"></div></div>
      </div>
    `).join('');

    const suggestionsEl = document.getElementById('atsSuggestions');
    if(result.suggestions.length){
      suggestionsEl.innerHTML = result.suggestions.map(s => `
        <div class="ats-suggestion-item"><span class="ats-suggestion-dot"></span><span>${escapeHtml(s)}</span></div>
      `).join('');
    } else {
      suggestionsEl.innerHTML = `<p class="ats-suggestions-empty">No suggestions — your resume covers all the basics well.</p>`;
    }
  }

  function openAtsModal(){
    renderATSScore();
    document.getElementById('atsModal').hidden = false;
  }
  function closeAtsModal(){
    document.getElementById('atsModal').hidden = true;
  }

  // ---------- settings modal ----------
  function refreshKeyState(){
    const has = !!getApiKey();
    document.getElementById('keyDot').classList.toggle('on', has);
    document.getElementById('keyStateText').textContent = has ? 'Key saved in this browser' : 'No key saved';
  }
  function openSettings(){
    document.getElementById('apiKeyInput').value = getApiKey();
    refreshKeyState();
    document.getElementById('settingsModal').hidden = false;
    document.getElementById('apiKeyInput').focus();
  }
  function closeSettings(){
    document.getElementById('settingsModal').hidden = true;
  }

  // ---------- init ----------
  function init(){
    loadState();
    if(!state.experience || !state.experience.length) state.experience = [newExperience()];
    if(!state.education || !state.education.length) state.education = [newEducation()];

    bindSimple('f-name', 'name');
    bindSimple('f-target', 'target');
    bindSimple('f-email', 'email');
    bindSimple('f-phone', 'phone');
    bindSimple('f-location', 'location');
    bindSimple('f-summary', 'summary');
    bindSimple('f-skills', 'skills');

    renderExperienceList();
    renderEducationList();
    renderLinksList();
    renderPhotoPreview();
    renderPreview();
    renderSpine();
    setupTemplatePicker();
    setupColorSwatches();
    setupFontSelect();

    document.getElementById('f-photo').addEventListener('change', handlePhotoChange);
    document.getElementById('removePhotoBtn').addEventListener('click', removePhoto);
    document.getElementById('exportDocxBtn').addEventListener('click', async () => {
      const btn = document.getElementById('exportDocxBtn');
      btn.disabled = true;
      try{
        await exportDocx();
      }catch(e){
        console.error('DOCX export failed', e);
        alert('Could not generate the DOCX file. Please try again.');
      }finally{
        btn.disabled = false;
      }
    });

    document.getElementById('addExperience').addEventListener('click', () => {
      state.experience.push(newExperience());
      renderExperienceList();
      debounceSave();
      renderSpine();
    });
    document.getElementById('addEducation').addEventListener('click', () => {
      state.education.push(newEducation());
      renderEducationList();
      debounceSave();
      renderSpine();
    });
    document.getElementById('addLink').addEventListener('click', () => {
      state.links.push(newLink());
      renderLinksList();
      debounceSave();
      renderPreview();
    });
    document.getElementById('summaryAiBtn').addEventListener('click', enhanceSummary);
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('settingsModal').addEventListener('click', (e) => { if(e.target.id === 'settingsModal') closeSettings(); });
    document.getElementById('atsScoreBtn').addEventListener('click', openAtsModal);
    document.getElementById('closeAtsBtn').addEventListener('click', closeAtsModal);
    document.getElementById('atsModal').addEventListener('click', (e) => { if(e.target.id === 'atsModal') closeAtsModal(); });
    document.getElementById('saveKeyBtn').addEventListener('click', () => {
      setApiKey(document.getElementById('apiKeyInput').value.trim());
      refreshKeyState();
      closeSettings();
    });
    document.getElementById('clearKeyBtn').addEventListener('click', () => {
      clearApiKey();
      document.getElementById('apiKeyInput').value = '';
      refreshKeyState();
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
      if(!confirm('Clear everything and start over? This cannot be undone.')) return;
      state = { name:'', target:'', email:'', phone:'', location:'', summary:'', links:[], photo:'', experience:[newExperience()], education:[newEducation()], skills:'', template:'classic', colorTheme:'brass', font:'default' };
      try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
      ['f-name','f-target','f-email','f-phone','f-location','f-summary','f-skills'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('fontSelect').value = 'default';
      document.getElementById('f-photo').value = '';
      renderExperienceList();
      renderEducationList();
      renderLinksList();
      renderPhotoPreview();
      renderPreview();
      renderSpine();
      updateTemplatePickerActive();
      updateColorSwatchActive();
    });
  }

  init();
})();
