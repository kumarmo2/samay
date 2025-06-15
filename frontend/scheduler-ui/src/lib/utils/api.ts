export type ApiResult<T, E> =
    | { ok: T, err: undefined | null }
    | { ok: null | undefined, err: E };


export function isSuccess<T, E>(res?: ApiResult<T, E>): res is { ok: T, err: undefined | null } {
    return !!res?.ok
}


export const get = async <T, E>(path: string, options?: RequestInit): Promise<ApiResult<T, E>> => {
    const res = await fetch(path, options);
    return res.json() as Promise<ApiResult<T, E>>;
}

export const post = async<T, E>(path: string, body?: any, options?: RequestInit): Promise<ApiResult<T, E>> => {
    const reqBody = body ? JSON.stringify(body) : null;
    options = options || {};
    options.method = "POST";
    options.headers = options.headers || {};

    options.headers = {
        ...options.headers,
        ["Content-type"]: "application/json"
    }

    if (reqBody) {
        options.body = reqBody;
    }

    const res = await fetch(path, options);
    return res.json() as Promise<ApiResult<T, E>>;

}
