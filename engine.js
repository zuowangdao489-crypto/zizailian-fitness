(function(root){
const D=root.FitData||(typeof require!=='undefined'?require('./data.js'):null);
const {EXERCISES:E}=D;
const GOALS={recomp:'改善体型',build:'增加肌肉',lose:'减少脂肪',health:'体能与习惯'};
const FOCUS={balanced:'全身均衡',shoulder:'肩背比例',chest:'胸部与手臂',glute:'臀腿线条',core:'腹部稳定'};
const DAYS=['周一','周二','周三','周四','周五','周六','周日'];
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const num=(v)=>v!==''&&v!=null&&Number.isFinite(Number(v));
function validateProfile(p){
 const errors=[];
 for(const [key,min,max,label] of [['age',10,100,'年龄'],['height',100,230,'身高'],['weight',25,250,'体重'],['sleep',0,16,'睡眠时长']])if(!num(p[key])||Number(p[key])<min||Number(p[key])>max)errors.push(`${label}请填 ${min}–${max} 范围内的数字。`);
 if(num(p.age)&&!Number.isInteger(Number(p.age)))errors.push('年龄请填整数。');
 if(!['male','female','skip'].includes(p.sex))errors.push('请选择生理性别，或选择不提供。');
 if(!Object.keys(GOALS).includes(p.goal)||!Object.keys(FOCUS).includes(p.focus))errors.push('请选择训练目标和体型重点。');
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
 return errors;
}
function assess(p){
 const reasons=[],issues=[];const bmi=Number(p.weight)/(Number(p.height)/100)**2;
 const add=(code,title,answer,message,step)=>{reasons.push(message);issues.push({code,title,answer,message,step});};
 if(Number(p.age)<18)add('age','年龄适用范围',`你填写的是 ${p.age} 岁。`,'本版不自动安排未成年人的成人增肌减脂计划，请与监护人及专业人员一起安排。',0);
 if(Number(p.age)>=65)add('age','年龄适用范围',`你填写的是 ${p.age} 岁。`,'本版成人入门计划暂不覆盖 65 岁及以上的个体需求；合适的计划还需考虑平衡与日常功能。',0);
 const labels={symptoms:'胸痛、晕厥或异常气短',condition:'慢性病、用药或医生的运动限制',pain:'持续疼痛、受伤或手术恢复',pregnancy:'孕期、产后恢复或哺乳期',eating:'进食障碍史或近期不明原因的体重变化'};
 for(const key of Object.keys(labels))if(p.health[key]!=='no')add(key,labels[key],`你选择了“${p.health[key]==='unsure'?'不确定':'有'}”。`,p.health[key]==='unsure'?`${labels[key]}：回答“不确定”不代表已确认有这个问题。先核对题意；仍无法判断时，请向了解你情况的医生或相关专业人员确认。`:`${labels[key]}：请让了解你情况的医生或相关专业人员协助决定适合的训练和饮食。`,3);
 const bodyAnswer=`你填写的是 ${p.height} 厘米、${p.weight} 公斤，计算的 BMI（体重指数）为 ${bmi.toFixed(1)}。`;
 if(bmi<18.5)add('body','身高与体重范围',bodyAnswer,'体重指数低于本版自动计划覆盖范围（18.5）。先核对身高和体重单位；数据准确时，需结合营养与健康情况另行安排。',0);
 if(bmi>=35)add('body','身高与体重范围',bodyAnswer,'体重指数达到本版自动计划的上限（35）。先核对身高和体重单位；数据准确时，需结合关节负担、体能与健康情况另行安排。',0);
 return{eligible:reasons.length===0,reasons,issues,bmi:Math.round(bmi*10)/10,urgent:p.health.symptoms==='yes'};
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
function pick(p,ids){return ids.find(id=>E[id].equipment.every(x=>p.equipment.includes(x)));}
function makePlan(p,history=[]){
 const errors=validateProfile(p);if(errors.length)return{valid:false,errors};
 const safety=assess(p);if(!safety.eligible)return{valid:true,safety,workouts:[],trainingDays:[],notes:[]};
 const trainingDays=schedule(p.days);const novice=p.experience==='new';
 const squat=pick(p,novice?['legpress','goblet','chair','squat']:['legpress','goblet','squat']);
 const push=pick(p,['chestmachine','floor',...(novice?['wall']:['pushup','wall'])]);
 const pull=pick(p,['lat','row','bandrow','wraise']);
 const hinge=novice?'bridge':pick(p,['rdl','bridge']);
 const mainA=[squat,push,pull,hinge];const mainB=[pull,novice?'bridge':pick(p,['rdl','hinge']),push,squat];
 const count=Number(p.minutes)>=45?6:Number(p.minutes)>=30?5:4;
 const extras={balanced:['deadbug','calf'],shoulder:[pick(p,['lateral','bandpull','wraise']),'deadbug'],chest:[pick(p,['curl','deadbug']),'plank'],glute:['bridge','deadbug'],core:['deadbug','plank']}[p.focus];
 const complete=history.filter(h=>!h.pain&&h.completedSets>=h.totalSets*.8).length;
 const sets=complete<2?1:2;
 const patterns=[mainA,mainB,mainA];
 const workouts=trainingDays.map((day,i)=>{
  let ids=[...patterns[i]];
  for(const id of [...extras,'deadbug','calf','hinge'])if(!ids.includes(id)&&ids.length<count)ids.push(id);
  return{id:`workout-${i}`,label:`全身 ${String.fromCharCode(65+i)}`,day,sets,minutes:Math.min(Number(p.minutes),8+ids.length*sets*3),exercises:ids.map(id=>({id,sets,reps:E[id].reps,rest:E[id].rest}))};
 });
 const notes=[];
 if(p.days.length>trainingDays.length)notes.push('把力量训练隔开至少一天；相邻可用日留给散步和恢复。每周最多安排 3 次全身力量训练。');
 if(trainingDays.length<2)notes.push('当前可用日期只适合安排 1 次力量训练。先建立习惯，有条件后再增加一个不相邻的训练日。');
 if(pull==='wraise')notes.push('你还没有可用于拉力训练的器材。W 抬手只能练上背控制，不能替代负重划船的增肌刺激；先使用现有条件，不要求购买。');
 if(Number(p.minutes)===20)notes.push('20 分钟版先保留推、拉、蹲、髋部动作；所选体型重点需要更充裕的时间或后续增加训练容量。');
 if(p.focus==='shoulder'&&!p.equipment.includes('dumbbell')&&!p.equipment.includes('band'))notes.push('肩部重点暂受器材限制，先练基本控制。');
 if(Number(p.sleep)<6)notes.push('你填写的睡眠偏少。恢复不佳时少做一组或改散步，不因为日历到了就强行加量。');
 if(novice&&p.equipment.includes('dumbbell'))notes.push('有哑铃也从很轻重量试起；器材最大重量不是训练起始重量。');
 if(p.equipment.includes('dumbbell')&&!p.adjustable)notes.push('固定哑铃如果太重，就换徒手版本；不要为了使用现有重量硬撑。没有更小增量时保持原重量，不必购买。');
 return{valid:true,safety,trainingDays,workouts,notes,sets,focus:FOCUS[p.focus],goal:GOALS[p.goal]};
}
function nutrition(p){
 const safety=assess(p);if(!safety.eligible)return{eligible:false,reason:'先完成适用性评估，本版不生成热量、蛋白质或减脂目标。'};
 let effectiveGoal=p.goal,reason='';
 if(safety.bmi<20&&p.goal==='lose'){effectiveGoal='recomp';reason='你当前较轻，先维持饮食并建立力量训练习惯，不自动安排热量缺口。';}
 if(safety.bmi>=30)return{eligible:true,calories:null,protein:null,reason:'BMI 不能单独判断身体组成。这个范围的能量和蛋白质建议需要更多信息，本版只提供餐盘搭配，不按体重直接套数值。',effectiveGoal};
 const protein=[Math.round(Number(p.weight)*1.4),Math.round(Number(p.weight)*1.8)];
 if(p.sex==='skip')return{eligible:true,calories:null,protein,reason:'未提供公式需要的生理性别，因此不估算热量。可以先用餐盘份量法。',effectiveGoal};
 const rest=10*Number(p.weight)+6.25*Number(p.height)-5*Number(p.age)+(p.sex==='male'?5:-161);
 const factor={low:1.35,medium:1.5,high:1.65}[p.activity];
 const maintenance=rest*factor;const multiplier=effectiveGoal==='lose'?.9:effectiveGoal==='build'?1.05:1;
 let target=maintenance*multiplier;
 if(target<(p.sex==='male'?1500:1200))return{eligible:true,calories:null,protein,reason:'公式得出的热量较低，个体误差可能较大；本版不展示减量数字，先使用均衡餐盘并咨询营养师。',effectiveGoal};
 return{eligible:true,calories:Math.round(target/50)*50,protein,maintenance:Math.round(maintenance/50)*50,rest:Math.round(rest),factor,reason,effectiveGoal};
}
function progression(exId,history,maxWeight){
 const relevant=history.filter(h=>h.exercises?.some(x=>x.id===exId&&x.sets?.some(s=>s.done))).slice(-2);
 if(!relevant.length)return '首次练习：选能控制动作、做完仍能再做约 3 次的难度；不要测试最大重量。';
 if(relevant.some(h=>h.pain))return '最近记录过疼痛：先暂停引发疼痛的动作，请专业人员评估，不加重。';
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
const api={validateProfile,assess,schedule,makePlan,nutrition,progression,dateKey,GOALS,FOCUS,DAYS};root.FitEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
