// Minimal approval flow wiring — replace endpoints as appropriate
document.addEventListener('DOMContentLoaded', ()=>{
  const approveBtn = document.getElementById('approve');
  const requestBtn = document.getElementById('request-changes');
  const titleEl = document.getElementById('title');

  if(approveBtn){
    approveBtn.addEventListener('click', async ()=>{
      try{
        approveBtn.disabled = true;
        const resp = await fetch('/admin/campaigns/approve', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({campaign_id: titleEl.dataset.id})});
        if(!resp.ok) throw new Error('Approve failed');
        alert('Campaign approved');
      }catch(e){
        console.error(e); alert('Error approving campaign');
      }finally{approveBtn.disabled = false}
    });
  }

  if(requestBtn){
    requestBtn.addEventListener('click', ()=>{
      const note = prompt('Describe requested changes');
      if(!note) return;
      fetch('/admin/campaigns/comment', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({campaign_id: titleEl.dataset.id, note})}).then(r=>alert('Request sent'));
    });
  }
});
