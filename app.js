'use strict';
const {EXERCISES:E,SOURCES,EQUIPMENT}=FitData;
const F=FitEngine;
const STORE='zizailian-v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checked=(a,b)=>a===b?'checked':'';
const selected=(a,b)=>a===b?'selected':'';
const blank=()=>({version:1,profile:null,draft:null,history:[],measurements:[],mealChecks:{},session:null});
let state=blank(),storageOkay=true,loadError=false;
try{const raw=localStorage.getItem(STORE);if(raw){state=validateBackup(JSON.parse(raw));}}catch(e){loadError=true;storageOkay=false;}
let route=location.hash.slice(1)||'today',step=0,draft=state.draft||defaultDraft(),editMode=false,planTab=0,mealDay=0;
let timerEnd=0,timerInterval=null,toastTimeout;
function defaultDraft(){return{age:'',sex:'',height:'',weight:'',goal:'recomp',focus:'balanced',experience:'new',equipment:[],maxDumbbell:'',adjustable:false,days:[0,2,4],minutes:30,sleep:'',activity:'low',foodMode:'home',diet:'mixed',budget:'low',allergyTags:[],allergies:'',notes:'',health:{symptoms:'',condition:'',pain:'',pregnancy:'',eating:''}};}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));storageOkay=true;return true;}catch(e){storageOkay=false;toast('浏览器未能保存。请立即导出备份，不要关闭页面。');return false;}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),3600);}
function nav(to){route=to;location.hash=to;render();window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',()=>{route=location.hash.slice(1)||'today';render();});
function modal(title,body){$('#modal-content').innerHTML=`<div class="modal-head"><h2>${esc(title)}</h2><button class="icon-button" data-action="close" aria-label="关闭窗口">×</button></div>${body}`;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){$('#modal').close();}
function field(name,label,value,type='text',extra='',help=''){return `<label class="field"><span class="field-label">${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}>${help?`<span class="field-help">${help}</span>`:''}</label>`;}
function choice(name,value,title,help='',isChecked=false,type='radio'){return `<label class="choice"><input type="${type}" name="${name}" value="${value}" ${isChecked?'checked':''}><span><strong>${title}</strong>${help?`<small>${help}</small>`:''}</span></label>`;}
function selectField(name,label,options,value,help=''){return `<label class="field"><span class="field-label">${label}</span><select name="${name}">${options.map(([v,t])=>`<option value="${v}" ${selected(value,v)}>${t}</option>`).join('')}</select>${help?`<span class="field-help">${help}</span>`:''}</label>`;}
function render(){
 const main=$('#main');
 const validRoutes=['today','plan','food','record','profile','session'];if(!validRoutes.includes(route))route='today';
 $('#navigation').hidden=!state.profile||editMode||route==='session';
 if(!state.profile||editMode){renderSetup();return;}
 $('#navigation').innerHTML=[['today','◷','今天'],['plan','▦','计划'],['food','◒','饮食'],['record','▤','记录'],['profile','◎','我的']].map(([id,icon,label])=>`<button data-nav="${id}" class="${route===id?'active':''}" ${route===id?'aria-current="page"':''}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</button>`).join('');
 const plan=F.makePlan(state.profile,state.history);
 if(!plan.valid){main.innerHTML=`<div class="card"><h1>资料需要补充</h1><p>${esc(plan.errors.join(' '))}</p><button class="btn" data-action="edit">编辑资料</button></div>`;return;}
 const prefix=!storageOkay?'<div class="banner">当前不能可靠保存到浏览器。请在“我的”导出备份后再关闭页面。</div>':'';
 if(route==='session'){main.innerHTML=prefix+renderSession();return;}
 main.innerHTML=prefix+({today:()=>renderToday(plan),plan:()=>renderPlan(plan),food:()=>renderFood(plan),record:renderRecord,profile:renderProfile}[route]());
}
function renderSetup(){
 const titles=['先认识现在的你','你想练成什么样','用你已经有的器材','给计划加一道健康检查','把训练放进你的生活'];
 const intros=['所有资料在这里填写。数据保存在当前浏览器，不需要账号。','选择最想改善的方向，同时保留全身基础训练。','没有器材也可以开始。有哑铃时，填写单只重量。','这些回答决定本版是否适合自动安排负重与饮食。','选你确实有空的日期，计划会为恢复留出间隔。'];
 let content='';
 if(step===0)content=`<div class="grid-2">${field('age','年龄',draft.age,'number','min="10" max="100" step="1" inputmode="numeric" required')}${selectField('sex','生理性别',[['','请选择'],['male','男性'],['female','女性'],['skip','不提供（不估算热量）']],draft.sex)}</div><div class="grid-2">${field('height','身高 · 厘米',draft.height,'number','min="100" max="230" step="0.1" inputmode="decimal" required')}${field('weight','体重 · 公斤',draft.weight,'number','min="25" max="250" step="0.1" inputmode="decimal" required')}</div><div class="note">本版自动计划面向 18–64 岁、没有相关健康风险的成人。其他情况仍能使用资料与学习功能，但不会自动给出负重或减脂处方。</div><label class="inline-label"><input type="checkbox" name="localConsent" ${draft.localConsent?'checked':''} required><span class="small">我了解资料只保存在当前浏览器；清理网站数据会丢失记录，需要定期导出备份。</span></label>`;
 if(step===1)content=`<label class="field-label">目前最重要的目标</label><div class="choices">${Object.entries(F.GOALS).map(([k,v])=>choice('goal',k,v,{recomp:'建立肌肉与线条，先不急着改变体重',build:'逐步增加力量和肌肉量',lose:'温和减少脂肪，保留力量',health:'精力、体能与持续运动'}[k],draft.goal===k)).join('')}</div><label class="field field-label">最想改善的体型重点</label><div class="choices">${Object.entries(F.FOCUS).map(([k,v])=>choice('focus',k,v,'',draft.focus===k)).join('')}</div>${selectField('experience','运动基础',[['new','刚开始，或几乎没练过'],['return','练过，但停了较长时间'],['regular','已有稳定运动习惯']],draft.experience)}<div class="note">肌肉比例、脂肪分布和骨骼条件会影响外形。选择重点用于调整训练，不保证复制他人身材；腹部训练也不能指定只减腹部脂肪。</div>`;
 if(step===2)content=`<div class="choices">${EQUIPMENT.map(([k,v,h])=>choice('equipment',k,v,h,draft.equipment.includes(k),'checkbox')).join('')}</div><p class="field-help">没有这些器材可以全部不选。短环形弹力带、单杠、杠铃等暂未接入自动排课，可在备注中记录。</p><div id="dumbbell-fields" ${draft.equipment.includes('dumbbell')?'':'hidden'}>${field('maxDumbbell','单只哑铃最大可用重量 · 公斤',draft.maxDumbbell,'number','min="0.1" max="100" step="0.1" inputmode="decimal"','一对各 5 公斤，填 5；这个数字不是起始训练重量。')}<label class="inline-label"><input type="checkbox" name="adjustable" ${draft.adjustable?'checked':''}>哑铃可以调节重量</label></div><label class="field"><span class="field-label">其他器材 / 想补充的情况（可选）</span><textarea name="notes" maxlength="1000" placeholder="例如：瑜伽垫、固定哑铃只有一个重量">${esc(draft.notes)}</textarea><span class="field-help">备注用于保留信息；本版按上面勾选的器材排课，不会自动理解备注中的新器材。</span></label>`;
 if(step===3){const questions=[['symptoms','运动时或近期有胸痛、晕厥、明显异常气短？'],['condition','有慢性病、规律用药，或医生要求限制运动？'],['pain','有持续疼痛、未恢复的伤病，或处于术后恢复期？'],['pregnancy','处于孕期、产后恢复期或哺乳期？'],['eating','有进食障碍史，或近期不明原因的明显体重变化？']];content=questions.map(([key,title])=>`<fieldset class="field" style="border:0;padding:0"><legend class="field-label">${title}</legend><div class="choices" style="grid-template-columns:repeat(3,1fr)">${[['no','没有'],['yes','有'],['unsure','不确定']].map(([v,t])=>choice(`health_${key}`,v,t,'',draft.health[key]===v)).join('')}</div></fieldset>`).join('')+'<div class="note">选择“有”或“不确定”时，仍能保存资料，但本版会暂停自动处方，提示先找专业人员评估。这是适用范围检查，不能替代诊断。</div>';}
 if(step===4)content=`<span class="field-label">哪几天方便运动？</span><div class="choices">${F.DAYS.map((v,i)=>choice('days',i,v,'',draft.days.includes(i),'checkbox')).join('')}</div>${selectField('minutes','每次可用时间',[['20','约 20 分钟'],['30','约 30 分钟'],['45','约 45 分钟'],['60','约 60 分钟']],String(draft.minutes))}<div class="grid-2">${field('sleep','平时每晚睡多久 · 小时',draft.sleep,'number','min="0" max="16" step="0.5" inputmode="decimal" required')}${selectField('activity','日常活动量',[['low','多数时间坐着，走动较少'],['medium','经常走动或站立'],['high','工作活动较多、体力消耗较大']],draft.activity)}</div>${selectField('foodMode','主要在哪里吃',[['home','自己做饭'],['canteen','食堂'],['takeout','外卖 / 餐馆']],draft.foodMode)}<div class="grid-2">${selectField('diet','饮食方式',[['mixed','一般饮食'],['vegetarian','蛋奶素'],['vegan','纯素']],draft.diet)}${selectField('budget','饮食预算偏好',[['low','节省为主，用常见食材'],['medium','适中，兼顾方便'],['flexible','更看重方便与选择']],draft.budget)}</div><span class="field-label">需要避开的食物</span><div class="choices">${[['egg','蛋'],['milk','奶'],['soy','大豆'],['nuts','坚果 / 花生'],['fish','鱼 / 贝类'],['wheat','小麦']].map(([k,t])=>choice('allergyTags',k,t,'',draft.allergyTags.includes(k),'checkbox')).join('')}</div>${field('allergies','其他过敏或饮食限制（可选）',draft.allergies,'text','maxlength="500"','填写其他限制时，本版会暂停具体食谱建议，避免遗漏食物风险。')}`;
 $('#main').innerHTML=`<div class="setup">${loadError?'<div class="banner">上次保存的数据无法读取。为保护旧数据，请先用“导出原始数据”保存副本，再开始填写。<button class="text-button" data-action="raw-backup">导出原始数据</button></div>':''}<div class="page-head"><div><span class="eyebrow">建立我的计划 · ${step+1} / 5</span><h1>${titles[step]}</h1><p class="muted">${intros[step]}</p></div></div><div class="step-track" aria-label="第 ${step+1} 步，共 5 步">${titles.map((_,i)=>`<span class="${i<=step?'done':''}"></span>`).join('')}</div><form id="setup-form"><div class="card">${content}<div id="form-error" class="form-error" role="alert"></div></div><div class="onboarding-foot">${step>0?'<button type="button" class="btn secondary" data-action="setup-back">上一步</button>':editMode?'<button type="button" class="btn secondary" data-action="cancel-edit">取消修改</button>':''}<button class="btn" type="submit">${step===4?'保存资料，生成我的计划':'下一步'} <span aria-hidden="true">→</span></button></div></form><p class="footer-note">免费使用 · 不接收费 AI 接口 · 资料留在当前浏览器</p>${!state.profile?'<button class="text-button" data-action="import">从备份恢复已有记录</button>':''}</div>`;
 $('#setup-form').addEventListener('submit',e=>{e.preventDefault();setupNext();});
 $('#setup-form').addEventListener('change',()=>{if(step===2)$('#dumbbell-fields').hidden=!$('#setup-form input[value="dumbbell"]').checked;});
}
function readDraft(){
 const fd=new FormData($('#setup-form'));
 if(step===0){for(const k of ['age','sex','height','weight'])draft[k]=fd.get(k);draft.localConsent=fd.has('localConsent');}
 if(step===1)for(const k of ['goal','focus','experience'])draft[k]=fd.get(k);
 if(step===2){draft.equipment=fd.getAll('equipment');draft.maxDumbbell=fd.get('maxDumbbell')||'';draft.adjustable=fd.has('adjustable');draft.notes=fd.get('notes');}
 if(step===3)for(const k of Object.keys(draft.health))draft.health[k]=fd.get(`health_${k}`)||'';
 if(step===4){draft.days=fd.getAll('days').map(Number);for(const k of ['minutes','sleep','activity','foodMode','diet','budget','allergies'])draft[k]=fd.get(k);draft.allergyTags=fd.getAll('allergyTags');}
 state.draft=structuredClone(draft);
}
function setupNext(){
 readDraft();let errors=[];
 if(step===0&&(!draft.localConsent||!draft.sex))errors.push('请选择性别选项，并确认了解本机保存方式。');
 if(step===2&&draft.equipment.includes('dumbbell')&&!(Number(draft.maxDumbbell)>0&&Number(draft.maxDumbbell)<=100))errors.push('请填写单只哑铃最大可用重量。');
 if(step===3&&Object.values(draft.health).some(x=>!x))errors.push('请回答每一道健康问题，可选择“不确定”。');
 if(step===4)errors=F.validateProfile(draft);
 if(errors.length){$('#form-error').textContent=errors.join(' ');$('#form-error').scrollIntoView({block:'center'});return;}
 if(loadError){modal('先保护已有数据','<p>上次保存的数据无法读取。请先导出原始副本，再确认重新开始。</p><div class="actions"><button class="btn" data-action="raw-backup">导出原始数据</button><button class="btn danger" data-action="reset-corrupt">我已备份，重新开始</button></div>');return;}
 if(step<4){save();step++;renderSetup();window.scrollTo(0,0);return;}
 const oldWeight=state.profile?.weight;state.profile=structuredClone(draft);state.profile.updatedAt=F.dateKey();state.draft=null;state.session=null;
 if(!state.measurements.length)state.measurements.push({date:F.dateKey(),weight:Number(draft.weight),waist:null});
 save();editMode=false;nav('today');toast('资料已保存，计划已更新。');
}
function safetyCard(plan){return `<div class="card"><span class="eyebrow">先确认适用范围</span><h1>这次先不自动排训练</h1><p class="muted">你的资料已保存。下面这些情况需要更多个体评估，才适合决定负重和饮食。</p><ul>${plan.safety.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${plan.safety.urgent?'<div class="note danger">如果现在正在胸痛、接近晕厥或严重气短，请立即停止运动并寻求当地急救帮助。</div>':''}<div class="actions"><button class="btn" data-action="edit">检查我的资料</button><button class="btn secondary" data-action="sources">查看依据</button></div><p class="field-help">不能靠点击“我已知晓”绕过这些限制。取得评估后，可把记录带给专业人员制定合适计划。</p></div>`;}
function weekStrip(plan){const today=(new Date().getDay()+6)%7;return `<div class="week-strip">${F.DAYS.map((d,i)=>`<div class="day ${plan.trainingDays.includes(i)?'training':''} ${i===today?'today':''}"><strong>${d}</strong><small>${plan.trainingDays.includes(i)?'力量':state.profile.days.includes(i)?'轻活动':'恢复'}</small></div>`).join('')}</div>`;}
function renderToday(plan){
 if(!plan.safety.eligible)return safetyCard(plan);
 const today=(new Date().getDay()+6)%7;const workout=plan.workouts.find(w=>w.day===today);
 const done=state.history.find(h=>h.date===F.dateKey());
 const last=state.history.at(-1);const recovery=last&&Date.now()-last.finishedAt<48*3600000;
 const date=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
 const session=state.session;
 const mainTitle=done?'今天已经留下记录':recovery?'让身体恢复一下':workout?'今天，练好这一组':'今天，给恢复留点时间';
 const text=done?'不需要为了打卡再练一遍。下次按恢复情况继续。':recovery?'距离上次全身力量训练还不到 48 小时。今天优先散步和休息。':workout?`${workout.label} · ${workout.exercises.length} 个动作 · 约 ${workout.minutes} 分钟`:'轻松走一走，保持能说完整句子的强度。';
 const currentCount=state.history.filter(h=>new Date(h.date+'T12:00:00')>=new Date(Date.now()-7*86400000)).length;
 return `<div class="page-head"><div><span class="eyebrow">${esc(date)}</span><h1>按自己的节奏，开始。</h1></div><span class="badge">第 ${Math.floor(state.history.length/Math.max(1,plan.trainingDays.length))+1} 轮</span></div><section class="card dark hero-layout"><div><span class="eyebrow">${done?'已记录':workout&&!recovery?'今日训练':'恢复日'}</span><h1>${mainTitle}</h1><p class="muted">${text}</p><div class="tag-row"><span class="badge">${plan.focus}</span><span class="badge">${plan.sets===1?'熟悉动作 · 每项 1 组':'基础阶段 · 每项 2 组'}</span></div>${session?'<button class="btn primary" data-nav="session">继续未完成的训练 →</button>':workout&&!done&&!recovery?`<button class="btn primary" data-start="${workout.id}">开始今天的训练 →</button>`:'<button class="btn primary" data-nav="plan">查看本周计划 →</button>'}</div><div class="ring"><strong>${done?'✓':workout&&!recovery?workout.minutes:'轻'}</strong><span>${done?'今天已记录':workout&&!recovery?'分钟，留给自己':'活动 · 好恢复'}</span></div></section><div class="grid-3"><div class="stat card"><div class="stat-number">${currentCount}<small> 次</small></div><div class="stat-label">近 7 天训练</div></div><div class="stat card"><div class="stat-number">${plan.trainingDays.length}<small> 天</small></div><div class="stat-label">每周力量安排</div></div><div class="stat card"><div class="stat-number">${state.measurements.at(-1)?.weight||state.profile.weight}<small> kg</small></div><div class="stat-label">最近记录体重</div></div></div><div class="section-title"><h2>这一周，练与休息都算数</h2></div>${weekStrip(plan)}<div class="grid-2"><div class="card"><h2>先学会“留一点余力”</h2><p>一组就是连续做完规定次数。前两次先每个动作做 1 组，动作稳定后再到 2 组。</p><p class="muted">结束一组时，感觉还能用正确姿势再做约 3 次。先学会动作，不追求累到做不动。</p><button class="text-button" data-action="basics">看完整入门说明</button></div><div class="card focus-card"><h2>你的计划为什么这样排</h2><p>${plan.focus}是重点，同时保留推、拉、腿部和髋部训练。</p>${plan.notes.length?`<p class="muted small">${esc(plan.notes[0])}</p>`:'<p class="muted">力量日隔开安排，让身体有时间恢复。</p>'}<button class="text-button" data-nav="food">看看今天怎么吃</button></div></div><p class="footer-note">计划来自已核对资料和固定规则 · 不含在线 AI 问诊</p>`;
}
function moveRow(x,i){const ex=E[x.id];return `<div class="exercise-row"><span class="exercise-num">${String(i+1).padStart(2,'0')}</span><div class="exercise-title"><h3>${ex.name}</h3><p>${x.sets} 组 × ${ex.reps} · 休息 ${ex.rest} 秒</p><p>${ex.muscle}</p></div><button class="text-button" data-exercise="${ex.id}">怎么做</button></div>`;}
function renderPlan(plan){
 if(!plan.safety.eligible)return safetyCard(plan);
 planTab=Math.min(planTab,plan.workouts.length-1);const w=plan.workouts[planTab];
 return `<div class="page-head"><div><span class="eyebrow">我的训练安排</span><h1>练得明白，才能坚持。</h1></div><button class="btn secondary small" data-action="edit">调整资料</button></div>${weekStrip(plan)}<div class="segmented">${plan.workouts.map((x,i)=>`<button data-plan="${i}" class="${planTab===i?'active':''}">${F.DAYS[x.day]} · ${x.label}</button>`).join('')}</div><div class="card"><div class="section-title" style="margin-top:0"><h2>${w.label}</h2><span class="badge">约 ${w.minutes} 分钟</span></div><p class="muted">先热身 5–8 分钟，再按顺序完成。时间是估算，不用赶进度。</p>${w.exercises.map(moveRow).join('')}<div class="actions"><button class="btn" data-start="${w.id}">练这一套</button><button class="btn secondary" data-action="warmup">热身怎么做</button></div></div><div class="grid-2"><div class="card"><h2>从入门到进阶</h2><ol><li><strong>前两次：</strong>每动作 1 组，找到无痛、可控的难度。</li><li><strong>熟悉后：</strong>完整完成至少两次、没有疼痛，逐步到 2 组。</li><li><strong>加重条件：</strong>同一动作连续两次轻松达到全部组的次数上限，再考虑最小加重。</li><li><strong>恢复不好：</strong>减少一组，或换轻活动。不要同时增加重量、组数和次数。</li></ol><p class="field-help">这是起步阶段，不把入门低训练量当作长期最大增肌方案。坚持 4–6 周后结合记录复盘。</p></div><div class="card"><h2>散步与恢复</h2><p>刚开始可在方便的日子散步 10–20 分钟；能说完整句子，身体感受舒适。</p><p class="muted">随着适应逐步增加，成人长期可向每周 150–300 分钟中等强度活动靠近。不是第一周必须完成的任务。</p><p class="field-help">训练结束后放松走动 3–5 分钟。动作造成尖锐痛、麻木或异常不适时停止。</p></div></div>${plan.notes.map(x=>`<div class="note">${esc(x)}</div>`).join('')}<button class="text-button" data-action="sources">查看训练依据和适用范围</button>`;
}
function renderFood(plan){
 if(!plan.safety.eligible)return safetyCard(plan);
 const p=state.profile,n=F.nutrition(p),blockedOther=Boolean(p.allergies?.trim());
 const tags=p.allergyTags||[];const vegan=p.diet==='vegan';const vegetarian=p.diet!=='mixed';
 const proteins=[];
 if(!vegetarian)proteins.push('去皮鸡肉','瘦猪肉');
 if(!vegan&&!tags.includes('egg'))proteins.push('鸡蛋');
 if(!tags.includes('soy'))proteins.push('豆腐','毛豆');
 const p1=proteins[mealDay%Math.max(1,proteins.length)],p2=proteins[(mealDay+1)%Math.max(1,proteins.length)];
 const staples=['米饭','红薯','玉米','杂粮饭','土豆','米饭','红薯'];
 const milk=tags.includes('milk')||vegan?(tags.includes('soy')?'饮水':'无糖强化豆奶'):'牛奶或原味酸奶';
 const mealText=blockedOther?'你填写了其他饮食限制。本版不会用猜测处理这段信息，已暂停具体食物组合；请按已经确认安全的食物搭配，必要时请营养师核对。':!proteins.length?'当前饮食方式与过敏选项限制了内置蛋白质组合，已暂停食谱。请让营养师帮助选择合适的食物来源。':'';
 const foodRule={home:'在家做：蒸、煮、炖或少油炒；用同一只碗观察份量变化。',canteen:'食堂选：一份主食、一份明确的蛋白质菜、两份蔬菜；油多的汤汁不必拌完。',takeout:'外卖点：主食、肉蛋豆和蔬菜分别搭配。酱汁分开放，查看配料并备注过敏；不能只靠备注保证无交叉接触。'}[p.foodMode];
 const budgetRule={low:'优先选当季蔬菜和常见食材；鸡蛋、豆制品是否合适要看你的过敏和饮食方式。无需购买补剂。',medium:'常见食材轮换，忙时可用配料清楚的即食主食和蛋白质食物。',flexible:'方便食品也先看配料、份量和营养标签；价格高不代表更适合增肌。'}[p.budget];
 const checks=state.mealChecks[F.dateKey()]||{};
 return `<div class="page-head"><div><span class="eyebrow">我的饮食安排</span><h1>吃得合适，也吃得日常。</h1></div></div><div class="grid-2"><div class="card dark"><span class="eyebrow">每日能量 · 起点估算</span><h1>${n.calories?`${n.calories} <small>千卡左右</small>`:'先用餐盘份量法'}</h1><p class="muted">${n.calories?'不必每天一丝不差。先观察 2–3 周的平均体重、饥饿感和训练表现。':esc(n.reason)}</p>${n.calories?`<p class="small muted">估算维持量约 ${n.maintenance} 千卡；活动系数 ${n.factor}。<button class="text-button" style="color:var(--lime)" data-action="energy">怎样算的</button></p>`:''}</div><div class="card"><span class="eyebrow">每日蛋白质</span><h1>${n.protein?`${n.protein[0]}–${n.protein[1]} <small>克</small>`:'先确认适合的份量'}</h1><p class="muted">${n.protein?'分散到三餐，用普通食物也可以完成。这里指食物含有的蛋白质重量，不是肉的重量。':'需要结合身体组成和具体健康情况判断。'}</p><button class="text-button" data-action="protein">怎样看食物标签</button></div></div>${n.reason&&n.calories?`<div class="note">${esc(n.reason)}</div>`:''}<div class="card"><h2>把一天分成三顿，轮换着吃</h2><p class="muted small">以下是搭配与起步份量示例，不是精算菜单，总热量和蛋白质不一定等于上方目标。食物实际营养以包装标签或可靠食物成分表为准。</p><div class="segmented" aria-label="七天饮食轮换">${F.DAYS.map((x,i)=>`<button data-meal-day="${i}" class="${mealDay===i?'active':''}">${x}</button>`).join('')}</div>${mealText?`<div class="note warning">${mealText}</div>`:`<div class="meal"><div class="meal-title"><h3>早餐 · 主食 + 蛋白质 + 水果</h3><span class="pill">不空着肚子赶</span></div><p>${staples[mealDay]}约 1 拳头；${p1==='鸡蛋'?'鸡蛋 1–2 个':p1+'约 1 掌心'}；水果 1 份，${milk}。</p></div><div class="meal"><h3>午餐 · 好好吃一餐</h3><p>熟${staples[(mealDay+3)%7]}约 1–2 拳头；${p2}约 1–1.5 掌心；蔬菜约 2 拳头。炒菜油和酱汁适量。</p></div><div class="meal"><h3>晚餐 · 保留主食与蛋白质</h3><p>熟${staples[(mealDay+5)%7]}约 1 拳头；${p1}约 1–1.5 掌心；蔬菜约 2 拳头。训练后若仍饿，可补一份主食或合适的蛋白质食物。</p></div><div class="note">掌心和拳头是帮助入门的粗估，不是营养换算。豆腐、鸡蛋和肉的蛋白质密度不同，替换后需看标签调整份量。</div>`}<p>${foodRule}</p><p class="field-help">${budgetRule}</p>${tags.length?'<div class="note warning">已按勾选项避开相应食物示例。仍需检查调味料、包装配料和制作过程的交叉接触。</div>':''}</div><div class="grid-2"><div class="card"><h2>今天的饮食小记录</h2><p class="muted small">记录习惯，不用给自己打“好坏”分。</p>${[['protein','三餐安排了合适的蛋白质食物'],['veg','今天吃了蔬菜和水果'],['regular','正常吃饭，没有极端节食']].map(([k,t])=>`<label class="inline-label"><input type="checkbox" data-food-check="${k}" ${checks[k]?'checked':''}>${t}</label>`).join('')}</div><div class="card"><h2>什么时候需要调整</h2><p>先连续记录 2–3 周。看相同条件下的周平均趋势，别根据某一天体重就减饭。</p><p class="muted">持续疲劳、头晕、异常饥饿、训练明显退步或月经变化时，停止自行减量并寻求专业意见。当前工具不会自动越减越低。</p><button class="text-button" data-nav="record">去记录体重与感受</button></div></div><button class="text-button" data-action="sources">查看饮食依据</button>`;
}
function renderRecord(){
 const sorted=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date));
 const chart=sorted.length>1?weightChart(sorted):'';
 return `<div class="page-head"><div><span class="eyebrow">我的记录</span><h1>看长期变化，不催自己。</h1></div></div><div class="grid-2"><div class="card"><h2>体重趋势</h2>${sorted.length>1?chart:'<div class="empty"><strong>给变化一点时间</strong><p class="muted">记录两次后，这里会显示趋势。</p></div>'}<p class="field-help">尽量在早起、如厕后、进食前测量；按周看平均变化。</p><form id="measurement-form"><div class="grid-2">${field('weight','体重 · 公斤','','number','min="25" max="250" step="0.1" required inputmode="decimal"')}${field('waist','腰围 · 厘米（可选）','','number','min="30" max="250" step="0.1" inputmode="decimal"')}</div>${field('date','记录日期',F.dateKey(),'date',`max="${F.dateKey()}" required`)}<button class="btn wide" type="submit">保存身体记录</button><div class="form-error" id="measure-error" role="alert"></div></form></div><div class="card"><h2>训练历史 <span class="badge">${state.history.length} 次</span></h2>${state.history.length?state.history.slice().reverse().slice(0,20).map((h,i)=>`<div class="history-row"><div><strong>${esc(h.label)}</strong><p class="muted small">${esc(h.date)} · 完成 ${h.completedSets}/${h.totalSets} 组</p><p class="small">${h.pain?'记录过疼痛':{easy:'比较轻松',right:'刚刚好',hard:'偏吃力'}[h.effort]||'未评分'}</p></div><button class="text-button" data-history="${state.history.length-1-i}">详情</button></div>`).join(''):'<div class="empty"><strong>第一条记录，等你来写</strong><p class="muted">完成一次训练后，重量、次数和感受会保存在这里。</p></div>'}</div></div><div class="card"><h2>最近身体记录</h2>${sorted.length?`<div class="table-wrap"><table><thead><tr><th>日期</th><th>体重</th><th>腰围</th><th>操作</th></tr></thead><tbody>${sorted.slice(-10).reverse().map(x=>`<tr><td>${esc(x.date)}</td><td>${x.weight} kg</td><td>${x.waist??'—'}</td><td><button class="text-button" data-delete-measure="${esc(x.date)}">删除</button></td></tr>`).join('')}</tbody></table></div>`:''}<p class="field-help">同一天再次保存会替换当天身体记录。历史记录不会自动改写你的计划体重，需要时在“我的”更新资料。</p></div>`;
}
function weightChart(arr){
 const data=arr.slice(-30),min=Math.min(...data.map(x=>x.weight))-1,max=Math.max(...data.map(x=>x.weight))+1;
 const points=data.map((x,i)=>`${30+i/(data.length-1)*480},${130-(x.weight-min)/(max-min)*105}`);
 return `<svg class="chart" viewBox="0 0 540 160" role="img" aria-label="体重从 ${data[0].weight} 公斤到 ${data.at(-1).weight} 公斤"><path d="M30 135H515" stroke="#dce5e2"/><polyline points="${points.join(' ')}" fill="none" stroke="#427e58" stroke-width="3"/>${points.map(pt=>`<circle cx="${pt.split(',')[0]}" cy="${pt.split(',')[1]}" r="4" fill="#102b2c"/>`).join('')}<text x="30" y="155" fill="#586b6c" font-size="13">${data[0].date.slice(5)} · ${data[0].weight} kg</text><text x="510" y="155" text-anchor="end" fill="#586b6c" font-size="13">${data.at(-1).date.slice(5)} · ${data.at(-1).weight} kg</text></svg>`;
}
function renderProfile(){
 const p=state.profile;
 return `<div class="page-head"><div><span class="eyebrow">我的资料与设置</span><h1>计划跟着你调整。</h1></div></div><div class="grid-2"><div class="card"><h2>${F.GOALS[p.goal]} · ${F.FOCUS[p.focus]}</h2><p class="muted">${esc(p.age)} 岁 · ${esc(p.height)} 厘米 · ${esc(p.weight)} 公斤</p><div class="tag-row">${p.equipment.length?p.equipment.map(x=>`<span class="badge">${EQUIPMENT.find(y=>y[0]===x)[1]}</span>`).join(''):'<span class="badge">徒手起步</span>'}</div><p>${p.days.map(d=>F.DAYS[d]).join('、')}有空 · 每次 ${p.minutes} 分钟</p><p class="field-help">${esc(p.notes||'你可以随时更新器材、时间、体型重点和健康情况。')}</p><button class="btn wide" data-action="edit" style="margin-top:18px">编辑资料与计划</button></div><div class="card"><h2>我的数据，由我保管</h2><p>资料、训练和饮食记录仅保存在这个浏览器。本工具没有健康数据上传接口、广告追踪或收费入口。</p><p class="muted">清理浏览器、换手机或换访问地址，原记录不会自动跟过去。Safari 与主屏幕版本也可能使用不同存储，请先导出再恢复。</p><div class="actions"><button class="btn" data-action="export">导出备份</button><button class="btn secondary" data-action="import">导入备份</button></div><p class="field-help">备份含健康资料，请保存在自己的文件夹，不要公开分享。</p></div></div><div class="card"><h2>用起来更顺手</h2><div class="download-list"><button class="btn subtle" data-action="help">苹果手机怎么用</button><button class="btn subtle" data-action="sources">专业依据与开源说明</button><button class="btn subtle" data-action="basics">从零认识训练</button><button class="btn danger" data-action="reset">清空本机全部记录</button></div></div><p class="footer-note">自在练 1.0 · 资料核验：2026 年 9 月 27 日<br>固定规则生成入门方案，不能诊断、识别照片或实时纠正动作。</p>`;
}
function showExercise(id){
 const ex=E[id];if(!ex)return;
 const personal=state.profile?F.progression(id,state.history,state.profile.maxDumbbell):'';
 modal(ex.name,`<p class="muted">${ex.muscle} · ${ex.reps} · 组间休息 ${ex.rest} 秒</p>${ex.imageId?`<div class="exercise-photos"><figure><img src="assets/${ex.imageId}-0.jpg" alt="${ex.name}动作位置参考 1" loading="lazy"><figcaption>动作位置参考 1</figcaption></figure><figure><img src="assets/${ex.imageId}-1.jpg" alt="${ex.name}动作位置参考 2" loading="lazy"><figcaption>动作位置参考 2</figcaption></figure></div><p class="field-help">开源静态图示，用于理解姿势，不保证两张照片按完整动作先后排序。请按下方步骤完成；图示不代表你的动作已被检查。${ex.id==='goblet'?'图中为壶铃握法；使用哑铃时需双手托稳一端。':''}</p>`:'<div class="note">这个动作提供文字步骤；没有可靠对应图示时，不用其他动作照片代替。</div>'}<h3 style="margin-top:18px">一步一步做</h3><ol>${ex.steps.map(s=>`<li>${s}</li>`).join('')}</ol><h3 style="margin-top:18px">容易做错的地方</h3><ul>${ex.mistakes.map(s=>`<li>${s}</li>`).join('')}</ul><div class="note"><strong>太难时：</strong>${ex.easier}</div>${personal?`<div class="note"><strong>根据你的记录：</strong>${personal}</div>`:''}<p class="small">出现尖锐痛、麻木、胸痛、眩晕或异常气短时停止，不把疼痛当作有效训练的标志。</p>${ex.source?`<p style="margin-top:14px"><a href="${ex.source}" target="_blank" rel="noopener noreferrer">查看图文来源（外部网页，可能为英文）</a></p>`:'<p class="field-help">中文步骤为本工具原创整理；可带给合格教练确认动作。</p>'}`);
}
function beginWorkout(id){
 const plan=F.makePlan(state.profile,state.history);if(!plan.safety?.eligible)return;
 if(state.session){nav('session');return;}
 const last=state.history.at(-1);if(last&&Date.now()-last.finishedAt<48*3600000){modal('先给身体恢复时间','<p>距离上次全身力量训练不足 48 小时。今天可以进行舒适的轻活动，等恢复后再练下一次。</p><button class="btn wide" data-action="close" style="margin-top:20px">知道了</button>');return;}
 const w=plan.workouts.find(x=>x.id===id);if(!w)return;
 modal('今天的状态适合开始吗？',`<p>先确认今天没有新出现的疼痛、明显疲劳、发热或异常不适。</p><div class="note">热身 5–8 分钟：轻松走动、舒适活动关节，再用更容易的版本练习今天的动作。负重动作先用很轻重量试做。</div><div class="actions"><button class="btn" data-confirm-start="${id}">状态正常，开始热身</button><button class="btn secondary" data-action="not-ready">今天不太舒服</button></div>`);
}
function confirmStart(id){
 const plan=F.makePlan(state.profile,state.history);const w=plan.workouts.find(x=>x.id===id);if(!w)return;
 state.session={id:String(Date.now()),label:w.label,date:F.dateKey(),startedAt:Date.now(),exercises:w.exercises.map(x=>({id:x.id,sets:Array.from({length:x.sets},()=>({weight:E[x.id].load?'':'0',reps:'',done:false}))}))};save();closeModal();nav('session');
}
function renderSession(){
 const s=state.session;if(!s){route='today';return '<div class="card"><p>当前没有未完成的训练。</p><button class="btn" data-nav="today">回到今天</button></div>';}
 const total=s.exercises.reduce((a,x)=>a+x.sets.length,0),done=s.exercises.reduce((a,x)=>a+x.sets.filter(y=>y.done).length,0);
 return `<div class="session-head"><div class="page-head" style="margin:0"><div><span class="eyebrow">正在训练 · ${esc(s.label)}</span><h2 style="margin:5px 0 0">一组一组，慢慢完成。</h2></div><button class="btn secondary small" data-nav="today">暂存返回</button></div><div class="progress-track"><span style="width:${done/total*100}%"></span></div><p class="muted small">已完成 ${done} / ${total} 组 · 勾选后开始休息计时</p></div><div class="note">先热身。哑铃重量填写<strong>单只重量</strong>；徒手动作只填次数。左右交替动作填每侧次数。图示和记录不等于实时动作纠正。</div>${s.exercises.map((x,i)=>{const ex=E[x.id];return `<section class="card"><div class="section-title" style="margin-top:0"><div><span class="eyebrow">动作 ${i+1}</span><h2 style="margin-top:5px">${ex.name}</h2></div><button class="text-button" data-exercise="${x.id}">动作教学</button></div><p class="muted">目标 ${ex.reps} · 休息 ${ex.rest} 秒</p><p class="field-help">${F.progression(x.id,state.history,state.profile.maxDumbbell)}</p><div class="set-row labels"><span>组</span><span>${ex.load?'重量 · kg':'负重'}</span><span>${ex.timed?'秒数':'次数'}</span><span>完成</span></div>${x.sets.map((set,j)=>`<div class="set-row"><span>${j+1}</span>${ex.load?`<input aria-label="${ex.name}第 ${j+1} 组重量" type="number" inputmode="decimal" min="0" max="${ex.equipment.includes('dumbbell')?state.profile.maxDumbbell:300}" step="0.1" value="${esc(set.weight)}" data-set-input="weight" data-i="${i}" data-j="${j}">`:'<span class="small muted" style="text-align:center">徒手 / 带</span>'}<input aria-label="${ex.name}第 ${j+1} 组${ex.timed?'秒数':'次数'}" type="number" inputmode="numeric" min="1" max="200" step="1" value="${esc(set.reps)}" placeholder="实际完成" data-set-input="reps" data-i="${i}" data-j="${j}"><button class="check ${set.done?'checked':''}" aria-label="${set.done?'取消':'标记'}${ex.name}第 ${j+1} 组完成" aria-pressed="${set.done}" data-toggle-set="${i},${j}">✓</button></div>`).join('')}<div class="actions"><button class="btn subtle small" data-rest="${ex.rest}">休息 ${ex.rest} 秒</button><button class="btn secondary small" data-swap="${i}">换个适合的动作</button></div></section>`;}).join('')}<div class="card"><h2>记录今天的感受</h2><div class="actions"><button class="btn" data-action="finish">结束并保存训练</button><button class="btn danger" data-action="pain-stop">出现疼痛，先停止</button></div><button class="text-button" data-action="discard-session">放弃这次未保存的训练</button></div>`;
}
function toggleSet(i,j){
 const x=state.session.exercises[i],set=x.sets[j],ex=E[x.id];
 if(!set.done){const reps=Number(set.reps),weight=Number(set.weight);if(!Number.isInteger(reps)||reps<1||reps>200)return toast('先填写实际完成的次数或秒数（1–200 的整数）。');if(ex.load&&(set.weight===''||!Number.isFinite(weight)||weight<0||weight>300))return toast('先填写实际使用重量。');if(ex.equipment.includes('dumbbell')&&weight>Number(state.profile.maxDumbbell))return toast('这个重量超过你填写的单只哑铃上限。');}
 set.done=!set.done;save();render();if(set.done)startTimer(ex.rest);
}
function startTimer(seconds){
 timerEnd=Date.now()+seconds*1000;clearInterval(timerInterval);tick();timerInterval=setInterval(tick,250);
 function tick(){const left=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));$('#timer').hidden=false;$('#timer').innerHTML=`<div class="small">${left?'组间休息':'休息结束 · 按感受继续'}</div><strong>${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</strong><button data-action="timer-add">+30秒</button><button data-action="timer-close" aria-label="关闭休息计时">×</button>`;if(!left){clearInterval(timerInterval);toast('休息时间到了，感觉没恢复可以再休息。');}}
}
function stopTimer(){clearInterval(timerInterval);timerEnd=0;$('#timer').hidden=true;}
function finishDialog(pain=false){
 const s=state.session;if(!s)return;
 const completed=s.exercises.reduce((a,x)=>a+x.sets.filter(y=>y.done).length,0);
 if(!completed&&!pain){toast('还没有完成记录。填写并勾选做完的组，或放弃本次训练。');return;}
 modal(pain?'先停止，不要忍痛继续':'保存这一次训练',`${pain?'<div class="note danger">停止引发疼痛的动作。尖锐痛、持续痛、麻木需要专业评估；若正在胸痛、晕厥或严重气短，应寻求急救帮助。</div>':''}<p>已勾选完成 ${completed} 组，未勾选的组会保留为未完成。</p><form id="finish-form"><label class="field-label" style="margin-top:18px">整体用力感受</label><div class="choices">${[['easy','比较轻松'],['right','刚刚好'],['hard','偏吃力']].map(([v,t])=>choice('effort',v,t,'',false)).join('')}</div><label class="inline-label"><input type="checkbox" name="pain" ${pain?'checked':''}>本次出现了疼痛或异常不适</label><label class="field"><span class="field-label">想记住的事（可选）</span><textarea name="note" maxlength="500" placeholder="例如：深蹲后半程动作不太稳定"></textarea></label><div class="form-error" id="finish-error"></div><button class="btn wide" type="submit">保存训练记录</button></form>`);
 $('#finish-form').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);if(!fd.get('effort')){$('#finish-error').textContent='请选择整体用力感受。';return;}
 const totalSets=s.exercises.reduce((a,x)=>a+x.sets.length,0);const item={...structuredClone(s),date:F.dateKey(),finishedAt:Date.now(),completedSets:completed,totalSets,effort:fd.get('effort'),pain:fd.has('pain'),note:fd.get('note')};state.history.push(item);state.session=null;save();stopTimer();closeModal();nav('record');toast('本次训练已记录。');});
}
function swapDialog(index){
 const s=state.session,x=s.exercises[index],original=E[x.id],p=state.profile;
 if(x.sets.some(y=>y.done)){toast('这个动作已有完成记录。请保留本次记录，下次训练再换。');return;}
 const choices=Object.values(E).filter(e=>e.pattern===original.pattern&&e.id!==original.id&&e.equipment.every(k=>p.equipment.includes(k))&&!s.exercises.some(y=>y.id===e.id));
 modal('选择同类替代动作',`<p class="muted">只列出你现有器材能做的动作。动作疼痛时先停止，不用换动作硬练。</p>${choices.length?choices.map(e=>`<div class="exercise-row"><div class="exercise-title"><h3>${e.name}</h3><p>${e.muscle}</p></div><button class="btn secondary small" data-replace="${index},${e.id}">换成这个</button></div>`).join(''):'<div class="note">当前没有其他匹配动作。可以跳过不适合的动作，保留未完成记录。</div>'}`);
}
function showSources(){modal('依据与开源说明',`<p class="source-date">核验日期：2026-09-27。机构指南提供一般原则；本工具的具体排课与饮食组合为原创的保守应用规则。</p><ol class="source-list">${SOURCES.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a><p class="source-date">${s.date}</p><p class="small muted">${s.use}</p></li>`).join('')}</ol><h3>参考过的产品</h3><p class="small"><a href="https://www.hevyapp.com/features/" target="_blank" rel="noopener noreferrer">Hevy：组数记录、休息计时和训练历史</a>；<a href="https://github.com/wger-project/wger" target="_blank" rel="noopener noreferrer">wger：开源训练与营养管理</a>。仅借鉴工作流程，不复制界面或承诺其付费功能免费。</p><h3 style="margin-top:18px">适用边界</h3><p class="small">这是个人入门辅助工具，未经过临床验证、不能诊断疾病或实时识别动作。需要康复、特殊人群指导或更高阶训练时，请找具有相应资质的专业人员。</p><p class="small"><a href="EXERCISE-LICENSE.txt" target="_blank">查看动作素材许可证</a></p>`);}
function showHelp(){modal('苹果手机怎么用',`<ol><li>用 Safari 浏览器打开工具网址。</li><li>点“分享”，再选“添加到主屏幕”。如果看到“作为网页 App 打开”，将它打开。</li><li>以后点主屏幕上的“自在练”图标进入，先在里面填写资料。</li></ol><div class="note">若使用本机局域网地址，电脑需保持开机、启动服务，手机和电脑需在可互通的同一网络。网址变化后，原记录不会自动迁移，请先备份。</div><p>使用 HTTPS 地址时，本工具可缓存已访问的基本页面；外部资料链接仍需要网络。局域网 HTTP 版本不承诺离线使用，也不会在锁屏时可靠播放提醒。</p><p class="small" style="margin-top:14px"><a href="https://support.apple.com/zh-cn/guide/iphone/iphea86e5236/ios" target="_blank" rel="noopener noreferrer">苹果官方：将网站变为 App</a></p><h3 style="margin-top:18px">记录怎么保住</h3><p>在“我的 → 导出备份”保存 JSON 文件。换设备或换网址后，在“导入备份”恢复。备份包含健康资料，不要发到公开地方。</p>`);}
function showBasics(){modal('从零认识训练',`<ul><li><strong>次数：</strong>完整做一遍动作算 1 次。</li><li><strong>组数：</strong>连续做完一串次数算 1 组。例如 2 组 × 10 次，就是做 10 次，休息，再做 10 次。</li><li><strong>余力：</strong>做完还觉得能用好姿势再做约 3 次。不是憋气硬撑到完全做不动。</li><li><strong>选重量：</strong>先轻、先试。目标次数内不能控制动作就减轻，不用按体重猜一个“该举多少”的数。</li><li><strong>呼吸：</strong>通常用力阶段呼气，还原阶段吸气，避免长时间憋气。</li><li><strong>酸与痛：</strong>肌肉用力感不等于关节痛。尖锐痛、麻木或异常不适要停。</li></ul><div class="note">记录的目的是帮助下次选择，不是为了每次都破纪录。</div>`);}
function download(name,text,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
function exportData(){download(`自在练-备份-${F.dateKey()}.json`,JSON.stringify(state,null,2));toast('已发起备份下载，请在浏览器下载或“文件”里确认。');}
function validateBackup(v){
 if(!v||typeof v!=='object'||v.version!==1||!Array.isArray(v.history)||!Array.isArray(v.measurements)||v.history.length>10000||v.measurements.length>10000)throw Error('不是有效的自在练备份。');
 if(v.profile&&F.validateProfile(v.profile).length)throw Error('备份里的个人资料不完整或无效。');
 const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s));
 for(const x of v.measurements)if(!date(x.date)||!Number.isFinite(x.weight)||x.weight<25||x.weight>250||(x.waist!==null&&(!Number.isFinite(x.waist)||x.waist<30||x.waist>250)))throw Error('身体记录的格式不正确。');
 for(const h of [...v.history,...(v.session?[v.session]:[])]){
  if(!date(h.date)||typeof h.label!=='string'||!Array.isArray(h.exercises)||h.exercises.length>30)throw Error('训练记录的格式不正确。');
  for(const x of h.exercises){if(!E[x.id]||!Array.isArray(x.sets)||x.sets.length>20)throw Error('训练动作无效。');for(const s of x.sets)if(typeof s.done!=='boolean'||!['string','number'].includes(typeof s.reps)||!['string','number'].includes(typeof s.weight)||(s.done&&(!Number.isInteger(Number(s.reps))||Number(s.reps)<1||Number(s.reps)>200||!Number.isFinite(Number(s.weight))||Number(s.weight)<0||Number(s.weight)>300)))throw Error('训练组记录无效。');}
 }
 for(const h of v.history)if(!Number.isFinite(h.finishedAt)||!Number.isInteger(h.completedSets)||!Number.isInteger(h.totalSets)||!['easy','right','hard'].includes(h.effort)||typeof h.pain!=='boolean')throw Error('训练结果格式不正确。');
 if(v.draft&&(!v.draft.health||!Array.isArray(v.draft.equipment)||!Array.isArray(v.draft.days)))throw Error('填写草稿格式错误。');
 const allowed={...blank(),profile:v.profile||null,draft:v.draft||null,history:v.history,measurements:v.measurements,session:v.session||null,mealChecks:v.mealChecks&&typeof v.mealChecks==='object'?v.mealChecks:{}};
 return JSON.parse(JSON.stringify(allowed));
}
function importData(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files[0];if(!file)return;if(file.size>5*1024*1024)return toast('备份超过 5 MB，请检查文件是否正确。');try{const pending=validateBackup(JSON.parse(await file.text()));modal('确认恢复备份',`<p>这份备份包含 ${pending.history.length} 次训练、${pending.measurements.length} 条身体记录。</p><p>恢复会替换当前浏览器内的数据。请先导出当前记录，避免丢失。</p><div class="actions"><button class="btn secondary" id="export-current">先导出当前数据</button><button class="btn" id="confirm-import">确认替换并恢复</button></div>`);$('#export-current').onclick=exportData;$('#confirm-import').onclick=()=>{state=pending;loadError=false;draft=state.draft||defaultDraft();step=0;editMode=false;save();closeModal();nav('today');toast('备份已恢复。');};}catch(e){toast('恢复失败：'+e.message);}};input.click();}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a[data-nav]');if(!b)return;
 if(b.dataset.nav)return nav(b.dataset.nav);
 if(b.dataset.exercise)return showExercise(b.dataset.exercise);
 if(b.dataset.plan!=null){planTab=Number(b.dataset.plan);render();return;}
 if(b.dataset.mealDay!=null){mealDay=Number(b.dataset.mealDay);render();return;}
 if(b.dataset.start)return beginWorkout(b.dataset.start);
 if(b.dataset.confirmStart)return confirmStart(b.dataset.confirmStart);
 if(b.dataset.toggleSet){const [i,j]=b.dataset.toggleSet.split(',').map(Number);return toggleSet(i,j);}
 if(b.dataset.rest)return startTimer(Number(b.dataset.rest));
 if(b.dataset.swap!=null)return swapDialog(Number(b.dataset.swap));
 if(b.dataset.replace){const [idx,id]=b.dataset.replace.split(',');state.session.exercises[Number(idx)]={id,sets:state.session.exercises[Number(idx)].sets.map(()=>({weight:E[id].load?'':'0',reps:'',done:false}))};save();closeModal();render();return;}
 if(b.dataset.history!=null){const i=Number(b.dataset.history),h=state.history[i];modal(`${h.date} · ${h.label}`,`<p class="muted">${h.pain?'有疼痛 / 不适':'无疼痛记录'} · ${esc(h.note||'没有补充备注')}</p>${h.exercises.map(x=>`<div class="meal"><h3>${E[x.id].name}</h3><p>${x.sets.map((s,j)=>`第 ${j+1} 组：${s.done?`${E[x.id].load?esc(s.weight)+' kg × ':''}${esc(s.reps)} ${E[x.id].timed?'秒':'次'}`:'未完成'}`).join('<br>')}</p></div>`).join('')}<button class="btn danger wide" data-delete-history="${i}" style="margin-top:20px">删除这次记录</button>`);return;}
 if(b.dataset.deleteHistory!=null){const i=Number(b.dataset.deleteHistory);modal('删除这次训练记录？','<p>仅删除这一次，其他记录保留。删除前可以先导出备份。</p><div class="actions"><button class="btn secondary" data-action="close">保留</button><button class="btn danger" id="confirm-delete-history">确认删除</button></div>');$('#confirm-delete-history').onclick=()=>{state.history.splice(i,1);save();closeModal();render();};return;}
 if(b.dataset.deleteMeasure){const date=b.dataset.deleteMeasure;modal('删除这条身体记录？',`<p>将删除 ${esc(date)} 的体重和腰围记录。</p><div class="actions"><button class="btn secondary" data-action="close">保留</button><button class="btn danger" id="confirm-delete-measure">确认删除</button></div>`);$('#confirm-delete-measure').onclick=()=>{state.measurements=state.measurements.filter(x=>x.date!==date);save();closeModal();render();};return;}
 const action=b.dataset.action;
 if(action==='close')closeModal();
 if(action==='help')showHelp();
 if(action==='sources')showSources();
 if(action==='basics')showBasics();
 if(action==='edit'){if(state.session){toast('请先完成或放弃未结束的训练，再修改资料。');return;}draft={...defaultDraft(),...structuredClone(state.profile)};editMode=true;step=0;render();window.scrollTo(0,0);}
 if(action==='cancel-edit'){editMode=false;render();}
 if(action==='setup-back'){readDraft();save();step--;renderSetup();window.scrollTo(0,0);}
 if(action==='warmup')modal('热身与结束放松','<ol><li>轻松走动或原地踏步 2–3 分钟。</li><li>在舒适范围活动肩、髋、膝、踝。</li><li>用更轻重量或更容易版本，练习当天前几个动作各 5–8 次。</li><li>结束后慢走 3–5 分钟，呼吸平稳再离开。</li></ol><p class="field-help">有疼痛的动作不靠热身硬顶过去。</p>');
 if(action==='not-ready'){closeModal();modal('今天可以先休息','<p>有新的疼痛、发热或异常不适时，先不训练。持续或反复出现的情况需要专业评估；严重症状及时就医。</p>');}
 if(action==='finish')finishDialog();
 if(action==='pain-stop'){stopTimer();finishDialog(true);}
 if(action==='discard-session'){modal('放弃这次训练？','<p>本次未保存的组数会被移除，以前的训练记录保留。</p><div class="actions"><button class="btn secondary" data-action="close">继续保留</button><button class="btn danger" id="confirm-discard">确认放弃</button></div>');$('#confirm-discard').onclick=()=>{state.session=null;save();stopTimer();closeModal();nav('today');};}
 if(action==='timer-add'){startTimer(Math.max(0,Math.ceil((timerEnd-Date.now())/1000))+30);}
 if(action==='timer-close')stopTimer();
 if(action==='export')exportData();
 if(action==='import')importData();
 if(action==='raw-backup'){let raw='';try{raw=localStorage.getItem(STORE)||'空数据';}catch(_){}download('自在练-原始数据备份.txt',raw,'text/plain');}
 if(action==='reset-corrupt'){loadError=false;state=blank();draft=defaultDraft();save();closeModal();step=0;renderSetup();}
 if(action==='reset'){modal('清空当前浏览器的全部记录？','<p>将移除个人资料、训练历史、饮食勾选和身体记录。这个操作无法撤销；建议先导出备份。</p><div class="actions"><button class="btn secondary" data-action="export">先导出备份</button><button class="btn danger" id="confirm-reset">确认全部清空</button></div>');$('#confirm-reset').onclick=()=>{state=blank();draft=defaultDraft();step=0;editMode=false;save();stopTimer();closeModal();nav('today');};}
 if(action==='energy'){const n=F.nutrition(state.profile);modal('热量估算，怎样理解',`<p>先用年龄、身高、体重和生理性别估算静息能量，再乘你选择的日常活动系数。</p><div class="note">本次：静息约 ${n.rest} 千卡 × ${n.factor} ≈ 维持量 ${n.maintenance} 千卡。增肌起点约增加 5%，减脂约减少 10%；体型改善和健康目标先按维持量。</div><p>这些是估算假设，不是实际测量。活动系数已粗略考虑一般活动，不再把运动消耗额外加一遍。先按体重趋势、饥饿和训练表现复盘，不根据一天波动调整。</p>`);}
 if(action==='protein')modal('蛋白质克数不是食物重量','<p>例如某食品标签写“每 100 克含蛋白质 10 克”，吃 200 克就得到约 20 克蛋白质。这只是读标签的算例，并非特定食物的营养数据。</p><p>把三餐食物的蛋白质相加，再和你的范围比较。普通食物可以完成目标，不需要为了使用这个工具购买蛋白粉。</p>');
});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.setInput&&state.session){const set=state.session.exercises[Number(t.dataset.i)].sets[Number(t.dataset.j)];set[t.dataset.setInput]=t.value;if(set.done){set.done=false;const check=t.closest('.set-row').querySelector('.check');check.classList.remove('checked');check.setAttribute('aria-pressed','false');const ex=E[state.session.exercises[Number(t.dataset.i)].id];check.setAttribute('aria-label',`标记${ex.name}第 ${Number(t.dataset.j)+1} 组完成`);const total=state.session.exercises.reduce((a,x)=>a+x.sets.length,0),done=state.session.exercises.reduce((a,x)=>a+x.sets.filter(y=>y.done).length,0);$('.session-head .progress-track span').style.width=(done/total*100)+'%';$('.session-head p').textContent=`已完成 ${done} / ${total} 组 · 勾选后开始休息计时`;}save();}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.foodCheck){state.mealChecks[F.dateKey()]??={};state.mealChecks[F.dateKey()][t.dataset.foodCheck]=t.checked;save();}});
document.addEventListener('submit',e=>{if(e.target.id!=='measurement-form')return;e.preventDefault();const fd=new FormData(e.target),weight=Number(fd.get('weight')),waist=fd.get('waist')===''?null:Number(fd.get('waist')),date=String(fd.get('date'));if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>F.dateKey()||weight<25||weight>250||(waist!==null&&(waist<30||waist>250))){$('#measure-error').textContent='请检查日期、体重和腰围。';return;}state.measurements=state.measurements.filter(x=>x.date!==date);state.measurements.push({date,weight,waist});state.measurements.sort((a,b)=>a.date.localeCompare(b.date));save();render();toast('身体记录已保存。');});
$('#help-button').onclick=showHelp;
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&timerEnd&&timerEnd<=Date.now()){stopTimer();toast('休息时间已经结束，请按身体感受继续。');}});
render();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'navigate_fitness_section',title:'打开健身工具页面',description:'只切换到指定页面，不修改或输出健康资料。',inputSchema:{type:'object',properties:{section:{type:'string',enum:['today','plan','food','record','profile']}},required:['section'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!['today','plan','food','record','profile'].includes(input.section))throw Error('页面无效');nav(input.section);return{opened:input.section,profileRequired:!state.profile};}});}catch(_){}}
