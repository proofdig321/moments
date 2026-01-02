(async function(){
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON = window.SUPABASE_ANON_KEY;
  const supabase = supabase_js.createClient(SUPABASE_URL, SUPABASE_ANON);

  const signInBtn = document.getElementById('sign-in');
  const signOutBtn = document.getElementById('sign-out');
  const authArea = document.getElementById('auth-area');
  const campaignList = document.getElementById('campaign-list');
  const statsEl = document.getElementById('stats');
  const rolesArea = document.getElementById('roles-area');
  const sponsorsArea = document.getElementById('sponsors-area');
  const newCampaignBtn = document.getElementById('new-campaign');
  const modal = document.getElementById('modal');
  const campaignForm = document.getElementById('campaign-form');
  const modalCancel = document.getElementById('modal-cancel');

  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }

  // Auth
  async function checkSession(){
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if(session){
      hide(signInBtn); show(signOutBtn);
      loadData(session.access_token);
    } else {
      show(signInBtn); hide(signOutBtn);
      campaignList.innerHTML = '<em>Please sign in to manage campaigns.</em>';
      rolesArea.innerHTML = '';
    }
  }

  signInBtn.addEventListener('click', async ()=>{
    const email = prompt('Sign in — enter your admin email (magic link)');
    if(!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if(error) return alert('Sign-in failed: '+error.message);
    alert('Magic link sent — check your email.');
  });

  signOutBtn.addEventListener('click', async ()=>{
    await supabase.auth.signOut();
    checkSession();
  });

  // fetch campaigns using server API, passing supabase access token
  async function apiFetch(path, options={}){
    const session = (await supabase.auth.getSession()).data.session;
    const headers = options.headers || {};
    if(session) headers['Authorization'] = 'Bearer '+session.access_token;
    headers['Content-Type'] = 'application/json';
    const res = await fetch(path, {...options, headers});
    if(res.status===401||res.status===403){
      alert('Unauthorized - you may not have the right role.');
      return null;
    }
    return res.json();
  }

  async function loadData(token){
    campaignList.innerHTML = 'Loading campaigns...';
    const campaignsRes = await apiFetch('/admin/campaigns');
    if(!campaignsRes) { campaignList.innerHTML = '<em>Unable to load campaigns.</em>'; return; }
    renderCampaigns(campaignsRes.campaigns || []);

    // roles
    const rolesRes = await apiFetch('/admin/roles');
    if(rolesRes) renderRoles(rolesRes.roles||[]);

    // sponsors
    const sponsorsRes = await apiFetch('/admin/sponsors');
    if(sponsorsRes) renderSponsors(sponsorsRes.sponsors||[]);

    // basic stats
    const stats = await apiFetch('/admin/analytics');
    if(stats) renderStats(stats);
  }

  function renderStats(s){
    statsEl.innerHTML = '';
    const items = [
      {k:'totalMoments',t:'Moments'},
      {k:'totalBroadcasts',t:'Broadcasts'},
      {k:'activeSubscribers',t:'Subscribers'},
      {k:'successRate',t:'Success %'}
    ];
    items.forEach(it=>{
      const v = s[it.k] ?? 0;
      const el = document.createElement('div'); el.className='stat'; el.innerHTML=`<strong>${v}</strong><div style="font-size:12px;color:#94a3b8">${it.t}</div>`;
      statsEl.appendChild(el);
    });
  }

  function renderCampaigns(list){
    campaignList.innerHTML = '';
    if(list.length===0){ campaignList.innerHTML = '<em>No campaigns</em>'; return; }
    list.forEach(c=>{
      const card = document.createElement('div'); card.className='card';
      const hr = document.createElement('div'); hr.innerHTML = `<h3>${escapeHtml(c.title)}</h3><div class="meta">${c.status} • ${new Date(c.created_at||'').toLocaleString()}</div>`;
      const p = document.createElement('div'); p.innerHTML = `<p style="white-space:pre-wrap;">${escapeHtml(c.content)}</p>`;
      const actions = document.createElement('div');
      const approveBtn = document.createElement('button'); approveBtn.textContent='Approve'; approveBtn.className='btn';
      approveBtn.addEventListener('click', ()=>approveCampaign(c.id));
      const publishBtn = document.createElement('button'); publishBtn.textContent='Publish'; publishBtn.className='btn';
      publishBtn.style.marginLeft='6px'; publishBtn.addEventListener('click', ()=>publishCampaign(c.id));
      actions.appendChild(approveBtn); actions.appendChild(publishBtn);
      card.appendChild(hr); card.appendChild(p); card.appendChild(actions);
      campaignList.appendChild(card);

      // touch swipe hint
      card.addEventListener('touchstart', handleTouchStart, false);
      card.addEventListener('touchmove', handleTouchMove, false);
    });
  }

  // simple swipe handlers to reveal actions (visual only)
  let xStart = null;
  function handleTouchStart(evt){ xStart = evt.touches[0].clientX; }
  function handleTouchMove(evt){ if(!xStart) return; const x = evt.touches[0].clientX; const dx = xStart - x; if(Math.abs(dx)>40) evt.currentTarget.style.transform = `translateX(${dx>0?-60:60}px)`; }

  function renderRoles(list){
    rolesArea.innerHTML = '';
    const table = document.createElement('div');
    list.forEach(r=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.padding='6px 0';
      row.innerHTML = `<div>${r.user_id}</div><div>${r.role}</div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn'; del.style.marginLeft='8px';
      del.addEventListener('click', ()=>deleteRole(r.id));
      row.appendChild(del);
      table.appendChild(row);
    });
    // add quick role form (superadmin only)
    const form = document.createElement('form'); form.style.marginTop='12px'; form.innerHTML = `<input name="user_id" placeholder="user_id" required style="padding:6px;margin-right:8px"><select name="role"><option>viewer</option><option>editor</option><option>admin</option><option>superadmin</option></select><button class="btn">Add/Update</button>`;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault(); const fd = new FormData(form); const body = { user_id: fd.get('user_id'), role: fd.get('role') };
      const res = await apiFetch('/admin/roles', { method:'POST', body: JSON.stringify(body) }); if(res && res.mapping){ alert('Role updated'); loadData(); }
    });
    rolesArea.appendChild(table); rolesArea.appendChild(form);
  }

  function renderSponsors(list){
    sponsorsArea.innerHTML = '';
    if(list.length===0){ sponsorsArea.innerHTML = '<em>No sponsors</em>'; return; }
    list.forEach(s=>{
      const row = document.createElement('div'); row.className='card';
      row.innerHTML = `<h3>${escapeHtml(s.display_name || s.name)}</h3><div class="meta">${s.contact_email||''}</div>`;
      const preview = document.createElement('button'); preview.className='btn'; preview.textContent='Preview';
      preview.addEventListener('click', ()=>previewSponsor(s));
      row.appendChild(preview);
      sponsorsArea.appendChild(row);
    });
  }

  function previewSponsor(sponsor){
    // Create a quick preview modal that shows a sample Moment with sponsor
    const modal = document.querySelector('.modal-content');
    modal.innerHTML = `<h3>Preview Sponsor: ${escapeHtml(sponsor.display_name||sponsor.name)}</h3><p>Brought to you by ${escapeHtml(sponsor.display_name||sponsor.name)}</p><div class="modal-actions"><button id="modal-close" class="btn">Close</button></div>`;
    show(document.getElementById('modal'));
    document.getElementById('modal-close').addEventListener('click', ()=>hide(document.getElementById('modal')));
  }

  async function deleteRole(id){ if(!confirm('Delete role?')) return; const res = await apiFetch('/admin/roles/'+id, { method:'DELETE' }); if(res && res.success) loadData(); }
  async function approveCampaign(id){ const res = await apiFetch(`/admin/campaigns/${id}/approve`, { method:'POST' }); if(res && res.campaign) { alert('Approved'); loadData(); } }
  async function publishCampaign(id){ if(!confirm('Publish campaign now?')) return; const res = await apiFetch(`/admin/campaigns/${id}/publish`, { method:'POST' }); if(res && res.success) { alert('Published'); loadData(); } }

  newCampaignBtn.addEventListener('click', ()=>{ show(modal); });
  modalCancel.addEventListener('click', ()=>{ hide(modal); });
  campaignForm.addEventListener('submit', async (e)=>{
    e.preventDefault(); const formData = new FormData(campaignForm);
    const body = {
      title: formData.get('title'),
      content: formData.get('content'),
      sponsor_id: formData.get('sponsor_id') || null,
      budget: parseFloat(formData.get('budget')||0),
      target_regions: formData.get('target_regions') ? formData.get('target_regions').split(',').map(s=>s.trim()) : [],
      target_categories: formData.get('target_categories') ? formData.get('target_categories').split(',').map(s=>s.trim()) : [],
      media_urls: formData.get('media_urls') ? formData.get('media_urls').split(',').map(s=>s.trim()) : [],
      scheduled_at: formData.get('scheduled_at') || null
    };
    const res = await apiFetch('/admin/campaigns', { method:'POST', body: JSON.stringify(body) });
    if(res && res.campaign) { alert('Created'); hide(modal); loadData(); }
  });

  function escapeHtml(s){ if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // init
  await checkSession();
  // listen for auth changes
  supabase.auth.onAuthStateChange(()=>{ checkSession(); });

})();
