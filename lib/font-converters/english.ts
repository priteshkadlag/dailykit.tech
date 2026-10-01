/**
 * British ⇄ American spelling. Word families are generated from stems so that
 * inflections (colours, organised, travelling…) are covered; case is preserved.
 * Pairs marked one-way are converted UK → US only, because the American word is
 * also correct British English in another sense (check/cheque, program, tire).
 */

const OUR = ["arbour", "ardour", "armour", "behaviour", "candour", "clamour", "colour", "demeanour", "endeavour", "favour", "fervour", "flavour", "harbour", "honour", "humour", "labour", "neighbour", "odour", "parlour", "rancour", "rigour", "rumour", "saviour", "savour", "splendour", "tumour", "valour", "vapour", "vigour"]
  .map((word) => word.slice(0, -3));
const OUR_SUFFIXES = ["", "s", "ed", "ing", "ful", "fully", "less", "able", "ably", "ite", "ites", "er", "ers", "hood", "hoods", "ly", "y"];

const ISE = ["agonis", "apologis", "authoris", "baptis", "capitalis", "categoris", "centralis", "characteris", "civilis", "colonis", "commercialis", "criticis", "customis", "digitalis", "emphasis", "energis", "equalis", "familiaris", "fertilis", "finalis", "globalis", "harmonis", "hospitalis", "idealis", "immunis", "industrialis", "itemis", "legalis", "localis", "maximis", "memoris", "minimis", "mobilis", "modernis", "monetis", "moralis", "nationalis", "neutralis", "normalis", "optimis", "organis", "patronis", "penalis", "personalis", "popularis", "prioritis", "privatis", "publicis", "realis", "recognis", "revolutionis", "sanitis", "scrutinis", "sensitis", "socialis", "specialis", "stabilis", "standardis", "sterilis", "summaris", "symbolis", "sympathis", "synchronis", "synthesis", "terroris", "theoris", "trivialis", "urbanis", "utilis", "vaporis", "verbalis", "victimis", "visualis", "vocalis"];
const ISE_SUFFIXES = ["e", "es", "ed", "ing", "er", "ers", "ation", "ations", "able"];

const RE = ["centre", "fibre", "litre", "lustre", "meagre", "metre", "calibre", "sabre", "sceptre", "sombre", "spectre", "theatre", "kilometre", "centimetre", "millimetre"];

const DOUBLED_L = ["travel", "cancel", "label", "model", "fuel", "counsel", "signal", "channel", "level", "marvel", "tunnel", "quarrel", "total", "dial", "duel", "equal", "jewel", "libel", "pedal", "rival", "shovel", "snorkel", "yodel", "grovel", "revel", "swivel", "tassel"];

