
const KEY='stockpilot-ai-mvp-v1';
const ML_API_BASE=String(window.STOCKPILOT_ML_API_BASE||'http://127.0.0.1:8000').replace(/\/+$/,'');
const img={chicken:"https://www.meatsdubai.com/cdn/shop/files/FreshChickenBreast.jpg?v=1758731218",milk:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=85",tomato:"https://cdn.wikifarmer.com/images/detailed/2020/11/La-valeur-nutritive-des-tomates.jpg",lettuce:"https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=85",rice:"https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop&q=85",cheese:"https://howheavyisit.com/theme/optimized/theme/generated/how-much-does-a-cheese-block-weigh-cover-1280w.webp",eggs:"https://www.anacondaweb.com/proyectos/freggs/images/productos_img_12c.jpg",oil:"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=85"};
const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const plus=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const seed={items:[
{id:'i1',name:'Chicken',image:img.chicken,category:'Meat',unit:'kg',qty:12,min:5,cost:18,supplier:'Fresh Supplier Co.',expiry:plus(4)},
{id:'i2',name:'Milk',image:img.milk,category:'Dairy',unit:'bottle',qty:8,min:10,cost:6.5,supplier:'Dairy Best',expiry:plus(2)},
{id:'i3',name:'Tomato',image:img.tomato,category:'Vegetables',unit:'kg',qty:5,min:4,cost:7,supplier:'Green Farm',expiry:plus(7)},
{id:'i4',name:'Lettuce',image:img.lettuce,category:'Vegetables',unit:'kg',qty:0,min:3,cost:8,supplier:'Green Farm',expiry:plus(-1)},
{id:'i5',name:'Rice',image:img.rice,category:'Dry Goods',unit:'kg',qty:20,min:8,cost:4,supplier:'Food Wholesale',expiry:plus(180)},
{id:'i6',name:'Cheese',image:img.cheese,category:'Dairy',unit:'pack',qty:6,min:4,cost:12,supplier:'Dairy Best',expiry:plus(12)},
{id:'i7',name:'Eggs',image:img.eggs,category:'Dairy',unit:'tray',qty:3,min:5,cost:15,supplier:'Farm Fresh',expiry:plus(5)},
{id:'i8',name:'Cooking Oil',image:img.oil,category:'Dry Goods',unit:'bottle',qty:9,min:4,cost:10,supplier:'Food Wholesale',expiry:plus(240)}
],records:[],waste:[],staff:[{id:'s1',name:'staff_01',username:'stockpilot_staff',status:'Active'}],loginActivity:[],settings:{restaurant:'My Restaurant',expiryDays:7,currency:'RM'},demoSeedVersion:2};
seed.items.forEach(i=>{i.isDemoSample=true});
let db=loadDB(),role='owner',currentUser={id:'owner',name:'Owner Account',username:'stockpilot_owner',role:'owner'},page='dashboard',selectedItem=null,detailTab='details',inventoryFilter='all';
db.expiryOutcomes=(db.expiryOutcomes||[]).filter(outcome=>String(outcome?.outcomeStatus||'').trim().toLowerCase()!=='pending');save();
save(); // Persist catalogue migration so restored demo items remain available on next launch.
function loadDB(){
 let data;
 try{
  const stored=JSON.parse(localStorage.getItem(KEY));
  data=stored&&Array.isArray(stored.items)?stored:structuredClone(seed);
 }catch{data=structuredClone(seed)}
 // Keep the built-in demo catalogue available even if an older browser session
 // only retained user-created items. Never overwrite an existing item or its stock.
 {
  const names=new Set(data.items.map(i=>String(i.name||'').trim().toLowerCase()));
  const ids=new Set(data.items.map(i=>String(i.id||'')));
  for(const sample of seed.items){
   const sampleName=String(sample.name||'').trim().toLowerCase();
   if(!ids.has(String(sample.id))&&!names.has(sampleName)){
    data.items.push(structuredClone(sample));
    ids.add(String(sample.id)); names.add(sampleName);
   }
  }
  // V11 catalogue cleanup: keep the 8 curated demo items and remove only obsolete seeded demo samples.
  const retainedDemoIds=new Set(seed.items.map(i=>String(i.id)));
  data.items=data.items.filter(i=>{
   const id=String(i.id||'');
   const isLegacyDemo=i.isDemoSample===true||/^i(?:[1-9]|1[0-9]|20)$/.test(id);
   return !isLegacyDemo||retainedDemoIds.has(id);
  });
  data.demoSeedVersion=4;
 }
 const seededIds=new Set(seed.items.map(i=>String(i.id)));
 if(!Array.isArray(data.records))data.records=[];
 // Remove obsolete placeholder history rows from earlier demo builds.
 // Stock Adjustment records and all other inventory history are retained.
 data.records=data.records.filter(record=>String(record.type||'').trim().toLowerCase()!=='stock taking');
 if(!Array.isArray(data.waste))data.waste=[];
 if(!Array.isArray(data.staff))data.staff=structuredClone(seed.staff);
 // Keep exactly one built-in Staff demo account; remove only the old bundled demo accounts.
 data.staff=data.staff.filter(member=>!['staff.b','aisha_staff'].includes(String(member.username||'').toLowerCase())&&!['s2','s-demo-aisha'].includes(String(member.id||'')));
 // Keep the built-in demo staff entry for the account list; authentication is not used in this build.
 // Existing sample Staff A is migrated to the visible demo Staff username.
 const sampleStaffA=data.staff.find(x=>x.id==='s1'&&x.username==='staff.a');
 if(sampleStaffA){sampleStaffA.name='staff_01';sampleStaffA.username='stockpilot_staff';}
 const builtInStaff=data.staff.find(member=>String(member.username||'').trim().toLowerCase()==='stockpilot_staff');
 if(builtInStaff)builtInStaff.name='staff_01';
 if(!data.staff.some(x=>x.username==='stockpilot_staff'))data.staff.unshift({id:'s-demo',name:'staff_01',username:'stockpilot_staff',status:'Active'});
 // Remove legacy credentials from data saved by earlier sign-in-enabled versions.
 data.staff.forEach(member=>{delete member.password;delete member.passwordUpdatedAt;});
 delete data.auth;
 if(!Array.isArray(data.loginActivity))data.loginActivity=[];
 data.loginActivity=data.loginActivity.filter(event=>!(event.isDemoSample===true&&['staff.b','aisha_staff'].includes(String(event.username||'').toLowerCase())));
 if(!data.settings)data.settings=structuredClone(seed.settings);
 data.items.forEach(i=>{
  if(i.isDemoSample===undefined)i.isDemoSample=seededIds.has(String(i.id));
  if(i.trackExpiry===undefined)i.trackExpiry=!!i.expiry;
  if(i.trackWaste===undefined)i.trackWaste=false;
 });
 if(!Array.isArray(data.expiryOutcomes))data.expiryOutcomes=[];
 // Remove obsolete pending expiry-outcome records. Only explicit pending outcome rows are removed;
 // current expired stock and confirmed Observed outcomes remain intact.
 data.expiryOutcomes=data.expiryOutcomes.filter(outcome=>String(outcome?.outcomeStatus||'').trim().toLowerCase()!=='pending');
 if(!Array.isArray(data.mlFeatureSnapshots))data.mlFeatureSnapshots=[];
 if(!Array.isArray(data.mlPredictionSnapshots))data.mlPredictionSnapshots=[];
 return data;
}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money(n){return `${db.settings.currency||'RM'} ${Number(n||0).toFixed(2)}`}
function fmtDate(s){if(!s)return '—';return new Date(s+'T00:00:00').toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'})}
function fmtDateTime(ts){const d=new Date(ts);return d.toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})+' MYT'}
function now(){return new Date().toISOString()}
function actor(){return currentUser?.name||(role==='owner'?'Owner':'Staff')}
function captureMLFeatureSnapshot(item,eventType,stockAtCapture=null){
 if(!item||item.trackExpiry===false||!item.expiry)return;
 const capturedAt=now(),capturedTime=new Date(capturedAt).getTime(),capturedDate=capturedAt.slice(0,10);
 // A training feature row must represent the state BEFORE the logged inventory action.
 if(capturedDate>=item.expiry)return;
 if(!Array.isArray(db.mlFeatureSnapshots))db.mlFeatureSnapshots=[];
 const history=(db.records||[]).filter(r=>r.itemId===item.id&&r.timestamp&&new Date(r.timestamp).getTime()<capturedTime);
 const windowMs=30*86400000,weekMs=7*86400000;
 // Only explicit kitchen-usage Stock Out events count as consumption. Waste, transfer,
 // adjustment and other Stock Out reasons are deliberately excluded from usage.
 const isUsage=r=>r.type==='Stock Out'&&/^Usage(?:\s|$)/i.test(String(r.note||''));
 const qty=r=>Math.max(0,Number(r.qtyBefore||0)-Number(r.qtyAfter||0));
 const usageBetween=(from,to)=>history.filter(r=>isUsage(r)&&new Date(r.timestamp).getTime()>=from&&new Date(r.timestamp).getTime()<to).reduce((sum,r)=>sum+qty(r),0);
 const usage30=usageBetween(capturedTime-windowMs,capturedTime);
 const usage7=usageBetween(capturedTime-weekMs,capturedTime);
 const usagePrev7=usageBetween(capturedTime-2*weekMs,capturedTime-weekMs);
 const wasteQty=(db.waste||[]).filter(w=>w.itemId===item.id&&w.timestamp&&new Date(w.timestamp).getTime()<capturedTime&&new Date(w.timestamp).getTime()>=capturedTime-windowMs).reduce((sum,w)=>sum+Math.max(0,Number(w.qty)||0),0);
 const observedDays=Math.max(1,Math.min(30,Math.ceil((capturedTime-(history.length?Math.min(...history.map(r=>new Date(r.timestamp).getTime())):capturedTime))/86400000)));
 const remainingDays=Math.max(0,Math.ceil((new Date(item.expiry+'T23:59:59').getTime()-capturedTime)/86400000));
 const snap={id:'mls'+Date.now()+Math.random().toString(16).slice(2,6),itemId:item.id,itemName:item.name,expiryDate:item.expiry,snapshotDate:capturedAt,currentStock:stockAtCapture===null?Number(item.qty)||0:Math.max(0,Number(stockAtCapture)||0),avgDailyUsage:usage30/30,daysUntilExpiry:remainingDays,recentUsageTrend:usagePrev7>0?(usage7/7)/(usagePrev7/7):(usage7>0?1:0),historicalWasteRate:(usage30+wasteQty)>0?wasteQty/(usage30+wasteQty):0,category:item.category||'Other',unit:item.unit,restaurantName:db.settings.restaurant||'My Restaurant',captureEvent:eventType,featureSnapshotOnly:true,snapshotTiming:'before_inventory_event',usageObservationDays:observedDays,labelStatus:'pending_expiry_outcome',dataSource:'local_inventory_event',snapshotType:'inventory_event',isDemoSample:!!item.isDemoSample};
 db.mlFeatureSnapshots.unshift(snap);
}
function stockpilotDateInMY(timestamp){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));
 const values=Object.fromEntries(parts.map(p=>[p.type,p.value]));
 return `${values.year}-${values.month}-${values.day}`;
}
function captureMLPredictionSnapshot(item,requestFeatures,prediction,requestedAt,modelValidation,usageObservationDays=0){
 if(!item||!item.expiry)return;
 const timestamp=requestedAt||now();
 const predictionDay=stockpilotDateInMY(timestamp);
 if(predictionDay>=item.expiry||Number(requestFeatures.days_until_expiry)<=0)return;
 if(!Array.isArray(db.mlPredictionSnapshots))db.mlPredictionSnapshots=[];
 const snap={
  id:'mlp'+Date.now()+Math.random().toString(16).slice(2,7),
  predictionId:'pred'+Date.now()+Math.random().toString(16).slice(2,7),
  itemId:item.id,itemName:item.name,expiryDate:item.expiry,snapshotDate:timestamp,predictionTime:timestamp,
  currentStock:Number(requestFeatures.current_stock),
  avgDailyUsage:Number(requestFeatures.average_daily_usage),
  daysUntilExpiry:Number(requestFeatures.days_until_expiry),
  recentUsageTrend:Number(requestFeatures.recent_usage_trend),
  historicalWasteRate:Number(requestFeatures.historical_waste_rate),
  category:String(requestFeatures.item_category||item.category||'Other'),unit:item.unit,
  restaurantName:db.settings.restaurant||'My Restaurant',snapshotType:'user_visible_prediction',
  snapshotTiming:'prediction_time',featureSource:'exact_successful_model_request',
  apiRequestFeatures:{...requestFeatures},usageObservationDays:Number(usageObservationDays||0),
  modelType:prediction.model_type||'Random Forest',modelVersion:prediction.model_version||'embedded-base-model',modelValidation:modelValidation||prediction.model_validation||'unknown',
  expiryRiskProbability:Number(prediction.expiry_risk_probability),riskLevel:String(prediction.risk_level||''),
  predictedRemainingStock:Number(prediction.predicted_remaining_stock),
  modelOutputIsLabel:false,labelStatus:'pending_expiry_outcome',
  dataSource:'displayed_prediction',isDemoSample:!!item.isDemoSample
 };
 const outputValues=[snap.expiryRiskProbability,snap.predictedRemainingStock];
 if(!Number.isFinite(snap.currentStock)||!Number.isFinite(snap.avgDailyUsage)||!Number.isFinite(snap.daysUntilExpiry)||!Number.isFinite(snap.recentUsageTrend)||!Number.isFinite(snap.historicalWasteRate)||!outputValues.every(Number.isFinite))return;
 if(snap.expiryRiskProbability<0||snap.expiryRiskProbability>100||snap.predictedRemainingStock<0)return;
 db.mlPredictionSnapshots.unshift(snap);
 save();
}
function stockAtExpiryFromHistory(item){
 if(!item||!item.expiry||!Array.isArray(db.records))return null;
 const expiryEnd=new Date(`${item.expiry}T23:59:59+08:00`).getTime();
 const eligible=db.records.filter(r=>{
  if(String(r.itemId)!==String(item.id)||String(r.expiryDate||'')!==String(item.expiry)||!r.timestamp)return false;
  const time=Date.parse(r.timestamp),quantity=Number(r.qtyAfter);
  return Number.isFinite(time)&&time<=expiryEnd&&Number.isFinite(quantity)&&quantity>=0;
 }).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 return eligible.length?{quantity:Number(eligible[0].qtyAfter),lastEvent:eligible[0]}:null;
}
function recordExpiryOutcomeFromWaste(item,remainingBeforeDiscard,discardedQty,reason,notes,timestamp){
 // The expiry target is reconstructed from the last auditable stock balance on or before expiry.
 // Post-expiry movements do not rewrite what was present at the expiry cut-off.
 if(!item||!item.expiry||item.expiry>=today()||String(reason||'').trim().toLowerCase()!=='expired')return;
 if(!Array.isArray(db.expiryOutcomes))db.expiryOutcomes=[];
 const q=Math.max(0,Number(discardedQty)||0);
 if(q<=0)return;
 const existing=db.expiryOutcomes.find(o=>o.itemId===item.id&&o.expiryDate===item.expiry);
 const atExpiry=stockAtExpiryFromHistory(item);
 if(existing){
  const previous=Number(existing.observedDiscardedQty??existing.discardedQty??0)||0;
  const next=previous+q;
  if(existing.outcomeStatus==='observed'&&atExpiry){
   existing.remainingAtExpiry=atExpiry.quantity;
   existing.discardedQty=Number(existing.discardedQty||0)+q;
   existing.observedDiscardedQty=existing.discardedQty;
   existing.remainingAfterDiscard=Math.max(0,existing.remainingAtExpiry-existing.discardedQty);
   existing.lastUpdatedAt=timestamp; existing.lastUpdatedBy=actor();
   if(existing.discardedQty>existing.remainingAtExpiry){
    existing.outcomeStatus='unknown';existing.unknownReason='Recorded expired disposal exceeds the stock quantity reconstructed at expiry.';
    existing.remainingAtExpiry=null;existing.discardedQty=null;existing.remainingAfterDiscard=null;
   }
  }else{
   existing.outcomeStatus='unknown';existing.remainingAtExpiry=null;existing.discardedQty=null;existing.remainingAfterDiscard=null;
   existing.observedDiscardedQty=next;
   existing.unknownReason='No reliable stock-history row was available at the expiry cut-off.';
   existing.lastUpdatedAt=timestamp; existing.lastUpdatedBy=actor();
  }
  if(existing.outcomeStatus==='observed')maybeAutoRetrainRandomForest('confirmed_expiry_outcome_updated');
  return;
 }
 const common={
  id:'eo'+Date.now()+Math.random().toString(16).slice(2,6),itemId:item.id,itemName:item.name,
  category:item.category||'Other',restaurantName:db.settings.restaurant||'My Restaurant',unit:item.unit,
  expiryDate:item.expiry,minimumStock:Number(item.min||0),unitCost:Number(item.cost||0),
  reason:String(reason),notes:String(notes||''),actor:actor(),timestamp,
  labelSource:'normal_expired_waste_flow',isDemoSample:!!item.isDemoSample,
  stockAtExpirySource:atExpiry?.lastEvent?.id||null
 };
 const outcome=atExpiry
  ? {...common,remainingAtExpiry:atExpiry.quantity,discardedQty:q,remainingAfterDiscard:Math.max(0,atExpiry.quantity-q),discardedCost:q*Number(item.cost||0),observedDiscardedQty:q,outcomeStatus:'observed'}
  : {...common,remainingAtExpiry:null,discardedQty:null,remainingAfterDiscard:null,discardedCost:q*Number(item.cost||0),observedDiscardedQty:q,outcomeStatus:'unknown',unknownReason:'No reliable stock-history row was available at the expiry cut-off.'};
 if(outcome.outcomeStatus==='observed'&&q>atExpiry.quantity){
  outcome.outcomeStatus='unknown';outcome.unknownReason='Recorded expired disposal exceeds the stock quantity reconstructed at expiry.';
  outcome.remainingAtExpiry=null;outcome.discardedQty=null;outcome.remainingAfterDiscard=null;
 }
 db.expiryOutcomes.unshift(outcome);
 if(outcome.outcomeStatus==='observed')maybeAutoRetrainRandomForest('new_confirmed_expiry_outcome');
}
function autoRecordZeroStockExpiryOutcomes(){
 if(!Array.isArray(db.expiryOutcomes))db.expiryOutcomes=[];
 let changed=false;
 for(const item of db.items){
  if(item.isDemoSample||item.trackExpiry===false||!item.expiry||item.expiry>=today())continue;
  if(db.expiryOutcomes.some(o=>o.itemId===item.id&&o.expiryDate===item.expiry))continue;
  const atExpiry=stockAtExpiryFromHistory(item);
  if(!atExpiry||atExpiry.quantity!==0)continue;
  db.expiryOutcomes.unshift({
   id:'eo'+Date.now()+Math.random().toString(16).slice(2,6),itemId:item.id,itemName:item.name,
   category:item.category||'Other',restaurantName:db.settings.restaurant||'My Restaurant',unit:item.unit,
   expiryDate:item.expiry,remainingAtExpiry:0,discardedQty:0,remainingAfterDiscard:0,
   discardedCost:0,observedDiscardedQty:0,reason:'No stock remaining at expiry',notes:'Automatically confirmed from the last recorded stock balance on or before the expiry date.',
   actor:'System · stock history',timestamp:now(),labelSource:'auto_confirmed_zero_stock_at_expiry_from_stock_history',
   stockAtExpirySource:atExpiry.lastEvent?.id||null,outcomeStatus:'observed',isDemoSample:false
  });
  changed=true;
 }
 if(changed)save();
}
function log(item,type,qtyBefore,qtyAfter,note=''){
 // Capture the pre-action stock state and only prior history, then append the event.
 captureMLFeatureSnapshot(item,type,qtyBefore);
 db.records.unshift({id:'r'+Date.now()+Math.random().toString(16).slice(2,6),itemId:item.id,itemName:item.name,category:item.category||'Other',type,qtyBefore,qtyAfter,delta:qtyAfter-qtyBefore,unit:item.unit,minimumStock:Number(item.min||0),unitCost:Number(item.cost||0),expiryDate:item.expiry||'',restaurantName:db.settings.restaurant||'My Restaurant',actor:actor(),timestamp:now(),note,source:'stockpilot_inventory_action',isDemoSample:!!item.isDemoSample});
 save();
 // An inventory action is the trigger: run the local model for this item only.
 // Demo and user-created items follow the same path. Items without a future
 // expiry date retain a visible status, but no fabricated prediction is created.
 if(type!=='Item Deleted'&&!(type==='Stock Out'&&/^Waste(?:\s|$)/i.test(String(note||''))))aiAnalyzeInventoryItem(item,true);
}
function toast(s){const t=document.getElementById('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
const ownerNav=[['dashboard','▦','Dashboard'],['inventory','▤','Inventory'],['lowstock','!','Low Stock Alerts'],['history','◷','Stock History'],['waste','◷','Expiry & Waste'],['ai','✦','AI Inventory Intelligence'],['staff','♙','Staff Management'],['settings','⚙','Settings']];
const staffNav=[['inventory','▤','Inventory']];
function renderAccountSwitcher(){
 const toggle=document.getElementById('accountSwitchToggle');
 const menu=document.getElementById('accountSwitchMenu');
 if(!toggle||!menu)return;
 const isOwner=role==='owner';
 const activeId=isOwner?'owner':String(currentUser?.id||'');
 const activeName=isOwner?'Owner Account':(currentUser?.name||'Staff Account');
 const activeUsername=isOwner?'stockpilot_owner':(currentUser?.username||'');
 const roleChip=document.getElementById('roleChip');
 const accountName=document.getElementById('accountName');
 const avatar=document.getElementById('avatar');
 if(roleChip)roleChip.textContent=isOwner?'OWNER':'STAFF';
 if(accountName)accountName.textContent=`${activeName} · ${activeUsername}`;
 if(avatar)avatar.textContent=isOwner?'O':String(activeName||'S').trim().charAt(0).toUpperCase();
 const option=(id,name,username,accountRole)=>{
  const selected=String(activeId)===String(id);
  const mark=accountRole==='owner'?'O':String(name||'S').trim().charAt(0).toUpperCase();
  return `<button type="button" class="account-switch-option ${selected?'active':''}" data-switch-account="${esc(id)}" role="menuitem" ${selected?'aria-current="true"':''}><span class="account-switch-mark">${esc(mark)}</span><span class="account-switch-copy"><b>${esc(name)}</b><small>${esc(username)} · ${accountRole==='owner'?'Owner':'Staff'}</small></span>${selected?'<span class="account-switch-current">Current</span>':''}</button>`;
 };
 const activeStaff=(db.staff||[]).filter(member=>member.status==='Active');
 menu.innerHTML=`<div class="account-switch-title">Switch account</div>${option('owner','Owner Account','stockpilot_owner','owner')}<div class="account-switch-title">Staff accounts</div>${activeStaff.length?activeStaff.map(member=>option(member.id,member.name,member.username,'staff')).join(''):'<div class="account-switch-empty">No active Staff accounts available.</div>'}`;
 toggle.onclick=e=>{e.stopPropagation();const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));};
 menu.querySelectorAll('[data-switch-account]').forEach(button=>button.onclick=e=>{e.stopPropagation();const target=button.dataset.switchAccount;menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');switchAccount(target);});
}
function switchAccount(accountId){
 let nextUser;
 if(String(accountId)==='owner'){
  nextUser={id:'owner',name:'Owner Account',username:'stockpilot_owner',role:'owner'};
 }else{
  const member=(db.staff||[]).find(item=>String(item.id)===String(accountId)&&item.status==='Active');
  if(!member){toast('This Staff account is disabled or unavailable');renderAccountSwitcher();return;}
  nextUser={id:member.id,name:member.name,username:member.username,role:'staff'};
 }
 const same=currentUser&&String(currentUser.id)===String(nextUser.id)&&role===nextUser.role;
 currentUser=nextUser;
 role=nextUser.role;
 page=role==='owner'?'dashboard':'inventory';
 selectedItem=null;detailTab='details';inventoryFilter='all';
 render();
 if(!same)toast(`Switched to ${role==='owner'?'Owner Account':`${nextUser.name} (Staff)`}`);
}
document.addEventListener('click',e=>{
 if(!e.target.closest('.account-switch-wrap')){
  const menu=document.getElementById('accountSwitchMenu');
  const toggle=document.getElementById('accountSwitchToggle');
  if(menu)menu.classList.remove('open');
  if(toggle)toggle.setAttribute('aria-expanded','false');
 }
});
function renderNav(){document.getElementById('nav').innerHTML=(role==='owner'?ownerNav:staffNav).map(([id,ico,label])=>`<div class="nav ${page===id&&!selectedItem?'active':''}" data-page="${id}"><span class="ico">${ico}</span><span class="nav-text">${label}</span></div>`).join('');document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>{page=n.dataset.page;selectedItem=null;renderNav();render()})}
function head(title,sub,actions=''){return `<div class="page-head"><div><div class="eyebrow">${role==='owner'?'Owner workspace':'Staff workspace'}</div><h1 class="page-title">${title}</h1>${sub?`<div class="page-sub">${sub}</div>`:''}</div><div class="toolbar">${actions}</div></div>`}
function imgTag(item){return `<img class="item-photo" draggable="false" src="${esc(item.image||'')}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="240"><rect width="100%" height="100%" fill="#edf3ef"/><text x="50%" y="52%" text-anchor="middle" font-size="22" fill="#47765b">${esc(item.name.slice(0,18))}</text></svg>`)}'">`}
function render(){renderAccountSwitcher();renderNav();if(selectedItem){renderDetails();return}const main=document.getElementById('main');switch(page){case'dashboard':main.innerHTML=dashboard();break;case'inventory':main.innerHTML=inventory();bindInventory();break;case'lowstock':main.innerHTML=lowstock();break;case'history':main.innerHTML=historyPage();bindHistory();break;case'waste':main.innerHTML=wastePage();break;case'ai':main.innerHTML=aiIntelligencePage();bindWasteChart();loadAiPredictions();break;case'staff':main.innerHTML=staffPage();break;case'settings':main.innerHTML=settingsPage();break;default:page='inventory';main.innerHTML=inventory();bindInventory()}}
function dashboard(){const low=db.items.filter(x=>x.qty>0&&x.qty<=x.min).length,out=db.items.filter(x=>x.qty<=0).length,exp=db.items.filter(x=>x.trackExpiry!==false&&x.expiry&&x.expiry<=plus(Number(db.settings.expiryDays||7))&&x.expiry>=today()).length;return `${head('Dashboard',`Inventory overview · ${db.settings.restaurant}`)}<div class="stats"><div class="stat" onclick="goInventory('all')"><div class="stat-label">TOTAL INVENTORY ITEMS</div><div class="stat-value">${db.items.length}</div><div class="stat-note">All registered items</div></div><div class="stat" onclick="goInventory('low')"><div class="stat-label">LOW STOCK ITEMS</div><div class="stat-value">${low}</div><div class="stat-note">At or below minimum level</div></div><div class="stat" onclick="goInventory('out')"><div class="stat-label">OUT OF STOCK ITEMS</div><div class="stat-value">${out}</div><div class="stat-note">Quantity is zero or less</div></div><div class="stat" onclick="goInventory('expiring')"><div class="stat-label">EXPIRING SOON</div><div class="stat-value">${exp}</div><div class="stat-note">Within ${db.settings.expiryDays} days</div></div></div><div class="panel"><div class="row-between"><h3>Recent Inventory Activity</h3><button class="link-btn" onclick="goPage('history')">View all records →</button></div>${recentTable(db.records.slice(0,6))}</div>`}
function goInventory(f){page='inventory';selectedItem=null;inventoryFilter=f;renderNav();render()}function goPage(p){page=p;selectedItem=null;renderNav();render()}
function inventory(){let items=[...db.items];if(inventoryFilter==='low')items=items.filter(x=>x.qty>0&&x.qty<=x.min);if(inventoryFilter==='out')items=items.filter(x=>x.qty<=0);if(inventoryFilter==='expiring')items=items.filter(x=>x.trackExpiry!==false&&x.expiry&&x.expiry<=plus(Number(db.settings.expiryDays||7))&&x.expiry>=today());return `${head('Inventory','Shared inventory: Owner and Staff see the same items and stock quantities.',role==='owner'?'<button class="primary" id="addItem">＋ Add Item</button>':'')}<div class="toolbar"><div class="search"><span>⌕</span><input id="itemSearch" placeholder="Search items by name..."></div><select id="categoryFilter" class="secondary" style="height:42px"><option value="">All categories</option>${[...new Set(db.items.map(x=>x.category))].map(c=>`<option>${esc(c)}</option>`).join('')}</select><button class="secondary" id="clearFilter">Clear filters</button></div><div class="quick-filters" id="quickFilters"><button class="filter-chip ${inventoryFilter==='all'?'active':''}" data-filter="all">All Items <span>${db.items.length}</span></button><button class="filter-chip ${inventoryFilter==='out'?'active':''}" data-filter="out">Out of Stock <span>${db.items.filter(x=>x.qty<=0).length}</span></button><button class="filter-chip ${inventoryFilter==='low'?'active':''}" data-filter="low">Low Stock <span>${db.items.filter(x=>x.qty>0&&x.qty<=x.min).length}</span></button><button class="filter-chip ${inventoryFilter==='expiring'?'active':''}" data-filter="expiring">Expiring Soon <span>${db.items.filter(x=>x.trackExpiry!==false&&x.expiry&&x.expiry<=plus(Number(db.settings.expiryDays||7))&&x.expiry>=today()).length}</span></button></div><div class="section-row"><div class="section-title">${inventoryFilter==='all'?'All Items':inventoryFilter==='low'?'Low Stock Items':inventoryFilter==='out'?'Out of Stock Items':'Expiring Soon'}</div><div class="count" id="itemCount">${items.length} items</div></div><div class="item-grid" id="itemGrid">${itemCards(items)}</div>`}
function itemCards(items){return items.map(x=>`<div class="item-card" data-item="${x.id}" role="button" tabindex="0"><button class="delete-x" type="button" data-delete-item="${x.id}" aria-label="Delete ${esc(x.name)}">×</button>${imgTag(x)}<div class="item-name">${esc(x.name)}</div></div>`).join('')||'<div class="empty" style="grid-column:1/-1">No items match this filter.</div>'}
function bindInventory(){
  const search=document.getElementById('itemSearch');
  const cat=document.getElementById('categoryFilter');
  const grid=document.getElementById('itemGrid');
  let pressTimer=null, pressedCard=null, pressedPointer=null, startX=0, startY=0;
  let suppressCardClick=null, suppressClickUntil=0;

  function update(){
    let arr=[...db.items],q=search.value.toLowerCase();
    if(inventoryFilter==='low')arr=arr.filter(x=>x.qty>0&&x.qty<=x.min);
    if(inventoryFilter==='out')arr=arr.filter(x=>x.qty<=0);
    if(inventoryFilter==='expiring')arr=arr.filter(x=>x.trackExpiry!==false&&x.expiry&&x.expiry<=plus(Number(db.settings.expiryDays||7))&&x.expiry>=today());
    arr=arr.filter(x=>x.name.toLowerCase().includes(q)&&(!cat.value||x.category===cat.value));
    grid.innerHTML=itemCards(arr);
    document.getElementById('itemCount').textContent=arr.length+' items';
  }

  function stopPendingPress(e){
    if(pressedPointer!==null && e && e.pointerId!==undefined && e.pointerId!==pressedPointer)return;
    if(pressTimer!==null)clearTimeout(pressTimer);
    pressTimer=null;pressedCard=null;pressedPointer=null;
  }

  search.oninput=update;
  cat.onchange=update;
  document.getElementById('quickFilters').onclick=e=>{
    const btn=e.target.closest('[data-filter]');
    if(!btn)return;
    inventoryFilter=btn.dataset.filter;
    document.querySelectorAll('#quickFilters .filter-chip').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelector('.section-title').textContent=({all:'All Items',out:'Out of Stock Items',low:'Low Stock Items',expiring:'Expiring Soon Items'})[inventoryFilter];
    update();
  };
  document.getElementById('clearFilter').onclick=()=>{
    search.value='';cat.value='';inventoryFilter='all';document.querySelectorAll('#quickFilters .filter-chip').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));document.querySelector('.section-title').textContent='All Items';update();
  };

  // Only the card being held enters delete mode. The rest remain clickable.
  grid.onpointerdown=e=>{
    if(role!=='owner'||e.target.closest('.delete-x')||(e.pointerType==='mouse'&&e.button!==0))return;
    const card=e.target.closest('.item-card');
    if(!card)return;
    grid.querySelectorAll('.item-card.delete-active').forEach(c=>c.classList.remove('delete-active'));
    stopPendingPress();
    pressedCard=card;pressedPointer=e.pointerId;startX=e.clientX;startY=e.clientY;
    pressTimer=setTimeout(()=>{
      if(!pressedCard||!pressedCard.isConnected)return;
      pressedCard.classList.add('delete-active');
      const id=pressedCard.dataset.item;
      const item=db.items.find(x=>x.id===id);
      toast(`Delete ${item?item.name:'item'}: tap the red ×`);
      // Suppress the synthetic click generated by the same long-press release.
      suppressCardClick=pressedCard;
      suppressClickUntil=Date.now()+700;
      pressTimer=null;
    },650);
  };

  document.onpointermove=e=>{
    if(pressedPointer===null||e.pointerId!==pressedPointer||pressTimer===null)return;
    if(Math.abs(e.clientX-startX)>12||Math.abs(e.clientY-startY)>12)stopPendingPress(e);
  };
  document.onpointerup=stopPendingPress;
  document.onpointercancel=stopPendingPress;
  grid.oncontextmenu=e=>{if(e.target.closest('.item-card'))e.preventDefault();};

  // Clicking anywhere outside the active item (including blank space) cancels
  // its delete affordance. Clicking another item still opens that item normally.
  document.addEventListener('click',e=>{
    if(e.target.closest('.delete-x'))return;
    const active=grid.querySelector('.item-card.delete-active');
    if(!active)return;
    const clickedCard=e.target.closest('.item-card');
    if(clickedCard===active)return;
    active.classList.remove('delete-active');
  });

  grid.onclick=e=>{
    const del=e.target.closest('[data-delete-item]');
    if(del){e.preventDefault();e.stopPropagation();confirmDeleteItem(del.dataset.deleteItem);return;}
    const card=e.target.closest('[data-item]');
    if(!card)return;
    if(suppressCardClick===card&&Date.now()<=suppressClickUntil){
      suppressCardClick=null;suppressClickUntil=0;e.preventDefault();return;
    }
    openItem(card.dataset.item);
  };
  grid.onkeydown=e=>{
    if(e.key==='Escape'){
      grid.querySelectorAll('.item-card.delete-active').forEach(c=>c.classList.remove('delete-active'));
      return;
    }
    if(e.key==='Enter'&&e.target.matches('[data-item]'))openItem(e.target.dataset.item);
  };
  if(document.getElementById('addItem'))document.getElementById('addItem').onclick=()=>itemModal();
  update();
}
function confirmDeleteItem(id){if(role!=='owner'){toast('Only Owner can delete items');return}const item=db.items.find(x=>x.id===id);if(!item)return;openModal('Delete Item?',`<div class="notice" style="border-color:#f1d8d8;background:#fff5f5;color:#9d3333"><b>Are you sure you want to delete ${esc(item.name)}?</b><br>This will remove the item and its current inventory information. This action cannot be undone.</div><p class="muted">Historical stock and activity records will be kept for audit purposes.</p>`,`<button class="secondary" id="cancelDelete">Cancel</button><button class="danger" id="confirmDelete">Yes, Delete</button>`);document.getElementById('cancelDelete').onclick=()=>{closeModal();render()};document.getElementById('confirmDelete').onclick=()=>{const before=item.qty;log(item,'Item Deleted',before,before,'Item removed from Inventory');db.items=db.items.filter(x=>x.id!==id);save();closeModal();selectedItem=null;render();toast(`${item.name} deleted from Inventory`)}}
function openItem(id){selectedItem=id;detailTab='details';render()}
function statusFor(i){if(i.qty<=0)return '<span class="pill red">Out of stock</span>';if(i.qty<=i.min)return '<span class="pill amber">Low stock</span>';return '<span class="pill green">In stock</span>'}
function expiryStatus(i){if(!i.expiry)return 'Not set';if(i.expiry<today())return '<span class="pill red">Expired</span>';if(i.expiry<=plus(Number(db.settings.expiryDays||7)))return '<span class="pill amber">Expiring soon</span>';return '<span class="pill green">Valid</span>'}
function renderDetails(){const i=db.items.find(x=>x.id===selectedItem);if(!i){selectedItem=null;render();return}const records=db.records.filter(r=>r.itemId===i.id);let tabs=role==='owner'?[['details','Details'],['in','Stock In Records'],['out','Stock Out Records'],['adjust','Stock Adjustment Records'],...((i.trackExpiry!==false||i.trackWaste)?[['expiry','Expiry & Waste']]:[])]:[['details','Details']];document.getElementById('main').innerHTML=`<div class="page-head"><div><button class="link-btn" id="backInventory">← Back to Inventory</button><div class="eyebrow" style="margin-top:12px">Inventory / Item Details</div><h1 class="page-title">${esc(i.name)}</h1></div><div class="toolbar">${role==='owner'?'<button class="secondary" id="editItem">Edit Item</button>':''}</div></div><div class="detail-top">${imgTag(i).replace('item-photo','detail-photo')}<div><div class="detail-name">${esc(i.name)}</div><div class="detail-stock">Current Stock: <b>${i.qty} ${esc(i.unit)}</b> &nbsp; ${statusFor(i)}</div>${i.trackExpiry!==false?`<div class="detail-stock">Expiry: ${fmtDate(i.expiry)} · ${expiryStatus(i)}</div>`:''}</div><div class="spacer"></div><div class="detail-actions"><button class="primary small-btn" id="stockIn">＋ Stock In</button><button class="secondary small-btn" id="stockOut">− Stock Out</button><button class="secondary small-btn" id="expiryUpdate">Update Expiry</button>${i.trackWaste?'<button class="secondary small-btn" id="recordWaste">＋ Record Waste</button>':''}</div></div><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${detailTab===k?'active':''}" data-tab="${k}">${t}</button>`).join('')}</div><div id="detailContent">${detailContent(i,records)}</div>`;
 document.getElementById('backInventory').onclick=()=>{selectedItem=null;render()};document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{detailTab=b.dataset.tab;renderDetails()});document.getElementById('stockIn').onclick=()=>movementModal(i,'Stock In');document.getElementById('stockOut').onclick=()=>movementModal(i,'Stock Out');if(document.getElementById('expiryUpdate'))document.getElementById('expiryUpdate').onclick=()=>expiryModal(i);if(document.getElementById('recordWaste'))document.getElementById('recordWaste').onclick=()=>wasteModal(i);if(document.getElementById('editItem'))document.getElementById('editItem').onclick=()=>itemModal(i);}
function detailContent(i,rs){if(detailTab==='details'){const fields=role==='owner'?[['Category',i.category],['Unit',i.unit],['Minimum Stock',`${i.min} ${i.unit}`],['Supplier',i.supplier||'—'],['Unit Cost',money(i.cost)],...(i.trackExpiry!==false?[['Expiry Date',fmtDate(i.expiry)]]:[])]:[['Current Stock',`${i.qty} ${i.unit}`],...(i.trackExpiry!==false?[['Expiry Date',fmtDate(i.expiry)],['Expiry Status',i.expiry&&i.expiry<today()?'Expired':i.expiry&&i.expiry<=plus(Number(db.settings.expiryDays||7))?'Expiring soon':'Valid']]:[])];return `<div class="detail-grid">${fields.map(([a,b])=>`<div class="info"><small>${a}</small><b>${esc(b)}</b></div>`).join('')}</div><div class="panel" style="margin-top:16px"><h3>Inventory Status</h3><div class="row-between"><span>Current Quantity</span><b>${i.qty} ${esc(i.unit)}</b></div><div style="height:8px;background:#edf2ef;border-radius:20px;margin:12px 0"><div style="height:8px;width:${Math.max(0,Math.min(100,i.min?i.qty/(i.min*2)*100:0))}%;background:#4d9b76;border-radius:20px"></div></div>${role==='owner'?`<div class="row-between muted" style="font-size:12px"><span>Minimum stock: ${i.min} ${esc(i.unit)}</span><span>${statusFor(i)}</span></div>`:`<div class="row-between muted" style="font-size:12px">${i.trackExpiry!==false?`<span>Expiry status: ${expiryStatus(i)}</span>`:''}<span>${statusFor(i)}</span></div>`}</div>`;}
if(detailTab==='in')return recentTable(rs.filter(r=>r.type==='Stock In'));
if(detailTab==='out')return recentTable(rs.filter(r=>r.type==='Stock Out'));
if(detailTab==='adjust')return recentTable(rs.filter(r=>r.type==='Stock Adjustment'));
const wr=db.waste.filter(w=>w.itemId===i.id);return `${i.trackExpiry!==false?`<div class="panel"><div class="row-between"><h3>Expiry Information</h3>${expiryStatus(i)}</div><p>Expiry date: <b>${fmtDate(i.expiry)}</b></p><p class="muted">The system uses the expiry date to identify expired and soon-to-expire items.</p></div>`:''}${i.trackWaste?`<div class="panel"><div class="row-between"><h3>Waste Records</h3></div>${wr.length?`<div class="table-wrap"><table><thead><tr><th>Date & Time</th><th>Quantity</th><th>Reason</th><th>Recorded By</th><th>Est. Cost</th></tr></thead><tbody>${wr.map(w=>`<tr><td>${fmtDateTime(w.timestamp)}</td><td>${w.qty} ${esc(w.unit)}</td><td>${esc(w.reason)}</td><td>${esc(w.actor)}</td><td>${money(w.cost)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No waste records yet.</div>'}</div>`:''}`}
function recentTable(rs){if(!rs.length)return '<div class="empty">No records yet.</div>';return `<div class="table-wrap"><table><thead><tr><th>Date & Time</th><th>Item</th><th>Action</th><th>Before</th><th>After</th><th>Changed By</th><th>Notes</th></tr></thead><tbody>${rs.map(r=>`<tr><td>${fmtDateTime(r.timestamp)}</td><td><b>${esc(r.itemName)}</b></td><td><span class="pill ${r.type==='Stock In'?'green':r.type==='Stock Out'?'amber':'blue'}">${esc(r.type)}</span></td><td>${r.qtyBefore} ${esc(r.unit||'')}</td><td>${r.qtyAfter} ${esc(r.unit||'')}</td><td>${esc(r.actor)}</td><td>${esc(r.note||'—')}</td></tr>`).join('')}</tbody></table></div>`}
function historyPage(){return `${head('Stock History','All stock movement and adjustment records.') }<div class="filters"><div class="field"><label>Item</label><select id="histItem"><option value="">All items</option>${db.items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select></div><div class="field"><label>From date</label><input type="date" id="histFrom"></div><div class="field"><label>To date</label><input type="date" id="histTo"></div><div class="field"><label>Record type</label><select id="histType"><option value="">All records</option><option>Stock In</option><option>Stock Out</option><option>Stock Adjustment</option><option>Expiry Update</option><option>Item Updated</option></select></div><button class="secondary" id="resetHistory" style="align-self:end">Reset</button></div><div id="historyResults">${recentTable(db.records)}</div>`}
function bindHistory(){const ids=['histItem','histFrom','histTo','histType'];function update(){let rs=[...db.records];const item=document.getElementById('histItem').value,from=document.getElementById('histFrom').value,to=document.getElementById('histTo').value,type=document.getElementById('histType').value;if(item)rs=rs.filter(r=>r.itemId===item);if(from)rs=rs.filter(r=>r.timestamp.slice(0,10)>=from);if(to)rs=rs.filter(r=>r.timestamp.slice(0,10)<=to);if(type)rs=rs.filter(r=>r.type===type);document.getElementById('historyResults').innerHTML=recentTable(rs)}ids.forEach(id=>document.getElementById(id).onchange=update);document.getElementById('resetHistory').onclick=()=>{ids.forEach(id=>document.getElementById(id).value='');update()}}
function lowstock(){const rows=db.items.filter(i=>i.qty<=i.min);return `${head('Low Stock Alerts','Items at or below their minimum stock level.')}<div class="table-wrap"><table><thead><tr><th>Item</th><th>Current Stock</th><th>Minimum Stock</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(i=>`<tr><td><b>${esc(i.name)}</b></td><td>${i.qty} ${esc(i.unit)}</td><td>${i.min} ${esc(i.unit)}</td><td>${statusFor(i)}</td><td><button class="link-btn" onclick="openItem('${i.id}')">View item →</button></td></tr>`).join('')||'<tr><td colspan="5">No low-stock items.</td></tr>'}</tbody></table></div>`}
function aiIntelligencePage(){
 // Only items with an actual user-recorded inventory action enter AI Intelligence.
 // The built-in demo catalogue is not pre-listed simply because it exists.
 // Keep dashboard counts consistent with the visible AI prediction list:
 // only operated items with at least one explicit kitchen-usage Stock Out count.
 const analysedItems=db.items.filter(i=>aiActivitySignature(i) && (aiUsageInputs(i).usage_record_count||0)>0);
 const expiring=analysedItems.filter(i=>i.expiry&&i.expiry>=today()&&i.expiry<=plus(Number(db.settings.expiryDays||7)));
 return `${head('AI Inventory Intelligence','Machine Learning automatically analyses an item after you add or update it, or record an inventory movement.')}
 
 <div class="stats"><div class="stat"><div class="stat-label">ITEMS ANALYSED</div><div class="stat-value">${analysedItems.length}</div><div class="stat-note">Items with recorded inventory actions</div></div><div class="stat"><div class="stat-label">EXPIRING WITHIN ${Number(db.settings.expiryDays||7)} DAYS</div><div class="stat-value">${expiring.length}</div><div class="stat-note">Among analysed items with expiry dates</div></div></div>
 <section class="waste-analytics-card"><div class="waste-chart-header"><div class="waste-chart-heading"><h3>Expiry & Waste Prediction Analytics</h3><p>Recorded waste cost and modelled expiry exposure</p></div><select id="wasteChartRange" class="waste-chart-range" aria-label="Chart date range"><option value="thisWeek">This Week</option><option value="thisMonth" selected>This Month</option><option value="next30">Next 30 Days</option><option value="thisYear">This Year</option></select></div><div id="wasteChartCanvas" class="waste-chart-plot">${wasteForecastChart('thisMonth')}</div></section>
 <div class="panel"><div class="row-between"><h3>Expiry & Waste Risk Prediction</h3><span id="aiBackendStatus" class="pill amber">Running local ML…</span></div><p class="muted">When you add or edit an item, record Stock In, Stock Out, Usage, Waste, or update expiry settings, StockPilot automatically re-evaluates that item. Numeric ML predictions are shown only after at least 3 kitchen-usage Stock Out records; before that, the item shows its data-readiness status. Items with no future expiry date show a status instead of a fabricated score.</p><div id="aiPredictionResults" class="empty">Loading ML results for items you have operated on…</div></div>
 <div class="panel"><h3>Prediction data requirements</h3><ul><li>At least one recorded inventory action triggers analysis; Usage history improves the model inputs</li><li>A future expiry date is required for expiry-risk prediction</li><li>All categories can be evaluated; unrecognized categories use a neutral category fallback</li><li>Only observed expiry outcomes are eligible labels; prediction outputs are not training labels</li></ul></div>`;
}
function aiDaysUntilExpiry(dateValue){
 if(!dateValue)return null;
 const parts=String(dateValue).split('-').map(Number);
 if(parts.length!==3||parts.some(x=>!Number.isFinite(x)))return null;
 const expiryMs=Date.UTC(parts[0],parts[1]-1,parts[2]);
 const nowDate=new Date();const todayMs=Date.UTC(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate());
 return Math.round((expiryMs-todayMs)/86400000);
}
function aiUsageInputs(item){
 const nowMs=Date.now(),windowMs=30*86400000,cutoff=nowMs-windowMs;
 const rows=(db.records||[]).filter(r=>r.itemId===item.id&&r.type==='Stock Out'&&Date.parse(r.timestamp)>=cutoff);
 const usageRows=rows.filter(r=>/^Usage(?:\s|$)/i.test(String(r.note||'').split(' · ')[0].trim()));
 const quantities=usageRows.map(r=>({time:Date.parse(r.timestamp),qty:Math.max(0,Number(r.qtyBefore)-Number(r.qtyAfter))})).filter(x=>Number.isFinite(x.time)&&x.qty>0);
 const totalUsage=quantities.reduce((sum,x)=>sum+x.qty,0);
 const earliest=Math.min(...quantities.map(x=>x.time));
 const observedDays=Math.max(1,Math.min(30,Math.ceil((nowMs-earliest)/86400000)+1));
 const averageDailyUsage=totalUsage/observedDays;
 const recentUsage=quantities.filter(x=>x.time>=nowMs-7*86400000).reduce((sum,x)=>sum+x.qty,0);
 const recentUsageTrend=observedDays<7||averageDailyUsage<=0?1:Math.max(0.25,Math.min(3,(recentUsage/7)/averageDailyUsage));
 const wasteRows=(db.waste||[]).filter(w=>w.itemId===item.id&&Date.parse(w.timestamp)>=cutoff);
 const wasteTotal=wasteRows.reduce((sum,w)=>sum+Math.max(0,Number(w.qty)||0),0);
 const historicalWasteRate=(totalUsage+wasteTotal)>0?wasteTotal/(totalUsage+wasteTotal):0;
 return {ready:true,average_daily_usage:Number(averageDailyUsage.toFixed(4)),recent_usage_trend:Number(recentUsageTrend.toFixed(4)),historical_waste_rate:Number(historicalWasteRate.toFixed(4)),usage_observation_days:observedDays,usage_record_count:quantities.length};
}
function stockPilotTreeValue(tree,features){
 let node=0,guard=0;
 while(tree.l[node]!==-1&&tree.r[node]!==-1&&guard++<1000){
  const feature=tree.f[node];
  node=features[feature]<=tree.t[node]?tree.l[node]:tree.r[node];
 }
 return tree.v[node];
}

function stockPilotActiveModelData(){
 return db?.mlRetrainedModel?.modelData||window.STOCKPILOT_MODEL_DATA;
}
function stockPilotEncodeFeatures(input,keys){
 const category=String(input.item_category||'').trim().toLowerCase();
 const values={
  current_stock:Number(input.current_stock)||0,
  average_daily_usage:Number(input.average_daily_usage)||0,
  days_until_expiry:Number(input.days_until_expiry)||0,
  recent_usage_trend:Number(input.recent_usage_trend)||0,
  historical_waste_rate:Number(input.historical_waste_rate)||0,
  item_category_Dairy:category==='dairy'?1:0,
  item_category_Fruits:category==='fruits'?1:0,
  item_category_Meat:category==='meat'?1:0,
  item_category_Vegetables:category==='vegetables'?1:0
 };
 return keys.map(k=>Number(values[k]||0));
}
function stockPilotPredictWithData(data,input){
 if(!data||!Array.isArray(data.classifier)||!Array.isArray(data.regressor))throw new Error('Embedded ML model data is missing.');
 const category=String(input.item_category||'').trim().toLowerCase();
 const categorySupported=['dairy','fruits','meat','vegetables'].includes(category);
 const raw={
  current_stock:Number(input.current_stock)||0,
  average_daily_usage:Number(input.average_daily_usage)||0,
  days_until_expiry:Number(input.days_until_expiry)||0,
  recent_usage_trend:Number(input.recent_usage_trend)||0,
  historical_waste_rate:Number(input.historical_waste_rate)||0
 };
 const featureInput={...raw,item_category:category};
 const classifierFeatures=stockPilotEncodeFeatures(featureInput,data.classifier_features);
 const regressorFeatures=stockPilotEncodeFeatures(featureInput,data.regressor_features);
 const positiveIndex=data.classes.indexOf(1);
 if(positiveIndex<0)throw new Error('Expected positive class 1 is not present.');
 const risk=data.classifier.reduce((sum,tree)=>sum+Number(stockPilotTreeValue(tree,classifierFeatures)[positiveIndex]||0),0)/data.classifier.length;
 const rawRemaining=data.regressor.reduce((sum,tree)=>sum+Number(stockPilotTreeValue(tree,regressorFeatures)||0),0)/data.regressor.length;
 const predictedRemaining=data.regressor_target==='remaining_stock_ratio'
  ? raw.current_stock*Math.min(1,Math.max(0,rawRemaining))
  : rawRemaining;
 const boundedRemaining=Math.min(raw.current_stock,Math.max(0,predictedRemaining));
 return {
  success:true,item_category:input.item_category,category_supported:categorySupported,
  expiry_risk_probability:Number((risk*100).toFixed(2)),
  risk_level:risk>=.70?'HIGH':risk>=.40?'MEDIUM':'LOW',
  predicted_remaining_stock:Number(boundedRemaining.toFixed(2)),
  model_type:'Random Forest (local browser inference)',
  model_version:data.version||'embedded-base-model',
  risk_definition:'Classifier class 1 represents the model target of having stock remaining at expiry; this is a proxy expiry-risk label, not a direct prediction of discarded waste.',
  model_validation:data.training_provenance||'synthetic_demo_data_not_validated_for_real_business_use',
  prediction_note:categorySupported?'Prototype result only; model requires ongoing outcome validation.':'Neutral category fallback; this category was not represented in the model training categories.'
 };
}
function stockPilotLocalPredict(input){
 return stockPilotPredictWithData(stockPilotActiveModelData(),input);
}
// Browser-side Random Forest trainer. It learns only from confirmed expiry outcomes
// paired with their exact prediction-time input snapshots. Prediction outputs are never labels.
function stockPilotSeededRandom(seed){
 let state=(Number(seed)||123456789)>>>0;
 return ()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296};
}
function stockPilotTreeImpurity(indices,rows,kind){
 if(!indices.length)return 0;
 if(kind==='classifier'){
  let positives=0;for(const ix of indices)positives+=rows[ix].y;
  const p=positives/indices.length;return 1-p*p-(1-p)*(1-p);
 }
 let sum=0,sum2=0;for(const ix of indices){const y=rows[ix].y;sum+=y;sum2+=y*y;}
 return Math.max(0,sum2/indices.length-(sum/indices.length)**2);
}
function stockPilotBuildTree(rows,kind,featureCount,rng,maxDepth=5,minLeaf=2){
 const tree={l:[],r:[],f:[],t:[],v:[]};
 const allFeatures=Array.from({length:featureCount},(_,i)=>i);
 const leafValue=indices=>{
  if(kind==='classifier'){
   let positives=0;for(const ix of indices)positives+=rows[ix].y;
   const p=indices.length?positives/indices.length:.5;
   return [1-p,p];
  }
  return indices.reduce((s,ix)=>s+rows[ix].y,0)/Math.max(1,indices.length);
 };
 const build=(indices,depth)=>{
  const node=tree.l.length;
  tree.l.push(-1);tree.r.push(-1);tree.f.push(-1);tree.t.push(0);tree.v.push(leafValue(indices));
  if(depth>=maxDepth||indices.length<minLeaf*2||stockPilotTreeImpurity(indices,rows,kind)<1e-10)return node;
  const featurePool=allFeatures.slice();
  for(let i=featurePool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[featurePool[i],featurePool[j]]=[featurePool[j],featurePool[i]];}
  const mtry=Math.max(1,Math.ceil(Math.sqrt(featureCount)));
  const features=featurePool.slice(0,mtry);
  const parent=stockPilotTreeImpurity(indices,rows,kind);
  let bestGain=0,bestFeature=-1,bestThreshold=0,bestLeft=null,bestRight=null;
  for(const feature of features){
   const sorted=indices.map(ix=>({ix,x:rows[ix].x[feature]})).sort((a,b)=>a.x-b.x);
   for(let k=minLeaf;k<=sorted.length-minLeaf;k++){
    if(sorted[k-1].x===sorted[k].x)continue;
    const threshold=(sorted[k-1].x+sorted[k].x)/2;
    const left=sorted.slice(0,k).map(v=>v.ix),right=sorted.slice(k).map(v=>v.ix);
    const weighted=(left.length*stockPilotTreeImpurity(left,rows,kind)+right.length*stockPilotTreeImpurity(right,rows,kind))/indices.length;
    const gain=parent-weighted;
    if(gain>bestGain+1e-12){bestGain=gain;bestFeature=feature;bestThreshold=threshold;bestLeft=left;bestRight=right;}
   }
  }
  if(bestFeature<0)return node;
  tree.f[node]=bestFeature;tree.t[node]=bestThreshold;
  tree.v[node]=kind==='classifier'?[.5,.5]:leafValue(indices);
  tree.l[node]=build(bestLeft,depth+1);tree.r[node]=build(bestRight,depth+1);
  return node;
 };
 build(Array.from({length:rows.length},(_,i)=>i),0);
 return tree;
}
function stockPilotTrainForest(rows,kind,featureCount,seed,treeCount=48){
 const rng=stockPilotSeededRandom(seed),trees=[];
 for(let t=0;t<treeCount;t++){
  const boot=[];for(let i=0;i<rows.length;i++)boot.push(rows[Math.floor(rng()*rows.length)]);
  trees.push(stockPilotBuildTree(boot,kind,featureCount,rng,5,2));
 }
 return trees;
}
function stockPilotModelProbability(data,input){
 const vector=stockPilotEncodeFeatures(input,data.classifier_features);
 const positiveIndex=data.classes.indexOf(1);
 return data.classifier.reduce((sum,tree)=>sum+Number(stockPilotTreeValue(tree,vector)[positiveIndex]||0),0)/data.classifier.length;
}
function stockPilotModelRemaining(data,input){
 const vector=stockPilotEncodeFeatures(input,data.regressor_features);
 const avg=data.regressor.reduce((sum,tree)=>sum+Number(stockPilotTreeValue(tree,vector)||0),0)/data.regressor.length;
 const value=data.regressor_target==='remaining_stock_ratio'
  ? Number(input.current_stock||0)*Math.min(1,Math.max(0,avg))
  : avg;
 return Math.min(Number(input.current_stock||0),Math.max(0,value));
}
function stockPilotHashText(text){
 let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
 return h>>>0;
}
function stockPilotCollectConfirmedTrainingRows(){
 const outcomes=(db.expiryOutcomes||[]).filter(o=>o&&o.outcomeStatus==='observed'&&Number.isFinite(Number(o.remainingAtExpiry))&&Number.isFinite(Number(o.discardedQty)));
 const snapshots=db.mlPredictionSnapshots||[];
 const rows=[];
 const supported=new Set(['dairy','fruits','meat','vegetables']);
 for(const outcome of outcomes){
  const match=snapshots.filter(s=>String(s.itemId)===String(outcome.itemId)&&String(s.expiryDate)===String(outcome.expiryDate)&&s.apiRequestFeatures&&s.modelOutputIsLabel===false&&s.snapshotDate&&String(s.snapshotDate).slice(0,10)<String(outcome.expiryDate))
   .sort((a,b)=>Date.parse(b.snapshotDate)-Date.parse(a.snapshotDate))[0];
  if(!match)continue;
  const f=match.apiRequestFeatures,category=String(f.item_category||match.category||outcome.category||'').toLowerCase();
  if(!supported.has(category))continue;
  const remaining=Number(outcome.remainingAtExpiry),current=Number(f.current_stock);
  if(!Number.isFinite(remaining)||remaining<0||!Number.isFinite(current)||current<0)continue;
  const input={item_category:category,current_stock:current,average_daily_usage:Number(f.average_daily_usage)||0,days_until_expiry:Number(f.days_until_expiry)||0,recent_usage_trend:Number(f.recent_usage_trend)||0,historical_waste_rate:Number(f.historical_waste_rate)||0};
  rows.push({
   key:`${outcome.itemId}|${outcome.expiryDate}`,snapshotId:String(match.id||match.snapshotDate),itemId:String(outcome.itemId),expiryDate:String(outcome.expiryDate),
   xClassifier:stockPilotEncodeFeatures(input,window.STOCKPILOT_MODEL_DATA.classifier_features),
   xRegressor:stockPilotEncodeFeatures(input,window.STOCKPILOT_MODEL_DATA.regressor_features),
   input,targetClass:remaining>0?1:0,targetRemaining:remaining,
   // A ratio target is unit-scale independent. Only use a valid non-zero
   // prediction-time stock denominator with an outcome not exceeding that stock.
   targetRemainingRatio:current>0&&remaining<=current?remaining/current:null,
   provenance:outcome.isDemoSample?'synthetic_demo_workflow':'operational_observed_workflow'
  });
 }
 return rows;
}
function stockPilotSplitRows(rows,seed){
 const byClass={0:[],1:[]};rows.forEach(r=>byClass[r.targetClass].push(r));
 if(byClass[0].length<3||byClass[1].length<3)return null;
 const train=[],validation=[];
 for(const label of [0,1]){
  const group=byClass[label].slice().sort((a,b)=>stockPilotHashText(a.key+seed)-stockPilotHashText(b.key+seed));
  const nVal=Math.max(1,Math.floor(group.length*.25));
  validation.push(...group.slice(0,nVal));train.push(...group.slice(nVal));
 }
 if(train.length<8||validation.length<2)return null;
 return {train,validation};
}
function stockPilotClassificationMetrics(data,rows){
 let tp=0,fp=0,fn=0,brier=0;
 for(const row of rows){
  const p=Math.min(1,Math.max(0,stockPilotModelProbability(data,row.input)));
  const predicted=p>=.5?1:0;
  if(predicted===1&&row.targetClass===1)tp++;
  if(predicted===1&&row.targetClass===0)fp++;
  if(predicted===0&&row.targetClass===1)fn++;
  brier+=(p-row.targetClass)**2;
 }
 const precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0;
 return {f1:precision+recall?2*precision*recall/(precision+recall):0,brier:brier/rows.length};
}
function stockPilotRegressionMAE(data,rows){
 if(!rows.length)return Infinity;
 let total=0;
 for(const row of rows)total+=Math.abs(stockPilotModelRemaining(data,row.input)-row.targetRemaining);
 return total/rows.length;
}
function maybeAutoRetrainRandomForest(trigger='data_update'){
 const rows=stockPilotCollectConfirmedTrainingRows();
 const signature=rows.map(r=>`${r.key}:${r.targetRemaining}:${r.targetClass}`).sort().join(';');
 if(db.mlRetraining?.lastDatasetSignature===signature)return db.mlRetraining;
 const classes={zero:rows.filter(r=>r.targetClass===0).length,positive:rows.filter(r=>r.targetClass===1).length};
 const state={lastCheckedAt:now(),lastDatasetSignature:signature,labeledCohorts:rows.length,zeroRemainingCohorts:classes.zero,remainingCohorts:classes.positive,trigger};
 if(rows.length<12||classes.zero<3||classes.positive<3){
  state.status='waiting_for_confirmed_outcomes';
  state.message='Automatic retraining waits for at least 12 distinct item/expiry outcomes, including at least 3 with zero remaining and 3 with stock remaining.';
  db.mlRetraining=state;save();return state;
 }
 const split=stockPilotSplitRows(rows,signature.slice(0,32));
 if(!split){
  state.status='waiting_for_validation_split';
  state.message='More balanced item/expiry outcomes are required for a group holdout validation.';
  db.mlRetraining=state;save();return state;
 }
 const base=stockPilotActiveModelData();
 const classRowsTrain=split.train.map(r=>({x:r.xClassifier,y:r.targetClass}));
 const candidateClassifier=stockPilotTrainForest(classRowsTrain,'classifier',base.classifier_features.length,stockPilotHashText(signature+'classifier'),48);
 const candidateClassifierModel={...base,classifier:candidateClassifier};
 const baselineClass=stockPilotClassificationMetrics(base,split.validation);
 const candidateClass=stockPilotClassificationMetrics(candidateClassifierModel,split.validation);
 state.classifier={baseline:baselineClass,candidate:candidateClass};
 const classAccepted=candidateClass.brier<baselineClass.brier&&candidateClass.f1>=baselineClass.f1-.05;
 let nextModel={...base};
 if(classAccepted){
  nextModel.classifier=stockPilotTrainForest(rows.map(r=>({x:r.xClassifier,y:r.targetClass})),'classifier',base.classifier_features.length,stockPilotHashText(signature+'classifier-full'),64);
  state.classifier.status='updated';
 }else state.classifier.status='kept_previous_model_validation_not_better';
 const regRows=rows.filter(r=>r.targetRemainingRatio!==null);
 const splitReg=stockPilotSplitRows(regRows,signature.slice(0,32));
 if(splitReg&&regRows.length>=12){
  const regTrain=splitReg.train.map(r=>({x:r.xRegressor,y:r.targetRemainingRatio}));
  const candidateRegressor=stockPilotTrainForest(regTrain,'regressor',base.regressor_features.length,stockPilotHashText(signature+'regressor'),48);
  const candidateRegModel={...base,regressor:candidateRegressor,regressor_target:'remaining_stock_ratio'};
  const baselineReg=stockPilotRegressionMAE(base,splitReg.validation);
  const candidateReg=stockPilotRegressionMAE(candidateRegModel,splitReg.validation);
  state.regressor={baselineMAE:baselineReg,candidateMAE:candidateReg};
  if(candidateReg<baselineReg){
   nextModel.regressor=stockPilotTrainForest(regRows.map(r=>({x:r.xRegressor,y:r.targetRemainingRatio})),'regressor',base.regressor_features.length,stockPilotHashText(signature+'regressor-full'),64);
   nextModel.regressor_target='remaining_stock_ratio';state.regressor.status='updated';
  }else state.regressor.status='kept_previous_model_validation_not_better';
 }else{
  state.regressor={status:'waiting_for_compatible_remaining_labels',eligibleRows:regRows.length};
 }
 const didUpdate=state.classifier.status==='updated'||state.regressor.status==='updated';
 if(didUpdate){
  nextModel.version='2.1-local-auto-retrained';
  nextModel.training_provenance='locally_retrained_from_confirmed_expiry_outcomes';
  nextModel.trained_at=now();
  db.mlRetrainedModel={modelData:nextModel,trainedAt:now(),datasetSignature:signature,labeledCohorts:rows.length,syntheticCohorts:rows.filter(r=>r.provenance==='synthetic_demo_workflow').length,operationalCohorts:rows.filter(r=>r.provenance==='operational_observed_workflow').length};
  // Invalidate cached item-level predictions so the next AI page render uses the newly accepted model.
  db.items.forEach(item=>{if(item.aiMLAnalysis)item.aiMLAnalysis=null;});
  state.status='retrained_model_updated';
  state.message='Validation improved at least one model component. Updated model is now used for local browser predictions.';
 }else{
  state.status='candidate_not_better';
  state.message='A retraining candidate was evaluated, but it did not outperform the current model on the held-out outcomes. The existing model remains active.';
 }
 state.completedAt=now();db.mlRetraining=state;save();return state;
}

const AI_ACTIVITY_TYPES=new Set(['Stock In','Stock Out','Stock Adjustment','Item Updated','Tracking Settings Updated','Waste']);
function aiItemActivityRecords(item){
 return (db.records||[]).filter(r=>String(r.itemId)===String(item.id)&&AI_ACTIVITY_TYPES.has(String(r.type||'')));
}
function aiActivitySignature(item){
 const events=aiItemActivityRecords(item);
 if(!events.length)return '';
 const latest=events.reduce((a,b)=>Date.parse(a.timestamp||0)>=Date.parse(b.timestamp||0)?a:b);
 return `${events.length}|${latest.id||''}|${latest.timestamp||''}|${latest.type||''}|${latest.qtyAfter??''}`;
}
function aiAnalyzeInventoryItem(item,force=false){
 if(!item)return null;
 const signature=aiActivitySignature(item);
 if(!signature)return null;
 const previous=item.aiMLAnalysis;
 if(!force&&previous&&previous.activitySignature===signature)return previous;
 const analysedAt=now();
 const days=aiDaysUntilExpiry(item.expiry);
 if(days===null){
  item.aiMLAnalysis={status:'needs_expiry',message:'Add a future expiry date to run expiry-risk prediction.',analysedAt,activitySignature:signature,usageRecordCount:aiUsageInputs(item).usage_record_count||0};
  save();return item.aiMLAnalysis;
 }
 if(days<=0){
  item.aiMLAnalysis={status:'expiry_window_closed',message:'Expiry date is today or has passed; no forward expiry prediction is generated.',analysedAt,activitySignature:signature,usageRecordCount:aiUsageInputs(item).usage_record_count||0};
  save();return item.aiMLAnalysis;
 }
 try{
  const usage=aiUsageInputs(item);
  // Every qualifying inventory event triggers a fresh evaluation, but do not
  // present a numeric ML forecast until there are at least 3 explicit Usage records.
  if((usage.usage_record_count||0)<3){
   item.aiMLAnalysis={status:'insufficient_usage_data',message:`Insufficient usage data: ${usage.usage_record_count||0}/3 kitchen-usage Stock Out records. Inventory changes are tracked; prediction will run automatically after 3 Usage records.`,analysedAt,activitySignature:signature,usageRecordCount:usage.usage_record_count||0,usageObservationDays:usage.usage_observation_days||0};
   save();return item.aiMLAnalysis;
  }
  const requestFeatures={item_category:item.category,current_stock:Number(item.qty)||0,average_daily_usage:usage.average_daily_usage,days_until_expiry:days,recent_usage_trend:usage.recent_usage_trend,historical_waste_rate:usage.historical_waste_rate};
  const prediction=stockPilotLocalPredict(requestFeatures);
  item.aiMLAnalysis={status:'predicted',analysedAt,activitySignature:signature,requestFeatures,prediction,usageObservationDays:usage.usage_observation_days,usageRecordCount:usage.usage_record_count||0};
  captureMLPredictionSnapshot(item,requestFeatures,prediction,analysedAt,prediction.model_validation||'synthetic_demo_data_not_validated_for_real_business_use',usage.usage_observation_days);
  save();return item.aiMLAnalysis;
 }catch(error){
  item.aiMLAnalysis={status:'error',message:error.message||'Local prediction failed.',analysedAt,activitySignature:signature};
  save();return item.aiMLAnalysis;
 }
}
async function loadAiPredictions(){
 const statusEl=document.getElementById('aiBackendStatus'),resultsEl=document.getElementById('aiPredictionResults');
 if(!statusEl||!resultsEl)return;
 try{
  if(!window.STOCKPILOT_MODEL_DATA)throw new Error('Local ML model is not embedded in this StockPilot file.');
  if(page!=='ai')return;
  statusEl.className='pill green';statusEl.textContent=db.mlRetrainedModel?'Local ML model ready · Auto-retrained':'Local ML model ready · Offline';
  maybeAutoRetrainRandomForest('ai_page_open');
  // Backfill only items that already have a real action record (e.g. actions made
  // in an earlier build). Untouched demo catalogue items are deliberately omitted.
  // Show only items with at least one explicit kitchen-usage Stock Out record.
  // This filters the AI risk list only; it never deletes inventory items.
  const analysedItems=db.items.filter(item=>aiActivitySignature(item) && (aiUsageInputs(item).usage_record_count||0)>0);
  const rows=analysedItems.map(item=>({item,analysis:aiAnalyzeInventoryItem(item,false)}));
  if(page!=='ai')return;
  const rowsHtml=rows.map(({item,analysis})=>{
   const analysisStatus=analysis?.status||'pending';
   if(analysisStatus!=='predicted'){
    const message=analysis?.message||(analysisStatus==='error'?'Prediction could not be completed.':'Waiting for a valid prediction input.');
    return `<tr><td><b>${esc(item.name)}</b><div class="muted" style="font-size:11px">${esc(item.category)} · ${esc(item.qty)} ${esc(item.unit)}${item.isDemoSample?' · Demo':''}</div></td><td>${fmtDate(item.expiry)}</td><td colspan="3"><span class="muted">${esc(message)}</span></td></tr>`;
   }
   const p=analysis.prediction,color=p.risk_level==='HIGH'?'red':p.risk_level==='MEDIUM'?'amber':'green';
   return `<tr><td><b>${esc(item.name)}</b><div class="muted" style="font-size:11px">${esc(item.category)} · ${esc(item.qty)} ${esc(item.unit)}${item.isDemoSample?' · Demo':''}</div></td><td>${fmtDate(item.expiry)}</td><td><span class="pill ${color}">${esc(p.risk_level)}</span><div style="font-weight:750;margin-top:5px">${Number(p.expiry_risk_probability).toFixed(2)}%</div></td><td><b>${Number(p.predicted_remaining_stock).toFixed(2)} ${esc(item.unit)}</b></td><td><span class="muted" style="font-size:11px">${p.category_supported?'Prototype model':'Neutral category fallback'} · ${analysis.usageRecordCount||0} Usage records<br>Updated ${fmtDateTime(analysis.analysedAt)}</span></td></tr>`;
  }).join('');
  resultsEl.className='';
  resultsEl.innerHTML=rowsHtml?`<div class="table-wrap"><table><thead><tr><th>Item</th><th>Expiry Date</th><th>Expiry Risk</th><th>Predicted Remaining</th><th>Model Status</th></tr></thead><tbody>${rowsHtml}</tbody></table></div><p class="muted" style="font-size:11px;margin-bottom:0">Only items with at least one explicit kitchen-usage Stock Out record are listed. Items with 0 Usage records are hidden here, not deleted from Inventory. Each successful prediction is saved with its exact input features and timestamp; predictions are not ground-truth labels.</p>`:'<div class="empty">No eligible items yet. Record at least one Stock Out → Usage for an item to show it here. Items with 0 Usage records remain in Inventory and are not deleted.</div>';
 }catch(error){
  if(page!=='ai')return;
  statusEl.className='pill red';statusEl.textContent='Local ML unavailable';
  resultsEl.className='empty';resultsEl.innerHTML=`<b>Cannot start the local Machine Learning model.</b><br>${esc(error.message)}<br><br>No prediction is generated while the embedded model is unavailable.`;
 }
}
function expiryRecordRow(i){return `<tr><td><b>${esc(i.name)}</b></td><td>${i.qty} ${esc(i.unit)}</td><td>${fmtDate(i.expiry)}</td><td>${expiryStatus(i)}</td></tr>`}
function expiryOutcomeRow(o){
 const observed=o.outcomeStatus==='observed'&&Number.isFinite(Number(o.remainingAtExpiry))&&Number.isFinite(Number(o.discardedQty));
 const status=observed?'Observed':'Unknown';
 return `<tr><td><b>${esc(o.itemName)}</b></td><td>${fmtDate(o.expiryDate)}</td><td><span class="pill ${observed?'green':'amber'}">${status}</span></td><td>${observed?`${Number(o.remainingAtExpiry).toLocaleString('en-MY')} ${esc(o.unit)}`:'—'}</td><td>${observed?`${Number(o.discardedQty).toLocaleString('en-MY')} ${esc(o.unit)}`:'—'}</td><td>${esc(o.reason||'—')}</td><td>${fmtDateTime(o.timestamp)}</td></tr>`;
}
function wasteRecordRow(w){return `<tr><td><b>${esc(w.itemName)}</b></td><td>${fmtDateTime(w.timestamp)}</td><td>${w.qty} ${esc(w.unit)}</td><td>${esc(w.reason)}</td><td>${esc(w.actor)}</td><td>${money(w.cost)}</td></tr>`}

function wasteChartShiftDate(dateString,days){
 const d=new Date(`${dateString}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);
 return d.toISOString().slice(0,10);
}
function wasteChartRangeBounds(key){
 const current=today(),d=new Date(`${current}T00:00:00Z`),year=d.getUTCFullYear(),month=d.getUTCMonth();
 if(key==='thisWeek'){
  const mondayOffset=(d.getUTCDay()+6)%7;const start=wasteChartShiftDate(current,-mondayOffset);
  return {start,end:wasteChartShiftDate(start,6),label:'This Week'};
 }
 if(key==='next30')return {start:current,end:wasteChartShiftDate(current,29),label:'Next 30 Days'};
 if(key==='thisYear')return {start:`${year}-01-01`,end:`${year}-12-31`,label:'This Year'};
 return {start:`${year}-${String(month+1).padStart(2,'0')}-01`,end:new Date(Date.UTC(year,month+1,0)).toISOString().slice(0,10),label:'This Month'};
}
function wasteChartShortDate(dateString){
 const d=new Date(`${dateString}T12:00:00+08:00`);
 return new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',day:'numeric',month:'short'}).format(d);
}
function wasteChartMoney(value){
 const n=Number(value)||0;
 return 'RM '+n.toLocaleString('en-MY',{maximumFractionDigits:0});
}
function wasteChartNiceMaximum(value){
 if(!(value>0))return 100;
 const raw=value/4,power=Math.pow(10,Math.floor(Math.log10(raw))),fraction=raw/power;
 const nice=fraction<=1?1:fraction<=2?2:fraction<=5?5:10;
 return nice*power*4;
}
function wasteChartCurve(points){
 if(!points.length)return '';
 if(points.length===1)return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
 let path=`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
 for(let i=0;i<points.length-1;i++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6;
  const c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
  path+=` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
 }
 return path;
}
function wasteChartModelForecasts(start,end){
 const byDate={};
 const add=(item,date,probability,remaining)=>{
  const p=Number(probability),q=Number(remaining),unitCost=Number(item.cost);
  if(!date||date<today()||date<start||date>end||!Number.isFinite(p)||!Number.isFinite(q)||!Number.isFinite(unitCost)||p<0||p>100||q<0||unitCost<0)return;
  const exposure=(p/100)*q*unitCost;
  if(!Number.isFinite(exposure)||exposure<=0)return;
  byDate[date]=(byDate[date]||0)+exposure;
 };
 const snapshots=Array.isArray(db.mlPredictionSnapshots)?db.mlPredictionSnapshots:[];
 for(const item of (db.items||[])){
  if(item.trackExpiry===false||!item.expiry||item.expiry<today()||item.expiry<start||item.expiry>end)continue;
  const analysis=item.aiMLAnalysis;
  if(analysis&&analysis.status==='predicted'&&analysis.prediction){
   const p=analysis.prediction;
   add(item,item.expiry,p.expiry_risk_probability,p.predicted_remaining_stock);
   continue;
  }
  const candidates=snapshots.filter(x=>String(x.itemId)===String(item.id)&&String(x.expiryDate)===String(item.expiry))
   .sort((a,b)=>Date.parse(b.snapshotDate||b.predictionTime||0)-Date.parse(a.snapshotDate||a.predictionTime||0));
  if(candidates.length){const p=candidates[0];add(item,item.expiry,p.expiryRiskProbability,p.predictedRemainingStock);}
 }
 return byDate;
}
function wasteChartSeries(rangeKey){
 const bounds=wasteChartRangeBounds(rangeKey),actual={},forecast=wasteChartModelForecasts(bounds.start,bounds.end),current=today();
 for(const w of (db.waste||[])){
  if(!w.timestamp)continue;
  const time=Date.parse(w.timestamp);if(!Number.isFinite(time))continue;
  const date=stockpilotDateInMY(time);if(date<bounds.start||date>bounds.end||date>current)continue;
  const cost=Number(w.cost);if(!Number.isFinite(cost)||cost<0)continue;
  actual[date]=(actual[date]||0)+cost;
 }
 const actualPoints=Object.entries(actual).map(([date,value])=>({date,value,type:'actual'})).sort((a,b)=>a.date.localeCompare(b.date));
 const forecastPoints=Object.entries(forecast).map(([date,value])=>({date,value,type:'forecast'})).sort((a,b)=>a.date.localeCompare(b.date));
 return {bounds,actualPoints,forecastPoints};
}
function wasteForecastChart(rangeKey='thisMonth'){
 const {bounds,actualPoints,forecastPoints}=wasteChartSeries(rangeKey);
 const points=[...actualPoints,...forecastPoints].sort((a,b)=>a.date.localeCompare(b.date));
 if(!points.length)return `<div class="waste-chart-empty"><div class="waste-chart-empty-icon">⌁</div><strong>No waste or eligible expiry forecast data yet</strong><span>Recorded waste will appear as historical actuals. Future exposure appears after an item has a valid Random Forest prediction with sufficient Usage history and a future expiry date.</span></div>`;
 const width=1120,height=370,left=92,right=36,top=42,bottom=62,plotW=width-left-right,plotH=height-top-bottom,baseY=top+plotH;
 const minDate=new Date(`${bounds.start}T00:00:00Z`).getTime(),maxDate=new Date(`${bounds.end}T00:00:00Z`).getTime(),span=Math.max(1,maxDate-minDate);
 const maxValue=Math.max(...points.map(p=>p.value),1),maxY=wasteChartNiceMaximum(maxValue);
 const place=p=>({x:left+((new Date(`${p.date}T00:00:00Z`).getTime()-minDate)/span)*plotW,y:top+plotH-(p.value/maxY)*plotH,...p});
 const actual=actualPoints.map(place),forecast=forecastPoints.map(place);
 const actualPath=wasteChartCurve(actual),forecastPath=wasteChartCurve(forecast);
 const actualArea=actual.length?`${actualPath} L ${actual[actual.length-1].x.toFixed(2)} ${baseY} L ${actual[0].x.toFixed(2)} ${baseY} Z`:'';
 const yGrid=Array.from({length:5},(_,i)=>{const val=maxY*(4-i)/4,y=top+plotH*i/4;return `<line class="waste-chart-grid" x1="${left}" y1="${y}" x2="${width-right}" y2="${y}"/><text class="waste-chart-axis" x="${left-15}" y="${y+4}" text-anchor="end">${wasteChartMoney(val)}</text>`}).join('');
 const tickCount=7,ticks=Array.from({length:tickCount},(_,i)=>{const t=i/(tickCount-1),date=wasteChartShiftDate(bounds.start,Math.round(((maxDate-minDate)/86400000)*t)),x=left+plotW*t;return `<text class="waste-chart-date" x="${x}" y="${height-20}" text-anchor="${i===0?'start':i===tickCount-1?'end':'middle'}">${wasteChartShortDate(date)}</text>`}).join('');
 const valueLabels=arr=>arr.map(p=>`<text class="waste-chart-value" x="${p.x}" y="${Math.max(18,p.y-15)}" text-anchor="middle">${wasteChartMoney(p.value)}</text>`).join('');
 const dots=arr=>arr.map(p=>`<circle class="${p.type==='actual'?'waste-chart-actual-dot':'waste-chart-forecast-dot'}" cx="${p.x}" cy="${p.y}" r="6"><title>${p.type==='actual'?'Actual recorded waste cost':'Modelled expiry exposure'} · ${wasteChartShortDate(p.date)} · ${wasteChartMoney(p.value)}</title></circle>`).join('');
 const actualFill=actualArea?`<path d="${actualArea}" fill="url(#wasteChartAreaGradient)"/>`:'';
 const forecastFill=forecast.length?`<path d="${forecastPath} L ${forecast[forecast.length-1].x.toFixed(2)} ${baseY} L ${forecast[0].x.toFixed(2)} ${baseY} Z" fill="url(#wasteChartForecastGradient)"/>`:'';
 const svg=`<svg class="waste-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Waste cost and modelled expiry exposure analytics">
 <defs><linearGradient id="wasteChartAreaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#4b83e8" stop-opacity=".25"/><stop offset="100%" stop-color="#dceaff" stop-opacity=".12"/></linearGradient><linearGradient id="wasteChartForecastGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#72a0ee" stop-opacity=".16"/><stop offset="100%" stop-color="#e9f1ff" stop-opacity=".04"/></linearGradient></defs>
 ${yGrid}${actualFill}${forecastFill}
 ${actualPath?`<path class="waste-chart-actual-line" d="${actualPath}"/>`:''}
 ${forecastPath?`<path class="waste-chart-forecast-line" d="${forecastPath}"/>`:''}
 ${dots(actual)}${dots(forecast)}${valueLabels(actual)}${valueLabels(forecast)}
 ${ticks}</svg>`;
 const totalActual=actualPoints.reduce((s,p)=>s+p.value,0),totalForecast=forecastPoints.reduce((s,p)=>s+p.value,0);
 return `${svg}<div class="waste-chart-legend"><span class="waste-chart-legend-item"><i class="waste-chart-legend-line"></i>Actual Waste Cost</span><span class="waste-chart-legend-item"><i class="waste-chart-legend-line forecast"></i>Forecast Expiry Exposure</span></div><div class="waste-chart-note">Actual total: <b>${wasteChartMoney(totalActual)}</b> &nbsp;·&nbsp; Modelled expiry exposure: <b>${wasteChartMoney(totalForecast)}</b>. Forecast exposure is calculated from Random Forest expiry-risk probability × predicted remaining stock × current unit cost; it is an estimate, not confirmed waste.</div>`;
}
function bindWasteChart(){
 const select=document.getElementById('wasteChartRange');if(!select)return;
 select.onchange=()=>{const target=document.getElementById('wasteChartCanvas');if(target)target.innerHTML=wasteForecastChart(select.value);};
}

