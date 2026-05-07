// compare-data.js — built-in perceptual concept programs for the Compare game type.
//
// Each program: id, canScale, question2, questionMulti, correctLabel2, correctLabelMulti,
//               tiles[], stages[], renderTile(tileData, container, color).
//
// Programs with canScale:true support field sizes 2–6.
// Programs with canScale:false are always 2 tiles.
// Programs with dynamicTiles:true generate their tiles/stages at runtime from user programs.
//
// Stage arrays are shared across symmetric program pairs (bigger/smaller share tile IDs xs–xxl,
// just with different correct values).

// ── Shared stage arrays ──────────────────────────────────────────────────────

// xs/sm/md/lg/xl/xxl pool — correct = xxl (biggest, tallest, widest, etc.)
const _s6up = [
    // 2-tile
    { tiles: ['xs',  'xxl'],                         correct: 'xxl' },
    { tiles: ['sm',  'xxl'],                         correct: 'xxl' },
    { tiles: ['xs',  'xl'],                          correct: 'xl'  },
    { tiles: ['md',  'xxl'],                         correct: 'xxl' },
    { tiles: ['xs',  'lg'],                          correct: 'lg'  },
    { tiles: ['sm',  'xl'],                          correct: 'xl'  },
    { tiles: ['md',  'xl'],                          correct: 'xl'  },
    { tiles: ['lg',  'xxl'],                         correct: 'xxl' },
    // 3-tile
    { tiles: ['xs',  'sm',  'xxl'],                  correct: 'xxl' },
    { tiles: ['xs',  'md',  'xxl'],                  correct: 'xxl' },
    { tiles: ['sm',  'lg',  'xxl'],                  correct: 'xxl' },
    { tiles: ['xs',  'lg',  'xxl'],                  correct: 'xxl' },
    { tiles: ['md',  'xl',  'xxl'],                  correct: 'xxl' },
    { tiles: ['xs',  'xl',  'xxl'],                  correct: 'xxl' },
    { tiles: ['xs',  'sm',  'xl'],                   correct: 'xl'  },
    { tiles: ['sm',  'md',  'xxl'],                  correct: 'xxl' },
    // 4-tile
    { tiles: ['xs',  'sm',  'md',  'xxl'],           correct: 'xxl' },
    { tiles: ['xs',  'sm',  'lg',  'xxl'],           correct: 'xxl' },
    { tiles: ['xs',  'md',  'lg',  'xxl'],           correct: 'xxl' },
    { tiles: ['sm',  'md',  'xl',  'xxl'],           correct: 'xxl' },
    { tiles: ['xs',  'lg',  'xl',  'xxl'],           correct: 'xxl' },
    { tiles: ['xs',  'sm',  'xl',  'xxl'],           correct: 'xxl' },
    { tiles: ['md',  'lg',  'xl',  'xxl'],           correct: 'xxl' },
    { tiles: ['xs',  'sm',  'md',  'xl'],            correct: 'xl'  },
    // 5-tile
    { tiles: ['xs',  'sm',  'md',  'lg',  'xxl'],   correct: 'xxl' },
    { tiles: ['xs',  'sm',  'md',  'xl',  'xxl'],   correct: 'xxl' },
    { tiles: ['xs',  'sm',  'lg',  'xl',  'xxl'],   correct: 'xxl' },
    { tiles: ['xs',  'md',  'lg',  'xl',  'xxl'],   correct: 'xxl' },
    { tiles: ['sm',  'md',  'lg',  'xl',  'xxl'],   correct: 'xxl' },
    // 6-tile
    { tiles: ['xs',  'sm',  'md',  'lg',  'xl',  'xxl'], correct: 'xxl' },
];

// xs/sm/md/lg/xl/xxl pool — correct = xs (smallest, shortest, narrowest, etc.)
const _s6dn = [
    // 2-tile
    { tiles: ['xs',  'xxl'],                         correct: 'xs'  },
    { tiles: ['sm',  'xxl'],                         correct: 'sm'  },
    { tiles: ['xs',  'xl'],                          correct: 'xs'  },
    { tiles: ['md',  'xxl'],                         correct: 'md'  },
    { tiles: ['xs',  'lg'],                          correct: 'xs'  },
    { tiles: ['sm',  'xl'],                          correct: 'sm'  },
    { tiles: ['md',  'xl'],                          correct: 'md'  },
    { tiles: ['lg',  'xxl'],                         correct: 'lg'  },
    // 3-tile
    { tiles: ['xs',  'sm',  'xxl'],                  correct: 'xs'  },
    { tiles: ['xs',  'md',  'xxl'],                  correct: 'xs'  },
    { tiles: ['sm',  'lg',  'xxl'],                  correct: 'sm'  },
    { tiles: ['xs',  'lg',  'xxl'],                  correct: 'xs'  },
    { tiles: ['md',  'xl',  'xxl'],                  correct: 'md'  },
    { tiles: ['xs',  'xl',  'xxl'],                  correct: 'xs'  },
    { tiles: ['xs',  'sm',  'xl'],                   correct: 'xs'  },
    { tiles: ['sm',  'md',  'xxl'],                  correct: 'sm'  },
    // 4-tile
    { tiles: ['xs',  'sm',  'md',  'xxl'],           correct: 'xs'  },
    { tiles: ['xs',  'sm',  'lg',  'xxl'],           correct: 'xs'  },
    { tiles: ['xs',  'md',  'lg',  'xxl'],           correct: 'xs'  },
    { tiles: ['sm',  'md',  'xl',  'xxl'],           correct: 'sm'  },
    { tiles: ['xs',  'lg',  'xl',  'xxl'],           correct: 'xs'  },
    { tiles: ['xs',  'sm',  'xl',  'xxl'],           correct: 'xs'  },
    { tiles: ['md',  'lg',  'xl',  'xxl'],           correct: 'md'  },
    { tiles: ['xs',  'sm',  'md',  'xl'],            correct: 'xs'  },
    // 5-tile
    { tiles: ['xs',  'sm',  'md',  'lg',  'xxl'],   correct: 'xs'  },
    { tiles: ['xs',  'sm',  'md',  'xl',  'xxl'],   correct: 'xs'  },
    { tiles: ['xs',  'sm',  'lg',  'xl',  'xxl'],   correct: 'xs'  },
    { tiles: ['xs',  'md',  'lg',  'xl',  'xxl'],   correct: 'xs'  },
    { tiles: ['sm',  'md',  'lg',  'xl',  'xxl'],   correct: 'sm'  },
    // 6-tile
    { tiles: ['xs',  'sm',  'md',  'lg',  'xl',  'xxl'], correct: 'xs'  },
];

