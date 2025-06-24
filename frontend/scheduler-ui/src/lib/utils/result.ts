type Ok<T> = { type: 'ok', val: T }
type Err<E> = { type: 'err', val: E }


export type Maybe<T> = T | null;
export type Result<T, E> = Ok<T> | Err<E>
