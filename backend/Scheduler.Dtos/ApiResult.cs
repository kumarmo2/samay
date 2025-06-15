using System.Text.Json.Serialization;

namespace Scheduler.Dtos;

public class ApiResult<T, E>
{
    private T? _ok;
    private E? _err;

    public ApiResult(T ok)
    {
        _ok = ok;
        _err = default;

    }
    public ApiResult(E err)
    {
        _err = err;
        _ok = default;
    }
    public T? Ok
    {
        get
        {
            return _ok;

        }
        set
        {
            _err = default;
            _ok = value;
        }
    }
    public E? Err
    {
        get { return _err; }
        set
        {
            _ok = default;
            _err = value;

        }
    }
    [JsonIgnore]
    public bool IsSuccess
    {
        get
        {
            return _ok != null && _err == null;
        }
    }
}

