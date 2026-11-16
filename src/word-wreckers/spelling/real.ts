// Real words that a wrong spelling could accidentally be. Made by checking every wrong spelling the game can make against a
// dictionary (macOS's /usr/share/dict/words, which is generous: it has kat, boll and seel), plus modern and slang words it lacks. A
// test re-checks wherever a dictionary is installed. A wrong spelling on this list is never shown.
const FROM_DICTIONARY = [
  'ail', 'aint', 'ake', 'am', 'ame', 'amp', 'an', 'and', 'ape', 'ar', 'ark', 'arn', 'at', 'ave', 'ay', 'ba', 'back', 'bah', 'bain',
  'ban', 'bar', 'bark', 'barm', 'bas', 'bate', 'bathe', 'batt', 'bay', 'be', 'bea', 'beach', 'beek', 'beg', 'ben', 'bern', 'bice',
  'bick', 'bid', 'bigg', 'bin', 'birn', 'blay', 'blo', 'bo', 'boa', 'bog', 'boll', 'bon', 'bond', 'bot', 'bote', 'bow', 'bran',
  'brash', 'bream', 'breck', 'brin', 'bu', 'buck', 'buff', 'bun', 'bur', 'burd', 'bush', 'buss', 'but', 'ca', 'cab', 'cad', 'cain',
  'cam', 'cane', 'cape', 'care', 'carr', 'cate', 'chai', 'chane', 'check', 'chen', 'chi', 'chic', 'chine', 'cho', 'chob', 'clep',
  'coan', 'coe', 'come', 'con', 'coot', 'cop', 'cor', 'corm', 'cot', 'cote', 'cud', 'cue', 'cur', 'curch', 'cut', 'da', 'dag',
  'darn', 'deg', 'dess', 'di', 'dird', 'dis', 'disk', 'dit', 'dive', 'do', 'doat', 'doge', 'dol', 'done', 'drain', 'dram', 'dug',
  'dull', 'dum', 'durn', 'each', 'ed', 'en', 'fam', 'far', 'fen', 'fie', 'firn', 'fist', 'flue', 'fo', 'for', 'fro', 'fug', 'fute',
  'gab', 'gam', 'gane', 'gape', 'gat', 'gif', 'gil', 'git', 'goa', 'got', 'gote', 'gra', 'grad', 'graip', 'gree', 'grub', 'gruss',
  'gurl', 'ha', 'had', 'hag', 'hain', 'han', 'hark', 'harp', 'hate', 'hatt', 'he', 'hem', 'hick', 'hin', 'hip', 'hoe', 'hon',
  'hone', 'hop', 'how', 'hu', 'huge', 'ich', 'id', 'ide', 'ike', 'ilk', 'ill', 'in', 'ing', 'it', 'jete', 'joe', 'kan', 'kat',
  'kate', 'keck', 'ked', 'kin', 'kit', 'klip', 'kunk', 'kyte', 'lace', 'lack', 'lag', 'lak', 'lam', 'lamb', 'lant', 'lap', 'lay',
  'lea', 'led', 'leep', 'li', 'lide', 'lo', 'lobe', 'loge', 'longe', 'low', 'luc', 'lug', 'lump', 'lung', 'lute', 'ma', 'mab',
  'mad', 'mail', 'mart', 'met', 'mil', 'mile', 'mine', 'mo', 'mob', 'moke', 'mope', 'mot', 'mote', 'mu', 'mudd', 'muth', 'nae',
  'naim', 'nake', 'nam', 'nane', 'nap', 'nat', 'ne', 'nete', 'nick', 'nil', 'nit', 'not', 'now', 'nowt', 'nu', 'oast', 'oat',
  'ock', 'og', 'one', 'ope', 'ox', 'pa', 'pain', 'pam', 'pane', 'pant', 'par', 'pay', 'peak', 'pech', 'peg', 'pi', 'pim', 'pine',
  'pint', 'plan', 'plat', 'ply', 'po', 'pod', 'pon', 'port', 'pote', 'pott', 'pray', 'pug', 'pun', 'put', 'ra', 'rab', 'rain',
  'rame', 'ran', 'rape', 'rate', 'ream', 'ree', 'reen', 'ribe', 'ric', 'rick', 'rid', 'rie', 'rip', 'rive', 'robe', 'roc', 'roe',
  'rog', 'rok', 'row', 'ruck', 'rum', 'rune', 'rush', 'rut', 'sail', 'sake', 'sal', 'sap', 'sar', 'sark', 'sart', 'sate', 'scar',
  'sea', 'seak', 'seel', 'seep', 'sele', 'sell', 'set', 'shap', 'she', 'shee', 'shel', 'shi', 'shill', 'shin', 'sho', 'shoa',
  'shor', 'shot', 'shrip', 'si', 'sick', 'side', 'sile', 'sim', 'sin', 'sine', 'sip', 'site', 'skat', 'skit', 'skun', 'sleb',
  'slee', 'slid', 'slipe', 'snab', 'snape', 'snoke', 'snup', 'soc', 'sog', 'sok', 'soke', 'son', 'sop', 'sope', 'sort', 'sow',
  'spak', 'spay', 'spine', 'spor', 'spot', 'spry', 'stare', 'stob', 'stope', 'stree', 'stret', 'suck', 'sung', 'sunk', 'tab',
  'tae', 'tain', 'tap', 'tar', 'tart', 'te', 'tee', 'teet', 'teethe', 'teth', 'thee', 'tick', 'tin', 'tint', 'tip', 'toat', 'tone',
  'top', 'tost', 'track', 'tran', 'tri', 'trin', 'tripe', 'tu', 'tuck', 'tue', 'ud', 'ug', 'ump', 'un', 'up', 'urn', 'us', 'ut',
  'ute', 'vane', 'we', 'wed', 'wig', 'wim', 'win', 'yan', 'yar', 'yarm',
];
const NOT_IN_IT = ['birb', 'bruh', 'dat', 'dis', 'dem', 'skank', 'fux', 'lite', 'nite', 'kool', 'tho', 'bro', 'bae', 'emo', 'dude', 'yup', 'nope', 'duh', 'meh', 'nah', 'yay', 'ok', 'app', 'vape', 'meme', 'blog'];
export const REAL_WORDS: ReadonlySet<string> = new Set<string>([...FROM_DICTIONARY, ...NOT_IN_IT]);