// vlt/lt/md/dk/vdk/xdk pool — correct = vlt (lightest)
const _sLtUp = [
    // 2-tile
    { tiles: ['vlt', 'xdk'],                         correct: 'vlt' },
    { tiles: ['vlt', 'vdk'],                         correct: 'vlt' },
    { tiles: ['lt',  'xdk'],                         correct: 'lt'  },
    { tiles: ['vlt', 'dk'],                          correct: 'vlt' },
    { tiles: ['lt',  'vdk'],                         correct: 'lt'  },
    { tiles: ['md',  'xdk'],                         correct: 'md'  },
    { tiles: ['vlt', 'md'],                          correct: 'vlt' },
    { tiles: ['lt',  'dk'],                          correct: 'lt'  },
    // 3-tile
    { tiles: ['vlt', 'lt',  'xdk'],                  correct: 'vlt' },
    { tiles: ['vlt', 'md',  'xdk'],                  correct: 'vlt' },
    { tiles: ['vlt', 'dk',  'xdk'],                  correct: 'vlt' },
    { tiles: ['lt',  'md',  'xdk'],                  correct: 'lt'  },
    { tiles: ['lt',  'dk',  'xdk'],                  correct: 'lt'  },
    { tiles: ['vlt', 'lt',  'vdk'],                  correct: 'vlt' },
    { tiles: ['vlt', 'lt',  'dk'],                   correct: 'vlt' },
    { tiles: ['lt',  'md',  'vdk'],                  correct: 'lt'  },
    // 4-tile
    { tiles: ['vlt', 'lt',  'md',  'xdk'],           correct: 'vlt' },
    { tiles: ['vlt', 'lt',  'dk',  'xdk'],           correct: 'vlt' },
    { tiles: ['vlt', 'md',  'dk',  'xdk'],           correct: 'vlt' },
    { tiles: ['lt',  'md',  'dk',  'xdk'],           correct: 'lt'  },
    { tiles: ['vlt', 'lt',  'md',  'vdk'],           correct: 'vlt' },
    { tiles: ['vlt', 'lt',  'vdk', 'xdk'],           correct: 'vlt' },
    { tiles: ['lt',  'md',  'vdk', 'xdk'],           correct: 'lt'  },
    { tiles: ['vlt', 'md',  'vdk', 'xdk'],           correct: 'vlt' },
    // 5-tile
    { tiles: ['vlt', 'lt',  'md',  'dk',  'xdk'],   correct: 'vlt' },
    { tiles: ['vlt', 'lt',  'md',  'vdk', 'xdk'],   correct: 'vlt' },
    { tiles: ['vlt', 'lt',  'dk',  'vdk', 'xdk'],   correct: 'vlt' },
    { tiles: ['vlt', 'md',  'dk',  'vdk', 'xdk'],   correct: 'vlt' },
    { tiles: ['lt',  'md',  'dk',  'vdk', 'xdk'],   correct: 'lt'  },
    // 6-tile
    { tiles: ['vlt', 'lt',  'md',  'dk',  'vdk', 'xdk'], correct: 'vlt' },
];