function wastePage(){
 const tracked=db.items.filter(i=>i.trackExpiry!==false);
 const expiring=tracked.filter(i=>i.expiry&&i.expiry>=today()&&i.expiry<=plus(Number(db.settings.expiryDays||7)));
 const expired=tracked.filter(i=>i.expiry&&i.expiry<today());
 const rows=tracked.filter(i=>i.expiry).sort((a,b)=>a.expiry.localeCompare(b.expiry));
 const wasteRows=db.waste||[];
 const outcomeRows=db.expiryOutcomes||[];
 const expiredValue=expired.reduce((sum,i)=>sum+Number(i.qty||0)*Number(i.cost||0),0);
 const wasteValue=wasteRows.reduce((sum,w)=>sum+Number(w.cost||0),0);
 const matchedOutcomeIndexes=new Set();

 // Only display verified outcome data. No explanatory filler or placeholder labels.
 const outcomeDetails=outcome=>{
  if(!outcome)return '';
  if(outcome.isDemoSample===true&&Number(outcome.remainingAtExpiry)===0&&Number(outcome.discardedQty)===0)return '';
  const observed=outcome.outcomeStatus==='observed'
    &&Number.isFinite(Number(outcome.remainingAtExpiry))
    &&Number.isFinite(Number(outcome.discardedQty));
  if(!observed)return '';
  return `<div class="expiry-outcome-cell"><span class="pill green">Observed</span><div class="expiry-outcome-facts"><span><b>Remaining:</b> ${Number(outcome.remainingAtExpiry).toLocaleString('en-MY')} ${esc(outcome.unit)}</span><span><b>Discarded:</b> ${Number(outcome.discardedQty).toLocaleString('en-MY')} ${esc(outcome.unit)}</span><span><b>Reason:</b> ${esc(outcome.reason||'Not specified')}</span><span><b>Recorded:</b> ${fmtDateTime(outcome.timestamp)}</span></div></div>`;
 };

 const mergedExpiryRows=rows.map(item=>{
  const outcomeIndex=outcomeRows.findIndex(o=>o.itemId===item.id&&o.expiryDate===item.expiry);
  const outcome=outcomeIndex>=0?outcomeRows[outcomeIndex]:null;
  if(outcomeIndex>=0)matchedOutcomeIndexes.add(outcomeIndex);
  return `<tr>
   <td><b>${esc(item.name)}</b></td>
   <td>${fmtDate(item.expiry)}</td>
   <td>${Number(item.qty||0).toLocaleString('en-MY')} ${esc(item.unit)}</td>
   <td>${expiryStatus(item)}</td>
   <td>${outcomeDetails(outcome)}</td>
  </tr>`;
 });

 const historicalOutcomeRows=outcomeRows.map((outcome,index)=>{
  if(matchedOutcomeIndexes.has(index))return '';
  const details=outcomeDetails(outcome);
  if(!details)return '';
  return `<tr class="historical-expiry-row">
   <td><b>${esc(outcome.itemName)}</b><div class="muted" style="font-size:10px">Historical expiry record</div></td>
   <td>${fmtDate(outcome.expiryDate)}</td>
   <td><span class="muted">Past cycle</span></td>
   <td><span class="pill">Historical</span></td>
   <td>${details}</td>
  </tr>`;
 }).join('');

 const expiryOutcomeTable=mergedExpiryRows.length||historicalOutcomeRows
  ?`<div class="table-wrap"><table><thead><tr><th>Item</th><th>Expiry Date</th><th>Current Stock</th><th>Expiry Status</th><th>Observed Outcome</th></tr></thead><tbody>${mergedExpiryRows.join('')}${historicalOutcomeRows}</tbody></table></div>`
  :'<div class="empty">No expiry dates or expiry outcomes have been recorded yet.</div>';
 const wasteBlock=wasteRows.length?`<div class="table-wrap"><table><thead><tr><th>Item</th><th>Date & Time</th><th>Quantity</th><th>Reason</th><th>Recorded By</th><th>Cost</th></tr></thead><tbody>${wasteRows.map(wasteRecordRow).join('')}</tbody></table></div>`:'<div class="empty">No waste has been recorded yet.</div>';
 return `${head('Expiry & Waste','Monitor current expiry status and review recorded expiry outcomes in one place.')}
 <div class="stats"><div class="stat"><div class="stat-label">EXPIRING SOON</div><div class="stat-value">${expiring.length}</div><div class="stat-note">Within ${db.settings.expiryDays} days</div></div><div class="stat"><div class="stat-label">EXPIRED ITEMS</div><div class="stat-value">${expired.length}</div></div><div class="stat"><div class="stat-label">ESTIMATED EXPIRED STOCK VALUE</div><div class="stat-value" style="font-size:24px">${money(expiredValue)}</div><div class="stat-note">Based on current recorded quantity</div></div><div class="stat"><div class="stat-label">RECORDED WASTE COST</div><div class="stat-value" style="font-size:24px">${money(wasteValue)}</div><div class="stat-note">Based on standard waste records</div></div></div>
 <div class="panel"><div class="row-between"><h3>Expiry Monitoring & Outcome History</h3><span class="muted" style="font-size:12px">Current expiry status and recorded outcomes</span></div>${expiryOutcomeTable}</div>
 <div class="panel"><h3>Waste Records</h3>${wasteBlock}</div>`;
}
function staffPage(){const events=(db.loginActivity||[]).slice(0,100);const eventName=e=>e.event==='login_success'?'Successful login':e.event==='logout'?'Logged out':'Failed login';const eventClass=e=>e.event==='login_success'?'activity-success':e.event==='logout'?'activity-logout':'activity-failed';return `${head('Staff Management','Manage staff accounts and account status.','<button class="primary" id="addStaff">＋ Add Staff</button>')}<div class="panel"><div class="row-between"><h3>Staff Accounts</h3><span class="muted" style="font-size:12px">${db.staff.length} account(s)</span></div><div class="table-wrap"><table class="account-table"><thead><tr><th>Staff Name</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead><tbody>${db.staff.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td><code>${esc(s.username)}</code></td><td><span class="pill ${s.status==='Active'?'green':'red'}">${esc(s.status)}</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="secondary small-btn" data-toggle-staff="${esc(s.id)}">${s.status==='Active'?'Disable':'Activate'}</button><button class="danger small-btn" data-delete-staff="${esc(s.id)}">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="4">No staff accounts yet.</td></tr>'}</tbody></table></div></div><div class="panel" style="margin-top:20px"><div class="row-between"><h3>Login Activity</h3><span class="muted" style="font-size:12px">Latest 100 events</span></div><div class="table-wrap"><table><thead><tr><th>Username</th><th>Role</th><th>Activity</th><th>Date &amp; Time (MYT)</th></tr></thead><tbody>${events.map(e=>`<tr><td><b>${esc(e.username)}</b></td><td>${e.role==='owner'?'Owner':'Staff'}</td><td class="${eventClass(e)}">${eventName(e)}${e.isDemoSample?' <span class="pill amber" style="margin-left:6px">Demo sample</span>':''}</td><td>${esc(fmtDateTime(e.timestamp))}</td></tr>`).join('')||'<tr><td colspan="4">No login activity recorded yet.</td></tr>'}</tbody></table></div></div>`}
function toggleStaff(id){const s=db.staff.find(x=>x.id===id);if(s){s.status=s.status==='Active'?'Disabled':'Active';if(s.status!=='Active'&&currentUser&&String(currentUser.id)===String(s.id)){currentUser={id:'owner',name:'Owner Account',username:'stockpilot_owner',role:'owner'};role='owner';page='dashboard';selectedItem=null;}save();render();toast('Staff status updated')}}
function settingsPage(){
 const demoIds=new Set(db.items.filter(i=>i.isDemoSample).map(i=>String(i.id)));
 const isDemoRow=row=>!!row&&(row.isDemoSample===true||demoIds.has(String(row.itemId)));
 const demoObserved=(db.expiryOutcomes||[]).filter(o=>isDemoRow(o)&&o.outcomeStatus==='observed').length;
 const realObserved=(db.expiryOutcomes||[]).filter(o=>!isDemoRow(o)&&o.outcomeStatus==='observed').length;
 const demoPred=(db.mlPredictionSnapshots||[]).filter(isDemoRow).length;
 const realPred=(db.mlPredictionSnapshots||[]).filter(s=>!isDemoRow(s)).length;
 return `${head('Settings','Basic restaurant and inventory configuration.')}
 <div class="panel" style="max-width:680px"><h3>Restaurant Settings</h3><div class="form-grid"><div class="field full"><label>Restaurant Name</label><input id="setRestaurant" value="${esc(db.settings.restaurant)}"></div><div class="field"><label>Expiring Soon Threshold (days)</label><input id="setExpiry" type="number" min="1" max="90" value="${db.settings.expiryDays}"></div><div class="field"><label>Currency</label><select id="setCurrency"><option ${db.settings.currency==='RM'?'selected':''}>RM</option><option ${db.settings.currency==='USD'?'selected':''}>USD</option><option ${db.settings.currency==='SGD'?'selected':''}>SGD</option></select></div></div><div style="margin-top:18px"><button class="primary" id="saveSettings">Save Settings</button></div></div>
 
 <div class="panel" style="max-width:760px"><h3>ML Data Collection</h3><p class="muted">Successful predictions are captured with their exact input features and timestamps. Confirmed expiry outcomes are recorded only when the existing workflow can verify the stock balance at expiry. Unknown outcomes remain Unknown and are never converted to zero.</p>
 <div class="form-grid">
  <div class="field"><label>Synthetic / Demo Dataset</label><div class="muted">${db.items.filter(i=>i.isDemoSample).length} demo items · ${db.records.filter(isDemoRow).length} stock events · ${db.waste.filter(isDemoRow).length} waste records · ${demoObserved} observed demo outcomes · ${demoPred} prediction snapshots</div></div>
  <div class="field"><label>User / Operational Dataset</label><div class="muted">${db.items.filter(i=>!i.isDemoSample).length} user items · ${db.records.filter(r=>!isDemoRow(r)).length} stock events · ${db.waste.filter(w=>!isDemoRow(w)).length} waste records · ${realObserved} observed outcomes · ${realPred} prediction snapshots</div></div>
 </div>
 <div class="row-between" style="flex-wrap:wrap;gap:12px;margin-top:14px"><span class="muted">Both datasets are kept separate. Demo outcomes are synthetic workflow labels, not real restaurant observations.</span><button class="secondary" id="exportMLData">↓ Export ML Data (JSON)</button></div>
 <div class="notice" style="margin-top:14px"><b>Automatic Random Forest Retraining</b><br>${db.mlRetrainedModel?`Active model: ${esc(db.mlRetrainedModel.modelData?.version||'Locally retrained')} · ${db.mlRetrainedModel.labeledCohorts||0} labelled item-expiry cohorts`:'Embedded baseline model active'}<br>${db.mlRetraining?.status==='retrained_model_updated'?'The latest candidate passed held-out validation and was saved locally.':db.mlRetraining?.status==='candidate_not_better'?'A candidate was evaluated; the previous model was retained because validation did not improve.':`Waiting for confirmed outcomes (${db.mlRetraining?.labeledCohorts||0}/12 eligible item-expiry outcomes).`}<br><span class="muted">${esc(db.mlRetraining?.message||'Retraining starts automatically after enough confirmed expiry outcomes are available. Predictions and inventory movements alone are not training labels.')}</span></div>
 <p class="muted" style="font-size:12px;margin-top:12px">Data stays in this browser until exported. Exporting does not train the model; confirmed outcomes trigger local training and a held-out validation check.</p></div>
 <div class="panel" style="max-width:680px"><h3>Data & Privacy</h3><p class="muted">This prototype stores data in this browser's local storage. It is not yet a shared cloud database and does not sync between devices.</p><button class="danger" id="resetDemo">Reset Demo Data</button></div>`;
}
function exportMLData(){
 if(role!=='owner'){toast('Only Owner can export ML data');return}
 const demoIds=new Set(db.items.filter(i=>i.isDemoSample).map(i=>String(i.id)));
 const isDemoRow=row=>!!row&&(row.isDemoSample===true||demoIds.has(String(row.itemId)));
 const isReal=row=>!!row&&!isDemoRow(row);
 const enrichEvent=r=>{const i=db.items.find(x=>String(x.id)===String(r.itemId))||{};return {...r,category:r.category||i.category||'Other',minimumStock:r.minimumStock??Number(i.min||0),unitCost:r.unitCost??Number(i.cost||0),expiryDate:r.expiryDate||i.expiry||'',restaurantName:r.restaurantName||db.settings.restaurant||'My Restaurant'}};
 const enrichWaste=w=>({...w,restaurantName:w.restaurantName||db.settings.restaurant||'My Restaurant'});
 const enrichOutcome=o=>({...o,restaurantName:o.restaurantName||db.settings.restaurant||'My Restaurant',outcomeStatus:o.outcomeStatus||'unknown'});
 const confirmed=o=>o&&o.outcomeStatus==='observed'&&Number.isFinite(Number(o.remainingAtExpiry))&&Number.isFinite(Number(o.discardedQty));
 const demoItems=db.items.filter(i=>i.isDemoSample).map(i=>({itemId:i.id,itemName:i.name,category:i.category||'Other',unit:i.unit,currentStock:Number(i.qty||0),minimumStock:Number(i.min||0),unitCost:Number(i.cost||0),expiryDate:i.expiry||'',trackExpiry:i.trackExpiry!==false,isDemoSample:true}));
 const realItems=db.items.filter(i=>!i.isDemoSample).map(i=>({itemId:i.id,itemName:i.name,category:i.category||'Other',unit:i.unit,currentStock:Number(i.qty||0),minimumStock:Number(i.min||0),unitCost:Number(i.cost||0),expiryDate:i.expiry||'',trackExpiry:i.trackExpiry!==false,isDemoSample:false}));
 const demoPredictions=(db.mlPredictionSnapshots||[]).filter(isDemoRow).map(s=>({...s}));
 const realPredictions=(db.mlPredictionSnapshots||[]).filter(isReal).map(s=>({...s}));
 const demoOutcomes=(db.expiryOutcomes||[]).filter(isDemoRow).map(enrichOutcome);
 const realOutcomes=(db.expiryOutcomes||[]).filter(isReal).map(enrichOutcome);
 // Supervised examples are created only by joining an exact prediction-time feature snapshot
 // to a confirmed outcome for the same item + expiry date. Prediction outputs are never labels.
 const makeTrainingExamples=(predictions,outcomes,isSynthetic)=>predictions.flatMap(s=>{
  const o=outcomes.find(x=>String(x.itemId)===String(s.itemId)&&String(x.expiryDate)===String(s.expiryDate)&&confirmed(x));
  const f=s.apiRequestFeatures;
  if(!o||!f||!Number.isFinite(Number(o.remainingAtExpiry))||!Number.isFinite(Number(o.discardedQty)))return [];
  return [{
   itemId:s.itemId,itemName:s.itemName,category:s.category,unit:s.unit,expiryDate:s.expiryDate,
   snapshotDate:s.snapshotDate,features:{...f},
   targets:{hasRemainingAtExpiry:Number(o.remainingAtExpiry)>0?1:0,remainingAtExpiry:Number(o.remainingAtExpiry),discardedQty:Number(o.discardedQty)},
   labelSource:isSynthetic?'confirmed_demo_workflow_outcome':'confirmed_operational_outcome',
   isSynthetic:!!isSynthetic,modelOutputUsedAsLabel:false
  }];
 });
 const demoStockEvents=(db.records||[]).filter(isDemoRow).map(enrichEvent);
 const realStockEvents=(db.records||[]).filter(isReal).map(enrichEvent);
 const demoWaste=(db.waste||[]).filter(isDemoRow).map(enrichWaste);
 const realWaste=(db.waste||[]).filter(isReal).map(enrichWaste);
 const demoEventSnapshots=(db.mlFeatureSnapshots||[]).filter(isDemoRow).map(s=>({...s}));
 const realEventSnapshots=(db.mlFeatureSnapshots||[]).filter(isReal).map(s=>({...s}));
 const demoExamples=makeTrainingExamples(demoPredictions,demoOutcomes,true);
 const realExamples=makeTrainingExamples(realPredictions,realOutcomes,false);
 const payload={
  schemaVersion:'1.2',exportedAt:now(),timezone:'Asia/Kuala_Lumpur',
  restaurant:{name:db.settings.restaurant||'My Restaurant',currency:db.settings.currency||'RM'},
  dataQualityNotes:[
   'Demo catalogue events are included in syntheticDemoDataset and are labelled synthetic/demo.',
   'operationalDataset contains only user-created items and their events.',
   'Stock events and pre-action snapshots are operational features, not independently verified labels.',
   'Only expiryOutcomes with outcomeStatus=observed and numeric remainingAtExpiry and discardedQty are eligible supervised labels.',
   'trainingExamples are joined by itemId and expiryDate from prediction-time features to confirmed outcomes; prediction outputs are never labels.',
   'Demo training examples remain synthetic and must not be used to claim real-restaurant model accuracy.',
   'Unknown, pending or unverified outcomes remain excluded from supervised targets.',
   'eventFeatureSnapshots are pre-inventory-action audit snapshots; predictionSnapshots contain exact features used for successful displayed predictions.',
   'avgDailyUsage counts only Stock Out events explicitly marked Usage; waste and transfer events are excluded.',
   'This export does not itself train or update the embedded browser model.'
  ],
  operationalDataset:{
   items:realItems,featureSnapshots:realPredictions,eventFeatureSnapshots:realEventSnapshots,
   stockEvents:realStockEvents,wasteRecords:realWaste,expiryOutcomes:realOutcomes,
   supervisedTrainingExamples:realExamples,supervisedTrainingExampleCount:realExamples.length
  },
  syntheticDemoDataset:{
   datasetType:'synthetic_demo_workflow_data',isSynthetic:true,
   items:demoItems,featureSnapshots:demoPredictions,eventFeatureSnapshots:demoEventSnapshots,
   stockEvents:demoStockEvents,wasteRecords:demoWaste,expiryOutcomes:demoOutcomes,
   supervisedTrainingExamples:demoExamples,supervisedTrainingExampleCount:demoExamples.length,
   dataQualityNote:'These records come from the seeded/demo catalogue and demo workflow. They can support competition demonstrations and synthetic experiments, but are not verified real-restaurant observations.'
  },
  // Backwards-compatible top-level fields remain operational/user data only.
  items:realItems,featureSnapshots:realPredictions,eventFeatureSnapshots:realEventSnapshots,
  stockEvents:realStockEvents,wasteRecords:realWaste,expiryOutcomes:realOutcomes,
  excludedSeedItemCount:demoItems.length,
  syntheticDemoItemCount:demoItems.length,
  syntheticDemoStockEventCount:demoStockEvents.length,
  syntheticDemoWasteRecordCount:demoWaste.length,
  syntheticDemoObservedOutcomeCount:demoOutcomes.filter(confirmed).length,
  syntheticDemoTrainingExampleCount:demoExamples.length,
  operationalItemCount:realItems.length,
  operationalStockEventCount:realStockEvents.length,
  operationalWasteRecordCount:realWaste.length,
  operationalObservedOutcomeCount:realOutcomes.filter(confirmed).length,
  operationalTrainingExampleCount:realExamples.length,
  automaticRetrainingStatus:db.mlRetraining?({...db.mlRetraining}):{status:'not_started'},
  activeLocalModel:db.mlRetrainedModel?{
   version:db.mlRetrainedModel.modelData?.version||'unknown',
   trainedAt:db.mlRetrainedModel.trainedAt||null,
   labeledCohorts:db.mlRetrainedModel.labeledCohorts||0,
   syntheticCohorts:db.mlRetrainedModel.syntheticCohorts||0,
   operationalCohorts:db.mlRetrainedModel.operationalCohorts||0
  }:{version:window.STOCKPILOT_MODEL_DATA?.version||'embedded-base-model',trainedAt:null,labeledCohorts:0,syntheticCohorts:0,operationalCohorts:0}
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`stockpilot_ml_data_${today()}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast('ML data exported with Synthetic Demo and Operational datasets separated');
}
function itemModal(item=null){if(role!=='owner'){toast('Only Owner can edit item information');return}const isEdit=!!item;openModal(isEdit?'Edit Item':'Add Item',`<div class="form-grid"><div class="field full"><label>Item Name *</label><input id="fName" value="${esc(item?.name||'')}" required></div><div class="field"><label>Category</label><input id="fCategory" value="${esc(item?.category||'')}" placeholder="e.g. Meat"></div><div class="field"><label>Unit</label><input id="fUnit" value="${esc(item?.unit||'kg')}" placeholder="kg, bottle, pack"></div><div class="field"><label>Current Quantity</label><input id="fQty" type="number" step="0.01" value="${item?.qty??0}"></div><div class="field"><label>Minimum Stock</label><input id="fMin" type="number" step="0.01" value="${item?.min??0}"></div><div class="field"><label>Unit Cost (RM)</label><input id="fCost" type="number" step="0.01" value="${item?.cost??0}"></div><div class="field"><label>Supplier</label><input id="fSupplier" value="${esc(item?.supplier||'')}"></div><div class="field"><label>Expiry Date (optional, required for AI prediction)</label><input id="fExpiry" type="date" value="${item?.expiry||''}"></div><div class="field full"><label>Image URL (optional)</label><input id="fImage" value="${esc(item?.image||'')}" placeholder="Paste a photo URL"></div></div>`,`<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="saveItem">Save Item</button>`);document.getElementById('saveItem').onclick=()=>{const name=document.getElementById('fName').value.trim();if(!name){toast('Enter an item name');return}const expiryValue=document.getElementById('fExpiry').value;const expiryEnabled=item?.trackExpiry!==undefined?(item.trackExpiry||!!expiryValue):!!expiryValue;const fields={name,category:document.getElementById('fCategory').value.trim()||'Other',unit:document.getElementById('fUnit').value.trim()||'unit',qty:Number(document.getElementById('fQty').value)||0,min:Number(document.getElementById('fMin').value)||0,cost:Number(document.getElementById('fCost').value)||0,supplier:document.getElementById('fSupplier').value.trim(),trackExpiry:expiryEnabled,trackWaste:item?.trackWaste??false,expiry:expiryValue,image:document.getElementById('fImage').value.trim()||item?.image||'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'};if(isEdit){const before=item.qty;const changed=Object.keys(fields).filter(k=>String(item[k]??'')!==String(fields[k]??''));Object.assign(item,fields);if(changed.length)log(item,before!==item.qty?'Stock Adjustment':'Item Updated',before,item.qty,`Updated: ${changed.join(', ')}`)}else{const ni={id:'i'+Date.now(),...fields,isDemoSample:false};db.items.push(ni);log(ni,'Item Updated',0,ni.qty,'New item created')}save();closeModal();render();toast(isEdit?'Item updated':'Item added')}}
function movementModal(item,type){
 const isWaste=type==='Stock Out';
 openModal(type,`<div class="notice">${esc(item.name)} · Current stock: <b>${item.qty} ${esc(item.unit)}</b></div><div class="form-grid"><div class="field"><label>Quantity *</label><input id="moveQty" type="number" min="0.01" step="0.01" placeholder="Enter quantity"></div><div class="field"><label>Date</label><input type="date" value="${today()}" disabled></div><div class="field full"><label>Reason / Notes</label><select id="moveReason">${type==='Stock In'?'<option value="Purchase">Purchase / Received</option><option value="Return">Supplier return</option><option value="Other">Other</option>':`<option value="Usage">Kitchen usage</option>${item.trackWaste?'<option value="Waste">Waste / Damaged</option>':''}<option value="Transfer">Transfer</option><option value="Other">Other</option>`}</select></div>${type==='Stock Out'&&item.trackWaste?'<div class="field full" id="wasteReasonField" style="display:none"><label>Waste Reason *</label><select id="wasteReason"><option value="">Select a reason</option><option>Spoiled</option><option>Expired</option><option>Over-prepared</option><option>Damaged</option><option>Spillage</option><option>Other</option></select></div>':''}<div class="field full"><label>Notes</label><input id="moveNote" placeholder="Optional notes / details"></div></div>`,`<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="saveMove">Save Record</button>`);
 const moveReasonEl=document.getElementById('moveReason');
 if(moveReasonEl&&document.getElementById('wasteReasonField'))moveReasonEl.onchange=()=>{document.getElementById('wasteReasonField').style.display=moveReasonEl.value==='Waste'?'':'none'};
 document.getElementById('saveMove').onclick=()=>{
  const q=Number(document.getElementById('moveQty').value);if(!q||q<=0){toast('Enter a valid quantity');return}
  const before=item.qty,reason=document.getElementById('moveReason').value,note=document.getElementById('moveNote').value.trim(),wasteReason=document.getElementById('wasteReason')?.value||'';
  if(type==='Stock Out'&&reason==='Waste'&&!wasteReason){toast('Select a waste reason');return}
  if(type==='Stock In')item.qty+=q;else{if(q>item.qty){toast('Quantity exceeds current stock');return}item.qty-=q}
  const eventNote=[reason,reason==='Waste'?wasteReason:'',note].filter(Boolean).join(' · ');
  log(item,type,before,item.qty,eventNote);
  if(type==='Stock Out'&&reason==='Waste'){
   const timestamp=now();
   db.waste.unshift({id:'w'+Date.now(),itemId:item.id,itemName:item.name,category:item.category||'Other',expiryDate:item.expiry||'',restaurantName:db.settings.restaurant||'My Restaurant',qty:q,unit:item.unit,reason:wasteReason,notes:note,cost:q*Number(item.cost||0),actor:actor(),timestamp,isDemoSample:!!item.isDemoSample});
   recordExpiryOutcomeFromWaste(item,before,q,wasteReason,note,timestamp);
   aiAnalyzeInventoryItem(item,true); // Re-run after the waste ledger entry is written.
  }
  save();closeModal();renderDetails();toast(`${type} recorded successfully`);
 };
}
function expiryModal(item){openModal('Expiry & Waste Settings',`<div class="form-grid">${role==='owner'?`<div class="field full"><label>Tracking Settings</label><div class="notice" style="display:grid;gap:12px"><label style="display:flex;align-items:center;gap:10px;font-weight:600"><input id="editTrackExpiry" type="checkbox" ${item.trackExpiry!==false?'checked':''} style="width:17px;height:17px"> Expiry Tracking</label><label style="display:flex;align-items:center;gap:10px;font-weight:600"><input id="editTrackWaste" type="checkbox" ${item.trackWaste?'checked':''} style="width:17px;height:17px"> Waste Tracking</label></div></div>`:''}<div class="field full" id="editExpiryField" style="${item.trackExpiry!==false?'':'display:none'}"><label>Expiry Date</label><input id="newExpiry" type="date" value="${item.expiry||''}"></div></div>`,`<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="saveExpiry">Save Settings</button>`);const ex=document.getElementById('editTrackExpiry');if(ex)ex.onchange=()=>document.getElementById('editExpiryField').style.display=ex.checked?'':'none';document.getElementById('saveExpiry').onclick=()=>{const oldExpiry=item.expiry,oldExpiryFlag=item.trackExpiry,oldWasteFlag=item.trackWaste;if(role==='owner'){item.trackExpiry=ex.checked;item.trackWaste=document.getElementById('editTrackWaste').checked;}item.expiry=item.trackExpiry!==false?(document.getElementById('newExpiry')?.value||''):'';if(oldExpiry!==item.expiry||oldExpiryFlag!==item.trackExpiry||oldWasteFlag!==item.trackWaste)log(item,'Tracking Settings Updated',item.qty,item.qty,`Expiry Tracking: ${item.trackExpiry?'On':'Off'}; Waste Tracking: ${item.trackWaste?'On':'Off'}; Expiry Date: ${item.expiry||'Not set'}`);save();closeModal();renderDetails();toast('Tracking settings updated')}}
function wasteModal(item){
 openModal('Record Waste',`<div class="notice">${esc(item.name)} · Current stock: <b>${item.qty} ${esc(item.unit)}</b></div><div class="form-grid"><div class="field"><label>Quantity Discarded *</label><input id="wasteQty" type="number" min="0.01" step="0.01" placeholder="Enter quantity"></div><div class="field full"><label>Waste Reason *</label><select id="wasteReasonOnly"><option value="">Select a reason</option><option>Spoiled</option><option>Expired</option><option>Over-prepared</option><option>Damaged</option><option>Spillage</option><option>Other</option></select></div><div class="field full"><label>Notes (optional)</label><input id="wasteNotes" placeholder="Additional details"></div><div class="field full muted"><small>Date & time will be recorded automatically: ${fmtDateTime(now())}</small></div></div>`,`<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="saveWaste">Save Waste Record</button>`);
 document.getElementById('saveWaste').onclick=()=>{
  const q=Number(document.getElementById('wasteQty').value),reason=document.getElementById('wasteReasonOnly').value,notes=document.getElementById('wasteNotes').value.trim();
  if(!q||q<=0||q>item.qty){toast('Enter a valid quantity');return}if(!reason){toast('Select a reason');return}
  const before=item.qty,timestamp=now();item.qty-=q;
  db.waste.unshift({id:'w'+Date.now(),itemId:item.id,itemName:item.name,category:item.category||'Other',expiryDate:item.expiry||'',restaurantName:db.settings.restaurant||'My Restaurant',qty:q,unit:item.unit,reason,notes,cost:q*Number(item.cost||0),actor:actor(),timestamp,isDemoSample:!!item.isDemoSample});
  log(item,'Waste',before,item.qty,`${reason}${notes?' · '+notes:''}`);
  recordExpiryOutcomeFromWaste(item,before,q,reason,notes,timestamp);
  save();closeModal();renderDetails();toast('Waste record saved');
 };
}
function openModal(title,body,foot){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=body;document.getElementById('modalFoot').innerHTML=foot;document.getElementById('modalBackdrop').classList.add('open')}
function closeModal(){document.getElementById('modalBackdrop').classList.remove('open')}
document.getElementById('modalClose').onclick=closeModal;document.getElementById('modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()};

document.addEventListener('click',e=>{if(e.target.id==='addStaff')openModal('Add Staff',`<div class="form-grid"><div class="field full"><label>Staff Name</label><input id="staffName" autocomplete="off"></div><div class="field full"><label>Username</label><input id="staffUser" autocomplete="off"></div></div>`,`<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="saveStaff">Add Staff</button>`);if(e.target.id==='saveStaff'){const name=document.getElementById('staffName').value.trim(),username=document.getElementById('staffUser').value.trim();if(!name||!username){toast('Enter staff name and username');return}if(db.staff.some(x=>x.username.toLowerCase()===username.toLowerCase())){toast('This username is already in use');return}db.staff.push({id:'s'+Date.now(),name,username,status:'Active'});save();closeModal();render();toast('Staff account created')}if(e.target.dataset.toggleStaff)toggleStaff(e.target.dataset.toggleStaff);if(e.target.dataset.deleteStaff){const member=db.staff.find(x=>x.id===e.target.dataset.deleteStaff);if(member&&confirm('Delete this staff account?')){db.staff=db.staff.filter(x=>x.id!==member.id);if(currentUser&&String(currentUser.id)===String(member.id)){currentUser={id:'owner',name:'Owner Account',username:'stockpilot_owner',role:'owner'};role='owner';page='dashboard';selectedItem=null;}save();render();toast('Staff account deleted')}}if(e.target.id==='exportMLData'){exportMLData()}if(e.target.id==='saveSettings'){db.settings.restaurant=document.getElementById('setRestaurant').value.trim()||'My Restaurant';db.settings.expiryDays=Math.max(1,Number(document.getElementById('setExpiry').value)||7);db.settings.currency=document.getElementById('setCurrency').value;save();render();toast('Settings saved')}if(e.target.id==='resetDemo'){if(confirm('Reset the local StockPilot dataset to the full competition demo? This also removes user-created items, records and staff accounts in this browser.')){localStorage.removeItem(KEY);db=loadDB();seedDemoOperationalData(true);if(window.STOCKPILOT_MODEL_DATA){try{maybeAutoRetrainRandomForest('demo_reset');db.items.filter(item=>item.isDemoSample&&item.expiry&&item.expiry>=today()).forEach(item=>aiAnalyzeInventoryItem(item,true));}catch(e){console.warn('Demo reset prediction refresh failed:',e);}}save();page='dashboard';selectedItem=null;render();toast('Demo data reset')}}});
function demoSeedTimestamp(daysAgo,hour=12,minute=0){
 const date=plus(-Number(daysAgo||0));
 return new Date(`${date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+08:00`).toISOString();
}
function seedDemoOperationalData(force=false){
 if(!force&&Number(db.demoOperationalDataVersion||0)>=10)return false;
 const definitions=[
  {id:'i1',name:'Chicken',image:img.chicken,category:'Meat',unit:'kg',qty:8,min:5,cost:18,supplier:'Fresh Supplier Co.',expiry:plus(4),opening:12,replenish:4,usage:[1.5,1.2,1.4,1.1,1.3],waste:[{daysAgo:2,qty:1.5,reason:'Spoiled'}]},
  {id:'i2',name:'Milk',image:img.milk,category:'Dairy',unit:'bottle',qty:6,min:10,cost:6.5,supplier:'Dairy Best',expiry:plus(2),opening:10,replenish:3,usage:[1,1,1,1,1],waste:[{daysAgo:4,qty:2,reason:'Spoiled'}]},
  {id:'i3',name:'Tomato',image:img.tomato,category:'Vegetables',unit:'kg',qty:3,min:4,cost:7,supplier:'Green Farm',expiry:plus(-3),opening:8,replenish:2,usage:[1,.8,1.1,.7,.9],waste:[{daysAgo:6,qty:2.5,reason:'Damaged'},{daysAgo:2,qty:1,reason:'Expired'}]},
  {id:'i4',name:'Lettuce',image:img.lettuce,category:'Vegetables',unit:'kg',qty:3,min:3,cost:8,supplier:'Green Farm',expiry:plus(-2),opening:8,replenish:0,usage:[.7,.6,.6,.5,.6],waste:[{daysAgo:1,qty:2,reason:'Expired'}]},
  {id:'i5',name:'Rice',image:img.rice,category:'Dry Goods',unit:'kg',qty:20,min:8,cost:4,supplier:'Food Wholesale',expiry:plus(180),opening:30,replenish:6,usage:[3,3,4,3,3],waste:[]},
  {id:'i6',name:'Cheese',image:img.cheese,category:'Dairy',unit:'pack',qty:4,min:4,cost:12,supplier:'Dairy Best',expiry:plus(12),opening:8,replenish:3,usage:[1,1,1,1,1],waste:[{daysAgo:10,qty:.8,reason:'Spoiled'},{daysAgo:2,qty:1.2,reason:'Over-prepared'}]},
  {id:'i7',name:'Eggs',image:img.eggs,category:'Dairy',unit:'tray',qty:3,min:5,cost:15,supplier:'Farm Fresh',expiry:plus(5),opening:8,replenish:2,usage:[1,1,1,1,1],waste:[{daysAgo:12,qty:.5,reason:'Damaged'},{daysAgo:3,qty:1.5,reason:'Spoiled'}]},
  {id:'i8',name:'Cooking Oil',image:img.oil,category:'Dry Goods',unit:'bottle',qty:9,min:4,cost:10,supplier:'Food Wholesale',expiry:plus(240),opening:12,replenish:2,usage:[1,1,1,1,1],waste:[]}
 ];
 const demoIds=new Set(definitions.map(x=>String(x.id)));
 // Replace only the built-in demo catalogue and its synthetic activity. Keep all user-created records intact.
 definitions.forEach(def=>{
  const item={...def,trackExpiry:true,trackWaste:true,isDemoSample:true};
  const existing=db.items.find(x=>String(x.id)===String(def.id));
  if(existing&&existing.isDemoSample!==false)Object.assign(existing,item);
  else if(!existing)db.items.push(item);
 });
 db.records=(db.records||[]).filter(r=>r.isDemoSample!==true);
 db.waste=(db.waste||[]).filter(w=>w.isDemoSample!==true);
 db.expiryOutcomes=(db.expiryOutcomes||[]).filter(o=>o.isDemoSample!==true);
 db.mlFeatureSnapshots=(db.mlFeatureSnapshots||[]).filter(x=>x.isDemoSample!==true);
 db.mlPredictionSnapshots=(db.mlPredictionSnapshots||[]).filter(x=>x.isDemoSample!==true);
 db.loginActivity=(db.loginActivity||[]).filter(e=>e.isDemoSample!==true);
 db.settings=db.settings||{restaurant:'StockPilot Demo Kitchen',expiryDays:7,currency:'RM'};
 if(!db.settings.restaurant||db.settings.restaurant==='My Restaurant')db.settings.restaurant='StockPilot Demo Kitchen';
 db.settings.expiryDays=7;db.settings.currency='RM';
 db.staff=(db.staff||[]).filter(member=>!['staff.b','aisha_staff'].includes(String(member.username||'').toLowerCase())&&!['s2','s-demo-aisha'].includes(String(member.id||'')));
 if(!db.staff.some(x=>x.username==='stockpilot_staff'))db.staff.unshift({id:'s-demo',name:'staff_01',username:'stockpilot_staff',status:'Active'});
 const competitionStaff=db.staff.find(x=>x.username==='stockpilot_staff');
 if(competitionStaff){competitionStaff.name='staff_01';competitionStaff.status='Active';}
 // Build a 4-week stock ledger with consistent opening, replenishment, usage and waste quantities.
 for(const def of definitions){
  let running=0;
  const timeline=[{daysAgo:27,kind:'in',qty:def.opening,note:'Purchase · Opening supplier delivery'}];
  [24,20,13,8,5].forEach((daysAgo,index)=>timeline.push({daysAgo,kind:'usage',qty:def.usage[index],note:`Usage · ${['Breakfast preparation','Lunch service','Dinner preparation','Kitchen service','Daily preparation'][index]}`}));
  if(def.replenish>0)timeline.push({daysAgo:16,kind:'in',qty:def.replenish,note:'Purchase · Supplier replenishment'});
  def.waste.forEach(w=>timeline.push({daysAgo:w.daysAgo,kind:'waste',qty:w.qty,reason:w.reason}));
  
  timeline.sort((a,b)=>b.daysAgo-a.daysAgo);
  let eventIndex=0;
  for(const event of timeline){
   const timestamp=demoSeedTimestamp(event.daysAgo,event.kind==='in'?9:event.kind==='waste'?16:12);
   const before=running;let type,note;
   if(event.kind==='in'){running+=event.qty;type='Stock In';note=event.note;}
   else if(event.kind==='usage'){running-=event.qty;type='Stock Out';note=event.note;}
   else if(event.kind==='waste'){
    running-=event.qty;type='Stock Out';note=`Waste · ${event.reason} · Preloaded competition sample`;
    db.waste.push({id:`demo-w-${def.id}-${eventIndex}`,itemId:def.id,itemName:def.name,category:def.category,expiryDate:def.expiry,restaurantName:db.settings.restaurant,qty:event.qty,unit:def.unit,reason:event.reason,notes:'Preloaded synthetic competition demo record',cost:Number((event.qty*def.cost).toFixed(2)),actor:'Demo Staff · staff_01',timestamp,isDemoSample:true});
   }
   db.records.push({id:`demo-r-${def.id}-${eventIndex}`,itemId:def.id,itemName:def.name,category:def.category,type,qtyBefore:Number(before.toFixed(3)),qtyAfter:Number(running.toFixed(3)),delta:Number((running-before).toFixed(3)),unit:def.unit,minimumStock:def.min,unitCost:def.cost,expiryDate:def.expiry,restaurantName:db.settings.restaurant,actor:event.kind==='in'?'Demo Owner · Competition': 'Demo Staff · staff_01',timestamp,note,source:'stockpilot_inventory_action',isDemoSample:true});
   if(event.kind==='waste'&&event.reason==='Expired'){
    const item=db.items.find(x=>x.id===def.id);
    recordExpiryOutcomeFromWaste(item,before,event.qty,event.reason,'Expired batch disposed in the demo workflow',timestamp);
   }
   eventIndex++;
  }
  const item=db.items.find(x=>x.id===def.id);
  item.qty=Number(running.toFixed(3));
 }
 db.records.sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 db.waste.sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 // Add an explicit pre-expiry prediction snapshot for the current Tomato expiry cohort.
 // It is a synthetic demo fixture, marked as such, and is paired only with the
 // matching observed outcome created by the expired-waste event above.
 const tomatoDemoItem=db.items.find(item=>item.id==='i3');
 if(tomatoDemoItem&&tomatoDemoItem.expiry&&tomatoDemoItem.expiry<today()){
  const tomatoExpirySnapshotDate=demoSeedTimestamp(10,10);
  const tomatoSnapshotFeatures={
   item_category:'vegetables',
   current_stock:7.1,
   average_daily_usage:0.18,
   days_until_expiry:7,
   recent_usage_trend:0.95,
   historical_waste_rate:0
  };
  if(!db.mlPredictionSnapshots.some(snapshot=>snapshot.itemId==='i3'&&snapshot.expiryDate===tomatoDemoItem.expiry&&snapshot.snapshotDate)){
   db.mlPredictionSnapshots.push({
    id:'demo-current-tomato-prediction',
    predictionId:'demo-current-tomato-expiry',
    itemId:tomatoDemoItem.id,
    itemName:tomatoDemoItem.name,
    expiryDate:tomatoDemoItem.expiry,
    snapshotDate:tomatoExpirySnapshotDate,
    predictionTime:tomatoExpirySnapshotDate,
    currentStock:tomatoSnapshotFeatures.current_stock,
    avgDailyUsage:tomatoSnapshotFeatures.average_daily_usage,
    daysUntilExpiry:tomatoSnapshotFeatures.days_until_expiry,
    recentUsageTrend:tomatoSnapshotFeatures.recent_usage_trend,
    historicalWasteRate:tomatoSnapshotFeatures.historical_waste_rate,
    category:'Vegetables',
    unit:tomatoDemoItem.unit,
    restaurantName:db.settings.restaurant,
    snapshotType:'synthetic_training_example',
    snapshotTiming:'prediction_time',
    featureSource:'synthetic_demo_fixture',
    apiRequestFeatures:tomatoSnapshotFeatures,
    usageObservationDays:14,
    modelType:'Random Forest',
    modelVersion:'synthetic-demo-cohort',
    modelValidation:'synthetic_demo_data_not_validated_for_real_business_use',
    expiryRiskProbability:72,
    riskLevel:'HIGH',
    predictedRemainingStock:3.6,
    modelOutputIsLabel:false,
    labelStatus:'paired_with_synthetic_demo_outcome',
    dataSource:'synthetic_demo_training_fixture',
    isDemoSample:true
   });
  }
 }

 // Add balanced, explicitly synthetic historical expiry cohorts so the demo can exercise the local auto-retraining evaluation flow.
 const trainingItems=definitions.filter(x=>['Meat','Dairy','Vegetables'].includes(x.category));
 let cohort=0;
 for(let cycle=0;cycle<3;cycle++){
  trainingItems.forEach((def,index)=>{
   const daysAgo=75+cycle*65+index*2;
   const expiryDate=plus(-daysAgo),snapshotDate=demoSeedTimestamp(daysAgo+7,10),outcomeTime=demoSeedTimestamp(daysAgo-1,15);
   const currentStock=Number((9+index*1.7+cycle*1.2).toFixed(2));
   const remainingClass=cycle===2?1:((index+cycle)%2===0?0:1);
   const remaining=remainingClass?Number((currentStock*.32).toFixed(2)):0;
   const features={item_category:def.category.toLowerCase(),current_stock:currentStock,average_daily_usage:Number((.45+index*.12+cycle*.08).toFixed(3)),days_until_expiry:7+index%3,recent_usage_trend:Number((.72+index*.09).toFixed(3)),historical_waste_rate:Number((.08+index*.035).toFixed(3))};
   db.mlPredictionSnapshots.push({id:`demo-hist-pred-${cohort}`,predictionId:`demo-hist-${cohort}`,itemId:def.id,itemName:def.name,expiryDate,snapshotDate,predictionTime:snapshotDate,currentStock,avgDailyUsage:features.average_daily_usage,daysUntilExpiry:features.days_until_expiry,recentUsageTrend:features.recent_usage_trend,historicalWasteRate:features.historical_waste_rate,category:def.category,unit:def.unit,restaurantName:db.settings.restaurant,snapshotType:'synthetic_training_example',snapshotTiming:'prediction_time',featureSource:'synthetic_demo_fixture',apiRequestFeatures:features,usageObservationDays:14,modelType:'Random Forest',modelVersion:'synthetic-demo-cohort',modelValidation:'synthetic_demo_data_not_validated_for_real_business_use',expiryRiskProbability:remainingClass?68:32,riskLevel:remainingClass?'MEDIUM':'LOW',predictedRemainingStock:currentStock*.4,modelOutputIsLabel:false,labelStatus:'paired_with_synthetic_demo_outcome',dataSource:'synthetic_demo_training_fixture',isDemoSample:true});
   db.expiryOutcomes.push({id:`demo-hist-outcome-${cohort}`,itemId:def.id,itemName:def.name,category:def.category,restaurantName:db.settings.restaurant,unit:def.unit,expiryDate,remainingAtExpiry:remaining,discardedQty:remainingClass?Number((currentStock*.25).toFixed(2)):0,remainingAfterDiscard:remainingClass?Number((remaining-currentStock*.25).toFixed(2)):0,discardedCost:Number((def.cost*(remainingClass?currentStock*.25:0)).toFixed(2)),observedDiscardedQty:remainingClass?Number((currentStock*.25).toFixed(2)):0,minimumStock:def.min,unitCost:def.cost,reason:'Expired',notes:'Synthetic demo training example; not a verified restaurant observation.',actor:'Demo Dataset',timestamp:outcomeTime,labelSource:'synthetic_demo_workflow_outcome',outcomeStatus:'observed',stockAtExpirySource:`demo-hist-stock-${cohort}`,isDemoSample:true});
   cohort++;
  });
 }
 const sampleActivity=[
  {event:'login_success',username:'stockpilot_staff',role:'staff',timestamp:demoSeedTimestamp(1,8)},
  {event:'logout',username:'stockpilot_staff',role:'staff',timestamp:demoSeedTimestamp(1,17)},
  {event:'login_failed',username:'stockpilot_staff',role:'staff',timestamp:demoSeedTimestamp(2,9,3)},
  {event:'login_success',username:'stockpilot_owner',role:'owner',timestamp:demoSeedTimestamp(0,8)}
 ];
 db.loginActivity.push(...sampleActivity.map((e,i)=>({...e,id:`demo-auth-${i}`,isDemoSample:true})));
 db.loginActivity.sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 db.demoOperationalDataVersion=10;
 return true;
}

// Upgrade the built-in competition workspace once (v10 cleaned inventory history), then generate live predictions from its seeded usage ledger.
seedDemoOperationalData();
if(window.STOCKPILOT_MODEL_DATA){
 try{maybeAutoRetrainRandomForest('demo_seed_initialization');}catch(e){console.warn('Demo retraining preview unavailable:',e);}
 db.items.filter(item=>item.isDemoSample&&item.expiry&&item.expiry>=today()).forEach(item=>{try{aiAnalyzeInventoryItem(item,true);}catch(e){console.warn('Demo prediction unavailable for',item.name,e);}});
}
autoRecordZeroStockExpiryOutcomes();
render();
