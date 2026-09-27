(function(root){
const source=(id)=>`https://github.com/yuhonas/free-exercise-db/blob/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${id}.json`;
const nhs='https://www.nhs.uk/live-well/exercise/strength-exercises/';
const balanceSource='https://www.nhs.uk/live-well/exercise/balance-exercises/';
const standingSource='https://www.uhsussex.nhs.uk/resources/standing-exercises/';
const shoulderSource='https://www.newcastle-hospitals.nhs.uk/services/newcastle-occupational-health-service/information-for-staff/physiotherapy/self-help-leaflets/painful-shoulder/';
const moves=[
['squat','徒手深蹲','腿部','squat',[],'Bodyweight_Squat','8–12 次',12,90,['双脚约肩宽，脚尖自然略向外，脚掌完整着地。','吸气，屈髋屈膝，向下坐到能稳定控制的位置。','膝盖跟随脚尖方向；呼气站起，不用锁死膝盖。'],['脚跟翘起或膝盖向内夹。','为了蹲得低而让腰背明显弯曲。'],'蹲浅一些；有稳定椅子时换成坐站。'],
['chair','椅子坐站','腿部','squat',['chair'],null,'6–10 次',10,90,['椅子靠墙、无轮、不打滑；双脚着地。','坐在前半部，身体略前倾，呼气站起。','慢慢坐回，必要时用手轻扶。'],['跌坐到椅子上。','使用会滑动、转动的椅子。'],'减少次数，扶着稳定支撑完成。'],
['goblet','高脚杯深蹲','腿部','squat',['dumbbell'],'Goblet_Squat','8–12 次',12,120,['双手托稳一只轻哑铃，贴近胸前；脚掌着地。','屈髋屈膝下蹲，深度以腰背与平衡可控为准。','呼气站起，哑铃始终靠近身体。'],['第一次就拿大重量。','下蹲时膝盖内夹或憋气。'],'先换徒手深蹲学会动作。'],
['wall','靠墙俯卧撑','胸部 · 手臂','push',[],null,'8–12 次',12,90,['面向墙站立，双手放在胸部高度、略宽于肩。','身体从头到脚保持一条线，屈肘靠近墙。','肘部与身体约成 30–60 度，呼气推回。'],['腰部塌下，或耸肩。','身体离墙太远，难以控制。'],'站得更靠近墙，缩小幅度。'],
['pushup','俯卧撑','胸部 · 手臂','push',[],'Pushups','6–12 次',12,120,['双手略宽于肩，手指展开，腹部收紧。','身体整体下放，肘部自然斜向后。','呼气推起；若腰塌或动作变形，立刻换靠墙版。'],['腰先落下。','手肘完全向两侧展开。'],'换靠墙俯卧撑，控制好每一次。'],
['floor','哑铃地板卧推','胸部 · 手臂','push',['dumbbell'],'Dumbbell_Floor_Press','8–12 次',12,120,['轻哑铃放在身体两侧，安全躺下，屈膝脚掌着地。','上臂与身体约 30–60 度，前臂大致垂直地面。','呼气推起；缓慢下降至上臂轻触地面，不砸地。'],['手腕后折或耸肩。','无法安全拿起、放下所选重量。'],'换靠墙俯卧撑。'],
['row','双哑铃俯身划船','背部 · 手臂','pull',['dumbbell'],'Bent_Over_Two-Dumbbell_Row','8–12 次',12,120,['膝盖微屈，臀部向后，背部保持自然平直。','腹部轻收，哑铃自然垂下，视线朝前下方。','肘部向后带动哑铃靠近腰侧，再缓慢放下。'],['靠甩动腰部拉起哑铃。','抬头过高或圆背。'],'减重；先练徒手髋折叠，不能无痛保持姿势时暂停。'],
['bandrow','弹力带坐姿划船','背部','pull',['band'],null,'10–15 次',15,90,['检查长弹力带无裂纹，绕在穿鞋的双脚中部，防止滑脱。','坐稳、膝略屈、背部自然伸直，双手握牢两端。','肘向后拉到腰侧，再缓慢还原；始终避开面部回弹方向。'],['带子只挂在脚尖。','身体大幅前后摇摆。'],'换更轻阻力；短环形带不适用这个动作。'],
['wraise','俯卧 W 抬手','上背部控制','pull',[],null,'8–12 次',12,60,['俯卧在舒适的平面上，额头垫折叠毛巾。','双臂弯成 W 形，肩膀远离耳朵。','轻轻抬起双手和前臂，停约 1 秒，缓慢放下；幅度很小即可。'],['靠抬头、挺腰获得更大幅度。','肩颈紧张仍强行抬高。'],'减小幅度或只做肩胛轻收；这不是负重划船的等效替代。'],
['hinge','徒手髋折叠','臀部 · 大腿后侧','hinge',[],null,'8–12 次',12,90,['双脚髋宽，膝盖微屈，手放在髋部。','臀部向后推，上身自然前倾，背部保持平直。','感到大腿后侧轻拉伸后，呼气站直。'],['把动作做成弯腰摸地。','膝盖锁死或腰背弯曲。'],'减小前倾幅度，先练向后推髋。'],
['rdl','哑铃直腿硬拉（微屈膝）','臀部 · 大腿后侧','hinge',['dumbbell'],'Stiff-Legged_Dumbbell_Deadlift','8–12 次',12,120,['先学会徒手髋折叠；全程保持膝盖微屈。','哑铃沿腿前方缓慢下降，臀部向后推，背部自然平直。','降到能保持背部姿势的位置即可；呼气站起，不后仰。'],['为了碰地而弯腰。','膝盖锁死，或重量远离身体。'],'换徒手髋折叠；图示深度不是你必须达到的深度。'],
['bridge','臀桥','臀部','hinge',[],'Butt_Lift_Bridge','10–15 次',15,90,['仰卧屈膝，双脚约髋宽，脚掌完整着地。','呼气，收紧臀部抬髋至肩、髋、膝大致一线。','停 1 秒，缓慢下落；避免腰部过度拱起。'],['用腰部顶起，而不是臀部发力。','双膝向内倒。'],'抬得低一些，保持呼吸。'],
['deadbug','死虫式','腹部稳定','core',[],'Dead_Bug','每侧 6–10 次',10,60,['仰卧，髋膝约 90 度，双手朝上；腹部轻收。','呼气，缓慢伸出对侧手脚，保持腰背稳定。','收回后换边；腰部要拱起时减少伸展幅度。'],['动作过快。','腿伸太低，腰部明显拱起。'],'只移动一条腿，或做脚跟轻点地。'],
['plank','前臂平板支撑','腹部稳定','core',[],'Plank','15–30 秒',30,60,['肘在肩下，前臂撑地，脚尖着地。','轻收腹臀，头、背、髋保持自然一线。','正常呼吸，姿势开始塌陷前结束。'],['憋气，腰塌或臀部抬得太高。','为追求秒数硬撑。'],'膝盖落地，或缩短到 10 秒。'],
['lateral','哑铃侧平举','肩部','shoulder',['dumbbell'],'Side_Lateral_Raise','10–15 次',15,75,['拿轻哑铃，肘部微屈，双肩放松。','手臂在身体侧前方缓慢抬起，到舒适位置、不高于肩。','控制下降，呼气抬起，避免耸肩。'],['摆动身体借力。','过重导致肩颈紧张。'],'减重或缩小幅度；不追求抬得高。'],
['bandpull','弹力带拉开','上背 · 后肩','shoulder',['band'],'Band_Pull_Apart','10–15 次',15,75,['长带握在胸前，双手间距足够大，肩放松。','肘微屈，双手向两侧拉开，到舒适范围。','缓慢收回；检查带子无裂纹，勿在面部高度拉伸。'],['耸肩或过度挺腰。','阻力过大、带子回弹。'],'双手握得更宽，减少阻力。'],
['curl','哑铃弯举','手臂','arm',['dumbbell'],'Dumbbell_Bicep_Curl','10–15 次',15,75,['站稳，上臂自然靠近身体，手腕平直。','呼气屈肘举起哑铃，上臂不前后摆动。','缓慢下降，不靠身体甩动。'],['手腕弯折。','摆腰借力。'],'减轻重量，或先减少次数。'],
['calf','扶稳提踵','小腿','calf',[],null,'10–15 次',15,60,['轻扶墙面或固定支撑，双脚着地。','缓慢抬起脚跟，重心均匀放在前脚掌。','控制落下，不用弹跳。'],['脚踝向外翻。','失去平衡还继续。'],'抬低一些，双手扶稳。'],
['legpress','器械腿举','腿部','squat',['legpress'],'Leg_Press','8–12 次',12,120,['先请场馆工作人员示范保险杆和座椅调节。','背部贴靠垫，双脚完整踩踏板，膝盖对准脚尖。','用轻重量缓慢屈伸，腰臀不离垫，膝盖不锁死。'],['下放太深，腰臀离垫。','不熟悉保险装置就开始。'],'换徒手深蹲；未学会保险装置时不做此动作。'],
['chestmachine','器械胸推','胸部 · 手臂','push',['chestmachine'],'Machine_Bench_Press','8–12 次',12,120,['请工作人员协助把手高度调到胸中部。','背贴靠垫，双脚踩稳，手腕自然平直。','呼气平稳推起，缓慢回程，重物不相撞。'],['耸肩、肘抬过高。','选重过大，靠身体扭动推起。'],'减轻重量或换靠墙俯卧撑。'],
['lat','高位下拉','背部 · 手臂','pull',['lat'],'Wide-Grip_Lat_Pulldown','8–12 次',12,120,['调好压腿垫与座位，用舒适的略宽握距。','肩膀放松下沉，手肘向下，拉杆靠近上胸前方。','控制向上还原，不把拉杆拉到颈后。'],['大幅后仰借力。','颈后下拉或耸肩。'],'减重并缩小幅度，先由工作人员示范。'],
['supportedbalance','扶墙单腿平衡','平衡 · 下肢控制','balance',[],null,'每侧 5–10 秒',10,60,['面向墙站稳，双手扶墙；地面平整防滑，脚边不放杂物。','重心缓慢移到一条腿，另一只脚轻轻离地；支撑膝微屈，两侧髋部保持平齐。','每侧先保持 5 秒，正常呼吸；轻放回脚后再换边，不稳时立即双脚着地。'],['放开支撑、闭眼或在软垫上练习。','抬腿过高、歪着身体硬撑秒数。'],'双手扶稳，把抬起脚的脚尖留在地面；先做短暂重心转移，不强求离地。'],
['supportedmarch','扶稳原地慢踏步','基础活动 · 下肢协调','cardio',[],null,'每侧 5–8 次',8,60,['面向墙面或固定台面，双手扶稳，双脚与髋同宽。','把一侧膝盖轻抬到舒服的高度，再缓慢把脚放回地面。','左右交替，每侧先做 5 次；能轻松完整说话即可，不追求速度或抬高。'],['越踏越快、身体后仰，或屏住呼吸。','扶着会滑动的椅子，或脚还没放稳就抬另一边。'],'少抬一点、放慢速度，每侧少做几次；若扶稳仍无法站立，先暂停这个动作。'],
['standinghip','扶稳站姿髋伸','臀部 · 大腿后侧控制','hinge',[],null,'每侧 5–8 次',8,60,['双手扶住墙面或固定台面，站直，双脚与髋同宽。','保持躯干朝前，一条腿缓慢向后移一小段，膝盖自然伸直但不锁死。','缓慢放回后换腿；先做每侧 5 次，臀部轻发力，腰背保持自然，不需要抬得高。'],['身体向前倒，或用挺腰、转髋代替腿后移。','踢腿借力、抬得过高，或扶着不稳定的家具。'],'腿往后移动更小的距离，脚尖轻点地；这是基础髋伸练习，不能代替负重硬拉的全部训练刺激。'],
['standingw','站姿肩胛轻收','上背部控制','pull',[],null,'6–10 次',10,60,['双脚稳稳着地，身体自然站直，双臂放松垂在身侧，肩膀远离耳朵。','轻轻把两侧肩胛骨向后靠近，幅度小、无痛即可，手臂不用抬高。','缓慢放松回原位，正常呼吸；先做 6 次，避免刻意挺胸或憋气。'],['用力夹背、耸肩或腰部后仰。','为了完成次数而继续引起肩部疼痛的动作。'],'减小幅度、减少次数；有稳定椅子时可坐着做。这是肩胛控制练习，不能提供负重划船同等的增肌刺激。']
];
const extraSources={supportedbalance:balanceSource,supportedmarch:standingSource,standinghip:standingSource,standingw:shoulderSource};
const floorMoves=new Set(['pushup','floor','bandrow','wraise','bridge','deadbug','plank']);
const supportedMoves=new Set(['chair','wall','calf','legpress','chestmachine','lat','supportedbalance','supportedmarch','standinghip']);
const EXERCISES=Object.fromEntries(moves.map(x=>[x[0],{id:x[0],name:x[1],muscle:x[2],pattern:x[3],equipment:x[4],imageId:x[5],reps:x[6],maxReps:x[7],rest:x[8],steps:x[9],mistakes:x[10],easier:x[11],source:x[5]?source(x[5]):(extraSources[x[0]]||(['wall','chair','calf'].includes(x[0])?nhs:null)),load:['dumbbell','legpress','lat','chestmachine'].some(y=>x[4].includes(y)),timed:['plank','supportedbalance'].includes(x[0]),floor:floorMoves.has(x[0]),supported:supportedMoves.has(x[0])}]));
const SOURCES=[
{title:'Mayo Clinic：运动前后怎样吃',url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/exercise/art-20045506',date:'2023-12-21 · 核验 2026-09-27',use:'运动前兼顾碳水食物、份量和消化舒适；运动后可用含主食与蛋白质的正餐恢复，距离下餐较久时考虑小份加餐。本工具不设置必须额外吃一餐的固定窗口。'},
{title:'食物过敏研究与教育机构 FARE：避免交叉接触',url:'https://www.foodallergy.org/resources/avoiding-cross-contact',date:'核验 2026-09-27',use:'调味料和共享器具等可能带入过敏原；去掉表面的食物或加热并不能可靠去除。内置食材筛选不能保证餐馆成品安全，需核对包装、配料及制作情况。'},
{title:'美国运动医学会：2026 年力量训练立场声明',url:'https://acsm.org/resistance-training-guidelines-update-2026/',date:'2026',use:'支持主要肌群规律训练、逐步进阶以及徒手和弹力带等训练方式。这里的具体排课规则是保守的产品设计，不是机构对个人开出的处方。'},
{title:'世界卫生组织：身体活动',url:'https://www.who.int/news-room/fact-sheets/detail/physical-activity',date:'2024 / 2020 指南',use:'成人每周逐步达到 150–300 分钟中等强度活动及至少 2 天肌力活动。初学者从较少活动起步。'},
{title:'美国运动医学会：运动前筛查与分流',url:'https://acsm.org/wp-content/uploads/EIM-Health-Care-Providers-Action-Guide-clickable-links.pdf',date:'第 5 页 · 核验 2026-09-27',use:'结合警示症状、已确诊疾病和当前活动习惯，判断是否需要先接受专业评估。本工具的问卷、适配和排课是本地规则，没有经过临床验证，也不代表医生已确认你适合训练。'},
{title:'英国国家医疗服务体系：健康增重',url:'https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/',date:'页面复核 2023 · 核验 2026-09-27',use:'体重偏低不自动等于不能力量训练；规律饮食与合适的力量活动可帮助健康增重。突然或无法解释的体重下降，需要先向医生咨询。'},
{title:'英国 NICE：严重消瘦与营养评估',url:'https://www.nice.org.uk/guidance/cg32/chapter/Recommendations',date:'CG32 第 1.4.6–1.4.7 节 · 核验 2026-09-27',use:'体重指数低于 16 是开始营养支持前的一项再喂养风险筛查条件，需要专业营养评估。本工具不凭体重指数诊断疾病，也不为严重消瘦者自动开出激进增重或高蛋白处方。'},
{title:'美国疾病控制与预防中心：65 岁及以上人群活动建议',url:'https://www.cdc.gov/physical-activity-basics/guidelines/older-adults.html',date:'2025-12-04 · 核验 2026-09-27',use:'结合有氧、肌力和平衡活动，按个人能力与健康条件起步；年龄本身不是禁止运动的理由。本工具的低起点次数是产品安排，不是该机构为个人开出的计划。'},
{title:'美国运动医学会：体重较高人群如何开始活动',url:'https://acsm.org/wp-content/uploads/EIM_Obesity_Flyer_English.pdf',date:'核验 2026-09-27',use:'从能承受的少量活动开始，结合有氧与力量训练；即使体重没有下降，活动仍有健康益处。体重指数用于提示调整起点，不单独作为禁止训练的条件。'},
{title:'国际运动营养学会：蛋白质与运动',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/',date:'2017',use:'健康运动人群每日蛋白质常用范围为每公斤体重 1.4–2.0 克。本工具在适用人群中给出 1.4–1.8 克的保守起点。'},
{title:'Mifflin 等：健康成人静息能量估算研究',url:'https://pubmed.ncbi.nlm.nih.gov/2305711/',date:'1990',use:'静息能量估算公式。活动系数、±5–10% 调整是本工具估算假设，误差需要靠持续记录校正。'},
{title:'加拿大卫生部：怎样搭配健康餐盘',url:'https://www.canada.ca/en/health-canada/services/food-guide/eating-support/cooking/make-healthy-meals-plate.html',date:'核验 2026-09-27',use:'用蔬果、全谷主食、蛋白质食物组成餐盘。下面的中餐例子为原创应用示例，非原文食谱。'},
{title:'英国国家医疗服务体系：初学者力量动作',url:nhs,date:'核验 2026-09-27',use:'椅子坐站、靠墙俯卧撑、扶稳提踵的图文参考。'},
{title:'英国国家医疗服务体系：扶墙平衡练习',url:balanceSource,date:'页面复核 2023 · 核验 2026-09-27',use:'扶墙单腿平衡的动作与每侧 5–10 秒起点参考。请在平整地面保留稳定支撑，不以闭眼或撤掉支撑增加难度。'},
{title:'英国 Sussex NHS 医院：站姿基础动作',url:standingSource,date:'核验 2026-09-27',use:'扶稳慢踏步、站姿髋伸的官方图文。中文说明为改写；原页未指定个人次数，本工具每侧 5–8 次为较低起点的本地安排。'},
{title:'英国 Newcastle NHS 医院：肩胛后收动作',url:shoulderSource,date:'页面更新 2025 · 核验 2026-09-27',use:'仅参考其中肩胛轻收的坐姿或站姿动作。此动作用于控制练习；引用该页不表示本工具可诊断或治疗肩痛，也不等同于负重拉力训练。'},
{title:'美国 NIDDK：体重计划工具适用边界',url:'https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner',date:'2017',use:'成人体重规划不适用于未成年人、孕期或哺乳期。本工具对健康风险另有保守限制。'},
{title:'美国 CDC：BMI 能说明什么',url:'https://www.cdc.gov/bmi/about/index.html',date:'2025-12-16 · 核验 2026-09-27',use:'BMI 不直接测量体脂，不能区分脂肪、肌肉与骨量。薄肌目标不会凭 BMI 推断精确体脂率或诊断身体组成。'},
{title:'Helms 等：不同能量盈余与力量训练变化',url:'https://pubmed.ncbi.nlm.nih.gov/37914977/',date:'2023 · 核验 2026-09-27',use:'8 周、17 名完成者的小样本训练研究中，体重增长更快主要与皮褶增加相关。不能据此断定每个人增重都是脂肪，也不能精确规定个人的最佳增重速度。本工具不承诺增重全部为肌肉。'},
{title:'Slater 等：增肌是否需要能量盈余',url:'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2019.00131/full',date:'2019 · 核验 2026-09-27',use:'增肌所需的能量安排与训练基础、个体反应有关。工具把外形目标和体重方向分开，使用起点估算与记录复盘；具体趋势阈值是保守产品规则，不是该综述对个人的处方。'},
{title:'英国 East Lancashire NHS 医院：腰围测量',url:'https://elht.nhs.uk/services/dietetics/body-measuring-techniques',date:'核验 2026-09-27',use:'在最下方肋骨与髋骨上缘中点，自然呼气后测量腰围，保持测量条件一致。腰围变化仅作趋势参考，不直接换算体脂或肌肉变化。'},
{title:'开源动作图示库 free-exercise-db',url:'https://github.com/yuhonas/free-exercise-db',date:'固定版本 f00c92c · 2026-09-27',use:'复用少量动作的起止照片，原库声明 Unlicense 公共领域许可；它是图示资料，不是医学证据，也未获机构逐项认证。中文步骤为本工具改写。'}
];
const EQUIPMENT=[['dumbbell','哑铃','固定重量或可调哑铃'],['band','长弹力带','能绕过双脚的长带；短环不适用'],['chair','稳定椅子','无轮、靠墙、不打滑'],['legpress','腿举器械','健身房固定器械'],['chestmachine','胸推器械','健身房坐姿推胸'],['lat','高位下拉','健身房背部训练器械']];
const api={EXERCISES,SOURCES,EQUIPMENT};root.FitData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
