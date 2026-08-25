// Annex War Room live patch: reliable pick entry + full Top 150 refresh.
(function(){
  function status(text,kind){
    if(typeof window.setRefreshStatus==='function') window.setRefreshStatus(text,kind||'');
  }

  function applyLatestPlayerUpdates(master,updates){
    if(!Array.isArray(updates)) return master;
    let board=[...master];
    updates.forEach(u=>{
      let idx=board.findIndex(p=>p.name===u.name);
      if(idx>=0){
        const old=board[idx];
        const requestedRank=Number.isFinite(Number(u.rank))?Math.max(1,Math.min(150,Number(u.rank))):old.rank;
        const merged={...old,...u,rank:requestedRank};
        board.splice(idx,1);
        board.splice(Math.min(requestedRank-1,board.length),0,merged);
      }else if(Number.isFinite(Number(u.rank)) && Number(u.rank)<=150){
        const requestedRank=Math.max(1,Math.min(150,Number(u.rank)));
        board.splice(Math.min(requestedRank-1,board.length),0,{...u,rank:requestedRank});
        if(board.length>150) board.pop();
      }
    });
    board=board.slice(0,150);
    board.forEach((p,i)=>p.rank=i+1);
    return board;
  }

  // Replace the normal refresh with a master-board refresh.
  window.refreshLatestData = async function(){
    const btn=document.getElementById('refreshLatestBtn');
    try{
      if(btn) btn.disabled=true;
      status('Loading Top 150 + latest news…','busy');
      const bust='?v='+Date.now();
      const [base,p1,p2,p3]=await Promise.all([
        fetch('war-room-data-latest.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('latest data '+r.status);return r.json()}),
        fetch('rankings-top150-1.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rankings 1 '+r.status);return r.json()}),
        fetch('rankings-top150-2.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rankings 2 '+r.status);return r.json()}),
        fetch('rankings-top150-3.json'+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rankings 3 '+r.status);return r.json()})
      ]);
      let master=[...(p1.players||[]),...(p2.players||[]),...(p3.players||[])].sort((a,b)=>a.rank-b.rank);
      if(master.length!==150) throw new Error('Top 150 file is incomplete');

      // Start with the full Top 150, then layer the newest JSON player/ranking changes on top.
      master=applyLatestPlayerUpdates(master,base.players||[]);
      players.splice(0,players.length,...master);

      // Apply detailed position-lab/news updates without merging players a second time.
      const detailed={...base,players:[]};
      if(typeof window.applyUpdatePayload==='function') window.applyUpdatePayload(detailed);

      // Use the metadata from the newest JSON instead of a hard-coded date.
      dataMeta={...dataMeta,...(base.meta||{})};
      localStorage.setItem('annexWarRoomDataV1',JSON.stringify({meta:dataMeta,players,rbCore,rbBackup,wrCore,wrBreakout,qbCore,qbLate,teCore,teLate,dstData,kickerData}));
      if(typeof window.refreshFreshness==='function') window.refreshFreshness();
      if(typeof window.renderDraft==='function') window.renderDraft();
      if(typeof window.renderRB==='function') window.renderRB();
      if(typeof window.renderWR==='function') window.renderWR();
      if(typeof window.renderQB==='function') window.renderQB();
      if(typeof window.renderTE==='function') window.renderTE();
      if(typeof window.renderST==='function') window.renderST();
      if(typeof window.updateDraftIntel==='function') window.updateDraftIntel();
      if(typeof window.renderLiveGrid==='function') window.renderLiveGrid();
      if(typeof window.renderClockPanel==='function') window.renderClockPanel();
      const label=(base.meta&&base.meta.updatedLabel)?base.meta.updatedLabel:'latest data';
      status('Updated: '+label,'ok');
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
