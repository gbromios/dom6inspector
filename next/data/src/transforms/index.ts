export type Transform = (data: any) => void;

import v30 from './v30';

export const transforms: Record<number, Record<string, Transform[]>> = {
  30: v30,
}

