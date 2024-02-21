export type IndexDef = {
  readonly name: string,
  readonly keyPath: string | string[],
  readonly options?: IndexOptions
};

export type IndexOptions = {
  readonly unique?: boolean;
  readonly multEntry?: boolean;
};

export enum MIGRATION {
  CREATE_STORE = 'CREATE_STORE',
  REMOVE_STORE = 'REMOVE_STORE',
  CREATE_INDEX = 'ADD_INDEX',
  // TODO - REMOVE/UPDATE_INDEX; TRANSFORM/UPDATE_DATA ?
}

export type Migration =
  {
    readonly type: MIGRATION.CREATE_STORE;
    readonly name: string;
    readonly primaryKey: string;
    readonly indices: Readonly<IndexDef[]>;
  } | {
    readonly type: MIGRATION.CREATE_INDEX;
    readonly name: string;
    readonly index: IndexDef;
  };