// vlt/lt/md/dk/vdk/xdk pool — correct = xdk (darkest)
const _sLtDn = [
    // 2-tile
    { tiles: ['vlt', 'xdk'],                         correct: 'xdk' },
    { tiles: ['vlt', 'vdk'],                         correct: 'vdk' },
    { tiles: ['lt',  'xdk'],                         correct: 'xdk' },
    { tiles: ['vlt', 'dk'],                          correct: 'dk'  },
    { tiles: ['lt',  'vdk'],                         correct: 'vdk' },
    { tiles: ['md',  'xdk'],                         correct: 'xdk' },
    { tiles: ['vlt', 'md'],                          correct: 'md'  },
    { tiles: ['lt',  'dk'],                          correct: 'dk'  },
    // 3-tile
    { tiles: ['vlt', 'lt',  'xdk'],                  correct: 'xdk' },
    { tiles: ['vlt', 'md',  'xdk'],                  correct: 'xdk' },
    { tiles: ['vlt', 'dk',  'xdk'],                  correct: 'xdk' },
    { tiles: ['lt',  'md',  'xdk'],                  correct: 'xdk' },
    { tiles: ['lt',  'dk',  'xdk'],                  correct: 'xdk' },
    { tiles: ['vlt', 'lt',  'vdk'],                  correct: 'vdk' },
    { tiles: ['vlt', 'lt',  'dk'],                   correct: 'dk'  },
    { tiles: ['md',  'dk',  'xdk'],                  correct: 'xdk' },
    // 4-tile
    { tiles: ['vlt', 'lt',  'md',  'xdk'],           correct: 'xdk' },
    { tiles: ['vlt', 'lt',  'dk',  'xdk'],           correct: 'xdk' },
    { tiles: ['vlt', 'md',  'dk',  'xdk'],           correct: 'xdk' },
    { tiles: ['lt',  'md',  'dk',  'xdk'],           correct: 'xdk' },
    { tiles: ['vlt', 'lt',  'md',  'vdk'],           correct: 'vdk' },
    { tiles: ['vlt', 'lt',  'vdk', 'xdk'],           correct: 'xdk' },
    { tiles: ['lt',  'md',  'vdk', 'xdk'],           correct: 'xdk' },
    { tiles: ['md',  'dk',  'vdk', 'xdk'],           correct: 'xdk' },
    // 5-tile
    { tiles: ['vlt', 'lt',  'md',  'dk',  'xdk'],   correct: 'xdk' },
    { tiles: ['vlt', 'lt',  'md',  'vdk', 'xdk'],   correct: 'xdk' },
    { tiles: ['vlt', 'lt',  'dk',  'vdk', 'xdk'],   correct: 'xdk' },
    { tiles: ['vlt', 'md',  'dk',  'vdk', 'xdk'],   correct: 'xdk' },
    { tiles: ['lt',  'md',  'dk',  'vdk', 'xdk'],   correct: 'xdk' },
    // 6-tile
    { tiles: ['vlt', 'lt',  'md',  'dk',  'vdk', 'xdk'], correct: 'xdk' },
];

// n1/n2/n3/n4 dot pool — correct = n4 (most), max 4-tile stages
const _sMrUp = [
    { tiles: ['n1', 'n4'],             correct: 'n4' },
    { tiles: ['n1', 'n3'],             correct: 'n3' },
    { tiles: ['n2', 'n4'],             correct: 'n4' },
    { tiles: ['n1', 'n2'],             correct: 'n2' },
    { tiles: ['n3', 'n4'],             correct: 'n4' },
    { tiles: ['n2', 'n3'],             correct: 'n3' },
    { tiles: ['n1', 'n2', 'n4'],       correct: 'n4' },
    { tiles: ['n1', 'n3', 'n4'],       correct: 'n4' },
    { tiles: ['n2', 'n3', 'n4'],       correct: 'n4' },
    { tiles: ['n1', 'n2', 'n3'],       correct: 'n3' },
    { tiles: ['n1', 'n2', 'n3', 'n4'], correct: 'n4' },
];

// n1/n2/n3/n4 dot pool — correct = n1 (fewest)
const _sMrDn = [
    { tiles: ['n1', 'n4'],             correct: 'n1' },
    { tiles: ['n1', 'n3'],             correct: 'n1' },
    { tiles: ['n2', 'n4'],             correct: 'n2' },
    { tiles: ['n1', 'n2'],             correct: 'n1' },
    { tiles: ['n3', 'n4'],             correct: 'n3' },
    { tiles: ['n2', 'n3'],             correct: 'n2' },
    { tiles: ['n1', 'n2', 'n4'],       correct: 'n1' },
    { tiles: ['n1', 'n3', 'n4'],       correct: 'n1' },
    { tiles: ['n2', 'n3', 'n4'],       correct: 'n2' },
    { tiles: ['n1', 'n2', 'n3'],       correct: 'n1' },
    { tiles: ['n1', 'n2', 'n3', 'n4'], correct: 'n1' },
];

// polygons + circles — correct = polygon (has edges)
const _sEdge = [
    // 2-tile
    { tiles: ['square',   'c1'],                               correct: 'square'   },
    { tiles: ['square',   'c2'],                               correct: 'square'   },
    { tiles: ['triangle', 'c1'],                               correct: 'triangle' },
    { tiles: ['triangle', 'c3'],                               correct: 'triangle' },
    { tiles: ['pentagon', 'c2'],                               correct: 'pentagon' },
    { tiles: ['pentagon', 'c4'],                               correct: 'pentagon' },
    { tiles: ['hexagon',  'c1'],                               correct: 'hexagon'  },
    { tiles: ['diamond',  'c3'],                               correct: 'diamond'  },
    // 3-tile
    { tiles: ['square',   'c1', 'c2'],                         correct: 'square'   },
    { tiles: ['triangle', 'c1', 'c3'],                         correct: 'triangle' },
    { tiles: ['pentagon', 'c2', 'c4'],                         correct: 'pentagon' },
    { tiles: ['hexagon',  'c1', 'c5'],                         correct: 'hexagon'  },
    { tiles: ['diamond',  'c2', 'c3'],                         correct: 'diamond'  },
    { tiles: ['square',   'c3', 'c5'],                         correct: 'square'   },
    { tiles: ['triangle', 'c2', 'c4'],                         correct: 'triangle' },
    { tiles: ['pentagon', 'c1', 'c5'],                         correct: 'pentagon' },
    // 4-tile
    { tiles: ['square',   'c1', 'c2', 'c3'],                   correct: 'square'   },
    { tiles: ['triangle', 'c1', 'c2', 'c4'],                   correct: 'triangle' },
    { tiles: ['pentagon', 'c1', 'c3', 'c5'],                   correct: 'pentagon' },
    { tiles: ['hexagon',  'c2', 'c3', 'c4'],                   correct: 'hexagon'  },
    { tiles: ['diamond',  'c1', 'c4', 'c5'],                   correct: 'diamond'  },
    { tiles: ['square',   'c2', 'c4', 'c5'],                   correct: 'square'   },
    // 5-tile
    { tiles: ['square',   'c1', 'c2', 'c3', 'c4'],             correct: 'square'   },
    { tiles: ['triangle', 'c1', 'c2', 'c3', 'c5'],             correct: 'triangle' },
    { tiles: ['pentagon', 'c1', 'c2', 'c4', 'c5'],             correct: 'pentagon' },
    { tiles: ['hexagon',  'c1', 'c3', 'c4', 'c5'],             correct: 'hexagon'  },
    { tiles: ['diamond',  'c2', 'c3', 'c4', 'c5'],             correct: 'diamond'  },
    // 6-tile
    { tiles: ['square',   'c1', 'c2', 'c3', 'c4', 'c5'],       correct: 'square'   },
    { tiles: ['triangle', 'c1', 'c2', 'c3', 'c4', 'c5'],       correct: 'triangle' },
    { tiles: ['pentagon', 'c1', 'c2', 'c3', 'c4', 'c5'],       correct: 'pentagon' },
];

