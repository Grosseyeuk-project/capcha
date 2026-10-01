// Order of play. Each piece only edits its own lines.
import a_checkbox from './a_checkbox.js';
import a_wavy from './a_wavy.js';
import a_grid from './a_grid.js';
import a_math from './a_math.js';
import a_slider from './a_slider.js';
import a_bins from './a_bins.js';
import a_order from './a_order.js';
import a_rotate from './a_rotate.js';
import b_flip from './b_flip.js';
export const CAPTCHAS = [
  // captchas-a
  a_checkbox, a_wavy, a_grid, a_math, a_slider, a_bins, a_order, a_rotate,
  // captchas-b: add below
  b_flip,
];
