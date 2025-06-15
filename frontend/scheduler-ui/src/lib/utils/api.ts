export type ApiResult<T, E> =
    | { ok: T, err: undefined | null }
    | { ok: null | undefined, err: E };


export function isSuccess<T, E>(res?: ApiResult<T, E>): res is { ok: T, err: undefined | null } {
    return !!res?.ok
}


export const get = async <T, E>(path: string, options?: RequestInit): Promise<ApiResult<T, E>> => {
    const res = await fetch(path, options);
    if (!res.ok) {
        throw res.json() as Promise<ApiResult<T, E>>;
    }
    return res.json() as Promise<ApiResult<T, E>>;
}