// circles + polygons — correct = circle (has no edges)
const _sNoEdge = [
    // 2-tile
    { tiles: ['c1', 'square'],                                  correct: 'c1' },
    { tiles: ['c2', 'triangle'],                                correct: 'c2' },
    { tiles: ['c3', 'pentagon'],                                correct: 'c3' },
    { tiles: ['c4', 'hexagon'],                                 correct: 'c4' },
    { tiles: ['c5', 'square'],                                  correct: 'c5' },
    { tiles: ['c1', 'triangle'],                                correct: 'c1' },
    { tiles: ['c2', 'diamond'],                                 correct: 'c2' },
    { tiles: ['c3', 'hexagon'],                                 correct: 'c3' },
    // 3-tile
    { tiles: ['c1', 'square',   'triangle'],                    correct: 'c1' },
    { tiles: ['c2', 'square',   'pentagon'],                    correct: 'c2' },
    { tiles: ['c3', 'triangle', 'hexagon'],                     correct: 'c3' },
    { tiles: ['c4', 'pentagon', 'diamond'],                     correct: 'c4' },
    { tiles: ['c5', 'square',   'hexagon'],                     correct: 'c5' },
    { tiles: ['c1', 'triangle', 'diamond'],                     correct: 'c1' },
    // 4-tile
    { tiles: ['c1', 'square',   'triangle', 'pentagon'],        correct: 'c1' },
    { tiles: ['c2', 'square',   'triangle', 'hexagon'],         correct: 'c2' },
    { tiles: ['c3', 'square',   'pentagon', 'diamond'],         correct: 'c3' },
    { tiles: ['c4', 'triangle', 'hexagon',  'diamond'],         correct: 'c4' },
    { tiles: ['c5', 'square',   'triangle', 'diamond'],         correct: 'c5' },
    // 5-tile
    { tiles: ['c1', 'square', 'triangle', 'pentagon', 'hexagon'], correct: 'c1' },
    { tiles: ['c2', 'square', 'triangle', 'pentagon', 'diamond'], correct: 'c2' },
    { tiles: ['c3', 'square', 'triangle', 'hexagon',  'diamond'], correct: 'c3' },
    { tiles: ['c4', 'square', 'pentagon', 'hexagon',  'diamond'], correct: 'c4' },
    // 6-tile
    { tiles: ['c1', 'square', 'triangle', 'pentagon', 'hexagon', 'diamond'], correct: 'c1' },
    { tiles: ['c2', 'square', 'triangle', 'pentagon', 'hexagon', 'diamond'], correct: 'c2' },
];

// whole/half shapes — correct = whole tile
const _sWhole = [
    { tiles: ['circle-w', 'circle-h'], correct: 'circle-w' },
    { tiles: ['square-w', 'square-h'], correct: 'square-w' },
    { tiles: ['circle-w', 'square-h'], correct: 'circle-w' },
    { tiles: ['square-w', 'circle-h'], correct: 'square-w' },
];

// whole/half shapes — correct = half tile
const _sHalf = [
    { tiles: ['circle-w', 'circle-h'], correct: 'circle-h' },
    { tiles: ['square-w', 'square-h'], correct: 'square-h' },
    { tiles: ['circle-w', 'square-h'], correct: 'square-h' },
    { tiles: ['square-w', 'circle-h'], correct: 'circle-h' },
];

// number/letter chars — correct = number tile
const _sNumber = [
    { tiles: ['n5', 'la'], correct: 'n5' },
    { tiles: ['n8', 'lg'], correct: 'n8' },
    { tiles: ['n3', 'lm'], correct: 'n3' },
    { tiles: ['n5', 'lg'], correct: 'n5' },
    { tiles: ['n8', 'lm'], correct: 'n8' },
    { tiles: ['n3', 'la'], correct: 'n3' },
];

// number/letter chars — correct = letter tile
const _sLetter = [
    { tiles: ['n5', 'la'], correct: 'la' },
    { tiles: ['n8', 'lg'], correct: 'lg' },
    { tiles: ['n3', 'lm'], correct: 'lm' },
    { tiles: ['n5', 'lg'], correct: 'lg' },
    { tiles: ['n8', 'lm'], correct: 'lm' },
    { tiles: ['n3', 'la'], correct: 'la' },
];

