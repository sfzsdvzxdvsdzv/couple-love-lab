/* Seven playful rounds. Choices stay in memory and never leave the browser. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let step=0,answers={},config={},finish=()=>{},sound=()=>{},timer;
  const rounds=[
    {kicker:'01 / PRIVATE NICKNAME',icon:'✧',title:'先选一个，<br>只属于我们的称呼。',desc:'普通用户只有用户名，你可以有一点特权。',key:'nickname',options:[
      ['♡','宝贝','一叫就想靠近','好，称呼已更新。以后叫你宝贝的时候，记得回头看我一眼。'],
      ['☁','小朋友','专属偏爱，不限年龄','小朋友认证成功。今天也可以任性一点，我负责偏心。'],
      ['✦','我的心动嘉宾','有且仅有一位','嘉宾席已经为你留好了。不好意思，其他人连候补都没有。']]},
    {kicker:'02 / MISSING YOU',icon:'∞',title:'今天想我了吗？<br><span>别急着嘴硬。</span>',desc:'拖动滑杆，让系统看看你的想念浓度。',key:'longing',type:'slider'},
    {kicker:'03 / CATCH MY HEART',icon:'♥',title:'我的心跑出来了。<br>麻烦你接一下。',desc:'接住 5 颗小心动。别担心，它们只往你这里跑。',key:'hearts',type:'catch'},
    {kicker:'04 / OUR NEXT DATE',icon:'☾',title:'下次见面，<br>你想怎么偷走我的时间？',desc:'选一个约会剧本，我已经开始期待了。',key:'date',options:[
      ['☾','晚风散步','不赶路，只靠近一点','路线已经规划好了：从见到你，到舍不得送你回家。'],
      ['☕','奶茶约会','甜度随你，偏爱满杯','你的奶茶可以少糖。我的那杯不用加糖，看你就够甜了。'],
      ['✧','窝着看电影','剧情随意，位置留给你','电影我可能会看漏一半。因为旁边的你，比剧情还让人分心。']]},
    {kicker:'05 / EXCLUSIVE REWARD',icon:'🎟',title:'检测有奖励。<br>你想先领哪一个？',desc:'不是抽奖，每一张都是为你准备的。',key:'reward',type:'reward',options:[
      ['♡','一个抱抱','见面时，慢慢兑现','抱抱券已签发。使用方法：向我靠近一点，再靠近一点。'],
      ['✦','一句甜到犯规的话','现在就可以领取','你不用每次都很可爱。因为在我这里，做你自己就已经很犯规了。'],
      ['☁','先欠着，改天再领','有效期：一直喜欢你','已记在我的心动账本上。你可以慢慢挑，我可以一直等。']]},
    {kicker:'06 / OUR LITTLE SIGNAL',icon:'↗',title:'如果我突然说想你，<br>你会怎么回？',desc:'最后一项默契测试，没有标准答案，只有我的小心思。',key:'reply',options:[
      ['♡','我也想你','直接打出直球','收到双向信号。系统正在努力降温，可惜我已经开始傻笑了。'],
      ['✧','那你来找我呀','有一点点挑衅','收到召唤。导航目的地不是某个地址，是有你的地方。'],
      ['☁','才不告诉你','继续保留一点神秘感','行，那我先偷偷多想你一点。你慢慢嘴硬，我慢慢心动。']]},
    {kicker:'07 / UNEXPECTED RESULT',icon:'!',title:'等等，系统<br>出现了一点<span>异常。</span>',desc:'你的回答触发了一个隐藏结果。',type:'verdict'}
  ];
  function template(r,body){return `<div class="kicker">${r.kicker}</div><h1 class="flirt-title" tabindex="-1">${r.title}</h1><p class="subtitle flirt-description">${r.desc}</p><div class="glass flirt-card"><div class="flirt-symbol" aria-hidden="true">${r.icon}</div>${body}<div class="flirt-feedback" id="flirtFeedback" hidden aria-live="polite"><span class="feedback-label">系统偷偷说</span><p class="feedback-text" id="feedbackText"></p><button class="primary flirt-next" id="flirtNext" type="button">继续，看看你还藏了什么 →</button></div></div>`;}
  function feedback(text){$('feedbackText').textContent=text;$('flirtFeedback').hidden=false;sound(660);$('flirtNext').onclick=next;}
  function choose(r,index){const option=r.options[index];answers[r.key]={label:option[1],index};document.querySelectorAll('.flirt-choice').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});if(r.key==='date'){const scene=$('flirtContent').querySelector('.scenario-scene');scene.innerHTML=option[0]+'<small>'+option[1]+'</small>';scene.dataset.scene=String(index);}if(r.type==='reward'){$('rewardTicket').hidden=false;$('ticketTitle').textContent=option[1];$('ticketIcon').textContent=option[0];$('ticketCopy').textContent=option[2];}feedback(option[3]);}
  function render(){clearTimeout(timer);const r=rounds[step];$('flirtStepLabel').textContent=String(step+1).padStart(2,'0')+' / 07';$('flirtDots').innerHTML=rounds.map((_,i)=>`<i class="${i===step?'active':i<step?'done':''}"></i>`).join('');$('flirtBack').hidden=step===0;
    let body='';
    if(r.options){body='<div class="choice-list">'+r.options.map((o,i)=>`<button class="flirt-choice" type="button" data-option="${i}" aria-pressed="false"><span class="choice-icon" aria-hidden="true">${o[0]}</span><span>${o[1]}<small>${o[2]}</small></span><span aria-hidden="true">↗</span></button>`).join('')+'</div>';if(r.key==='date')body='<div class="scenario-scene" aria-hidden="true">☾ <span>✧</span> ✦</div>'+body;if(r.type==='reward')body+='<div class="reward-ticket" id="rewardTicket" hidden><span class="ticket-icon" id="ticketIcon"></span><div><b class="ticket-title" id="ticketTitle"></b><p class="ticket-copy" id="ticketCopy"></p><small>LOVE LAB · 仅限你使用</small></div></div>';}
    else if(r.type==='slider'){body=`<div class="longing-slider"><div class="longing-value"><b id="longingValue">${answers.longing??50}</b><span>%</span></div><label for="longingRange" class="longing-prompt">今天的想念浓度</label><input id="longingRange" type="range" min="0" max="100" value="${answers.longing??50}" aria-label="今天的想念浓度"><div class="longing-scale"><span>一点点</span><span>超级想</span></div><p id="longingHint" class="longing-hint" aria-live="polite">你慢慢选，我偷偷期待。</p><button id="submitLonging" class="primary" type="button">就这么想你，提交 ♡</button></div>`;}
    else if(r.type==='catch'){body='<div class="catch-counter"><b id="heartCount">0</b> / 5 颗心动</div><div class="charge-track"><div id="chargeFill"></div></div><div class="catch-field" id="catchField"><button class="catch-heart" id="catchHeart" type="button" aria-label="接住一颗心动">♥</button><span class="catch-caption">点一下心，把它接住</span></div><p class="charge-label" id="heartStatus" aria-live="polite">这是我的心。收好哦。</p>';}
    else body='<div class="fake-result" id="fakeResult" role="status"><div class="loading-dots"><i></i><i></i><i></i></div><p>正在重新核对心动数据……</p></div><div class="system-alert" id="systemAlert" hidden><span class="alert-code">ERROR 520 / HEART OVERFLOW</span><h2>问题找到了：<br>你太让我心动了。</h2><p>不是程序出错，是我一开始就把答案写成了你。</p><div class="promise-tags"><span>称呼已专属</span><span>心动已签收</span><span>偏爱已生效</span></div><button class="primary flirt-next" id="revealFinal" type="button">好啦，让我看最终结果 ♡</button></div>';
    $('flirtContent').innerHTML=template(r,body);window.scrollTo({top:0,behavior:'smooth'});$('flirtContent').querySelector('h1').focus({preventScroll:true});
    if(r.options){document.querySelectorAll('.flirt-choice').forEach(b=>b.onclick=()=>choose(r,Number(b.dataset.option)));if(answers[r.key])choose(r,answers[r.key].index);}
    if(r.type==='slider'){$('longingRange').oninput=()=>{const v=Number($('longingRange').value);$('longingValue').textContent=v;$('longingHint').textContent=v<30?'才这么一点？剩下的，我负责想你。':v<80?'收到。嘴角已经开始不听指挥了。':'警告：想念过载。建议尽快见面。';$('flirtFeedback').hidden=true;};$('submitLonging').onclick=()=>{answers.longing=Number($('longingRange').value);const v=answers.longing;feedback(v<30?'这么巧？我刚好多想你一点，合起来还是很甜。':v<80?'已收到 '+v+'% 的想念。我这边回赠 100%，不用找零。':'想念浓度 '+v+'%。申请把这份想念换成下次见面，好不好？');};}
    if(r.type==='catch'){let caught=answers.hearts||0;const phrases=['接到了。我的心还挺听你的话。','第二颗：这是看见你时的心动。','第三颗：这是被你逗笑时的心动。','第四颗：这是舍不得说晚安的心动。','五颗都归你啦，不许随便弄丢。'];const button=$('catchHeart');if(caught===5){$('heartCount').textContent='5';$('chargeFill').style.width='100%';button.disabled=true;button.textContent='♡';$('catchField').classList.add('complete');$('catchField').querySelector('.catch-caption').textContent='全部签收 · 心动归你';$('heartStatus').textContent=phrases[4];feedback('五次心动都已经收好。还要继续的话，我就在下一页等你。');}button.onclick=()=>{if(caught>=5)return;caught++;$('heartCount').textContent=caught;$('chargeFill').style.width=caught*20+'%';$('heartStatus').textContent=phrases[caught-1];sound(440+caught*88);if(caught===5){answers.hearts=5;button.disabled=true;button.textContent='♡';$('catchField').classList.add('complete');$('catchField').querySelector('.catch-caption').textContent='全部签收 · 心动归你';feedback('心动已签收。友情提醒：我只有这一颗心，刚刚那五次，是它为你跳了五下。');}else{const field=$('catchField');const oldX=button.offsetLeft;const maxX=Math.max(0,field.clientWidth-button.offsetWidth-16);let x=8+Math.random()*Math.max(0,maxX-8);if(Math.abs(x-oldX)<35)x=oldX>field.clientWidth/2?8:maxX;button.style.left=x+'px';button.style.top=(12+Math.random()*Math.max(0,field.clientHeight-button.offsetHeight-58))+'px';}};}
    if(r.type==='verdict'){timer=setTimeout(()=>{$('fakeResult').hidden=true;$('systemAlert').hidden=false;sound(330);$('revealFinal').onclick=()=>{summary();finish();};},2200);}
  }
  function next(){if(step<rounds.length-1){step++;render();}}
  function summary(){const name=answers.nickname?.label||config.to,date=answers.date?.label||'下次见面',reward=answers.reward?.label||'一份偏爱';$('flirtSummary').hidden=false;$('flirtSummary').innerHTML=`<small>我们的专属小暗号</small><p>今天开始，<b>${escape(name)}</b>的心动已签收。</p><div class="promise-tags"><span>${escape(date)}</span><span>${escape(reward)}</span><span>心动收藏 5 / 5</span></div>`;}
  $('flirtBack').onclick=()=>{if(step>0){step--;render();}};
  window.LOVE_FLIRT={start(c,onFinish,onTone){clearTimeout(timer);config=c;finish=onFinish;sound=onTone;step=0;answers={};render();},reset(){clearTimeout(timer);step=0;answers={};$('flirtSummary').hidden=true;}};
})();
