// Silly words for Real or Silly: made-up words a first grader can sound out under each Pattern (vob, shib, blig, fube, treeb, zorp),
// so "Which one is a real word?" is a reading question, not a guess. Plain data, no game code.
//
// Each was made from the Pattern's own letters (a consonant or blend, the Pattern's vowel, a consonant: never a soft c or g, never
// ending in the letters English words don't end in) and kept only if it is:
//   - not a word in /usr/share/dict/words, /usr/share/dict/propernames, or the US and UK Hunspell dictionaries (calibre's), nor on
//     the word list, nor a modern word, slang or a short name those lack (words.test.ts lists them);
//   - not said like a common word when spelled another way (kat for cat, fone for phone, slaid for slayed): words.test.ts tries the
//     other spellings of each sound, and a vowel team said as a magic e (caik for cake, fraim for frame, grait for grate);
//   - nothing rude can be read in it, and not slang a parent would wince at (pog, fap, larp, womp were taken out by hand, and in the
//     review pass bish, trib, virg, parm, spag, crit, the names Zurg, Yash, Stig and the like: words.test.ts's BY_HAND).
// The tests re-check all of it wherever those dictionaries are installed.
import type { PatternId } from './list';

export const SILLY: Readonly<Record<PatternId, readonly string[]>> = {
  cvc: [
    'bip', 'fep', 'fim', 'fom', 'hib', 'hig', 'lig', 'meb', 'mip', 'pab', 'pag', 'peb', 'vab', 'vam', 'vap', 'veb', 'vem',
    'vep', 'vib', 'vit', 'vob', 'vop', 'vub', 'vup', 'wib', 'yab', 'yag', 'yeb', 'yig', 'yim', 'yit', 'yog',
    'yug', 'yut', 'zab',
  ],
  digraph: [
    'sheb', 'shib', 'shig', 'shub', 'chag', 'cheb', 'cheg', 'chib', 'chig', 'chim', 'thab', 'thag', 'thap', 'theg', 'thep', 'thib',
    'thim', 'thip', 'thit', 'thub', 'thup', 'dack', 'dath', 'dith', 'fith', 'fing', 'futh', 'hith', 'jath', 'jesh', 'jeth',
    'jick', 'jith', 'mish', 'neng', 'nith', 'nung', 'rish', 'rith', 'tish', 'toth', 'vash', 'vath', 'vesh', 'veck', 'veth',
    'vish', 'vith', 'ving', 'vosh', 'voth', 'vush', 'vuck', 'vuth', 'yath', 'yesh', 'yish', 'yick', 'yith', 'yosh',
    'yoth', 'yush', 'zesh', 'zeng', 'zish', 'zoth', 'zush', 'cuth', 'gath',
  ],
  blend: [
    'blap', 'blep', 'blib', 'blid', 'blig', 'blim', 'blit', 'blon', 'blop', 'blun', 'clab', 'cleb', 'clib', 'clig', 'clin',
    'clob', 'flib', 'flig', 'flom', 'glab', 'glap', 'glat', 'gleb', 'glep', 'glid', 'glig', 'glip', 'glit', 'glot', 'plab', 'plam',
    'pleg', 'plem', 'plep', 'plib', 'plig', 'plin', 'plip', 'plit', 'plob', 'plom', 'plub', 'slib', 'slig', 'slin', 'brap', 'breb',
    'brep', 'brib', 'brid', 'brip', 'brop', 'brub', 'brup', 'cren', 'crip', 'drap', 'drep', 'drim', 'drin', 'freb',
    'frem', 'frin', 'frip', 'frob', 'frub', 'grib', 'trab', 'treb', 'treg', 'trit', 'trob', 'stin', 'stip', 'stom',
    'spab', 'spap', 'speb', 'speg', 'spep', 'spib', 'spim', 'spip', 'spob', 'spog', 'spop', 'spub', 'spup', 'snam', 'snan',
    'snat', 'snem', 'snen', 'snet', 'snid', 'snim', 'snin', 'snom', 'snon', 'snun', 'swib', 'swid', 'swin', 'swip', 'swit', 'swod',
    'swud', 'bamp', 'bemp', 'beft', 'bimp', 'bist', 'bomp', 'bont', 'boft', 'dend', 'dind', 'dimp', 'dift', 'dond', 'dund', 'famp',
    'faft', 'femp', 'feft', 'fimp', 'fint', 'fift', 'fomp', 'foft', 'fump', 'fuft', 'hamp', 'hift', 'jand', 'jamp', 'jast', 'jaft',
    'jend', 'jemp', 'jeft', 'jind', 'jint', 'jond', 'jomp', 'joft', 'jund', 'juft', 'laft', 'lont', 'mamp', 'maft', 'memp', 'meft',
    'mond', 'momp', 'moft', 'muft', 'namp', 'nemp', 'neft', 'nind', 'nimp', 'nint', 'nomp', 'nost', 'nust', 'pamp', 'paft', 'pemp',
    'peft', 'pift', 'poft', 'puft', 'rast', 'rimp', 'rint', 'rost', 'sast', 'semp', 'sest', 'seft', 'sint', 'somp', 'sost', 'sust',
    'tand', 'tast', 'timp', 'tist', 'tond', 'vand', 'vaft', 'veft', 'vind', 'vimp', 'vist', 'vift', 'vond', 'voft', 'vund', 'vuft',
    'wemp', 'yand', 'yast', 'yant', 'yaft', 'yend', 'yemp', 'yent', 'yeft', 'yind', 'yimp', 'yist', 'yint', 'yift', 'yoft',
    'yund', 'zamp', 'zast', 'zaft', 'zemp', 'zeft', 'zind', 'zimp', 'zist', 'zint', 'zomp', 'zost', 'zust',     'cuft', 'gand', 'gaft', 'gomp', 'goft', 'guft',
  ],
  'magic-e': [
    'bibe', 'fime', 'fipe', 'fube', 'fune', 'fupe', 'hibe', 'hube', 'jike', 'mibe', 'mube', 'mume', 'mupe', 'pabe', 'pibe',
    'pobe', 'rupe', 'sibe', 'sube', 'sume', 'tupe', 'vabe', 'vake', 'vame', 'vime', 'vipe', 'vobe', 'voke', 'vope', 'vube',
    'vuke', 'vume', 'vune', 'vupe', 'vute', 'wibe', 'wobe', 'wube', 'wuke', 'wume', 'wune', 'wute', 'yabe', 'yibe', 'yube', 'yuke',
    'yume', 'yune', 'yupe', 'zabe', 'zibe', 'zube', 'gake', 'gome', 'gube', 'slube', 'sluke', 'slume', 'blape', 'blide', 'blike',
    'bline', 'blipe', 'blube', 'bluke', 'blune', 'stame', 'stike', 'stome', 'stube', 'stume', 'stune', 'frabe', 'fribe', 'frime',
    'frobe', 'frube', 'fruke', 'frume', 'frupe', 'grite', 'grube', 'gruke', 'trabe', 'trobe', 'trube', 'trume',
  ],
  team: [
    'daik', 'feeg', 'feek', 'feep', 'faip', 'heeg', 'haib', 'jeeg', 'leeb', 'leem', 'meeb',     'paib', 'poab', 'saib', 'teeb', 'teeg', 'teep', 'veeb', 'veek', 'veem', 'vaib', 'vaim', 'voab', 'voak',
    'weeg', 'waib', 'woab', 'yeeb', 'yeek', 'yeem', 'yaib', 'yaig', 'yoag', 'yoat', 'zeeg', 'zaib', 'zoam',     'gaik', 'goam', 'bleeg', 'bleem', 'blaip', 'sleeb', 'sleeg', 'sleem', 'sloak', 'steeb', 'staim', 'stoam', 'treeb',
    'treeg', 'treem', 'treep', 'traib', 'traig', 'troab', 'troak', 'greem', 'graik', 'freeb', 'freem',
    'freen', 'freep', 'fraib', 'froab',
  ],
  r: [
    'barg', 'barp', 'borp', 'darb', 'darm', 'darp', 'dorb', 'dorg', 'dirb', 'dirg', 'durb', 'durg', 'farb', 'farg', 'forp',
    'firp', 'furp', 'harg', 'hirg', 'hurg', 'jark', 'jarm', 'jarp', 'larm', 'lart', 'lorb', 'lorm', 'lort',
    'lirb', 'lirm', 'lirt', 'lurb', 'lurm', 'lurt', 'marb', 'marn', 'marp', 'morb', 'morm', 'morp', 'mirb',
    'mirm', 'mirp', 'murb', 'murm', 'murp', 'narb', 'narg', 'narm', 'narp', 'nart', 'norb', 'norg', 'norp', 'nort', 'nirb', 'nirg',
    'nirp', 'nirt', 'nurb', 'nurg', 'nurp', 'nurt', 'parb', 'parg', 'parn', 'porb', 'porp', 'pirb', 'pirg', 'pirp',
    'purb', 'purg', 'rarb', 'rarg', 'rark', 'rarn', 'rarp', 'rart', 'rorb', 'rorg', 'rork', 'rorn', 'rorp', 'rirb', 'rirg',
    'rirk', 'rirn', 'rirp', 'rirt', 'rurb', 'rurg', 'rurk', 'rurn', 'rurp', 'rurt', 'sarb', 'sarg', 'sarm', 'sarn', 'sarp', 'sorg',
    'sorm', 'sorp', 'sirg', 'sirm', 'sirp', 'surg', 'surm', 'surp', 'tarb', 'targ', 'tark', 'tarm', 'torb', 'torg', 'tirb', 'tirg',
    'turg', 'varb', 'varg', 'vark', 'varm', 'varn', 'varp', 'vart', 'vorg', 'vork', 'vorm', 'vorp', 'vird', 'virk', 'virm',
    'virp', 'vurd', 'vurg', 'vurk', 'vurm', 'vurp', 'warb', 'worb', 'worg', 'wirb', 'wirg', 'wurb', 'wurg', 'yarg', 'yarp', 'yart',
    'yorb', 'yorg', 'yort', 'yirb', 'yirg', 'yurb', 'yurg', 'zarb', 'zard', 'zarg', 'zarm', 'zarn', 'zart', 'zorg', 'zorm', 'zorp',
    'zirg', 'zirk', 'zirm', 'zirp', 'zurk', 'zurm', 'zurp', 'carg', 'corg', 'curg', 'garg', 'gark', 'garm', 'gort',
    'gurg',
  ],
};
