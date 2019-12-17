
export type Modify<T, R extends Partial<Record<keyof T, any>>> = Omit<T, keyof R> & R;

export type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;
