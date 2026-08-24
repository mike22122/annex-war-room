// Annex War Room live patch: reliable pick entry + full Top 150 refresh.
(function(){
  function status(text,kind){
    if(typeof window.setRefreshStatus==='function') window.setRefreshStatus(text,kind||'');
  }

  // Replace the normal refresh with a master-board refresh.
  window.refreshLatestData = async function(){
    const btn=document.getElementById('refreshLatestBtn');
    try{
      if(btn) btn.disabled=true;
      status('Loading full Top 150 + latest news…','busy');
      const bust='?v='+Date.now();
      const [base,p1,p2,p3]=await Promise.all([
        fetch('war-room-data-latest.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('latest data '+r.status);return r.json()}),
        fetch('rankings-top150-1.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rankings 1 '+r.status);return r.json()}),
        fetch('rankings-top150-2.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rankings 2 '+r.status);return r.json()}),
        fetch('rankings-top150-3.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rankings 3 '+r.status);return r.json()})
      ]);
      const master=[...(p1.players||[]),...(p2.players||[]),...(p3.players||[])].sort((a,b)=>a.rank-b.rank);
      if(master.length!==150) throw new Error('Top 150 file is incomplete');

      // Replace the master list completely so stale seed rankings cannot survive.
      players.splice(0,players.length,...master);

      // Apply the normal detailed lab/news update without re-merging its small player patch list.
      const detailed={...base,players:[]};
      if(typeof window.applyUpdatePayload==='function') window.applyUpdatePayload(detailed);

      dataMeta={...dataMeta,
        updated:'2026-08-24',
        updatedLabel:'Aug. 24, 2026 — full Top 150 rebuild',
        note:'Complete Top 150 master-board replacement for 12-team half-PPR, 5-point passing TD. Market Slot is a consensus market anchor; injury and role notes are layered on separately.'
      };
      localStorage.setItem('annexWarRoomDataV1',JSON.stringify({meta:dataMeta,players,rbCore,rbBackup,wrCore,wrBreakout,qbCore,qbLate,teCore,teLate,dstData,kickerData}));
      if(typeof window.refreshFreshness==='function') window.refreshFreshness();
      if(typeof window.renderDraft==='function') window.renderDraft();
      if(typeof window.renderLiveGrid==='function') window.renderLiveGrid();
      status('Updated: Aug. 24, 2026 — full Top 150 rebuild','ok');
    }catch(err){
      console.error(err);
      status('Refresh failed: '+err.message,'err');
    }finally{
      if(btn) btn.disabled=false;
    }
  };

  // Reliable Draft/Gone capture. Reads the player name from the row instead of fragile quoted inline HTML.
  document.addEventListener('click',function(event){
    const btn=event.target.closest('button.smallbtn');
    if(!btn)return;
    const label=(btn.textContent||'').trim();
    if(label!=='Draft'&&label!=='Gone')return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const row=btn.closest('tr');
    const nameEl=row?row.querySelector('.player'):null;
    const playerName=nameEl?nameEl.textContent.trim():'';
    if(!playerName){alert('Could not identify this player.');return;}
    try{
      const mine=label==='Draft';
      if(typeof window.recordPick==='function') window.recordPick(playerName,mine,btn);
      else if(typeof window.draft==='function') window.draft(playerName,mine);
      else throw new Error('Draft function is unavailable');
    }catch(err){console.error(err);alert('Could not record pick: '+err.message);}
  },true);

  // The full rebuild uses a consensus market anchor, not a Yahoo-only feed. Keep labels honest.
  function relabel(){
    document.querySelectorAll('th').forEach(el=>{if(el.textContent.trim()==='Yahoo ADP')el.textContent='Market Slot';});
    document.querySelectorAll('.platformnote,.reason,.meta,.marketbox').forEach(el=>{
      if(el.textContent.includes('Yahoo-calibrated')) el.innerHTML=el.innerHTML.replaceAll('Yahoo-calibrated','Market-calibrated');
      if(el.textContent.includes('Yahoo edge')) el.innerHTML=el.innerHTML.replaceAll('Yahoo edge','Market edge');
    });
  }
  relabel();
  new MutationObserver(relabel).observe(document.body,{childList:true,subtree:true});
})();
