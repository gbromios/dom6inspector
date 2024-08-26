import { Component } from 'vue'
import FTBoolTD from './FTBoolTD.vue';
import FTBoolTH from './FTBoolTH.vue';

export type ColumnFilter = any;

export type FTColumn<T = any, P = Record<string, any>> = {
  key: keyof T;
  labelText: string;
  labelComponent?: Component<{
    col: FTColumn<T>;
    tableName: string;
  }>;
  labelProps?: any;
  itemComponent?: Component<{
    item: T;
    opts: P;
    column: FTColumn;
    value: any;
    text: string;
    tableName: string;
  }>;
  itemProps?: P,
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

export function boolValue<T = any> (opts: {
  key: string,
  labelText?: string,
  labelIcon?: string,
  is?: string,
  isNot?: string,
}): FTColumn {
  let { key, labelText, labelIcon, is, isNot } = opts;
  labelText ??= key;
  is ??= `is ${labelText}`;
  isNot ??= `is not ${labelText}`;

  const [labelProps, labelComponent] = labelIcon ?
    [{ icon: labelIcon }, FTBoolTH] : []
  return {
    key,
    labelText,
    labelComponent,
    labelProps,
    itemComponent: FTBoolTD,
    getItemValue: (item: any) => item[key],
    getItemText: (item: T) => item[key] ? is : isNot,
  }
}