// above/below positions — correct = above tile
const _sAbove = [
    { tiles: ['above-c', 'below-c'], correct: 'above-c' },
    { tiles: ['above-s', 'below-s'], correct: 'above-s' },
    { tiles: ['above-c', 'below-s'], correct: 'above-c' },
    { tiles: ['above-s', 'below-c'], correct: 'above-s' },
];

// above/below positions — correct = below tile
const _sBelow = [
    { tiles: ['above-c', 'below-c'], correct: 'below-c' },
    { tiles: ['above-s', 'below-s'], correct: 'below-s' },
    { tiles: ['above-c', 'below-s'], correct: 'below-s' },
    { tiles: ['above-s', 'below-c'], correct: 'below-c' },
];

// ── Shared tile pools ────────────────────────────────────────────────────────

const _t6 = [   // xs–xxl for square/circle size programs
    { id: 'xs',  pct: 10 }, { id: 'sm', pct: 22 }, { id: 'md', pct: 36 },
    { id: 'lg',  pct: 54 }, { id: 'xl', pct: 72 }, { id: 'xxl', pct: 88 },
];
const _t6h = [  // xs–xxl for height programs (taller/shorter)
    { id: 'xs',  pct: 10 }, { id: 'sm', pct: 22 }, { id: 'md', pct: 38 },
    { id: 'lg',  pct: 56 }, { id: 'xl', pct: 74 }, { id: 'xxl', pct: 90 },
];
const _t6w = [  // xs–xxl for width-bar programs (wider/narrower)
    { id: 'xs',  pct:  8 }, { id: 'sm', pct: 20 }, { id: 'md', pct: 35 },
    { id: 'lg',  pct: 52 }, { id: 'xl', pct: 68 }, { id: 'xxl', pct: 84 },
];
const _t6k = [  // xs–xxl for thick-bar programs (thicker/thinner)
    { id: 'xs',  pct:  5 }, { id: 'sm', pct: 12 }, { id: 'md', pct: 22 },
    { id: 'lg',  pct: 35 }, { id: 'xl', pct: 52 }, { id: 'xxl', pct: 68 },
];
const _tLt = [  // vlt–xdk for lighter/darker
    { id: 'vlt', color: 'hsl(220,38%,82%)' },
    { id: 'lt',  color: 'hsl(220,38%,65%)' },
    { id: 'md',  color: 'hsl(220,38%,48%)' },
    { id: 'dk',  color: 'hsl(220,38%,32%)' },
    { id: 'vdk', color: 'hsl(220,38%,18%)' },
    { id: 'xdk', color: 'hsl(220,38%, 8%)' },
];
const _tMr = [  // n1–n4 for more/fewer (max 9 dots)
    { id: 'n1', count: 2 }, { id: 'n2', count: 4 },
    { id: 'n3', count: 6 }, { id: 'n4', count: 9 },
];
const _t6f = [  // xs–xxl for fill programs (fuller/emptier)
    { id: 'xs',  pct:  5 }, { id: 'sm', pct: 22 }, { id: 'md', pct: 40 },
    { id: 'lg',  pct: 58 }, { id: 'xl', pct: 76 }, { id: 'xxl', pct: 94 },
];
const _tEdge = [  // polygons + circles for has-edges / has-no-edges
    { id: 'square',   type: 'poly4'  },
    { id: 'triangle', type: 'poly3'  },
    { id: 'pentagon', type: 'poly5'  },
    { id: 'hexagon',  type: 'poly6'  },
    { id: 'diamond',  type: 'poly4d' },
    { id: 'c1',       type: 'circle' },
    { id: 'c2',       type: 'circle' },
    { id: 'c3',       type: 'circle' },
    { id: 'c4',       type: 'circle' },
    { id: 'c5',       type: 'circle' },
];
const _tWH = [  // whole/half shapes
    { id: 'circle-w', type: 'circle-whole' },
    { id: 'circle-h', type: 'circle-half'  },
    { id: 'square-w', type: 'square-whole' },
    { id: 'square-h', type: 'square-half'  },
];
const _tNL = [  // number/letter characters
    { id: 'n5', char: '5', type: 'number' },
    { id: 'n8', char: '8', type: 'number' },
    { id: 'n3', char: '3', type: 'number' },
    { id: 'la', char: 'A', type: 'letter' },
    { id: 'lg', char: 'G', type: 'letter' },
    { id: 'lm', char: 'M', type: 'letter' },
];
const _tAB = [  // above/below positions
    { id: 'above-c', pos: 'above', shape: 'circle' },
    { id: 'below-c', pos: 'below', shape: 'circle' },
    { id: 'above-s', pos: 'above', shape: 'square' },
    { id: 'below-s', pos: 'below', shape: 'square' },
];

// ── Shared render functions ──────────────────────────────────────────────────

function _renderSquare(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    box.style.cssText = `width:${t.pct}%;aspect-ratio:1;background:${color};border-radius:8px;pointer-events:none;`;
    el.appendChild(box);
}

function _renderCircle(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    box.style.cssText = `width:${t.pct}%;aspect-ratio:1;background:${color};border-radius:50%;pointer-events:none;`;
    el.appendChild(box);
}

