(function(root){
'use strict';
const PLACES={home:'在家做饭',canteen:'食堂',takeout:'外卖或餐馆',store:'便利店或超市'};
const MEALS={breakfast:'早餐',lunch:'午餐',dinner:'晚餐',snack:'加餐'};
const CONTEXTS={normal:'普通用餐',pre:'训练前',post:'训练后'};
const knownAllergens=['egg','milk','soy','nuts','fish','wheat'];
// Original meal examples. Cost ranks describe usual ingredient choices, not
// live prices. Restaurant/packaged versions must be checked where they are sold.
const FOODS={};
function food(id,name,role,portion,diet,allergens,cost,places){FOODS[id]={id,name,role,portion,diet,allergens,cost,places};}
const ALL=['home','canteen','takeout','store'],HOT=['home','canteen','takeout'];
food('rice','米饭','starch','熟饭约 1 拳头','vegan',[],1,HOT);
food('congee','原味大米粥','starch','1 小碗，不加肉汤','vegan',[],1,HOT);
food('potato','蒸或煮土豆','starch','约 1 拳头','vegan',[],1,['home','canteen']);
food('sweet','蒸红薯','starch','小个约 1 个','vegan',[],1,['home','canteen','store']);
food('corn','熟玉米','starch','小根约 1 根','vegan',[],1,['home','canteen','store']);
food('oats','原味燕麦','starch','干燕麦约 30–40 克，按说明冲煮','vegan',['wheat'],1,['home','store']);
food('bread','纯素配方全麦面包','starch','约 1–2 片，核对配料','vegan',['wheat'],2,['home','store']);
food('bun','原味馒头','starch','小个约 1 个，确认无蛋奶配方','vegan',['wheat'],1,['home','canteen','takeout']);
food('noodles','清水煮面条','starch','熟面约 1 小碗，不加肉汤','vegan',['wheat'],1,['home']);
food('ricebox','配料明确的原味即食米饭','starch','约半盒至 1 拳头，按包装加热','vegan',[],2,['store']);
food('egg','白水煮鸡蛋','protein','约 1–2 个','vegetarian',['egg'],1,ALL);
food('tomatoegg','番茄炒蛋','protein','鸡蛋约 1–2 个、番茄约 1 个，少量油炒熟','vegetarian',['egg'],1,['home']);
food('tofu','原味豆腐','protein','约 150–200 克，煮熟或按标签食用','vegan',['soy'],1,HOT);
food('readytofu','即食原味豆腐','protein','约 150–200 克，按包装说明食用','vegan',['soy'],2,['store']);
food('soy','无糖豆浆','protein','约 200–250 毫升，确认配料','vegan',['soy'],1,ALL);
food('milk','原味牛奶','protein','约 200–250 毫升','vegetarian',['milk'],1,['home','canteen','store']);
food('yogurt','原味无糖酸奶','protein','约 150–200 克，查看营养标签','vegetarian',['milk'],2,['home','store']);
food('beans','原味熟红豆或绿豆','protein','约半碗；干豆需充分煮熟，确认没有混入其他豆类','vegan',[],1,['home']);
food('chickpeas','即食鹰嘴豆罐头','protein','沥去汤汁约半碗，核对配料','vegan',[],2,['home','store']);
food('chicken','清蒸或白煮鸡肉','protein','熟肉约 1 掌心，核对调味','mixed',[],1,HOT);
food('beef','清炖瘦牛肉','protein','熟肉约 1 掌心，核对汤汁调味','mixed',[],3,HOT);
food('fish','清蒸鱼肉','protein','熟鱼约 1 掌心，去刺并核对调味','mixed',['fish'],3,HOT);
food('readychicken','配料明确的即食鸡胸肉','protein','约 1 小包，核对份量和配料','mixed',['soy','wheat'],2,['store']);
food('tuna','水浸金枪鱼罐头','protein','沥水约半罐至 1 掌心，核对标签','mixed',['fish'],3,['store']);
food('greens','清炒或焯青菜','produce','约 1–2 拳头，确认不用蚝油等不适合的调料','vegan',[],1,HOT);
food('broccoli','蒸或焯西兰花','produce','约 1–2 拳头，调味另放','vegan',[],2,HOT);
food('tomato','番茄','produce','约 1 个，清洗后切块','vegan',[],1,['home','store']);
food('cucumber','黄瓜','produce','约半根至 1 根，清洗后食用','vegan',[],1,['home','store']);
food('salad','原味蔬菜盒','produce','约 1 盒，不加复合沙拉酱并核对配料','vegan',[],2,['store']);
food('banana','香蕉','fruit','小根约 1 根','vegan',[],1,ALL);
food('apple','苹果','fruit','小个约 1 个','vegan',[],1,ALL);
food('orange','橙子或橘子','fruit','约 1 个','vegan',[],1,ALL);
food('nuts','原味坚果','extra','约 10 克的一小撮，不按大把添加','vegan',['nuts'],3,['home','store']);
const RECIPES=[];
function rows(place,meal,entries){for(const [title,ids,instruction] of entries)RECIPES.push({id:`${place}-${meal}-${RECIPES.length}`,place,meal,title,ids:ids.split(' '),instruction});}
rows('home','breakfast',[
 ['燕麦牛奶配香蕉','oats milk banana','按包装把燕麦煮软或冲泡，牛奶单独喝或拌入，香蕉切片。'],
 ['红薯鸡蛋早餐','sweet egg apple','红薯蒸熟、鸡蛋煮熟，水果洗净；可提前准备。'],
 ['豆浆馒头配水果','bun soy orange','加热馒头，选择配料简单的豆浆，水果另放。'],
 ['面包酸奶配水果','bread yogurt banana','面包、酸奶和水果分别装盘，留意面包的蛋奶配料。'],
 ['杂豆米粥早餐','congee beans apple','把充分煮熟的杂豆搭配原味米粥，不用咸菜代替蛋白质食物。'],
 ['玉米鸡蛋配坚果','corn egg nuts orange','玉米和鸡蛋煮熟，坚果只取小份，水果另吃。']
]);
rows('home','lunch',[
 ['番茄鸡蛋米饭','rice tomatoegg greens','番茄和鸡蛋用少量油炒熟；米饭、青菜另外准备。'],
 ['豆腐青菜饭','rice tofu greens','豆腐切块煮熟，青菜焯水后少量调味，不用肉汤或蚝油。'],
 ['土豆鸡肉盘','potato chicken broccoli','土豆蒸熟，鸡肉充分做熟，西兰花焯水；分别调味。'],
 ['牛肉蔬菜面','noodles beef greens','瘦牛肉炖熟后与清水煮面、青菜搭配，避免把浓汤当作必须喝完的部分。'],
 ['清蒸鱼配米饭','rice fish broccoli','鱼蒸熟并去刺；米饭、西兰花另备，调味分开。'],
 ['杂豆土豆盘','potato beans greens','熟杂豆和土豆分别加热，青菜做熟；不把豆类与肉看成同份量等营养。']
]);
rows('home','dinner',[
 ['土豆豆腐青菜盘','potato tofu greens','土豆蒸熟、豆腐煮熟，再配一份做熟青菜。'],
 ['玉米鸡肉配西兰花','corn chicken broccoli','玉米蒸煮，鸡肉做熟、西兰花焯水，避免厚重酱汁。'],
 ['米饭配杂豆和番茄','rice beans tomato','米饭和充分煮熟的杂豆配番茄，可拌成热饭碗。'],
 ['清蒸鱼青菜饭','rice fish greens','鱼肉做熟去刺，青菜和米饭分别准备。'],
 ['牛肉土豆盘','potato beef broccoli','瘦牛肉炖熟，土豆与西兰花熟食搭配。'],
 ['鹰嘴豆蔬菜饭','rice chickpeas greens','罐装鹰嘴豆沥水后按标签处理，与熟米饭、青菜搭配。']
]);
rows('home','snack',[
 ['牛奶配香蕉','milk banana','适合需要小份加餐时，牛奶和香蕉各取一份。'],
 ['鸡蛋配小红薯','egg sweet','准备煮鸡蛋与小份熟红薯，按当天饥饿程度取用。'],
 ['酸奶配苹果','yogurt apple','选原味酸奶，苹果切块；不额外倒入一大份糖浆。'],
 ['豆浆配馒头','soy bun','豆浆加热到适口，馒头取小份。'],
 ['鹰嘴豆配黄瓜','chickpeas cucumber','即食鹰嘴豆按标签处理，黄瓜清洗切块。'],
 ['水果配少量坚果','orange nuts','水果一份，坚果只取小撮；这不是完整正餐。']
]);
rows('canteen','breakfast',[
 ['馒头鸡蛋配水果','bun egg orange','选原味馒头、白水蛋和水果，核对馒头配方。'],
 ['玉米豆浆早餐','corn soy banana','选熟玉米与无糖豆浆，水果取小份。'],
 ['米粥鸡蛋早餐','congee egg apple','米粥配鸡蛋和水果，不把咸菜作为主要搭配。'],
 ['红薯牛奶早餐','sweet milk orange','选熟红薯与原味牛奶，核对牛奶配料。'],
 ['馒头豆浆组合','bun soy apple','馒头和豆浆分别取，核对是否额外加糖或含不适合的成分。']
]);
rows('canteen','lunch',[
 ['米饭配原味豆腐和青菜','rice tofu greens','找原味或清淡豆腐菜，加一份青菜；问清肉末、蚝油和调味成分。'],
 ['米饭配鸡肉和西兰花','rice chicken broccoli','选择清蒸或白煮鸡肉，米饭与蔬菜分开取，核对酱汁。'],
 ['土豆鸡蛋配青菜','potato egg greens','选原味土豆、白水蛋和熟青菜，避免把油炸土豆当成同一道菜。'],
 ['米饭配清蒸鱼和青菜','rice fish greens','选清蒸鱼并去刺，再配米饭、青菜。'],
 ['牛肉西兰花饭','rice beef broccoli','选清炖瘦牛肉，询问调味，并取米饭和蔬菜。']
]);
rows('canteen','dinner',[
 ['玉米豆腐青菜盘','corn tofu greens','玉米作主食，配原味豆腐和青菜，确认豆腐未混肉末。'],
 ['米饭鸡肉青菜盘','rice chicken greens','取米饭、清蒸或白煮鸡肉与熟青菜，酱汁少量另放。'],
 ['土豆鱼肉配西兰花','potato fish broccoli','选择非油炸土豆、清蒸鱼和西兰花，鱼刺需去除。'],
 ['米饭鸡蛋配西兰花','rice egg broccoli','用白水蛋、米饭和熟蔬菜组成一餐。'],
 ['牛肉土豆配青菜','potato beef greens','土豆与瘦牛肉分别取一份，再配熟青菜。']
]);
rows('canteen','snack',[
 ['白水蛋配水果','egg banana','各取小份；如果马上吃正餐，就留到正餐一起安排。'],
 ['牛奶配小红薯','milk sweet','原味牛奶配小个熟红薯，不需要另外点甜饮。'],
 ['豆浆配小玉米','soy corn','选择无糖豆浆与小份熟玉米。'],
 ['豆浆配馒头','soy bun','按这次饥饿程度选择小份，不因为是训练日自动多加一顿。'],
 ['鸡蛋配苹果','egg apple','鸡蛋和苹果分别取用，作为当天饮食的一部分。']
]);
rows('takeout','breakfast',[
 ['原味粥配白水蛋和水果','congee egg orange','寻找可分别点原味粥和白水蛋的店，水果可另购。'],
 ['馒头豆浆配香蕉','bun soy banana','选择原味馒头和无糖豆浆，确认没有额外蛋奶配料。'],
 ['米粥豆腐配水果','congee tofu apple','可选择清淡豆腐搭配原味粥，核对汤底、肉末和调味。'],
 ['馒头鸡蛋组合','bun egg apple','馒头与鸡蛋分别点，避免把油炸夹馅版本当作同等搭配。']
]);
rows('takeout','lunch',[
 ['清蒸鸡肉饭配青菜','rice chicken greens','搜索清蒸或白煮鸡肉饭，要求蔬菜单独一份、酱汁另放；先确认配料。'],
 ['原味豆腐蔬菜饭','rice tofu broccoli','点米饭、原味豆腐和熟蔬菜，确认不用肉末、肉汤或蚝油。'],
 ['清蒸鱼配米饭和青菜','rice fish greens','优先能清楚说明鱼肉和调味的店，鱼刺自行检查。'],
 ['清炖牛肉蔬菜饭','rice beef broccoli','选择清炖瘦牛肉类型，浓汁另放，配熟蔬菜。'],
 ['鸡蛋配米饭和青菜','rice egg greens','店内可单点白水蛋时，搭配米饭和青菜，避免成分不清的卤汁。']
]);
rows('takeout','dinner',[
 ['豆腐青菜饭','rice tofu greens','点单时确认豆腐为无肉版本，问清汤底和调味。'],
 ['鸡肉西兰花饭','rice chicken broccoli','鸡肉以清蒸或白煮做法为例，酱汁与蔬菜另放。'],
 ['鱼肉西兰花饭','rice fish broccoli','选择清蒸鱼肉，配西兰花和米饭；核对调味。'],
 ['牛肉青菜饭','rice beef greens','点清炖瘦牛肉、米饭和青菜，不要求把汤汁全部喝完。'],
 ['白水蛋配米饭和西兰花','rice egg broccoli','可以单点白水蛋和熟蔬菜时组合，找不到就改用其他卡片。']
]);
rows('takeout','snack',[
 ['豆浆配小馒头','soy bun','可单点无糖豆浆和小份原味馒头；先问清配料。'],
 ['白水蛋配香蕉','egg banana','从能明确说明做法的店取白水蛋，水果可另购。'],
 ['原味粥配鸡蛋','congee egg','原味粥与白水蛋各取小份，不再叠加甜饮。'],
 ['豆浆配水果','soy apple','选择无糖豆浆，水果一份作为小加餐。']
]);
rows('store','breakfast',[
 ['全麦面包牛奶配香蕉','bread milk banana','核对面包配料，选择原味牛奶和新鲜香蕉，开封即组合。'],
 ['红薯鸡蛋配水果','sweet egg orange','有即食蒸红薯和白水蛋时直接组合，按包装要求保存和食用。'],
 ['燕麦酸奶配水果','oats yogurt apple','燕麦按标签泡软或煮熟后搭配原味酸奶，不能直接生吃需烹煮的产品。'],
 ['面包豆浆配苹果','bread soy apple','选择确认无蛋奶的面包与无糖豆浆，查看包装配料。'],
 ['玉米即食豆腐组合','corn readytofu banana','按标签加热或直接食用玉米、即食豆腐，水果另放。'],
 ['红薯鹰嘴豆配水果','sweet chickpeas orange','即食红薯配沥水罐装鹰嘴豆，确认开封保存条件。']
]);
rows('store','lunch',[
 ['即食米饭鸡胸肉蔬菜盒','ricebox readychicken salad','分别购买原味米饭、即食鸡肉和蔬菜盒，按标签加热；核对鸡肉腌料。'],
 ['玉米鸡蛋配番茄','corn egg tomato','买熟玉米、白水蛋和番茄，食用前清洗番茄。'],
 ['面包酸奶蔬菜组合','bread yogurt salad','选择配料明确的面包、原味酸奶与无复合酱蔬菜盒。'],
 ['即食米饭豆腐蔬菜组合','ricebox readytofu salad','即食米饭按要求加热，豆腐和蔬菜按标签食用。'],
 ['金枪鱼面包配黄瓜','bread tuna cucumber','罐头沥水，核对配料；黄瓜清洗后切块。'],
 ['红薯鹰嘴豆蔬菜盒','sweet chickpeas salad','把即食红薯、沥水鹰嘴豆和原味蔬菜盒组合。']
]);
rows('store','dinner',[
 ['即食米饭豆腐配番茄','ricebox readytofu tomato','米饭按包装加热，豆腐按标签食用，番茄洗净。'],
 ['红薯鸡蛋蔬菜盒','sweet egg salad','原味熟红薯、白水蛋与原味蔬菜盒分别取一份。'],
 ['玉米即食鸡肉配黄瓜','corn readychicken cucumber','核对鸡肉腌料，玉米按包装处理，黄瓜洗净。'],
 ['即食米饭金枪鱼蔬菜盒','ricebox tuna salad','即食米饭加热，金枪鱼沥水，蔬菜不使用成分不清的酱。'],
 ['面包鹰嘴豆配番茄','bread chickpeas tomato','选择纯素面包，鹰嘴豆沥水后搭配洗净番茄。'],
 ['红薯豆腐配黄瓜','sweet readytofu cucumber','熟红薯和即食豆腐依标签处理，黄瓜洗净后食用。']
]);
rows('store','snack',[
 ['原味牛奶配香蕉','milk banana','直接组合小份牛奶和水果；牛奶过敏者不能换成普通酸奶。'],
 ['鸡蛋配小玉米','egg corn','选白水蛋与即食熟玉米，按包装要求保存。'],
 ['酸奶配苹果','yogurt apple','选择原味无糖酸奶，苹果洗净。'],
 ['豆浆配小红薯','soy sweet','选无糖豆浆与即食红薯，无需再加一杯甜饮。'],
 ['鹰嘴豆配黄瓜','chickpeas cucumber','罐头开封沥水后取小份，黄瓜洗净。'],
 ['橘子配少量坚果','orange nuts','坚果约一小撮，选择配料明确的原味产品。']
]);
const PRE={home:[['banana'],['congee'],['bun','banana'],['rice'],['potato']],canteen:[['banana'],['congee'],['bun'],['rice'],['sweet']],takeout:[['congee'],['bun','banana'],['rice'],['banana']],store:[['banana'],['bread'],['sweet'],['ricebox'],['corn']]};
function allowed(item,p,tags){return!item.allergens.some(x=>tags.includes(x))&&(p.diet==='mixed'||p.diet==='vegetarian'&&item.diet!=='mixed'||p.diet==='vegan'&&item.diet==='vegan');}
function normalize(p,selection){const place=Object.hasOwn(PLACES,selection.place)?selection.place:Object.hasOwn(PLACES,p.foodMode)?p.foodMode:'home';return{place,meal:Object.hasOwn(MEALS,selection.meal)?selection.meal:'lunch',context:Object.hasOwn(CONTEXTS,selection.context)?selection.context:'normal',variant:Number.isSafeInteger(Number(selection.variant))&&Number(selection.variant)>=0?Number(selection.variant):0};}
function portion(item,selection,strategy){
 if(selection.context==='pre')return item.id==='banana'?'半根至 1 小根，按消化舒适度':item.id==='congee'?'约半小碗，别为凑份量喝到饱':item.id==='ricebox'||item.id==='rice'?'少量熟饭，约半拳头':item.id==='bread'?'约 1 片，慢慢吃':item.id==='bun'?'约半个小馒头':item.id==='corn'?'约半根小玉米；肠胃敏感时换香蕉':'少量约半拳头，按消化舒适度';
 if(selection.meal==='snack')return item.role==='starch'?(item.id==='bun'?'约半个小馒头':item.id==='corn'?'约半根小玉米':item.id==='sweet'?'约半个小红薯':item.id==='congee'?'约半小碗':item.portion):item.id==='egg'?'约 1 个':item.id==='chickpeas'?'约四分之一碗，按饥饿程度':item.portion;
 if(strategy==='gain'&&selection.meal==='lunch'&&item.role==='starch')return item.portion+'；若当天需要，可只在这一餐多加 2–3 口';
 return item.portion;
}
function itemView(item,selection,strategy){return{id:item.id,name:item.name,portion:portion(item,selection,strategy),allergens:[...item.allergens],diet:item.diet,role:item.role};}
// Preparation ranks are a local convenience heuristic, not a measured cooking time.
const PREPARATION={rice:2,congee:2,potato:2,sweet:2,corn:2,oats:1,bread:0,bun:1,noodles:2,ricebox:1,egg:2,tomatoegg:2,tofu:2,readytofu:0,soy:0,milk:0,yogurt:0,beans:3,chickpeas:0,chicken:3,beef:4,fish:3,readychicken:0,tuna:0,greens:2,broccoli:2,tomato:1,cucumber:1,salad:0,banana:0,apple:1,orange:0,nuts:0};
function budgetScore(recipe,budget){const cost=averageCost(recipe.ids),effort=recipe.ids.reduce((sum,id)=>sum+PREPARATION[id],0)/recipe.ids.length;return budget==='flexible'?effort+cost/100:budget==='medium'?Math.abs(cost-1.6):cost;}
function averageCost(ids){return ids.reduce((sum,id)=>sum+FOODS[id].cost,0)/ids.length;}
function recommend(profile,nutrition,selection={}){
 const p=profile||{},n=nutrition||{},choice=normalize(p,selection||{}),tags=Array.isArray(p.allergyTags)?p.allergyTags:[],notes=[];
 const result=(status,reason,reviewStep,cards=[],strategy='review',availableCount=0)=>({status,reason,reviewStep,selection:choice,cards,notes,strategy,availableCount,hasMore:availableCount>3});
 if(n.menuAllowed!==true||n.eligible===false||n.weightGuidance?.effectiveStrategy==='review')return result('blocked',n.reason||'先完成当前资料的饮食适用判断，再提供具体搭配。',p.recentWeightTrend==='unexplained'?1:3);
 if(typeof p.allergies!=='string'||p.allergies.trim())return result('blocked','你有文字填写的其他食物限制，当前内置筛选无法可靠理解全部内容。请先在资料中核对限制或继续遵循已有饮食建议，场景选择不能绕过。',4);
 if(!['mixed','vegetarian','vegan'].includes(p.diet)||!Array.isArray(p.allergyTags)||tags.some(t=>!knownAllergens.includes(t)))return result('blocked','饮食类型或食物限制选项需要核对，暂不猜测可以吃什么。',4);
 const strategy=n.weightGuidance? n.weightGuidance.effectiveStrategy:n.effectiveGoal==='build'?'gain':n.effectiveGoal==='recomp'?'maintain':'balanced';
 let pool=choice.context==='pre'?PRE[choice.place].map((ids,i)=>({id:`pre-${choice.place}-${choice.meal}-${i}`,place:choice.place,meal:choice.meal,title:`${MEALS[choice.meal]}的训练前轻量选择 · ${FOODS[ids[0]].name}`,ids,instruction:choice.place==='home'?'准备少量容易吃下的主食或水果；如果马上训练，大份正餐可安排在之后。':choice.place==='store'?'选择配料清楚、按包装可直接吃或加热的简单食品；不要为了凑成套餐吃得很满。':'选少量原味主食或水果，问清配料；临近训练时不点满一大餐。'})):RECIPES.filter(r=>r.place===choice.place&&r.meal===choice.meal);
 pool=pool.filter(r=>r.ids.every(id=>allowed(FOODS[id],p,tags))).sort((a,b)=>budgetScore(a,p.budget)-budgetScore(b,p.budget)||a.id.localeCompare(b.id));
 const count=pool.length;
 notes.push('每次从卡片中选 1 套，不是把所有卡片都吃完。份量是起步参考，不保证达到上方每日热量或蛋白质数值。');
 notes.push('主推荐与替换均按当前选项筛选，但不同食物不能按相同体积视为等蛋白质或等热量；看配料、营养标签和实际饥饿感调整。');
 notes.push(choice.place==='home'?'使用普通食材和清楚的调味成分；有过敏时也需避免锅具、砧板和餐具交叉接触。':'这是可寻找的食品类型，不保证商家有售或一定无过敏原。核对配料、汤底、调味及共用器具；无法确认时不要用这套搭配。');
 notes.push('节省为主时按常见食材的相对成本排序；方便优先时按准备步骤的多少排序。这些是内置参考，不是当地实时报价或实测做饭时间。');
 if(strategy==='gain')notes.push('小幅增重不等于每顿和每次加餐都追加：如当天确实需要，可先只在午餐主食多加 2–3 口，其他餐保持原起点，再看多日趋势。');
 else notes.push('按当前维持或均衡饮食起点选择；切换场景、换一组和训练前后都不会自动追加一天食量。');
 if(choice.context==='pre')notes.push('训练前优先考虑消化舒适的少量碳水。离训练较近或吃大餐容易不适时，选择小份、给消化留时间；这些轻量选择不能长期替代完整正餐。');
 if(choice.context==='post')notes.push('训练后可以与下一顿正常正餐合并，包含合适的主食和蛋白质食物即可。下餐还早且有需要时再选小加餐，不自动重复吃一顿，也没有必须卡住的固定窗口。');
 if(!count)return result('empty','当前地点、餐次和饮食限制下没有可可靠匹配的内置组合。可换一个用餐地点或餐次，或核对实际食品配料；不要为获得推荐取消真实限制。',4,[],strategy,0);
 const offset=count>3?(choice.variant*3)%count:0,selected=Array.from({length:Math.min(3,count)},(_,i)=>pool[(offset+i)%count]);
 const cards=selected.map(recipe=>{
  const items=recipe.ids.map(id=>itemView(FOODS[id],choice,strategy)),swaps=[];
  for(const id of recipe.ids){const source=FOODS[id];if(swaps.length>=3)break;
   let candidates=Object.values(FOODS).filter(x=>x.role===source.role&&x.id!==id&&!recipe.ids.includes(x.id)&&x.places.includes(choice.place)&&allowed(x,p,tags));
   if(choice.context==='pre')candidates=candidates.filter(x=>PRE[choice.place].some(ids=>ids.includes(x.id)));
   candidates.sort((a,b)=>p.budget==='flexible'?PREPARATION[a.id]-PREPARATION[b.id]||a.cost-b.cost:a.cost-b.cost);
   const replacement=candidates[0];if(replacement)swaps.push({...itemView(replacement,choice,strategy),replaces:source.name});
  }
  const why=choice.context==='pre'?'这套以少量主食或水果为主，优先考虑消化舒适；不在训练前硬塞满一大餐。':choice.meal==='snack'?'适合当下确实需要的小份补充，可作为当天已有饮食的一部分；不要求训练日额外多吃。':'组合了主食、可吃的蛋白质食物与蔬果，方便在当前地点用普通食物完成一餐。';
  return{id:recipe.id,title:recipe.title,items,instruction:recipe.instruction+(choice.context==='post'?' 若这就是训练后的正餐，吃这一套即可，不再自动加一套加餐。':''),why,swaps,budgetLabel:averageCost(recipe.ids)<=1.3?'常见经济食材':averageCost(recipe.ids)<2?'方便轮换的搭配':'提供更多食材选择'};
 });
 if(count<=3)notes.push(`当前只有 ${count} 套符合条件的组合，已全部展示；不会为凑数量放宽限制。`);
 else if(count<6)notes.push(`当前共有 ${count} 套符合条件的组合，换一组时部分选项可能重复。`);
 return result('ready',count<=3?'当前符合条件的组合已全部展示。':'选择一套即可，也可以换一组。',4,cards,strategy,count);
}
const api={PLACES,MEALS,CONTEXTS,recommend};root.FitFood=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
