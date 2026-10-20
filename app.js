import { CATEGORIES, validateAnswer, letter, isLetter, wrongLetters, guess, newSession, validSave } from './game.js';
const $ = s => document.querySelector(s);
const main = $('#main');
const STORAGE = 'hangtime.session.v1';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state = null, muted = false, audio, storageFailed = false;
try { const saved = JSON.parse(localStorage.getItem(STORAGE)); if (validSave(saved)) { state = saved; muted = saved.muted; } } catch {}
function save() { if (!state) return; state.muted = muted; try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { storageFailed = true; } }
function sound(type) {
  if (muted) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const notes = {right:[523,659],wrong:[240,180],won:[523,659,784,1047],lost:[392,330,262]}[type];
    notes.forEach((freq,i) => { const o=audio.createOscillator(), g=audio.createGain(), t=audio.currentTime+i*.11; o.type='sine'; o.frequency.setValueAtTime(freq,t); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.12,t+.012); g.gain.exponentialRampToValueAtTime(.001,t+.22); o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.24); });
  } catch {}
}
function soundButton() { $('#sound').innerHTML = muted ? '♫<span class="slash">╱</span>' : '♫'; $('#sound').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound'); $('#sound').title = muted ? 'Unmute sound' : 'Mute sound'; }
$('#sound').onclick = () => { muted=!muted; save(); soundButton(); if (!muted) sound('right'); };
function scoreboard() { return `<div class="scoreboard">${state.names.map((name,i)=>`<div class="player ${i===1-state.setter?'active':''}"><span class="avatar">${esc(name[0].toUpperCase())}</span><span class="player-name">${esc(name)}<small>${i===state.setter?'SETTING':'GUESSING'}</small></span><strong>${state.scores[i]}</strong></div>`).join('')}</div>`; }
function sessionLink() { return `<button class="text-button" id="new-session">New session</button>`; }
function bindSession() { $('#new-session')?.addEventListener('click', () => $('#confirm').showModal()); }
$('#confirm').addEventListener('close', () => { if ($('#confirm').returnValue === 'confirm') { state=null; try { localStorage.removeItem(STORAGE); } catch {} render(); } });
function drawing(count=0,result=null) {
 const won = result === 'won', lost = result === 'lost';
 const eyes = lost ? 'M175 75l4 4m0-4-4 4M189 75l4 4m0-4-4 4' : 'M177 77v1M191 77v1';
 const mouth = won ? 'M176 85q8 7 16 0' : lost ? 'M176 90q8-8 16 0' : 'M177 87h14';
 return `<svg class="hangman ${won?'celebrate':''}" viewBox="0 0 300 220" role="img" aria-label="${won?'Smiling character celebrating':lost?'Character with a frown and X eyes':`${count} of 6 character parts drawn`}"><ellipse cx="150" cy="204" rx="99" ry="8" fill="#e9e7e2"/><g class="gallows"><path d="M56 200V23Q56 17 63 17H184V44M43 200H92M57 55L95 18"/></g><path class="rope" d="M184 44v13"/>${count>=1||won?`<g class="character"><circle cx="184" cy="78" r="21" fill="#e6ddff"/><path class="face eyes" d="${eyes}"/><path class="face mouth" d="${mouth}"/>${count>=2||won?'<path d="M184 100v48"/>':''}${count>=3||won?'<path d="M184 148l-22 36"/>':''}${count>=4||won?'<path d="M184 148l22 36"/>':''}${count>=5||won?`<path d="M184 111l-29 ${won?'-23':'25'}"/>`:''}${count>=6||won?`<path d="M184 111l29 ${won?'-23':'25'}"/>`:''}</g>`:''}${count===0&&!won?'<g fill="#b4a7d7"><path d="m218 86 3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><circle cx="146" cy="126" r="3"/><circle cx="224" cy="154" r="2"/></g>':''}</svg>`;
}
function render() {
 soundButton();
 if (!state) welcome(); else if (state.phase==='setup') setup(); else if(state.phase==='handoff') handoff(); else board();
 bindSession();
 if (storageFailed) main.insertAdjacentHTML('beforeend','<p class="storage-note" role="status">Browser storage is unavailable. Keep this tab open to preserve your game.</p>');
}
function welcome() {
 main.innerHTML=`<section class="welcome"><span class="pill">TWO PLAYERS · ONE PHONE</span><div class="hero-art">${drawing(6,'won')}<span class="art-badge">let’s hang ✳</span></div><h1>Good words.<br>Great company.</h1><p class="intro">One secret answer. Six chances.<br>A little friendly rivalry.</p><form id="names" class="card"><span class="eyebrow">MEET THE PLAYERS</span><label for="p1">Player one <span>sets the first answer</span></label><input id="p1" name="p1" maxlength="24" placeholder="Your name" autocomplete="off" required><label for="p2">Player two <span>takes the first guess</span></label><input id="p2" name="p2" maxlength="24" placeholder="Their name" autocomplete="off" required><p id="name-error" class="error" role="alert"></p><button class="primary full">Let’s play <span>→</span></button></form><p class="fine-print">Solve it, score a point. Swap roles. Repeat.<br>Your game saves automatically on this browser.</p></section>`;
 $('#names').onsubmit = e => { e.preventDefault(); const names=[$('#p1').value.trim(),$('#p2').value.trim()]; if(names.some(n=>!n)) { $('#name-error').textContent='Enter a name for each player.'; return; } if(names[0].toLowerCase()===names[1].toLowerCase()) { $('#name-error').textContent='Use different names so you can tell the scores apart.';return; } state=newSession(names,muted); save();render();window.scrollTo(0,0); };
}
function setup() {
 main.innerHTML=`${scoreboard()}<section class="setup"><div class="round-label">ROUND ${state.round} <span>✳</span> THE SECRET</div><h1>Your move,<br>${esc(state.names[state.setter])}.</h1><p class="intro">Keep the phone with you.<br>Choose an answer ${esc(state.names[1-state.setter])} will have to guess.</p><form id="answer-form" class="card"><label for="answer">The secret answer <span id="count">0 / 140</span></label><textarea id="answer" rows="3" maxlength="140" placeholder="A word, a place, an inside joke…" autocomplete="off" autocapitalize="sentences" spellcheck="false" required></textarea><p class="hint">Spaces, numbers & punctuation appear automatically.</p><label for="category">Give them a category</label><select id="category" required><option value="" disabled selected>Choose a category</option>${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select><div id="custom-wrap" hidden><label for="custom">Your category</label><input id="custom" maxlength="60" placeholder="e.g. Things in our kitchen" autocomplete="off"></div><p id="answer-error" class="error" role="alert"></p><button class="primary full">Hide answer & pass phone <span>→</span></button></form><p class="fine-print">Only you should see this screen.</p>${sessionLink()}</section>`;
 $('#answer').oninput=()=>$('#count').textContent=`${[...$('#answer').value].length} / 140`;
 $('#category').onchange=()=>{ const custom=$('#category').value==='Other'; $('#custom-wrap').hidden=!custom; $('#custom').required=custom; };
 $('#answer-form').onsubmit=e=>{ e.preventDefault(); const answer=$('#answer').value.trim().replace(/\s+/g,' '); const error=validateAnswer(answer); if(error){$('#answer-error').textContent=error;return;} const category=$('#category').value==='Other'?$('#custom').value.trim():$('#category').value; if(!category){$('#answer-error').textContent='Add a category to help your guesser.';return;} state={...state,answer,category,guesses:[],phase:'handoff',result:null};save();render();window.scrollTo(0,0); };
}
function handoff() {
 main.innerHTML=`${scoreboard()}<section class="handoff"><div class="handoff-icon" aria-hidden="true">↗</div><span class="eyebrow">SECRET SAFELY HIDDEN</span><h1>Over to you,<br>${esc(state.names[1-state.setter])}.</h1><p class="intro">${esc(state.names[state.setter])}, hand over the phone.<br>The next screen is for the guesser.</p><div class="card rules"><h2>A little how-to</h2><p><span>01</span> Tap letters to reveal the answer.</p><p><span>02</span> Six wrong guesses ends the round.</p><p><span>03</span> Solve it to earn one point.</p></div><button id="ready" class="primary full">I’m ${esc(state.names[1-state.setter])}. Let’s guess <span>→</span></button>${sessionLink()}</section>`;
 $('#ready').onclick=()=>{state.phase='play';save();render();window.scrollTo(0,0);};
}
function board() {
 const wrong=wrongLetters(state), result=state.phase==='result', won=state.result==='won';
 const words=state.answer.split(' ').map(word=>`<span class="word">${[...word].map(c=>`<span class="tile ${!isLetter(c)?'punctuation':''} ${result&&isLetter(c)&&!state.guesses.includes(letter(c))?'revealed':''}">${!isLetter(c)||result||state.guesses.includes(letter(c))?esc(c.toUpperCase()):'<span class="sr-only">blank</span>'}</span>`).join('')}</span>`).join('');
 main.innerHTML=`${scoreboard()}<section class="game"><div class="round-label">ROUND ${state.round} <span>✳</span> ${result?'THE REVEAL':'MAKE YOUR GUESS'}</div><div class="game-top"><span class="pill category">${esc(state.category)}</span><span class="chances ${wrong.length>=4?'urgent':''}">${6-wrong.length} ${6-wrong.length===1?'chance':'chances'} left</span></div><div class="drawing-area">${drawing(wrong.length,result?state.result:null)}<div class="progress-dots" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i class="${i<wrong.length?'used':''}"></i>`).join('')}</div></div><div class="puzzle" aria-label="Puzzle answer" ${result?'':'aria-live="polite"'}>${words}</div>${result?`<div class="result ${won?'win':''}" role="status"><span class="eyebrow">${won?'NICELY DONE · +1 POINT':'AH, SO CLOSE'}</span><h1>${won?`You got it, ${esc(state.names[1-state.setter])}!`:'That’s six. Good game.'}</h1><p>${won?'A well-earned point. Ready to return the favor?':'No points this time. A new secret awaits.'}</p></div><button id="next" class="primary full">Next round · swap roles <span>→</span></button>`:`<p id="feedback" class="feedback" role="status">Pick a letter. Trust your instincts.</p><div class="keyboard" aria-label="Letter keyboard">${['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map(row=>`<div class="key-row">${[...row].map(c=>{const used=state.guesses.includes(c);return `<button class="key ${used?(wrong.includes(c)?'wrong':'correct'):''}" data-key="${c}" ${used?'disabled':''} aria-label="${c}${used?(wrong.includes(c)?', incorrect':', correct'):''}">${c}${used?`<small>${wrong.includes(c)?'−':'•'}</small>`:''}</button>`;}).join('')}</div>`).join('')}</div>`}${sessionLink()}</section>`;
 document.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>makeGuess(b.dataset.key));
 $('#next')?.addEventListener('click',()=>{state={...state,phase:'setup',setter:1-state.setter,round:state.round+1,answer:'',category:'',guesses:[],result:null};save();render();window.scrollTo(0,0);});
}
function makeGuess(key) {
 const next=guess(state,key); if(next===state)return;
 state=next;save();render();
 if(state.phase==='result')sound(state.result); else {const wrong=wrongLetters(state).includes(key);sound(wrong?'wrong':'right');$('#feedback').textContent=wrong?`${key} isn’t in this one. Keep going.`:`${key} — good find!`;}
}
document.addEventListener('keydown',e=>{ if(state?.phase==='play' && !$('#confirm').open && !e.ctrlKey && !e.metaKey && !e.altKey && /^[a-z]$/i.test(e.key))makeGuess(e.key.toUpperCase()); });
render();
