import THBool from '$lib/component/Column/Bool.svelte'
import TDBool from '$lib/component/Data/Bool.svelte'
export type ColumnFilter = any;

export type Column<T = any, P = Record<string, any>> = {
  key: keyof T;
  labelText: string;
  labelComponent?: any;// SvelteComponent?;
  labelProps?: any;
  itemComponent?: any; // SvelteComponent ?
  itemProps?: P,
  flex?: string,
  getItemText (item: T): any;
  getItemValue (row: any, item: T, raw: any): any;
  filters?: ColumnFilter[];

  // TODO - will think of something a bit more fancier but just fix all sizes
  // for the time being
  size?: string,
}

export function rawValue<T = any> (
  key: string,
  labelText?: string,
  _type?: any,
): Column {
  labelText ??= key;
  return {
    key,
    labelText,
    getItemValue: (item: any) => item[key],
    getItemText: (item: T) => (item as any)[key], // TODO - based on type
    size: '0 0 10em',
  }
}

export function boolValue<T = any> (opts: {
  key: string,
  labelText?: string,
  labelIcon?: string,
  is?: string,
  isNot?: string,
}): Column {

  let { key, labelText, labelIcon, is, isNot } = opts;
  labelText ??= key;
  is ??= `is ${labelText}`;
  isNot ??= `is not ${labelText}`;

  const [labelProps, labelComponent] = labelIcon ?
    [{ icon: labelIcon }, THBool] : []
  return {
    key,
    labelText,
    labelComponent,
    labelProps,
    itemComponent: TDBool,
    getItemValue: (item: any) => item[key] ?? false,
    getItemText: (item: T) => (item as any)[key] ? is : isNot,
    size: '0 0 2em'
  }
}