function _renderHeightBar(t, el, color) {
    el.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:5%;box-sizing:border-box;';
    const box = document.createElement('div');
    box.style.cssText = `width:28px;height:${t.pct}%;background:${color};border-radius:6px 6px 3px 3px;pointer-events:none;`;
    el.appendChild(box);
}

function _renderWidthBar(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    box.style.cssText = `width:${t.pct}%;height:24px;background:${color};border-radius:6px;pointer-events:none;`;
    el.appendChild(box);
}

function _renderThickBar(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    box.style.cssText = `width:${t.pct}%;height:85%;background:${color};border-radius:6px;pointer-events:none;`;
    el.appendChild(box);
}

function _renderSwatch(t, el) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    box.style.cssText = `width:88%;height:88%;background:${t.color};border-radius:12px;box-shadow:inset 0 2px 6px rgba(0,0,0,0.15);pointer-events:none;`;
    el.appendChild(box);
}

function _renderDots(t, el, color) {
    el.style.cssText = 'display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:5px;padding:8%;width:100%;height:100%;box-sizing:border-box;';
    for (let i = 0; i < t.count; i++) {
        const d = document.createElement('div');
        d.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};flex-shrink:0;pointer-events:none;`;
        el.appendChild(d);
    }
}

function _renderFill(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:40%;height:72%;border:3px solid #999;border-radius:4px;overflow:hidden;background:rgba(255,255,255,0.2);box-sizing:border-box;pointer-events:none;';
    const fill = document.createElement('div');
    fill.style.cssText = `position:absolute;bottom:0;left:0;right:0;height:${t.pct}%;background:${color};`;
    wrap.appendChild(fill);
    el.appendChild(wrap);
}

function _renderEdge(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    if (t.type === 'poly4') {
        box.style.cssText = `width:65%;aspect-ratio:1;background:${color};pointer-events:none;`;
    } else if (t.type === 'poly3') {
        box.style.cssText = `width:70%;aspect-ratio:1;clip-path:polygon(50% 0%,100% 100%,0% 100%);background:${color};pointer-events:none;`;
    } else if (t.type === 'poly5') {
        box.style.cssText = `width:65%;aspect-ratio:1;clip-path:polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%);background:${color};pointer-events:none;`;
    } else if (t.type === 'poly6') {
        box.style.cssText = `width:65%;aspect-ratio:1;clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%);background:${color};pointer-events:none;`;
    } else if (t.type === 'poly4d') {
        box.style.cssText = `width:65%;aspect-ratio:1;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);background:${color};pointer-events:none;`;
    } else {
        const szMap = { c1:'68%;aspect-ratio:1', c2:'52%;aspect-ratio:1', c3:'72%;height:52%', c4:'44%;height:72%', c5:'44%;aspect-ratio:1' };
        const sz = szMap[t.id] || '60%;aspect-ratio:1';
        box.style.cssText = `width:${sz};background:${color};border-radius:50%;pointer-events:none;`;
    }
    el.appendChild(box);
}

function _renderWH(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const box = document.createElement('div');
    if (t.type === 'circle-whole')
        box.style.cssText = `width:68%;aspect-ratio:1;background:${color};border-radius:50%;pointer-events:none;`;
    else if (t.type === 'circle-half')
        box.style.cssText = `width:68%;aspect-ratio:2/1;background:${color};border-radius:50% 50% 0 0/100% 100% 0 0;pointer-events:none;`;
    else if (t.type === 'square-whole')
        box.style.cssText = `width:60%;aspect-ratio:1;background:${color};border-radius:4px;pointer-events:none;`;
    else
        box.style.cssText = `width:60%;aspect-ratio:2/1;background:${color};border-radius:4px 4px 0 0;pointer-events:none;`;
    el.appendChild(box);
}

function _renderChar(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const txt = document.createElement('div');
    txt.style.cssText = `font-size:4.5rem;font-weight:700;color:${color};pointer-events:none;line-height:1;`;
    txt.textContent = t.char;
    el.appendChild(txt);
}

function _renderAB(t, el, color) {
    el.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    const line = document.createElement('div');
    line.style.cssText = 'position:absolute;top:50%;left:10%;right:10%;height:3px;background:#bbb;border-radius:2px;pointer-events:none;';
    const obj = document.createElement('div');
    const isAbove = t.pos === 'above';
    const isCircle = t.shape === 'circle';
    obj.style.cssText = `position:absolute;${isAbove ? 'bottom:55%' : 'top:55%'};left:50%;transform:translateX(-50%);width:28%;aspect-ratio:1;background:${color};border-radius:${isCircle ? '50%' : '4px'};pointer-events:none;`;
    el.appendChild(line);
    el.appendChild(obj);
}

function _renderWordPic(t, el, color) {
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
    if (t.type === 'word') {
        const txt = document.createElement('div');
        txt.style.cssText = `font-size:2.2rem;font-weight:700;color:${color};pointer-events:none;text-align:center;padding:8px;`;
        txt.textContent = t.text.toUpperCase();
        el.appendChild(txt);
    } else {
        const img = document.createElement('img');
        img.src = (t.image.startsWith('data:') || t.image.startsWith('http') || t.image.startsWith('file:')) ? t.image : (window.ASSET_BASE || '') + t.image;
        img.style.cssText = 'max-width:85%;max-height:85%;object-fit:contain;border-radius:8px;pointer-events:none;';
        el.appendChild(img);
    }
}

// ── Programs ─────────────────────────────────────────────────────────────────

window.COMPARE_PROGRAMS = [

    // ── BIGGER / SMALLER ──────────────────────────────────────────────────────
    {
        id: 'bigger', canScale: true,
        question2: 'Which one is bigger?',       questionMulti: 'Which is the biggest?',
        correctLabel2: 'bigger',                 correctLabelMulti: 'the biggest',
        tiles: _t6, stages: _s6up, renderTile: _renderSquare,
    },
    {
        id: 'smaller', canScale: true,
        question2: 'Which one is smaller?',      questionMulti: 'Which is the smallest?',
        correctLabel2: 'smaller',                correctLabelMulti: 'the smallest',
        tiles: _t6, stages: _s6dn, renderTile: _renderSquare,
    },

    // ── TALLER / SHORTER ──────────────────────────────────────────────────────
    {
        id: 'taller', canScale: true,
        question2: 'Which one is taller?',       questionMulti: 'Which is the tallest?',
        correctLabel2: 'taller',                 correctLabelMulti: 'the tallest',
        tiles: _t6h, stages: _s6up, renderTile: _renderHeightBar,
    },
    {
        id: 'shorter', canScale: true,
        question2: 'Which one is shorter?',      questionMulti: 'Which is the shortest?',
        correctLabel2: 'shorter',                correctLabelMulti: 'the shortest',
        tiles: _t6h, stages: _s6dn, renderTile: _renderHeightBar,
    },

    // ── WIDER / NARROWER ──────────────────────────────────────────────────────
    {
        id: 'wider', canScale: true,
        question2: 'Which one is wider?',        questionMulti: 'Which is the widest?',
        correctLabel2: 'wider',                  correctLabelMulti: 'the widest',
        tiles: _t6w, stages: _s6up, renderTile: _renderWidthBar,
    },
    {
        id: 'narrower', canScale: true,
        question2: 'Which one is narrower?',     questionMulti: 'Which is the narrowest?',
        correctLabel2: 'narrower',               correctLabelMulti: 'the narrowest',
        tiles: _t6w, stages: _s6dn, renderTile: _renderWidthBar,
    },

    // ── THICKER / THINNER ─────────────────────────────────────────────────────
    {
        id: 'thicker', canScale: true,
        question2: 'Which one is thicker?',      questionMulti: 'Which is the thickest?',
        correctLabel2: 'thicker',                correctLabelMulti: 'the thickest',
        tiles: _t6k, stages: _s6up, renderTile: _renderThickBar,
    },
    {
        id: 'thinner', canScale: true,
        question2: 'Which one is thinner?',      questionMulti: 'Which is the thinnest?',
        correctLabel2: 'thinner',                correctLabelMulti: 'the thinnest',
        tiles: _t6k, stages: _s6dn, renderTile: _renderThickBar,
    },

    // ── LIGHTER / DARKER ──────────────────────────────────────────────────────
    {
        id: 'lighter', canScale: true,
        question2: 'Which one is lighter?',      questionMulti: 'Which is the lightest?',
        correctLabel2: 'lighter',                correctLabelMulti: 'the lightest',
        tiles: _tLt, stages: _sLtUp, renderTile: _renderSwatch,
    },
    {
        id: 'darker', canScale: true,
        question2: 'Which one is darker?',       questionMulti: 'Which is the darkest?',
        correctLabel2: 'darker',                 correctLabelMulti: 'the darkest',
        tiles: _tLt, stages: _sLtDn, renderTile: _renderSwatch,
    },

    // ── MORE / FEWER ──────────────────────────────────────────────────────────
    {
        id: 'more', canScale: true,
        question2: 'Which has more?',            questionMulti: 'Which has the most?',
        correctLabel2: 'more',                   correctLabelMulti: 'the most',
        tiles: _tMr, stages: _sMrUp, renderTile: _renderDots,
    },
    {
        id: 'fewer', canScale: true,
        question2: 'Which has fewer?',           questionMulti: 'Which has the fewest?',
        correctLabel2: 'fewer',                  correctLabelMulti: 'the fewest',
        tiles: _tMr, stages: _sMrDn, renderTile: _renderDots,
    },

    // ── NEARER / FURTHER ──────────────────────────────────────────────────────
    {
        id: 'nearer', canScale: true,
        question2: 'Which one is nearer?',       questionMulti: 'Which is the nearest?',
        correctLabel2: 'nearer',                 correctLabelMulti: 'the nearest',
        tiles: _t6, stages: _s6up, renderTile: _renderCircle,
    },
    {
        id: 'further', canScale: true,
        question2: 'Which one is further?',      questionMulti: 'Which is the furthest?',
        correctLabel2: 'further',                correctLabelMulti: 'the furthest',
        tiles: _t6, stages: _s6dn, renderTile: _renderCircle,
    },

    // ── FULLER / EMPTIER ──────────────────────────────────────────────────────
    {
        id: 'fuller', canScale: true,
        question2: 'Which one is fuller?',       questionMulti: 'Which is the fullest?',
        correctLabel2: 'fuller',                 correctLabelMulti: 'the fullest',
        tiles: _t6f, stages: _s6up, renderTile: _renderFill,
    },
    {
        id: 'emptier', canScale: true,
        question2: 'Which one is emptier?',      questionMulti: 'Which is the most empty?',
        correctLabel2: 'emptier',                correctLabelMulti: 'the most empty',
        tiles: _t6f, stages: _s6dn, renderTile: _renderFill,
    },

    // ── HAS EDGES / HAS NO EDGES ──────────────────────────────────────────────
    {
        id: 'has-edges', canScale: true,
        question2: 'Which one has edges?',       questionMulti: 'Which one has edges?',
        correctLabel2: 'the one with edges',     correctLabelMulti: 'the one with edges',
        tiles: _tEdge, stages: _sEdge, renderTile: _renderEdge,
    },
    {
        id: 'has-no-edges', canScale: true,
        question2: 'Which one has no edges?',    questionMulti: 'Which one has no edges?',
        correctLabel2: 'the one with no edges',  correctLabelMulti: 'the one with no edges',
        tiles: _tEdge, stages: _sNoEdge, renderTile: _renderEdge,
    },

    // ── WHOLE / HALF ──────────────────────────────────────────────────────────
    {
        id: 'whole', canScale: false,
        question2: 'Which one is whole?',        questionMulti: 'Which one is whole?',
        correctLabel2: 'the whole one',          correctLabelMulti: 'the whole one',
        tiles: _tWH, stages: _sWhole, renderTile: _renderWH,
    },
    {
        id: 'half', canScale: false,
        question2: 'Which one is a half?',       questionMulti: 'Which one is a half?',
        correctLabel2: 'the half',               correctLabelMulti: 'the half',
        tiles: _tWH, stages: _sHalf, renderTile: _renderWH,
    },

    // ── WORD / PICTURE ────────────────────────────────────────────────────────
    // tiles and stages populated at runtime from user programs via _populateTiles()
    {
        id: 'word', canScale: false, dynamicTiles: true,
        question2: 'Which one is a word?',       questionMulti: 'Which one is a word?',
        correctLabel2: 'the word',               correctLabelMulti: 'the word',
        tiles: [], stages: [],
        renderTile: _renderWordPic,
        _populateTiles(stimuli) {
            const pool = stimuli.slice(0, 12);
            this.tiles = pool.flatMap((s, i) => [
                { id: `w${i}`, type: 'word', text: s.name },
                { id: `p${i}`, type: 'pic',  image: s.images[0] },
            ]);
            this.stages = pool.map((_, i) => ({ tiles: [`w${i}`, `p${i}`], correct: `w${i}` }));
        },
    },
    {
        id: 'picture', canScale: false, dynamicTiles: true,
        question2: 'Which one is a picture?',    questionMulti: 'Which one is a picture?',
        correctLabel2: 'the picture',            correctLabelMulti: 'the picture',
        tiles: [], stages: [],
        renderTile: _renderWordPic,
        _populateTiles(stimuli) {
            const pool = stimuli.slice(0, 12);
            this.tiles = pool.flatMap((s, i) => [
                { id: `w${i}`, type: 'word', text: s.name },
                { id: `p${i}`, type: 'pic',  image: s.images[0] },
            ]);
            this.stages = pool.map((_, i) => ({ tiles: [`w${i}`, `p${i}`], correct: `p${i}` }));
        },
    },

    // ── NUMBER / LETTER ───────────────────────────────────────────────────────
    {
        id: 'number', canScale: false,
        question2: 'Which one is a number?',     questionMulti: 'Which one is a number?',
        correctLabel2: 'the number',             correctLabelMulti: 'the number',
        tiles: _tNL, stages: _sNumber, renderTile: _renderChar,
    },
    {
        id: 'letter', canScale: false,
        question2: 'Which one is a letter?',     questionMulti: 'Which one is a letter?',
        correctLabel2: 'the letter',             correctLabelMulti: 'the letter',
        tiles: _tNL, stages: _sLetter, renderTile: _renderChar,
    },

    // ── ABOVE / BELOW ─────────────────────────────────────────────────────────
    {
        id: 'above', canScale: false,
        question2: 'Which one is above?',        questionMulti: 'Which one is above?',
        correctLabel2: 'the one above',          correctLabelMulti: 'the one above',
        tiles: _tAB, stages: _sAbove, renderTile: _renderAB,
    },
    {
        id: 'below', canScale: false,
        question2: 'Which one is below?',        questionMulti: 'Which one is below?',
        correctLabel2: 'the one below',          correctLabelMulti: 'the one below',
        tiles: _tAB, stages: _sBelow, renderTile: _renderAB,
    },

];

// ── Groups for the setup UI ───────────────────────────────────────────────────
// Controls how compare programs are displayed as paired checkboxes on cats-home.

window.COMPARE_PROGRAM_GROUPS = [
    { label: 'Bigger / Smaller',   ids: ['bigger',      'smaller'    ] },
    { label: 'Taller / Shorter',   ids: ['taller',      'shorter'    ] },
    { label: 'Wider / Narrower',   ids: ['wider',       'narrower'   ] },
    { label: 'Thicker / Thinner',  ids: ['thicker',     'thinner'    ] },
    { label: 'Lighter / Darker',   ids: ['lighter',     'darker'     ] },
    { label: 'More / Fewer',       ids: ['more',        'fewer'      ] },
    { label: 'Nearer / Further',   ids: ['nearer',      'further'    ] },
    { label: 'Fuller / Emptier',   ids: ['fuller',      'emptier'    ] },
    { label: 'Has / Has Not',      ids: ['has-edges',   'has-no-edges'] },
    { label: 'Whole / Half',       ids: ['whole',       'half'       ] },
    { label: 'Word / Picture',     ids: ['word',        'picture'    ] },
    { label: 'Number / Letter',    ids: ['number',      'letter'     ] },
    { label: 'Above / Below',      ids: ['above',       'below'      ] },
];
