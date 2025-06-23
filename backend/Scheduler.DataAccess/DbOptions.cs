namespace Scheduler.DataAccess;

public class DbOptions
{
    public const string Key = "Db";
    required public string Database { get; set; }
    required public string Username { get; set; }
    required public string Password { get; set; }
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5432;
}
