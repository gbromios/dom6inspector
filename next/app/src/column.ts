import { Component } from "vue"

export type FTColumn<T = any> = {
  key: keyof T,
  labelComponent?: Component<{ col: FTColumn<T> }>,
  labelText: string,
  itemComponent?: Component<{ item: T, col: FTColumn<T> }>,
  getItemText?: (item: T) => any
}
