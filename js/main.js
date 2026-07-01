'use strict';

let DATA = null;
let SCHEDULES_BY_SEASON = null;
let RULES = null;

const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

async function loadJson(path){
 const response=await fetch(path,{cache:'no-store'});
 if(!response.ok)throw new Error('載入失敗：'+path);
 return response.json();
}

function getSeasonRules(season){
 if(RULES.defaultBySeason[season.id])return RULES.defaultBySeason[season.id];
 return RULES.defaultBySeason.laterSeasons||[];
}

function getCustomRules(seasonId){
 return RULES.customBySeason?.[seasonId]||'';
}

function showLoadError(error){
 const target=document.getElementById('seasonPages');
 target.innerHTML='<div class="panel notice"><h3>資料載入失敗</h3><p>請用本資料夾提供的本機伺服器啟動檔開啟網站，或把整個資料夾放到網頁伺服器上。</p><p class="meta">'+escapeHtml(error.message)+'</p></div>';
}

function initSite(){
const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
document.getElementById('seasonTabs').innerHTML=DATA.seasons.map((s,i)=>'<button class="season-tab '+(i===0?'active':'')+'" data-season="'+s.id+'">第 '+s.seasonIndex+' 賽季 · '+escapeHtml(s.tabLabel||s.title.match(/\d{4}年(?:\d+月)?/)?.[0]||'')+'</button>').join('');
function stat(label,value){return '<div class="stat"><span>'+label+'</span><b>'+value+'</b></div>'}
function buildSeason(s,i){
 const max=s.leaderboard[0]?.total||1;
 const summaries={
  1:[['世界排名','20'],['亞洲排名','1']],
  2:[['世界排名','4'],['亞洲排名','1'],['Top10榜首','糖炒栗子羊']],
  3:[['世界排名','5'],['亞洲排名','1'],['Top10榜首','loger128'],['總訂閱榜首','糖炒栗子羊']],
  4:[['世界排名','4'],['亞洲排名','1'],['Top10榜首','逍遙隱士']]
 };
 const summaryHtml=(summaries[s.seasonIndex]||[]).map(x=>'<div class="mini"><span>'+x[0]+'</span><b>'+escapeHtml(x[1])+'</b></div>').join('');
 const top10=s.leaderboard.slice(0,10).map(x=>'<div class="rank-row '+(x.rank===1?'first':'')+'"><div class="rank-no">'+(['','🥇','🥈','🥉'][x.rank]||'#'+x.rank)+'</div><div><div class="rank-name">'+escapeHtml(x.name)+'</div><div class="meta">上榜 '+x.appearances+' 場 · 單場第一 '+x.firsts+' 次 · 最高 '+fmt(x.best)+'</div><div class="bar"><i style="width:'+(x.total/max*100)+'%"></i></div></div><div class="amount">'+fmt(x.total)+' 訂</div></div>').join('');
 const rewardHtml=s.rewards.map(x=>'<div class="reward"><b>'+escapeHtml(x.goal)+'</b><span>'+escapeHtml(x.reward)+'</span><span class="status '+(x.status.includes('未')?'no':'')+'">'+escapeHtml(x.status)+'</span></div>').join('');
 const timeHtml=s.timeStats.map(x=>stat(escapeHtml(x.label),escapeHtml(x.value))).join('');
 const providedHtml=s.providedLeaderboard.map(x=>'<div class="mini"><span>#'+x.rank+' · '+escapeHtml(x.name)+'</span><b>'+fmt(x.total)+' 訂</b></div>').join('');
 const noDetails=!s.rounds.length;
 const seasonRules=getSeasonRules(s);
 const rulesHtml=seasonRules.map(x=>'<li>'+x+'</li>').join('');
 return '<section class="season '+(i===0?'active':'')+'" id="'+s.id+'">'+
 '<div class="hero"><div class="hero-card"><div class="season-kicker">SEASON '+s.seasonIndex+'</div><h2>'+escapeHtml(s.title)+'</h2><div class="record"><span>'+s.wins+'</span><small>勝</small><span>—</span><span class="loss">'+s.losses+'</span><small>負</small></div>'+
 '<div class="stats">'+stat('最終訂閱數',s.finalSubs?fmt(s.finalSubs):'—')+stat('最快下班',s.fastest||'未記錄')+stat('完整 Round',s.rounds.length||'無逐場資料')+stat('前10榜單贈訂加總',s.listedGiftTotal?fmt(s.listedGiftTotal):'—')+'</div></div>'+
 '<aside class="hero-card"><h3>賽季摘要</h3><div class="mini-list">'+summaryHtml+'</div>'+
 (s.notes.length?'<div class="notice" style="margin-top:14px">'+s.notes.map(escapeHtml).join('<br>')+'</div>':'')+'</aside></div>'+
 '<div class="season-nav"><button class="active" data-subtab="rules">下班台規則</button>'+(noDetails?'<button data-subtab="rounds">Round</button>':'<button data-subtab="ranking">贈訂排行榜</button><button data-subtab="rounds">Round</button><button data-subtab="extras">祭品／時數</button>')+'</div>'+
 '<div class="season-subpage active" data-subpage="rules"><div class="section panel"><div class="section-head"><div><h3>下班台規則</h3><p>第 '+s.seasonIndex+' 賽季適用規則。</p></div></div><ol class="rules-list">'+rulesHtml+'</ol></div></div>'+
 (noDetails?'<div class="season-subpage" data-subpage="rounds"><div class="section panel empty"><h3>此賽季沒有逐場訂閱紀錄</h3></div></div>':
 '<div class="season-subpage" data-subpage="ranking"><div class="section"><div class="section-head"><div><h3>前10榜單贈訂加總 Top 10</h3><p>依該賽季每場前 10 榜單加總。</p></div></div><div class="panel top-list">'+top10+'</div>'+
 '<div class="section panel"><div class="section-head"><div><h3>完整總榜</h3><p>搜尋本季所有曾進入單場前 10 的贈訂者。</p></div></div><div class="controls"><input class="control leader-search" placeholder="搜尋贈訂者名稱"></div><div class="table-wrap"><table class="data-table"><thead><tr><th>名次</th><th>名稱</th><th class="hide-mobile">上榜次數</th><th class="hide-mobile">單場第一</th><th>贈訂總數</th></tr></thead><tbody class="leader-body"></tbody></table></div></div></div></div>'+
 '<div class="season-subpage" data-subpage="rounds"><div class="section"><div class="section-head"><div><h3>Round 戰績</h3><p>展開卡片查看單場前 10、掉裝、最高 DPS 與得獎者。</p></div></div><div class="controls"><input class="control round-search" placeholder="搜尋 Round、名字或獎品"><select class="control round-sort"><option value="number">依 Round</option><option value="total">依贈訂總數</option></select></div><div class="round-grid"></div></div></div>')+
 ((s.rewards.length||s.timeStats.length||s.specialRolls.length||s.providedLeaderboard.length)?'<div class="season-subpage '+(noDetails?'active':'')+'" data-subpage="extras"><div class="section"><div class="section-head"><div><h3>祭品、特殊骰點與時數</h3><p>祭品、時數等相關資訊。</p></div></div><div class="cards"><article class="panel"><h3>下班台訂閱祭品</h3>'+ (rewardHtml||'<div class="empty">無資料</div>')+'</article><article class="panel"><h3>時數紀錄</h3><div class="stats">'+(timeHtml||'<div class="empty">無資料</div>')+'</div></article>'+
 (providedHtml?'<article class="panel" style="grid-column:1/-1"><h3>8 月送訂總數排行榜</h3><p class="meta">此區為8月實際訂月數榜單；非每場前 10 明細重新加總，統計口徑與贈訂排行榜分頁不同。</p><div class="mini-list">'+providedHtml+'</div></article>':'')+
 '<article class="panel" style="grid-column:1/-1"><h3>擲骰 1 或 100 特殊獎勵</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Round</th><th>ID</th><th class="num">點數</th></tr></thead><tbody>'+(s.specialRolls.map(x=>'<tr><td>Round '+x.round+'</td><td><b>'+escapeHtml(x.name)+'</b></td><td class="num">'+x.points+'</td></tr>').join('')||'<tr><td colspan="3" class="empty">無資料</td></tr>')+'</tbody></table></div></article></div></div></div>':'')+'</section>';
}
document.getElementById('seasonPages').innerHTML=DATA.seasons.map(buildSeason).join('');
(function customizeSeasonFive(){
 const page=document.getElementById('season-5');
 const season=DATA.seasons.find(s=>s.id==='season-5');
 if(!page||!season)return;
 const nav=page.querySelector('.season-nav');
 if(nav)nav.innerHTML='<button class="active" data-subtab="rules">下班台規則</button><button data-subtab="rounds">Round</button><button data-subtab="extras">祭品／時數</button>';
 page.querySelectorAll('.season-subpage').forEach(p=>p.classList.remove('active'));
 const rules=page.querySelector('[data-subpage="rules"]');
 if(rules){
   const lines=String(getCustomRules('season-5')||'').split(/\n/).map(x=>x.trim()).filter(Boolean);
   const bonusIndex=lines.findIndex(x=>x.includes('加碼規則'));
   const ruleLines=lines.filter((line,idx)=>idx>0&&(bonusIndex<0||idx<bonusIndex));
   const bonusLines=bonusIndex>=0?lines.slice(bonusIndex+1):[];
   const ruleRows=ruleLines.map(line=>`<div class="rule-row">${escapeHtml(line)}</div>`).join('');
   const bonusRows=bonusLines.map(line=>`<div class="rule-row">${escapeHtml(line)}</div>`).join('');
   rules.innerHTML='<h2>下班台規則</h2><p class="muted">第 5 賽季適用規則。</p><div class="panel"><div class="rules-list plain">'+ruleRows+'</div></div><div class="panel" style="margin-top:13px"><h3>加碼規則</h3><div class="rules-list plain">'+bonusRows+'</div></div>';
   rules.classList.add('active');
 }
 const extras=page.querySelector('[data-subpage="extras"]');
 if(extras){
   const rewardHtml=(season.rewards||[]).map(x=>`<div class="reward"><b>${escapeHtml(x.goal||'')}</b><span>${escapeHtml(x.reward||'')}</span><span class="status ${String(x.status||'').includes('未')?'no':''}">${escapeHtml(x.status||'')}</span></div>`).join('');
   extras.innerHTML=`<div class="section"><div class="section-head"><div><h3>祭品、特殊骰點與時數</h3><p>祭品、時數等相關資訊。</p></div></div><div class="cards"><article class="panel"><h3>下班台訂閱祭品</h3>${rewardHtml||'<div class="empty">無資料</div>'}</article><article class="panel"><h3>時數紀錄</h3><div class="stats"><div class="empty">無資料</div></div></article><article class="panel" style="grid-column:1/-1"><h3>擲骰 1 或 100 特殊獎勵</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Round</th><th>ID</th><th class="num">點數</th></tr></thead><tbody><tr><td colspan="3" class="empty">無資料</td></tr></tbody></table></div></article></div></div>`;
 }
})();
function activateSeason(id){document.querySelectorAll('.season-tab,.season').forEach(x=>x.classList.remove('active'));document.querySelector('[data-season="'+id+'"]').classList.add('active');document.getElementById(id).classList.add('active');window.scrollTo({top:document.querySelector('.season-tabs').offsetTop,behavior:'smooth'})}
document.querySelectorAll('.season-tab').forEach(b=>b.onclick=()=>activateSeason(b.dataset.season));
document.querySelectorAll('.season').forEach((page,index)=>{
 const s=DATA.seasons[index];
 page.querySelectorAll('[data-subtab]').forEach(b=>b.onclick=()=>{page.querySelectorAll('[data-subtab],.season-subpage').forEach(x=>x.classList.remove('active'));b.classList.add('active');page.querySelector('[data-subpage="'+b.dataset.subtab+'"]').classList.add('active')});
 if(!s.rounds.length)return;
 const leaderSearch=page.querySelector('.leader-search'), leaderBody=page.querySelector('.leader-body');
 function renderLeaders(){const q=leaderSearch.value.trim().toLowerCase();leaderBody.innerHTML=s.leaderboard.filter(x=>x.name.toLowerCase().includes(q)).map(x=>'<tr><td>#'+x.rank+'</td><td><b>'+escapeHtml(x.name)+'</b></td><td class="hide-mobile">'+x.appearances+'</td><td class="hide-mobile">'+x.firsts+'</td><td class="num"><b>'+fmt(x.total)+'</b></td></tr>').join('')||'<tr><td colspan="5" class="empty">找不到符合資料</td></tr>'} leaderSearch.oninput=renderLeaders;renderLeaders();
 const roundSearch=page.querySelector('.round-search'),roundSort=page.querySelector('.round-sort'),roundGrid=page.querySelector('.round-grid');
 function renderRounds(){const q=roundSearch.value.trim().toLowerCase();let rs=s.rounds.filter(r=>('r'+r.number+' '+r.drop+' '+r.topDps+' '+r.winner+' '+r.notes.join(' ')+' '+r.records.map(x=>x.name).join(' ')).toLowerCase().includes(q));rs.sort(roundSort.value==='total'?(a,b)=>b.total-a.total:(a,b)=>a.number-b.number);roundGrid.innerHTML=rs.map(r=>'<details class="round-card"><summary><div class="round-title"><b>Round '+r.number+'</b><span class="badge">'+fmt(r.total)+' 訂</span></div><div class="round-sub">'+[r.drop&&'掉裝：'+escapeHtml(r.drop),r.topDps&&'最高 DPS：'+escapeHtml(r.topDps)].filter(Boolean).join('<br>')+'</div></summary><table class="round-table">'+r.records.map(x=>'<tr><td>#'+x.rank+'</td><td>'+escapeHtml(x.name)+'</td><td>'+fmt(x.amount)+'</td></tr>').join('')+'</table>'+(r.winner?'<div class="note">得獎者：'+escapeHtml(r.winner)+'</div>':'')+r.notes.map(n=>'<div class="note">'+escapeHtml(n)+'</div>').join('')+'</details>').join('')||'<div class="empty">找不到符合的 Round</div>'}roundSearch.oninput=renderRounds;roundSort.onchange=renderRounds;renderRounds();
});



function secondsLabel(sec){sec=Math.max(0,Math.round(sec||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h+'小時'+String(m).padStart(2,'0')+'分'+String(s).padStart(2,'0')+'秒'}
function clockLabel(min){const total=Math.round(min)%1440,h=Math.floor(total/60),m=total%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
function renderSchedulePage(seasonId,schedule){
 const page=document.getElementById(seasonId);
 if(!page||page.querySelector('[data-subtab="schedule"]'))return;
 const nav=page.querySelector('.season-nav');
 const btn=document.createElement('button');
 btn.type='button';btn.dataset.subtab='schedule';btn.textContent='開台時間';
 nav.appendChild(btn);
 const section=document.createElement('div');
 section.className='season-subpage';section.dataset.subpage='schedule';
 const grouped={};
 schedule.dates.forEach(d=>grouped[d]=[]);
 schedule.segments.forEach(x=>(grouped[x.date]||(grouped[x.date]=[])).push(x));
 const hourHead=Array.from({length:24},(_,i)=>'<span>'+String(i).padStart(2,'0')+'</span>').join('');
 const isWorkOnly=schedule.mode==='work-only';
 const legendText=isWorkOnly?'上班時間':'開台時間';
 const desc=isWorkOnly?'黃色長條代表該 Round 的上班時段。S2 僅有上班時間紀錄，無開台時間長度紀錄。':'綠色長條代表該 Round 的開台時段。';
 const rows=schedule.dates.map(date=>{
   const monthDay=date.slice(5).replace('-','/');
   const segs=(grouped[date]||[]).sort((a,b)=>a.start-b.start).map(x=>{
     const left=x.start/1440*100,width=Math.max((x.end-x.start)/1440*100,.28);
     const roundInfo=schedule.rounds.find(r=>r.round===x.round)||{};
     const timeTitle=isWorkOnly?'上班時段':'開台時間';
     const lengthTitle=isWorkOnly?'上班時間':'開台長度';
     const finalLine=isWorkOnly?'':'<span class="timeline-tip-work">上班時間 '+secondsLabel(roundInfo.workSeconds||0)+'</span>';
     const label='Round '+x.round+'<br>'+timeTitle+' '+clockLabel(x.start)+'–'+clockLabel(x.end)+'<br>'+lengthTitle+' '+secondsLabel(roundInfo.barSeconds||((x.end-x.start)*60))+finalLine;
     return '<span class="timeline-seg '+(isWorkOnly?'work-only':'')+'" tabindex="0" data-tip="'+escapeHtml(label)+'" style="left:'+left+'%;width:'+width+'%" aria-label="'+escapeHtml(label.replace(/<[^>]+>/g,' '))+'"></span>';
   }).join('');
   return '<div class="timeline-row"><div class="timeline-date">'+monthDay+'</div><div class="timeline-track">'+segs+'</div></div>';
 }).join('');
 const tableRows=schedule.rounds.map(r=>'<tr><td>Round '+r.round+'</td><td>'+r.start+'</td><td class="num">'+secondsLabel(r.barSeconds)+'</td>'+(isWorkOnly?'':'<td class="num">'+secondsLabel(r.workSeconds)+'</td>')+'</tr>').join('');
 const tableHead=isWorkOnly?'<tr><th>Round</th><th>起始時間</th><th class="num">上班時間</th></tr>':'<tr><th>Round</th><th>開台時間</th><th class="num">開台時長</th><th class="num">上班時間</th></tr>';
 section.innerHTML='<div class="section"><div class="section-head"><div><h3>開台時間</h3><p>'+desc+'</p></div></div><div class="panel timeline-panel"><div class="timeline-legend"><span><i class="'+(isWorkOnly?'work-only':'stream')+'"></i>'+legendText+'</span></div><div class="timeline-tip">電腦版將滑鼠移到長條上可查看 Round 與時間資訊；手機版請長壓長條顯示。</div><div class="timeline-chart"><div class="timeline-head"><div class="timeline-corner">日期</div><div class="timeline-hours">'+hourHead+'</div></div>'+rows+'</div><details class="timeline-detail"><summary>查看逐 Round 原始時間</summary><div class="table-wrap"><table class="data-table"><thead>'+tableHead+'</thead><tbody>'+tableRows+'</tbody></table></div></details></div></div><div class="timeline-tooltip" id="timelineTooltip-'+seasonId+'"></div>';
 page.appendChild(section);
 btn.onclick=()=>{page.querySelectorAll('[data-subtab],.season-subpage').forEach(x=>x.classList.remove('active'));btn.classList.add('active');section.classList.add('active')};
 const tip=section.querySelector('.timeline-tooltip');
 let pressTimer=null;
 const placeTip=(target)=>{const rect=target.getBoundingClientRect();tip.innerHTML=target.dataset.tip;tip.classList.add('show');let left=rect.left+rect.width/2-tip.offsetWidth/2;let top=rect.top-tip.offsetHeight-10;if(top<8)top=rect.bottom+10;left=Math.max(8,Math.min(left,window.innerWidth-tip.offsetWidth-8));tip.style.left=left+'px';tip.style.top=top+'px'};
 const hideTip=()=>{tip.classList.remove('show')};
 section.querySelectorAll('.timeline-seg').forEach(el=>{
   el.addEventListener('mouseenter',()=>placeTip(el));
   el.addEventListener('mousemove',()=>placeTip(el));
   el.addEventListener('mouseleave',hideTip);
   el.addEventListener('focus',()=>placeTip(el));
   el.addEventListener('blur',hideTip);
   el.addEventListener('touchstart',e=>{clearTimeout(pressTimer);pressTimer=setTimeout(()=>placeTip(el),450)},{passive:true});
   el.addEventListener('touchend',()=>{clearTimeout(pressTimer);setTimeout(hideTip,1800)});
   el.addEventListener('touchcancel',()=>{clearTimeout(pressTimer);hideTip()});
 });
}
Object.entries(SCHEDULES_BY_SEASON).forEach(([seasonId,schedule])=>renderSchedulePage(seasonId,schedule));
}

Promise.all([
 loadJson('data/seasons.json'),
 loadJson('data/schedules.json'),
 loadJson('data/rules.json')
]).then(([seasonData,scheduleData,ruleData])=>{
 DATA=seasonData;
 SCHEDULES_BY_SEASON=scheduleData;
 RULES=ruleData;
 initSite();
}).catch(showLoadError);
