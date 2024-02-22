import { Component } from "vue"

export type ColumnFilter = any;

export type FTColumn<T = any> = {
  key: keyof T;
  labelText: string;
  labelComponent?: Component<{ col: FTColumn<T> }>;
  itemComponent?: Component<{ item: T, col: FTColumn<T> }>;
  getItemText (item: T): any;
  getItemValue (row: any, item: T): any;
  filters?: ColumnFilter[];
}

export function rawValue<T = any> (
  key: string,
  labelText?: string,
  _type?: any,
): FTColumn {
  labelText ??= key;
  return {
    key,
    labelText,
    getItemValue: (item: any) => item[key],
    getItemText: (item: T) => item[key], // TODO - based on type
  }
}