/** Two-way pairs [UK, US]. */
const PAIRS: [string, string][] = [
  ["defence", "defense"], ["offence", "offense"], ["pretence", "pretense"], ["analyse", "analyze"], ["analysed", "analyzed"], ["analyses", "analyzes"], ["analysing", "analyzing"],
  ["paralyse", "paralyze"], ["paralysed", "paralyzed"], ["catalyse", "catalyze"], ["breathalyse", "breathalyze"],
  ["catalogue", "catalog"], ["catalogues", "catalogs"], ["grey", "gray"], ["greys", "grays"], ["greyish", "grayish"], ["aluminium", "aluminum"], ["jewellery", "jewelry"],
  ["plough", "plow"], ["ploughs", "plows"], ["ploughed", "plowed"], ["moustache", "mustache"], ["pyjamas", "pajamas"], ["sceptic", "skeptic"], ["sceptical", "skeptical"], ["scepticism", "skepticism"],
  ["enrol", "enroll"], ["enrols", "enrolls"], ["enrolment", "enrollment"], ["fulfil", "fulfill"], ["fulfils", "fulfills"], ["fulfilment", "fulfillment"], ["instil", "instill"], ["distil", "distill"],
  ["skilful", "skillful"], ["skilfully", "skillfully"], ["wilful", "willful"], ["instalment", "installment"], ["ageing", "aging"], ["judgement", "judgment"], ["acknowledgement", "acknowledgment"],
  ["paediatric", "pediatric"], ["paediatrician", "pediatrician"], ["anaemia", "anemia"], ["anaemic", "anemic"], ["anaesthetic", "anesthetic"], ["encyclopaedia", "encyclopedia"], ["haemoglobin", "hemoglobin"],
  ["oestrogen", "estrogen"], ["foetus", "fetus"], ["oesophagus", "esophagus"], ["diarrhoea", "diarrhea"], ["orthopaedic", "orthopedic"], ["leukaemia", "leukemia"],
  ["cosy", "cozy"], ["doughnut", "donut"], ["mould", "mold"], ["moulds", "molds"], ["mouldy", "moldy"], ["smoulder", "smolder"], ["woollen", "woolen"], ["sulphur", "sulfur"],
  ["cheque", "check"], ["cheques", "checks"], ["chequebook", "checkbook"], ["tyre", "tire"], ["tyres", "tires"], ["programme", "program"], ["programmes", "programs"],
  ["practise", "practice"], ["practised", "practiced"], ["practising", "practicing"], ["licence", "license"], ["licences", "licenses"], ["kerb", "curb"], ["storey", "story"], ["storeys", "stories"],
  ["draught", "draft"], ["draughts", "drafts"], ["gaol", "jail"], ["manoeuvre", "maneuver"], ["manoeuvres", "maneuvers"], ["manoeuvred", "maneuvered"], ["manoeuvring", "maneuvering"], ["artefact", "artifact"], ["artefacts", "artifacts"],
  ["axe", "ax"], ["dialogue", "dialog"], ["analogue", "analog"], ["whilst", "while"], ["amongst", "among"], ["learnt", "learned"], ["spelt", "spelled"], ["dreamt", "dreamed"],
];
/** UK spellings that only convert one way (the US form is also a different British word, or both forms are British). */
const ONE_WAY = new Set(["cheque", "cheques", "chequebook", "tyre", "tyres", "programme", "programmes", "practise", "practised", "practising", "licence", "licences", "kerb", "storey", "storeys", "draught", "draughts", "gaol", "axe", "dialogue", "analogue", "whilst", "amongst", "learnt", "spelt", "dreamt"]);

function buildPairs(): [string, string][] {
  const pairs: [string, string][] = [...PAIRS];
  for (const stem of OUR) for (const suffix of OUR_SUFFIXES) pairs.push([`${stem}our${suffix}`, `${stem}or${suffix}`]);
  // organis + ed → organised / organized
  for (const stem of ISE) for (const suffix of ISE_SUFFIXES) pairs.push([`${stem}${suffix}`, `${stem.slice(0, -1)}z${suffix}`]);
  for (const word of RE) pairs.push([word, word.replace(/re$/, "er")], [`${word}s`, `${word.replace(/re$/, "er")}s`]);
  for (const stem of DOUBLED_L) for (const suffix of ["led", "ling", "ler", "lers"]) pairs.push([`${stem}${suffix}`, `${stem}${suffix.slice(1)}`]);
  return pairs;
}

const ALL = buildPairs();
const UK_TO_US = new Map(ALL);
const US_TO_UK = new Map(ALL.filter(([uk]) => !ONE_WAY.has(uk)).map(([uk, us]) => [us, uk]));

function matchCase(source: string, target: string) {
  if (source === source.toUpperCase() && source.length > 1) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return target[0].toUpperCase() + target.slice(1);
  return target;
}

function convert(input: string, map: Map<string, string>) {
  let changes = 0;
  const text = input.replace(/[A-Za-z]+/g, (word) => {
    const replacement = map.get(word.toLowerCase());
    if (!replacement) return word;
    changes++;
    return matchCase(word, replacement);
  });
  return { text, changes };
}

export const ukToUs = (input: string) => convert(input, UK_TO_US);
export const usToUk = (input: string) => convert(input, US_TO_UK);
