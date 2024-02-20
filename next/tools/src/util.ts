// just a bunch of output formatting shit
export function tableDeco(name: string, width = 80, style = 9) {
  const { TL, BL, TR, BR, HR } = getBoxChars(style)
  const nameWidth = name.length - 2;
  const hTailWidth = width - (nameWidth + 5 - 1)
  return [
    `${TL}${HR.repeat(4)} ${name} ${HR.repeat(hTailWidth)}${TR}`,
    `${BL}${HR.repeat(width - 2)}${BR}`
  ];
}


function getBoxChars (style: number) {
  switch (style) {
    case 9: return { TL: '┌', BL: '└', TR: '┐', BR: '┘', HR: '─' };
    case 18: return { TL: '┏', BL: '┗', TR: '┓', BR: '┛', HR: '━' };
    case 36: return { TL: '╔', BL: '╚', TR: '╗', BR: '╝', HR: '═' };
    default: throw new Error('invalid style');
    //case ?: return { TL: 'M', BL: 'N', TR: 'O', BR: 'P', HR: 'Q' };
  }
}

export function boxChar (i: number, dot = 0) {
  switch (i) {
    case 0:                               return ' ';
    case (BOX.U_T):                       return '\u2575';
    case (BOX.U_B):                       return '\u2579';
    case (BOX.D_T):                       return '\u2577';
    case (BOX.D_B):                       return '\u257B';
    case (BOX.L_T):                       return '\u2574';
    case (BOX.L_B):                       return '\u2578';
    case (BOX.R_T):                       return '\u2576';
    case (BOX.R_B):                       return '\u257A';

    // two-way
    case BOX.U_T|BOX.D_T: switch (dot) {
        case 3:                           return '\u250A';
        case 2:                           return '\u2506';
        case 1:                           return '\u254E';
        default:                          return '\u2502';
      }
    case BOX.U_T|BOX.D_B:                 return '\u257D';
    case BOX.U_B|BOX.D_T:                 return '\u257F';
    case BOX.U_B|BOX.D_B: switch (dot) {
        case 3:                           return '\u250B';
        case 2:                           return '\u2507';
        case 1:                           return '\u254F';
        default:                          return '\u2503';
      }
    case BOX.U_B|BOX.D_D:                 return '\u25FF';
    case BOX.U_D|BOX.D_D:                 return '\u2551';
    case BOX.U_T|BOX.L_T:                 return '\u2518';
    case BOX.U_T|BOX.L_B:                 return '\u2519';
    case BOX.U_T|BOX.L_D:                 return '\u255A';
    case BOX.U_B|BOX.L_T:                 return '\u251A';
    case BOX.U_B|BOX.L_B:                 return '\u251B';
    case BOX.U_D|BOX.L_T:                 return '\u255C';
    case BOX.U_D|BOX.L_D:                 return '\u255D';
    case BOX.U_T|BOX.R_T:                 return '\u2514';
    case BOX.U_T|BOX.R_B:                 return '\u2515';
    case BOX.U_T|BOX.R_D:                 return '\u2558';
    case BOX.U_B|BOX.R_T:                 return '\u2516';
    case BOX.U_B|BOX.R_B:                 return '\u2517';
    case BOX.U_D|BOX.R_T:                 return '\u2559';
    case BOX.U_D|BOX.R_D:                 return '\u255A';
    case BOX.D_T|BOX.L_T:                 return '\u2510';
    case BOX.D_T|BOX.L_B:                 return '\u2511';
    case BOX.D_T|BOX.L_D:                 return '\u2555';
    case BOX.D_B|BOX.L_T:                 return '\u2512';
    case BOX.D_B|BOX.L_B:                 return '\u2513';
    case BOX.D_D|BOX.L_T:                 return '\u2556';
    case BOX.D_D|BOX.L_D:                 return '\u2557';
    case BOX.D_T|BOX.R_T:                 return '\u250C';
    case BOX.D_T|BOX.R_B:                 return '\u250D';
    case BOX.D_T|BOX.R_D:                 return '\u2552';
    case BOX.D_B|BOX.R_T:                 return '\u250E';
    case BOX.D_B|BOX.R_B:                 return '\u250F';
    case BOX.D_D|BOX.R_T:                 return '\u2553';
    case BOX.D_D|BOX.R_D:                 return '\u2554';
    case BOX.L_T|BOX.R_T: switch (dot) {
        case 3:                           return '\u2508';
        case 2:                           return '\u2504';
        case 1:                           return '\u254C';
        default:                          return '\u2500';
      }
    case BOX.L_T|BOX.R_B:                 return '\u257C';
    case BOX.L_B|BOX.R_T:                 return '\u257E';
    case BOX.L_B|BOX.R_B: switch (dot) {
        case 3:                           return '\u2509';
        case 2:                           return '\u2505';
        case 1:                           return '\u254D';
        default:                          return '\u2501';
      }
    // three-way
    case BOX.U_T|BOX.D_T|BOX.L_T:         return '\u2524';
    case BOX.U_T|BOX.D_T|BOX.L_B:         return '\u2525';
    case BOX.U_T|BOX.D_T|BOX.L_D:         return '\u2561';
    case BOX.U_T|BOX.D_B|BOX.L_T:         return '\u2527';
    case BOX.U_T|BOX.D_B|BOX.L_B:         return '\u252A';
    case BOX.U_B|BOX.D_T|BOX.L_T:         return '\u2526';
    case BOX.U_B|BOX.D_T|BOX.L_B:         return '\u2529';
    case BOX.U_B|BOX.D_B|BOX.L_T:         return '\u2528';
    case BOX.U_B|BOX.D_B|BOX.L_B:         return '\u252B';
    case BOX.U_D|BOX.D_D|BOX.L_T:         return '\u2562';
    case BOX.U_D|BOX.D_D|BOX.L_D:         return '\u2563';
    case BOX.U_T|BOX.D_T|BOX.R_T:         return '\u251C';
    case BOX.U_T|BOX.D_T|BOX.R_B:         return '\u251D';
    case BOX.U_T|BOX.D_T|BOX.R_D:         return '\u255E';
    case BOX.U_T|BOX.D_B|BOX.R_T:         return '\u251F';
    case BOX.U_T|BOX.D_B|BOX.R_B:         return '\u2522';
    case BOX.U_B|BOX.D_T|BOX.R_T:         return '\u251E';
    case BOX.U_B|BOX.D_T|BOX.R_B:         return '\u2521';
    case BOX.U_B|BOX.D_B|BOX.R_T:         return '\u2520';
    case BOX.U_B|BOX.D_B|BOX.R_B:         return '\u2523';
    case BOX.U_D|BOX.D_D|BOX.R_T:         return '\u255F';
    case BOX.U_D|BOX.D_D|BOX.R_D:         return '\u2560';
    case BOX.U_T|BOX.L_T|BOX.R_T:         return '\u2534';
    case BOX.U_T|BOX.L_T|BOX.R_B:         return '\u2536';
    case BOX.U_T|BOX.L_B|BOX.R_T:         return '\u2535';
    case BOX.U_T|BOX.L_B|BOX.R_B:         return '\u2537';
    case BOX.U_T|BOX.L_D|BOX.R_D:         return '\u2567';
    case BOX.U_B|BOX.L_T|BOX.R_T:         return '\u2538';
    case BOX.U_B|BOX.L_T|BOX.R_B:         return '\u253A';
    case BOX.U_B|BOX.L_B|BOX.R_T:         return '\u2539';
    case BOX.U_B|BOX.L_B|BOX.R_B:         return '\u253B';
    case BOX.U_D|BOX.L_T|BOX.R_T:         return '\u2568';
    case BOX.U_D|BOX.L_D|BOX.R_D:         return '\u2569';
    case BOX.D_T|BOX.L_T|BOX.R_T:         return '\u252C';
    case BOX.D_T|BOX.L_T|BOX.R_B:         return '\u252E';
    case BOX.D_T|BOX.L_B|BOX.R_T:         return '\u252D';
    case BOX.D_T|BOX.L_B|BOX.R_B:         return '\u252F';
    case BOX.D_T|BOX.L_D|BOX.R_T:         return '\u2565';
    case BOX.D_T|BOX.L_D|BOX.R_D:         return '\u2564';
    case BOX.D_B|BOX.L_T|BOX.R_T:         return '\u2530';
    case BOX.D_B|BOX.L_T|BOX.R_B:         return '\u2532';
    case BOX.D_B|BOX.L_B|BOX.R_T:         return '\u2531';
    case BOX.D_B|BOX.L_B|BOX.R_B:         return '\u2533';
    case BOX.D_D|BOX.L_T|BOX.R_T:         return '\u2565';
    case BOX.D_D|BOX.L_D|BOX.R_D:         return '\u2566';
    // four-way
    case BOX.U_T|BOX.D_T|BOX.L_T|BOX.R_T: return '\u253C';
    case BOX.U_T|BOX.D_T|BOX.L_T|BOX.R_B: return '\u253E';
    case BOX.U_T|BOX.D_T|BOX.L_B|BOX.R_T: return '\u253D';
    case BOX.U_T|BOX.D_T|BOX.L_B|BOX.R_B: return '\u253F';
    case BOX.U_T|BOX.D_T|BOX.L_D|BOX.R_D: return '\u256A';
    case BOX.U_T|BOX.D_B|BOX.L_T|BOX.R_T: return '\u2541';
    case BOX.U_T|BOX.D_B|BOX.L_T|BOX.R_B: return '\u2546';
    case BOX.U_T|BOX.D_B|BOX.L_B|BOX.R_T: return '\u2545';
    case BOX.U_T|BOX.D_B|BOX.L_B|BOX.R_B: return '\u2548';
    case BOX.U_B|BOX.D_T|BOX.L_T|BOX.R_T: return '\u2540';
    case BOX.U_B|BOX.D_T|BOX.L_T|BOX.R_B: return '\u2544';
    case BOX.U_B|BOX.D_T|BOX.L_B|BOX.R_T: return '\u2543';
    case BOX.U_B|BOX.D_T|BOX.L_B|BOX.R_B: return '\u2547';
    case BOX.U_B|BOX.D_B|BOX.L_T|BOX.R_T: return '\u2542';
    case BOX.U_B|BOX.D_B|BOX.L_T|BOX.R_B: return '\u254A';
    case BOX.U_B|BOX.D_B|BOX.L_B|BOX.R_T: return '\u2549';
    case BOX.U_B|BOX.D_B|BOX.L_B|BOX.R_B: return '\u254B';
    case BOX.U_D|BOX.D_D|BOX.L_T|BOX.R_T: return '\u256B';
    case BOX.U_D|BOX.D_D|BOX.L_D|BOX.R_D: return '\u256C';
    default: return '☒';
  }
}

export const enum BOX {
  U_T = 1,
  U_B = 2,
  U_D = 4,
  D_T = 8,
  D_B = 16,
  D_D = 32,
  L_T = 64,
  L_B = 128,
  L_D = 256,
  R_T = 512,
  R_B = 1024,
  R_D = 2048,
}

