export const MAX_ANSWER = 140;
export const CATEGORIES = ['Place', 'Animal', 'Person', 'Food & drink', 'Movie or TV show', 'Job or occupation', 'Other'];
export function letter(char) {
  return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}
export function isLetter(char) { return /^[A-Z]$/.test(letter(char)); }
export function validateAnswer(answer) {
  if (!answer.trim()) return 'Add a secret answer first.';
  if ([...answer].length > MAX_ANSWER) return `Keep your answer to ${MAX_ANSWER} characters.`;
  if (![...answer].some(isLetter)) return 'Include at least one A–Z letter.';
  if ([...answer].some(c => /\p{L}/u.test(c) && !isLetter(c))) return 'Use letters from the English alphabet (accents are welcome).';
  if (answer.trim().split(/\s+/).some(w => [...w].length > 24)) return 'Keep each word to 24 characters so it fits nicely on screen.';
  return '';
}
export function wrongLetters(state) { return state.guesses.filter(g => ![...state.answer].some(c => letter(c) === g)); }
export function outcome(state) {
  if (wrongLetters(state).length >= 6) return 'lost';
  if ([...state.answer].filter(isLetter).every(c => state.guesses.includes(letter(c)))) return 'won';
  return null;
}
export function guess(state, key) {
  key = key.toUpperCase();
  if (state.phase !== 'play' || !/^[A-Z]$/.test(key) || state.guesses.includes(key)) return state;
  const next = { ...state, guesses: [...state.guesses, key], scores: [...state.scores] };
  const result = outcome(next);
  if (result) { next.phase = 'result'; next.result = result; if (result === 'won') next.scores[1 - state.setter]++; }
  return next;
}
export function newSession(names, muted = false) {
  return { version: 1, phase: 'setup', names, scores: [0, 0], setter: 0, round: 1, answer: '', category: '', guesses: [], muted };
}
export function validSave(s) {
  return s?.version === 1 && ['setup','handoff','play','result'].includes(s.phase) && Array.isArray(s.names) && s.names.length === 2 && s.names.every(n => typeof n === 'string' && n.trim().length && n.length <= 24) && Array.isArray(s.scores) && s.scores.length === 2 && s.scores.every(n => Number.isSafeInteger(n) && n >= 0) && [0,1].includes(s.setter) && Number.isSafeInteger(s.round) && s.round > 0 && typeof s.muted === 'boolean' && typeof s.answer === 'string' && typeof s.category === 'string' && s.category.length <= 60 && Array.isArray(s.guesses) && s.guesses.every(g => /^[A-Z]$/.test(g)) && new Set(s.guesses).size === s.guesses.length && (s.phase === 'setup' || (!validateAnswer(s.answer) && s.category.trim() && (s.phase !== 'result' || s.result === outcome(s)) && (s.phase !== 'play' || !outcome(s))));
}
