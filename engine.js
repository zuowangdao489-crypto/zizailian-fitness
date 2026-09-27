(function(root){
const D=root.FitData||(typeof require!=='undefined'?require('./data.js'):null);
const {EXERCISES:E}=D;
const GOALS={lean:'薄肌身材',recomp:'改善体型',build:'增加肌肉',lose:'减少脂肪',health:'体能与习惯'};
const FOCUS={balanced:'全身均衡',shoulder:'肩背比例',chest:'胸部与手臂',glute:'臀腿线条',core:'腹部稳定'};
const DAYS=['周一','周二','周三','周四','周五','周六','周日'];
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const num=(v)=>v!==''&&v!=null&&Number.isFinite(Number(v));
const bmiOf=p=>Number(p.weight)/(Number(p.height)/100)**2;
const details=p=>p.screening&&typeof p.screening==='object'&&!Array.isArray(p.screening)?p.screening:{};
const isRelevant=(p,key)=>['yes','unsure'].includes(p.health?.[key]);
function painToken(history=[]){
 const entries=history.filter(h=>h&&h.pain);if(!entries.length)return null;
 const last=entries[entries.length-1],raw=JSON.stringify([last.id,last.date,last.finishedAt,last.exercises,entries.length]);
 let hash=2166136261;for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return `cleared-${(hash>>>0).toString(36)}`;
}
function screeningQuestions(p,history=[]){
 const s=details(p),bmi=bmiOf(p),questions=[];
 const add=(key,title,help,options,group,dependsOn=[])=>questions.push({key,title,help,options,required:true,group,dependsOn});
 if(isRelevant(p,'symptoms'))add('symptomStatus','这些症状现在是什么情况？','这里指胸痛、晕厥、轻微活动就异常气短等警示症状，不是正常训练后的短暂喘气。当前严重或持续症状应及时就医。',[
 ['current','近期出现，或当前仍有尚未解释清楚的症状'],['cleared','过去出现过，已评估并明确允许恢复轻中强度运动'],['none','看清题意后确认没有这些症状'],['unsure','仍不能判断，需要进一步确认']],'symptoms',['health.symptoms']);
 if(isRelevant(p,'condition')){
  add('conditionType','慢性病或用药主要属于哪种情况？','选择最相关的一项；同时有多个所列疾病请选择“多种”。工具不诊断疾病，也不判断药物相互作用。',[
  ['cardio','已知心脏、脑血管或其他心血管疾病'],['metabolic','糖尿病等已知代谢疾病'],['kidney','已知肾脏疾病'],['multiple','上面所列疾病同时有多种'],['other','其他已确诊的慢性情况（如高血压）'],['medicine','主要是用药，上述疾病均没有'],['none','核对后，没有相关疾病、用药或运动限制'],['unsure','不清楚属于哪种情况']],'condition',['health.condition']);
  if(s.conditionType&&!['none','unsure'].includes(s.conditionType)){
   add('conditionStable','近期情况是否稳定？','新发症状、急性发作、近期住院或尚未控制的病情，需要先确认。',[
   ['stable','已确诊，近期稳定，无新症状或急性发作'],['changed','新近确诊、病情有变化或仍未控制'],['unsure','不能判断是否稳定']],'condition',['health.condition','screening.conditionType']);
   add('medicineChange','近期用药有变化吗？','新增或调整药物后先确认运动影响，请勿自行停药或改药。',[
   ['none','没有用药，或用药稳定且近期没有调整'],['cleared','调整过，医护人员已确认当前可按建议运动'],['changed','近期新增或调整，尚未确认运动影响'],['unsure','不确定']],'condition',['health.condition','screening.conditionType']);
   add('medicalAdvice','你目前收到的运动建议是什么？','指医疗人员针对你本人现状给出的建议，不能用一般网络建议代替。',[
   ['allowed','已明确允许轻中强度运动，无特殊动作限制'],['light','已明确允许轻量活动，没有其他动作限制'],['custom','需避开特定动作，或遵循专门康复处方'],['stop','被明确要求暂时停止或限制自主运动'],['none','没有收到明确建议'],['unsure','不确定医嘱具体含义']],'condition',['health.condition','screening.conditionType']);
   if(['cardio','metabolic','kidney','multiple'].includes(s.conditionType))add('regularActivity','在目前稳定状态下，你原本规律运动吗？','指至少近 3 个月，每周至少 3 天、每次约 30 分钟中等强度运动。刚开始、刚恢复或偶尔走走都选“没有”。',[
   ['yes','是，一直规律运动且近期正常耐受'],['no','没有，或最近中断了规律运动'],['unsure','不确定是否达到上述情况']],'condition',['health.condition','screening.conditionType']);
  }
 }
 if(isRelevant(p,'pain'))add('painStatus','疼痛、受伤或术后恢复目前是什么情况？','持续或新发疼痛不能硬撑。只有已确认的简单功能限制，才能使用这里的适配动作。',[
 ['resolved','已恢复，日常无痛，需评估时已获恢复建议'],['floorOnly','已评估并允许独立轻量运动，只需避免上下地'],['custom','需避开特定关节/动作，或执行康复处方'],['current','仍有疼痛、近期受伤/手术，尚未评估'],['unsure','还不清楚恢复情况或允许的活动范围']],'pain',['health.pain']);
 if(isRelevant(p,'pregnancy'))add('pregnancyStatus','目前属于下面哪种情况？','孕期、产后恢复和哺乳期需要专门安排，不能直接套成人增肌减脂模板。',[
 ['pregnant','正在孕期'],['postpartum','处于产后恢复阶段'],['feeding','处于哺乳期'],['none','不属于孕期、产后恢复或哺乳期'],['unsure','还不确定']],'pregnancy',['health.pregnancy']);
 if(isRelevant(p,'eating'))add('eatingStatus','进食或近期体重变化具体是哪种情况？','缓慢且有原因的变化，与不明原因消瘦或进食障碍史需要分别处理。',[
 ['expected','有原因的缓慢变化，正常进食，无进食障碍史'],['unexplained','近期意外变轻、下降明显，或原因不明'],['disorder','有进食障碍史，或当前明显限制/失控进食'],['none','核对后没有上述情况'],['unsure','仍不确定原因或进食状况']],'eating',['health.eating']);
 if(Number(p.age)>=18&&bmi<18.5)add('weightTrend','体重偏轻是长期稳定的吗？','体重偏轻本身不代表不能练。先区分长期体型和近期异常消瘦，不要为了生成计划修改真实体重。',[
 ['stable','长期较轻、近期稳定，进食和精神状态正常'],['loss','近期意外下降、吃不下，或明显乏力'],['unsure','不确定是否属于稳定偏瘦']],'body',['height','weight']);
 if(Number(p.age)>=65||bmi>=30||s.painStatus==='floorOnly')add('mobility','日常活动和上下地的能力如何？','根据日常表现选择，不测试极限。需要协助、近期跌倒或明显站不稳，应先做功能评估。',[
 ['normal','能独立行走、坐站，也能安全躺下再起身'],['upright','能独立行走和坐站，但不方便或不应上下地'],['assisted','需要协助，近期跌倒，或站立行走明显不稳'],['unsure','还不能判断']],'mobility',['age','height','weight','screening.painStatus']);
 if((isRelevant(p,'condition')&&s.conditionType!=='none')||(isRelevant(p,'eating')&&!['none','expected'].includes(s.eatingStatus))||bmi<18.5)add('nutritionRestriction','饮食方面有单独的医疗要求吗？','运动许可不等于饮食许可。本题仅影响饮食，不锁住适用训练；肾病和进食障碍仍需专门营养安排。',[
 ['none','无特殊饮食医嘱，日常进食正常'],['special','有蛋白质、能量、液体或其他特殊饮食要求'],['unsure','不确定是否需要特殊饮食安排']],'nutrition',['health.condition','screening.conditionType','health.eating','screening.eatingStatus']);
 const token=painToken(history);
 if(token)add('painResolution','最近训练记录中的疼痛已经处理了吗？','先停止相关动作。刷新页面或换训练日不会视为已恢复，新的疼痛记录需要重新确认。',[
 ['pending','还没有，或仍有疼痛'],[token,'已无痛恢复，需评估的情况也已获恢复建议'],['unsure','还不能判断']],'painHistory',[]);
 return questions;
}
function validateProfile(p){
 const errors=[];
 for(const [key,min,max,label] of [['age',10,100,'年龄'],['height',100,230,'身高'],['weight',25,250,'体重'],['sleep',0,16,'睡眠时长']])if(!num(p[key])||Number(p[key])<min||Number(p[key])>max)errors.push(`${label}请填 ${min}–${max} 范围内的数字。`);
 if(num(p.age)&&!Number.isInteger(Number(p.age)))errors.push('年龄请填整数。');
 if(!['male','female','skip'].includes(p.sex))errors.push('请选择生理性别，或选择不提供。');
 if(!Object.keys(GOALS).includes(p.goal)||!Object.keys(FOCUS).includes(p.focus))errors.push('请选择训练目标和体型重点。');
 if(p.goal==='lean'&&p.weightStrategy!==undefined&&!['auto','gain','maintain'].includes(p.weightStrategy))errors.push('请选择体重方向：根据情况建议、小幅增重或先维持。');
 if(p.goal==='lean'&&p.recentWeightTrend!==undefined&&!['','stable','plannedGain','plannedLoss','unexplained','unsure'].includes(p.recentWeightTrend))errors.push('近期体重变化选项无效，请重新选择。');
 if(!['new','return','regular'].includes(p.experience))errors.push('请选择运动基础。');
 if(![20,30,45,60].includes(Number(p.minutes)))errors.push('请选择每次训练时长。');
 if(!Array.isArray(p.days)||!p.days.length||p.days.some(d=>!Number.isInteger(d)||d<0||d>6))errors.push('至少选择一个方便训练的星期。');
 if(!Array.isArray(p.equipment)||p.equipment.some(e=>!D.EQUIPMENT.some(x=>x[0]===e)))errors.push('器材选择无效。');
 if(!Array.isArray(p.allergyTags)||p.allergyTags.some(x=>!['egg','milk','soy','nuts','fish','wheat'].includes(x)))errors.push('食物限制选项无效。');
 if(typeof p.allergies!=='string'||typeof p.notes!=='string')errors.push('补充说明格式无效。');
 if(p.equipment?.includes('dumbbell')&&(!num(p.maxDumbbell)||Number(p.maxDumbbell)<=0||Number(p.maxDumbbell)>100))errors.push('请填写单只哑铃可用的最大重量（大于 0，最多 100 公斤）。');
 if(!p.health||['symptoms','condition','pain','pregnancy','eating'].some(k=>!['no','yes','unsure'].includes(p.health[k])))errors.push('请回答全部健康问题；不确定可以选择“不确定”。');
 if(!['home','canteen','takeout'].includes(p.foodMode)||!['mixed','vegetarian','vegan'].includes(p.diet)||!['low','medium','flexible'].includes(p.budget)||!['low','medium','high'].includes(p.activity))errors.push('请完成饮食、预算和日常活动选择。');
 if((p.allergies||'').length>500||(p.notes||'').length>1000)errors.push('备注太长，请缩短后保存。');
 if(p.screening!==undefined&&(!p.screening||typeof p.screening!=='object'||Array.isArray(p.screening)||Object.entries(p.screening).some(([k,v])=>k.length>80||typeof v!=='string'||v.length>300)))errors.push('补充健康资料格式无效。');
 return errors;
}
function assess(p,history=[]){
 const reasons=[],issues=[],adaptations=[],s=details(p),bmi=bmiOf(p);let mode='standard',urgent=false;
 const rank={standard:0,adapted:1,clarify:2,review:3,pause:4};
 const add=(code,title,message,next='review',step=3)=>{reasons.push(message);issues.push({code,title,answer:'',message,step});if(rank[next]>rank[mode])mode=next;};
 const adapt=text=>{adaptations.push(text);if(mode==='standard')mode='adapted';};
 const qs=screeningQuestions(p,history);
 const missing=qs.filter(q=>q.group!=='nutrition'&&!q.options.some(o=>o[0]===s[q.key]));
 for(const q of missing)add(q.key,q.title,`请在工具内补充“${q.title}”，再按实际情况匹配方案。`,'clarify');
 if(Number(p.age)<18)add('age','需要青少年专门安排','未满 18 岁需要符合生长发育的活动和饮食，成人增肌减脂模板不适用。','review',0);
 if(p.recentWeightTrend==='unexplained')add('recentWeightTrend','先了解不明原因体重变化','你填写了近期不明原因的体重变化。请先核对记录并了解原因，暂不自动安排增减重或新的训练；这与其他健康题的回答分开判断。','review',1);
 if(isRelevant(p,'symptoms')){
  if(s.symptomStatus==='current'){add('symptoms','先处理警示症状','当前或近期有未解释清楚的胸痛、晕厥或异常气短，请暂停训练并尽快就医；严重、持续或突然加重时及时寻求急救。','pause');urgent=true;}
  if(s.symptomStatus==='unsure')add('symptoms','先确认症状含义','还不能确定是否存在警示症状，请由了解情况的医疗人员确认，之后回来继续。','clarify');
  if(s.symptomStatus==='cleared')adapt('过去症状已评估并获准恢复，先以轻量、能正常说话的强度开始。');
 }
 if(isRelevant(p,'condition')){
  if(s.conditionType==='unsure')add('condition','先弄清疾病或用药类别','请确认具体疾病或用药的运动注意事项，不能仅凭“慢性病/用药”决定强度。','clarify');
  if(s.conditionType&&!['none','unsure'].includes(s.conditionType)){
   if(s.conditionStable==='changed')add('condition','近期情况需要评估','近期情况有变化或尚未控制，先确认允许的活动范围，再启动自主训练。');
   if(s.conditionStable==='unsure')add('condition','先确认近期稳定性','尚不清楚情况是否稳定，需要补充医疗人员对近期状态的判断。','clarify');
   if(s.medicineChange==='changed')add('medicine','先确认药物调整的影响','近期药物调整后还未确认运动影响，先询问开药或随访的医护人员。');
   if(s.medicineChange==='unsure')add('medicine','先核对用药变化','请确认近期是否新增或调整过药物，以及对运动的影响。','clarify');
   if(s.medicalAdvice==='stop')add('condition','遵循暂停运动的医嘱','当前有明确自主运动限制，工具不能覆盖医嘱，请按医嘱复评。','pause');
   if(s.medicalAdvice==='custom')add('condition','需要个体处方','建议含特定动作或康复限制，本工具还不能把这些限制安全转换为完整处方。请使用已有专业方案，记录仍可使用。');
   if(s.medicalAdvice==='unsure')add('condition','先确认医嘱','还不清楚允许的活动范围，请先确认医嘱具体内容。','clarify');
   const disease=['cardio','metabolic','kidney','multiple'].includes(s.conditionType);
   if(disease&&s.regularActivity==='unsure')add('condition','先确认既往运动习惯','是否一直规律运动会影响判断；不确定时先与医疗人员确认。','clarify');
   if(disease&&s.regularActivity==='no'&&s.medicalAdvice==='none')add('condition','开始前需要运动许可','已有心血管、代谢或肾脏相关疾病，且原本没有规律运动：先取得针对现状的运动建议，再开始计划。');
   if(s.conditionStable==='stable')adapt('按已确认的稳定状态从轻量开始，不安排高强度、憋气或力竭训练。');
   if(s.medicalAdvice==='light')adapt('当前只获准轻量活动，优先徒手、扶稳动作，保留较长休息。');
  }
 }
 if(isRelevant(p,'pain')){
  if(s.painStatus==='current')add('pain','先明确疼痛或恢复状态','仍有持续/新发疼痛，或伤后术后尚未评估；先停止诱发疼痛的动作，并确认允许的活动范围。');
  if(s.painStatus==='custom')add('pain','使用已有康复方案','需要针对特定关节或动作的限制，本工具不能代替个体康复处方。');
  if(s.painStatus==='unsure')add('pain','先确认恢复范围','尚不清楚恢复状态或允许的活动，需要先补充专业意见。','clarify');
  if(s.painStatus==='resolved')adapt('伤痛已恢复，重新开始时减少训练量；出现新疼痛就停止相关动作。');
  if(s.painStatus==='floorOnly')adapt('仅使用站姿、坐站或扶稳版本，避开需要上下地的动作。');
 }
 if(isRelevant(p,'pregnancy')){
  if(['pregnant','postpartum','feeding'].includes(s.pregnancyStatus))add('pregnancy','需要孕产期专门安排','孕期、产后恢复或哺乳期应使用对应阶段的运动和营养安排；成人增肌减脂模板暂不覆盖。');
  if(s.pregnancyStatus==='unsure')add('pregnancy','先确认所处阶段','先确认是否属于孕期、产后恢复或哺乳期，再选择相应方案。','clarify');
 }
 if(isRelevant(p,'eating')){
  if(s.eatingStatus==='unexplained')add('eating','先了解意外消瘦原因','近期体重意外下降或原因不明，先评估原因，不自动安排增减重或加量训练。');
  if(s.eatingStatus==='disorder')add('eating','需要进食与运动的个体支持','有进食障碍史或当前进食问题，需要专业人员共同安排饮食与运动，不自动开热量和训练处方。');
  if(s.eatingStatus==='unsure')add('eating','先确认变化原因','还不能解释体重或进食变化，请先确认原因。','clarify');
 }
 if(Number(p.age)>=18&&bmi<16)add('body','先做营养与健康评估',`当前 BMI 约 ${bmi.toFixed(1)}，需要进一步评估营养风险。数字不用于诊断；先核对单位，再由专业人员安排恢复进食与活动。`,'review',0);
 else if(Number(p.age)>=18&&bmi<18.5){
  if(s.weightTrend==='stable')adapt('长期稳定偏轻：保留轻量力量训练，不安排减脂缺口。');
  if(s.weightTrend==='loss')add('body','先了解消瘦或乏力','近期意外消瘦、吃不下或明显乏力，先了解原因，再安排加量训练。','review',0);
  if(s.weightTrend==='unsure')add('body','先确认体重趋势','根据记录或专业评估确认是否长期稳定偏瘦，不凭一次体重判断。','clarify',0);
 }
 if(Number(p.age)>=65)adapt('按日常功能选择低冲击力量动作，并加入扶稳平衡练习；年龄本身不构成拒绝原因。');
 if(bmi>=30)adapt('根据实际活动能力降低起始负担，避免跳跃；体重较高本身不会锁住训练。');
 if(qs.some(q=>q.key==='mobility')){
  if(s.mobility==='upright')adapt('不便上下地，全部使用站姿、坐站或扶稳动作。');
  if(s.mobility==='assisted')add('mobility','先做功能与跌倒风险评估','需要协助、近期跌倒或明显站不稳，应先评估和指导活动，不自动安排独立站立训练。');
  if(s.mobility==='unsure')add('mobility','先确认活动能力','根据日常表现确认活动能力，不为回答本题测试极限。','clarify');
 }
 const token=painToken(history);
 if(token&&s.painResolution!==token&&s.painResolution!==undefined)add('painHistory','最近训练疼痛尚未处理','最近一次训练记录过疼痛，先停止相关动作并确认恢复，新的日期不会自动解除。',s.painResolution==='unsure'?'clarify':'review');
 if(token&&s.painResolution===token)adapt('最近训练疼痛已确认处理，重新从较低起点开始，新的疼痛需要再次暂停确认。');
 return{eligible:['standard','adapted'].includes(mode),mode,reasons,issues,bmi:Math.round(bmi*10)/10,urgent,adaptations,questions:qs.filter(q=>q.group!=='nutrition'&&(!q.options.some(o=>o[0]===s[q.key])||s[q.key]==='unsure')).map(q=>q.key)};
}
function schedule(days){
 const all=[...new Set(days)].sort((a,b)=>a-b);let best=[];
 for(let mask=1;mask<(1<<all.length);mask++){
  const subset=all.filter((_,i)=>mask&(1<<i));
  if(subset.length>3||subset.some((d,i)=>subset.some((e,j)=>i!==j&&[1,6].includes(Math.abs(d-e)))))continue;
  if(subset.length>best.length)best=subset;
 }
 return best;
}
function noFloor(p){return details(p).mobility==='upright'||(isRelevant(p,'pain')&&details(p).painStatus==='floorOnly');}
function available(p,id){return!!E[id]&&E[id].equipment.every(x=>(p.equipment||[]).includes(x))&&!(noFloor(p)&&E[id].floor);}
function pick(p,ids){return ids.find(id=>available(p,id));}
function alternatives(p,exId,history=[]){
 const safety=assess(p,history);if(!safety.eligible||!E[exId])return[];
 const gentle=['squat','chair','wall','hinge','bridge','wraise','standingw','calf','supportedbalance','supportedmarch','standinghip','bandpull'];
 return Object.keys(E).filter(id=>id!==exId&&E[id].pattern===E[exId].pattern&&available(p,id)&&(safety.mode!=='adapted'||gentle.includes(id)));
}
function parseLocalDate(value){
 if(value instanceof Date&&!Number.isNaN(value.getTime()))return new Date(value.getFullYear(),value.getMonth(),value.getDate());
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){const [y,m,d]=value.split('-').map(Number),parsed=new Date(y,m-1,d);if(dateKey(parsed)===value)return parsed;}
 const today=new Date();return new Date(today.getFullYear(),today.getMonth(),today.getDate());
}
const shiftDate=(date,n)=>{const result=new Date(date);result.setDate(result.getDate()+n);return result;};
// These are conservative review prompts for this app, not medical thresholds or
// a prescription for the rate of muscle gain. Food estimates always restart
// from the profile formula; a previous suggested surplus is never compounded.
function measurementDay(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d);
 return dateKey(date)===value?Date.UTC(y,m-1,d)/86400000:null;
}
const average=values=>values.reduce((a,b)=>a+b,0)/values.length;
const rounded=(value,digits=2)=>Math.round(value*10**digits)/10**digits;
function weightTrendSummary(measurements,now){
 const today=measurementDay(dateKey(now)),byDate=new Map(),notes=[];let ignoredCount=0,duplicateCount=0,olderCount=0,invalidWaist=0;
 for(const row of Array.isArray(measurements)?measurements:[]){
  const day=measurementDay(row?.date);
  if(day===null||day>today||!num(row?.weight)||Number(row.weight)<25||Number(row.weight)>250){ignoredCount++;continue;}
  if(day<today-41){olderCount++;continue;}
  let waist=null;if(row.waist!==undefined&&row.waist!==null&&row.waist!==''){if(num(row.waist)&&Number(row.waist)>=30&&Number(row.waist)<=250)waist=Number(row.waist);else invalidWaist++;}
  if(byDate.has(row.date))duplicateCount++;
  byDate.set(row.date,{date:row.date,day,weight:Number(row.weight),waist});
 }
 const rows=[...byDate.values()].sort((a,b)=>a.day-b.day),count=rows.length,first=rows[0],last=rows[count-1];
 const spanDays=count?last.day-first.day:0,early=count?rows.filter(x=>x.day<=first.day+6):[],late=count?rows.filter(x=>x.day>=last.day-6):[];
 const enough=count>=6&&spanDays>=14&&early.length>=3&&late.length>=3&&today-last.day<=7;
 const startAverage=enough?average(early.map(x=>x.weight)):null,endAverage=enough?average(late.map(x=>x.weight)):null;
 const change=enough?endAverage-startAverage:null,meanGap=enough?average(late.map(x=>x.day))-average(early.map(x=>x.day)):0;
 const rate=enough?change/startAverage/meanGap*7*100:null;
 const firstWaists=early.filter(x=>x.waist!==null),lastWaists=late.filter(x=>x.waist!==null);
 const waistChange=enough&&firstWaists.length>=2&&lastWaists.length>=2?average(lastWaists.map(x=>x.waist))-average(firstWaists.map(x=>x.waist)):null;
 const sudden=rows.some((x,i)=>i>0&&x.day-rows[i-1].day<=7&&Math.abs(x.weight-rows[i-1].weight)/rows[i-1].weight>.07);
 const abnormal=sudden||(enough&&(Math.abs(rate)>2||Math.abs(change)/startAverage>.10));
 if(ignoredCount)notes.push(`忽略了 ${ignoredCount} 条无效或未来日期的体重记录，请核对日期、公斤单位和输入。`);
 if(duplicateCount)notes.push(`${duplicateCount} 条同日重复记录按最后一条有效记录处理，不增加测量天数。`);
 if(olderCount)notes.push(`复盘仅使用最近 42 天，较早的 ${olderCount} 条记录仍可在历史中查看。`);
 if(invalidWaist)notes.push(`${invalidWaist} 个无效腰围数值未参与比较，体重记录仍可使用。`);
 if(count&&today-last.day>7)notes.push('最新体重记录已超过 7 天，请补充近期记录后再复盘。');
 if(!enough)notes.push('请跨至少 14 天记录，开始和结束的各 7 天内分别至少有 3 个不同日期的体重；同样的称量条件更便于比较。');
 if(abnormal)notes.push('记录变化较大或出现突跳：先检查单位、秤和录入。若变化属实、原因不明或伴随不适，请做专业评估，不据此自动加餐。');
 return{enough,count,spanDays,from:first?.date||null,to:last?.date||null,startAverage:startAverage===null?null:rounded(startAverage),endAverage:endAverage===null?null:rounded(endAverage),changeKg:change===null?null:rounded(change),weeklyPercent:rate===null?null:rounded(rate),waistChangeCm:waistChange===null?null:rounded(waistChange),ignoredCount,duplicateCount,abnormal,notes};
}
function trainingTrendSummary(history,now){
 const today=measurementDay(dateKey(now)),byDate=new Map();
 for(const row of Array.isArray(history)?history:[]){const day=measurementDay(row?.date);if(day===null||day>today||day<today-41||!num(row.completedSets)||!num(row.totalSets)||Number(row.totalSets)<=0)continue;byDate.set(row.date,{...row,day});}
 const rows=[...byDate.values()].sort((a,b)=>a.day-b.day),count=rows.length,recent=rows.slice(-2);
 if(Number(recent[recent.length-1]?.day)<today-14)return{status:'unknown',count,detail:'最近训练记录较久，需要新记录判断当前表现和恢复。'};
 if(recent.some(x=>x.pain||x.recovery==='poor'||x.recovery==='tired'||x.effort==='hard'||Number(x.completedSets)<Number(x.totalSets)*.8))return{status:'recovery',count,detail:'最近记录提示吃力、疲劳、疼痛或完成不足，先核对恢复与训练安排，不能直接归因于吃得少。'};
 if(count<4||rows[count-1].day-rows[0].day<14)return{status:'unknown',count,detail:'需要至少跨两周的 4 次训练记录，并有可比较的同类动作；当前不足以判断长期变化。'};
 const snapshot=row=>{
  const result=new Map();for(const ex of row.exercises||[]){const sets=(ex.sets||[]).filter(x=>x.done&&num(x.reps)&&Number(x.reps)>0&&Number(x.reps)<=200&&(!E[ex.id]?.load||(num(x.weight)&&Number(x.weight)>=0&&Number(x.weight)<=300)));if(!sets.length||!E[ex.id])continue;result.set(ex.id,{reps:average(sets.map(x=>Number(x.reps))),weight:E[ex.id].load?average(sets.map(x=>Number(x.weight))):0});}return result;
 };
 const first=snapshot(rows[0]),last=snapshot(rows[count-1]);let comparable=0,improved=0,declined=0;
 for(const [id,a] of first){const b=last.get(id);if(!b)continue;comparable++;if((b.reps>=a.reps+1&&b.weight>=a.weight)||(b.weight>a.weight+.1&&b.reps>=a.reps))improved++;if(b.reps<a.reps-1||b.weight<a.weight-.1)declined++;}
 if(comparable<2)return{status:'unknown',count,detail:'记录中的动作或负重条件不足以比较，请在可控制的条件下持续记录；不把换动作当作力量进步。'};
 if(declined>0)return{status:'recovery',count,detail:'部分可比较动作的次数或重量下降，先核对动作、训练量与恢复；这些记录不能单独证明需要更多热量。'};
 if(improved>0&&declined===0)return{status:'improving',count,detail:'至少一个可比较动作的次数或重量有进步，其余未见明显下降；这说明表现改善，不等于测出了肌肉增长。'};
 return{status:'stable',count,detail:'可比较动作暂未显示一致的进步。先核对动作、训练刺激与恢复，不仅靠增加食量解决。'};
}
function weightGuidance(p,history=[],measurements=[],options={}){
 if(p.goal!=='lean')return null;
 const requested=['gain','maintain'].includes(p.weightStrategy)?p.weightStrategy:'auto',now=parseLocalDate(options.now),trend=weightTrendSummary(measurements,now),performance=trainingTrendSummary(history,now),bmi=bmiOf(p),reasons=[];
 let effectiveStrategy=requested==='auto'?'maintain':requested,needsInfo=!trend.enough||!p.recentWeightTrend||p.recentWeightTrend==='unsure';
 let review={status:'collect',title:'先建立可比较的记录',detail:'单次称重不用于改变方向或热量。先按当前起点练习，积累至少两周体重与训练记录。',action:'在“记录”中持续保存不同日期的体重；腰围可选。每次训练后如实记录难度与恢复。'};
 const blocked=(message)=>{effectiveStrategy='review';needsInfo=true;reasons.push(message);review={status:'review',title:'先核对并完成适用评估',detail:message,action:'先核对资料与记录；需要医疗或营养评估时，按专业建议继续。不要为了获得数值而修改真实答案。'};};
 const nutritionCheck=nutritionBase({...p,goal:'recomp'},true);
 if(p.recentWeightTrend==='unexplained')blocked('你填写了近期不明原因的体重变化，需要先了解原因；不自动决定增重或维持，也不生成增减重数值。');
 else if(trend.abnormal)blocked('多日记录出现幅度较大的变化或突跳，先检查录入与称量条件；属实或原因不明时先评估，不自动加餐或减餐。');
 else if(!nutritionCheck.eligible)blocked(nutritionCheck.reason);
 else{
  if(!p.recentWeightTrend||p.recentWeightTrend==='unsure'){
   effectiveStrategy='maintain';reasons.push('近期体重变化还不清楚，暂以维持观察为起点，不因为选择“薄肌”就自动要求增重。');
   review={status:'collect',title:'先补充近期变化',detail:'请在资料页说明近期是稳定、有意变化还是原因不明。暂时不追加增重食量。',action:'在“我的”补充近期体重变化，并开始多日称重。'};
  }else if(requested==='maintain')reasons.push('你明确选择先维持体重，起点按维持安排；是否改为小幅增重由后续记录和你的选择决定。');
  else if(requested==='gain')reasons.push('你选择小幅增重，采用有限的饮食起点，再用体重趋势、训练表现和恢复复盘；不保证增加的都是肌肉。');
  else if(bmi<18.5&&details(p).weightTrend==='stable'){
   effectiveStrategy='gain';reasons.push('已确认长期稳定偏轻，且适合当前饮食建议，建议结合力量练习小幅增重。BMI 只用于筛查，不用于推断体脂。');
  }else reasons.push('目前没有足够依据要求你先增重，先维持并规律做力量训练，再看实际变化；BMI 无法分辨肌肉和脂肪。');
  if(requested==='maintain'&&bmi<18.5)reasons.push('你长期稳定偏轻，维持不等于少吃或减脂；若希望改善体重与营养状态，可再讨论小幅增重。');
  if(p.recentWeightTrend==='plannedLoss')reasons.push('你填写了此前有意减重；薄肌路线先观察正常进食与力量表现，不沿用自动减脂缺口。');
  if(trend.enough&&p.recentWeightTrend&&p.recentWeightTrend!=='unsure'){
   const fast=bmi>=18.5&&(trend.weeklyPercent>.25||((trend.waistChangeCm||0)>=2&&trend.weeklyPercent>.10));
   if(fast){
    effectiveStrategy='maintain';review={status:'reduce_gain',title:'先放慢增重，不继续追加食量',detail:`多日均值约每周变化 ${trend.weeklyPercent>0?'+':''}${trend.weeklyPercent}%。这是本工具提醒复盘的保守规则，不是医学分界，也不能据此判断增加的是脂肪还是肌肉。`,action:'若正在额外加餐，先撤回其中一小份，保留正常三餐与力量训练；继续观察约两周，不叠加新的盈余。'};
    reasons.push('增重速度或伴随腰围变化提示先复盘。暂建议维持观察，保存的原始方向选择不会被改写。');
   }else if(performance.status==='recovery'||Number(p.sleep)<6){
    review={status:'check_recovery',title:'先核对恢复，不把疲劳直接当作缺热量',detail:performance.status==='recovery'?performance.detail:'资料显示睡眠较少，需要先改善恢复并检查训练是否过量。',action:'先核对睡眠、规律进餐、动作和训练量。恢复正常后仍持续体重下降或表现不进步，再考虑一小份加餐；一次只改一项。'};
   }else if(performance.status==='improving'){
    review={status:'continue',title:'表现正在改善，先保持当前节奏',detail:'有可比较的训练进步，暂不需要为了体重数字继续增加食量。体重增加不等于测出了肌肉增加。',action:'继续当前方向和规律训练，再观察约两周的体重均值与恢复，不自动叠加热量。'};
   }else if(performance.status==='stable'&&trend.weeklyPercent<=.10&&(trend.waistChangeCm===null||trend.waistChangeCm<2)){
    if(requested==='auto')effectiveStrategy='gain';
    review={status:'consider_food',title:'先检查训练与恢复，再考虑一小份加餐',detail:'体重均值没有明显上升，且可比较动作暂未显示一致进步。它不能证明热量不足，但可作为核对训练、恢复与饮食的线索。',action:requested==='maintain'?'保留你选择的维持方向，先检查训练是否规律和睡眠；条件合适、你愿意尝试时，再切换小幅增重。':'先确认动作、规律训练和睡眠都合适；再尝试一天一小份加餐，持续观察约两周，不在每次打开页面时继续加量。'};
   }else{
    review={status:'continue',title:'先保持起点，继续积累训练证据',detail:'体重记录已可比较，但训练表现或恢复信息还不足以支持进一步加量。',action:'保持规律三餐和当前训练起点，继续记录动作次数、重量和恢复；不要只凭体重决定食量。'};
   }
  }else if(performance.status==='recovery'||Number(p.sleep)<6){review={status:'check_recovery',title:'先照顾恢复，同时积累记录',detail:'体重趋势尚不足判断，已有反馈提示先核对疲劳、睡眠或训练量，不自动把食量越加越多。',action:'按训练计划的减量提示恢复，保持规律进餐，并继续记录不同日期的体重。'};}
 }
 reasons.push('薄肌指适量肌肉、线条与整体比例，没有统一的目标体重或体脂率。');
 const label=effectiveStrategy==='gain'?'小幅增重':effectiveStrategy==='maintain'?'先维持体重':'先评估体重方向';
 return{requested,effectiveStrategy,label,title:effectiveStrategy==='review'?'薄肌目标先保留，体重方向待确认':`薄肌身材 · ${label}`,reasons,review,trend,performance,needsInfo};
}
function framework(p,history,now){
 const start=parseLocalDate(p.planStartedAt||p.updatedAt||dateKey(now));const elapsed=Math.max(0,Math.round((now-start)/86400000)),week=Math.min(4,Math.floor(elapsed/7)+1);
 const weeks=[{week:1,title:'认识动作，找到起点',detail:'先学动作、找到能控制的难度。没有完成记录就保持起步量，不因为日期变化加量。'},
 {week:2,title:'稳定完成，形成节奏',detail:'优先稳定完成与恢复。连续完成、恢复良好才考虑增加一组，吃力或恢复差就减少。'},
 {week:3,title:'根据反馈，小步调整',detail:'两次都轻松且动作稳定，再少量增加次数。一次只改变一个条件，不要求加重。'},
 {week:4,title:'回看四周，决定下一步',detail:'结合完成率、主观难度和恢复重新安排。错过不补做双倍，之后继续使用反馈规则。'}];
 return{phase:{...weeks[week-1],detail:weeks[week-1].detail+` 已记录 ${history.length} 次训练。`},weeks};
}
function makePlan(p,history=[],options={}){
 const errors=validateProfile(p);if(errors.length)return{valid:false,errors};
 const now=parseLocalDate(options.now),frames=framework(p,history,now),guidance=weightGuidance(p,history,options.measurements||[],{now});let safety=assess(p,history);
 if(guidance?.trend.abnormal){const message='身体记录出现幅度较大的变化或突跳。请到“记录”核对日期、公斤单位和数值；变化属实或原因不明时先评估，不自动开始新的训练。';safety={...safety,eligible:false,mode:safety.mode==='pause'?'pause':'review',reasons:[...safety.reasons,message],issues:[...safety.issues,{code:'measurements',title:'先核对身体记录',answer:'',message,step:0}]};}
 if(!safety.eligible)return{valid:true,safety,workouts:[],trainingDays:[],notes:[],...frames,next7:[],adjustment:{title:'先完成当前确认',detail:'资料和记录会保留，需要确认的内容只在应用内补充。'},rationale:safety.reasons,adapted:false,weightGuidance:guidance};
 const adapted=safety.mode==='adapted',novice=p.experience==='new',upright=noFloor(p),older=Number(p.age)>=65;
 const goalKey=p.goal==='lean'?'recomp':bmiOf(p)<18.5?'build':bmiOf(p)<20&&p.goal==='lose'?'recomp':p.goal;
 const goalLabel=p.goal==='lean'?GOALS.lean:GOALS[goalKey];
 const maxMinutes=Number(p.minutes),minutes=[20,30,45,60].includes(Number(options.minutes))?Math.min(maxMinutes,Number(options.minutes)):maxMinutes;
 let lastPainIndex=-1;for(let i=0;i<history.length;i++)if(history[i]?.pain)lastPainIndex=i;
 const trainingDays=schedule(p.days),usable=history.slice(lastPainIndex+1).filter(h=>h&&!h.pain&&num(h.completedSets)&&num(h.totalSets)&&Number(h.totalSets)>0);
 const latest=usable[usable.length-1],recent=usable.slice(-2),adequate=h=>Number(h.completedSets)>=Number(h.totalSets)*.8,recovered=h=>!['poor','tired'].includes(h.recovery);
 const good=usable.filter(h=>adequate(h)&&recovered(h)&&h.effort!=='hard');
 const twoGood=recent.length===2&&recent.every(h=>adequate(h)&&recovered(h)&&h.effort!=='hard');
 const twoEasy=recent.length===2&&recent.every(h=>adequate(h)&&recovered(h)&&h.effort==='easy');
 const reduce=!!latest&&(latest.effort==='hard'||!adequate(latest)||!recovered(latest)),poorSleep=Number(p.sleep)<6;
 let baseSets=(p.experience==='regular'&&!adapted)?2:twoGood?2:1;
 if(goalKey==='build'&&good.length>=6&&twoEasy&&!adapted&&minutes>=45)baseSets=3;
 if(reduce||poorSleep)baseSets=Math.max(1,baseSets-1);
 if(adapted)baseSets=Math.min(2,baseSets);
 const squat=pick(p,adapted?['chair','squat']:novice?['legpress','goblet','chair','squat']:['legpress','goblet','squat']);
 const push=pick(p,adapted?['wall']:['chestmachine','floor',...(novice?['wall']:['pushup','wall'])]);
 const pull=pick(p,adapted?['standingw']:['lat','row',...(upright?[]:['bandrow']),'wraise','standingw']);
 const hinge=pick(p,adapted?(upright?['standinghip','hinge']:['hinge','bridge']):novice?['bridge','hinge']:['rdl','hinge','bridge']);
 let main=[squat,push,pull,hinge];
 if(p.focus==='shoulder')main=[pull,push,squat,hinge];if(p.focus==='chest')main=[push,pull,squat,hinge];if(p.focus==='glute')main=[squat,hinge,pull,push];
 let count=minutes>=60?7:minutes>=45?6:minutes>=30?5:4;
 if(goalKey==='health'&&minutes>=45)count=5;if(goalKey==='build'&&minutes>=45&&!adapted)count=Math.min(7,count+1);if(older)count=Math.max(5,count);
 const extras={balanced:['deadbug','calf','supportedmarch'],shoulder:[pick(p,adapted?['standingw','bandpull']:['lateral','bandpull','wraise']),'deadbug','calf'],chest:[pick(p,adapted?['calf']:['curl','deadbug']),'plank','calf'],glute:['bridge','standinghip','deadbug'],core:['deadbug','plank','supportedmarch']}[p.focus];
 const patternSets=[main,[main[2],main[3],main[0],main[1]],main],notes=[...safety.adaptations];
 const adjustment=reduce?{title:'下一次主动减量',detail:'最近吃力、恢复不佳或完成不足：减少组数/次数，延长休息。恢复前不加量。'}:poorSleep?{title:'先照顾恢复',detail:'填写的睡眠较少，先减少组数与次数、延长休息，恢复后再根据实际反馈调整。'}:twoEasy?{title:'根据连续反馈小步增加',detail:'最近两次完成良好且轻松：优先增加一组，组数已稳定时才少量增加次数，不自动提高重量。'}:{title:'保持可完成的起点',detail:'先把动作做稳定，完成后记录难度与恢复。进入下一周不会自动增加组数或重量。'};
 const workouts=trainingDays.map((day,i)=>{
  const ids=[...new Set(patternSets[i].filter(Boolean))];if(older&&available(p,'supportedbalance'))ids.push('supportedbalance');
  for(const id of [...extras,'calf','supportedmarch','standinghip','deadbug','hinge'])if(id&&available(p,id)&&!(adapted&&id==='plank')&&!ids.includes(id)&&ids.length<count)ids.push(id);
  const exercises=ids.map(id=>{
   const ex=E[id],balance=ex.pattern==='balance',cardio=ex.pattern==='cardio',max=ex.maxReps||12;
   const baseline=ex.timed?(balance?5:15):Math.min(max,adapted?5:(max>=12?8:6));
   const priorDone=(latest?.exercises?.find(x=>x.id===id)?.sets||[]).filter(x=>x.done&&num(x.reps));
   const priorTarget=priorDone.length?Math.min(max,Math.max(baseline,Math.min(...priorDone.map(x=>Number(x.reps))))):baseline;
   const addingSet=priorDone.length>0&&baseSets>priorDone.length;let targetReps=priorTarget;
   if(reduce||poorSleep)targetReps=Math.max(ex.timed?5:4,baseline-(ex.timed?5:2));
   else if(twoEasy&&!addingSet&&priorDone.length)targetReps=Math.min(max,priorTarget+(ex.timed?5:1));
   const sets=(balance||cardio)?1:baseSets,rest=Math.min(180,Math.max(ex.rest,adapted?90:0)+(reduce||poorSleep?30:0));
   const reps=`${ex.reps.includes('每侧')?'每侧 ':''}${targetReps} ${ex.timed?'秒':'次'}`;
   const weights=priorDone.map(x=>Number(x.weight)).filter(x=>Number.isFinite(x)&&x>0),priorWeight=weights.length?Math.min(...weights):null;
   const withinLimit=!ex.equipment.includes('dumbbell')||priorWeight<=Number(p.maxDumbbell);
   const weightSuggestion=ex.load?(reduce||poorSleep?'选择更容易控制的轻重量，仍应能多做约 3 次。':priorWeight&&withinLimit?`可从上次记录的 ${priorWeight} 公斤试起，先判断控制能力，不自动加重。`:'用很轻重量试做，结束时仍能再做约 3 次；器材最大重量不是起始重量。'):'使用能稳定完成的幅度与姿势，不追求极限。';
   return{id,sets,reps,rest,targetReps,weightSuggestion,reason:reduce||poorSleep?'减少目标次数并延长休息。':addingSet?'稳定完成并恢复良好后先增加一组，次数保持。':twoEasy&&priorDone.length?'连续轻松完成后小幅增加目标次数。':adapted?'按功能和恢复采用较低起点。':'先稳定动作，再根据记录调整。'};
  });
  const estimate=()=>Math.ceil((360+exercises.reduce((sum,x)=>{const ex=E[x.id],side=ex.reps.includes('每侧')?2:1,effort=ex.timed?x.targetReps*side:x.targetReps*side*3;return sum+x.sets*(effort+x.rest)+15;},0))/60);
  while(estimate()>minutes&&exercises.some(x=>x.sets>1)){const last=[...exercises].reverse().find(x=>x.sets>1);last.sets--;last.reason='按今天可用时间减少组数，保留主要动作。';}
  while(estimate()>minutes&&exercises.length>4){let index=-1;for(let j=exercises.length-1;j>=0;j--)if(!['squat','push','pull','hinge','balance'].includes(E[exercises[j].id].pattern)){index=j;break;}if(index<0)break;exercises.splice(index,1);}
  return{id:`workout-${i}`,label:`${adapted?'轻量全身':'全身'} ${String.fromCharCode(65+i)}`,day,sets:Math.max(...exercises.map(x=>x.sets)),minutes:estimate(),exercises};
 });
 if(p.days.length>trainingDays.length)notes.push('力量训练间隔至少一天，每周最多 3 次；相邻可用日留给恢复，不补做双倍。');
 if(trainingDays.length<2)notes.push('当前日期只适合 1 次力量训练，先建立习惯，有条件再增加不相邻的一天。');
 if(['wraise','standingw'].includes(pull))notes.push('当前上背控制不能等效替代负重划船的增肌刺激。先使用安全的现有条件，不要求购买器材。');
 if(minutes===20)notes.push('20 分钟优先推、拉、蹲、髋部动作；老年模式额外保留扶稳平衡练习。');
 if(p.focus==='core')notes.push('腹部重点提高稳定性，不承诺只减少腹部脂肪；体型变化需要持续训练和适当饮食。');
 if(p.equipment.includes('dumbbell')&&!p.adjustable)notes.push('固定哑铃太重就用可控制的徒手同类动作，没有小增量就保持原重量。');
 if(minutes<maxMinutes)notes.push(`当前选用 ${minutes} 分钟的缩短版本，仅用于本次；后续日程仍按常规 ${maxMinutes} 分钟匹配。`);
 const today=dateKey(now),previous=dateKey(shiftDate(now,-1)),trainedToday=history.some(h=>h.date===today&&Number(h.completedSets)>0),trainedYesterday=history.some(h=>h.date===previous&&Number(h.completedSets)>0);
 const normalWorkouts=minutes<maxMinutes?makePlan(p,history,{now,measurements:options.measurements}).workouts:workouts;
 const activityMinutes=adapted?5:({lose:20,health:15,recomp:15,build:10}[goalKey]);
 const next7=Array.from({length:7},(_,n)=>{
  const date=shiftDate(now,n),key=dateKey(date),day=(date.getDay()+6)%7,workout=(n?normalWorkouts:workouts).find(w=>w.day===day);
  if(n===0&&(options.skipToday||trainedToday||trainedYesterday))return{date:key,day,kind:'rest',title:trainedToday?'今天已完成，留出恢复时间':trainedYesterday?'昨天已训练，今天恢复':'今天休息，不补课',minutes:0};
  if(workout)return{date:key,day,kind:'strength',title:workout.label,workoutId:workout.id,minutes:workout.minutes};
  return{date:key,day,kind:n%2?'rest':'activity',title:n%2?'恢复日，按感觉放松':'舒适散步或日常轻活动',minutes:n%2?0:activityMinutes};
 });
 const rationale=[`每次 ${minutes} 分钟，优先推、拉、蹲、髋部，侧重${FOCUS[p.focus]}。`,`目标为${goalLabel}，从当前能完成的训练量起步。`,`根据已选器材和${novice?'初学':p.experience==='return'?'重新开始':'已有运动'}基础匹配动作。`,...(guidance?[`外形目标与体重方向分别判断：当前${guidance.label}。`]:[]),...safety.adaptations];
 return{valid:true,safety,trainingDays,workouts,notes,sets:baseSets,focus:FOCUS[p.focus],goal:goalLabel,...frames,next7,adjustment,rationale,adapted,weightGuidance:guidance};
}
function nutritionBase(p,preserveDirection=false){
 const s=details(p),bmi=bmiOf(p);let effectiveGoal=p.goal,reason='';
 const blocked=reason=>({eligible:false,calories:null,protein:null,reason,effectiveGoal,menuAllowed:false});
 if(p.recentWeightTrend==='unexplained')return blocked('近期不明原因的体重变化需要先了解原因，更换外形目标不会自动解除这项确认。');
 if(Number(p.age)<18)return blocked('未成年人需要符合生长发育的饮食，本工具不生成成人热量、蛋白质目标或减脂菜单。');
 if(isRelevant(p,'pregnancy')&&s.pregnancyStatus!=='none')return blocked('孕期、产后恢复或哺乳期的饮食需要专门安排，先确认阶段并使用相应建议。');
 if(isRelevant(p,'eating')&&!['none','expected'].includes(s.eatingStatus))return blocked('进食问题或不明原因体重变化需要先确认原因，不生成热量、蛋白质目标和具体菜单。');
 if(bmi<16)return blocked('当前体重非常轻，需要先评估营养风险，不自动开热量、增重速度、蛋白质目标或具体菜单。');
 if(bmi<18.5&&s.weightTrend!=='stable')return blocked('先确认体重偏轻是否长期稳定，再决定饮食安排；不按一次体重计算增减重目标。');
 const condition=isRelevant(p,'condition')&&s.conditionType!=='none';
 if(condition&&!['cardio','metabolic','other','medicine'].includes(s.conditionType))return blocked('肾脏疾病、多种相关疾病或未明确的疾病类型可能有特殊营养要求，请使用专业人员给出的饮食方案。');
 if(s.nutritionRestriction==='special')return blocked('你有特殊饮食医嘱，蛋白质、热量及菜单需要遵循该建议，运动许可不能覆盖饮食要求。');
 if(screeningQuestions(p).some(q=>q.key==='nutritionRestriction')&&s.nutritionRestriction!=='none')return blocked(s.nutritionRestriction==='special'?'你有特殊饮食医嘱，蛋白质、热量及菜单需遵循该建议，运动许可不会覆盖饮食要求。':'请在工具内确认是否有特殊饮食医嘱，此项仅影响饮食，不阻止适用训练。');
 if(bmi<20&&p.goal==='lose'){effectiveGoal='recomp';reason='你当前较轻，先维持饮食并建立力量训练习惯，不自动安排热量缺口。';}
 if(bmi<18.5){if(!preserveDirection)effectiveGoal='build';reason=effectiveGoal==='build'?'长期稳定偏轻：优先规律进餐与力量练习，避免减脂。以下只是起点估算，持续记录后再调整。':'长期稳定偏轻且选择先维持：保证规律进餐，不安排减脂缺口，再结合身体和训练记录复盘。';}
 if(bmi>=30||condition)return{eligible:true,calories:null,protein:null,reason:reason+(condition?'慢性情况的能量与蛋白质需求需结合治疗确认；已确认无特殊饮食要求，先提供日常均衡搭配。':'BMI 无法反映全部身体组成，此范围先提供均衡餐盘，不按当前体重放大热量或蛋白质数值。'),effectiveGoal,menuAllowed:true};
 const protein=[Math.round(Number(p.weight)*1.4),Math.round(Number(p.weight)*1.8)];
 if(p.sex==='skip')return{eligible:true,calories:null,protein,reason:reason+'未提供公式需要的生理性别，因此不估算热量。可使用餐盘份量法。',effectiveGoal,menuAllowed:true};
 const rest=10*Number(p.weight)+6.25*Number(p.height)-5*Number(p.age)+(p.sex==='male'?5:-161);
 const factor={low:1.35,medium:1.5,high:1.65}[p.activity];
 const maintenance=rest*factor;const multiplier=effectiveGoal==='lose'?.9:effectiveGoal==='build'?1.05:1;
 let target=maintenance*multiplier;
 if(target<(p.sex==='male'?1500:1200))return{eligible:true,calories:null,protein,reason:reason+'公式热量较低且有个体误差，先使用均衡餐盘，不展示减量数字。',effectiveGoal,menuAllowed:true};
 return{eligible:true,calories:Math.round(target/50)*50,protein,maintenance:Math.round(maintenance/50)*50,rest:Math.round(rest),factor,reason,effectiveGoal,menuAllowed:true};
}
function nutrition(p,history=[],measurements=[],options={}){
 if(p.goal!=='lean')return nutritionBase(p);
 const guidance=weightGuidance(p,history,measurements,options);
 if(guidance.effectiveStrategy==='review')return{eligible:false,calories:null,protein:null,effectiveGoal:null,menuAllowed:false,reason:guidance.review.detail,weightGuidance:guidance};
 const effectiveGoal=guidance.effectiveStrategy==='gain'?'build':'recomp',result=nutritionBase({...p,goal:effectiveGoal},true);
 const assumption=result.calories===null?'当前只提供适用的日常搭配，不套用热量数字；体重方向不等于精确的热量处方。':guidance.effectiveStrategy==='gain'?'小幅增重先用维持估算上调约 5% 的起点；这是本工具的保守假设，不是个人精确需求。':'维持方向使用当前资料估算的维持起点，不预设增重或减脂缺口。';
 return{...result,effectiveGoal,weightGuidance:guidance,reason:[result.reason,assumption,'每次重新从资料公式计算，不把上一次建议继续叠加；用多日记录复盘。'].filter(Boolean).join(' ')};
}
function progression(exId,history,maxWeight){
 const relevant=history.filter(h=>h.exercises?.some(x=>x.id===exId&&x.sets?.some(s=>s.done))).slice(-2);
 if(!relevant.length)return '首次练习：选能控制动作、做完仍能再做约 3 次的难度；不要测试最大重量。';
 if(relevant.some(h=>h.pain))return '最近记录过疼痛：先暂停引发疼痛的动作，请专业人员评估，不加重。';
 if(relevant.some(h=>h.effort==='hard'||h.recovery==='poor'||h.recovery==='tired'||Number(h.completedSets)<Number(h.totalSets)*.8))return '最近吃力、完成不足或恢复不好：先减量或降低难度、延长休息，不加重。';
 if(relevant.length<2)return '先保持当前难度，累计两次动作稳定的训练记录，再判断是否加重。';
 const ready=relevant.every(h=>h.effort==='easy'&&h.exercises.filter(x=>x.id===exId).every(x=>x.sets.length&&x.sets.every(s=>s.done&&Number(s.reps)>=E[exId].maxReps)));
 if(!ready)return '先保持重量和难度，逐步做到次数上限；动作变形或恢复差时减量。';
 if(E[exId].load){
  const weights=relevant.at(-1).exercises.filter(x=>x.id===exId).flatMap(x=>x.sets.map(s=>Number(s.weight)));
  const latest=Math.max(...weights);
  if(E[exId].equipment.includes('dumbbell')&&latest>=Number(maxWeight))return '已到你填写的哑铃上限：先保持重量，控制动作和停顿；不要超过器材能力。';
  return '两次都轻松达到次数上限：下次可试最小可用增量，约 2–5%；器材增量太大就继续原重量。';
 }
 return '两次都轻松达到上限：先改善控制或选择稍难的同类动作，每次只改变一个条件。';
}
const api={validateProfile,screeningQuestions,assess,schedule,makePlan,nutrition,weightGuidance,alternatives,progression,dateKey,GOALS,FOCUS,DAYS};root.FitEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
