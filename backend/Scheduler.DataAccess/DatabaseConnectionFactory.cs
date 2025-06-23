using System.Data;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Scheduler.DataAccess;

public class DatabaseConnectionFactory(IOptions<DbOptions> dbOptions) : IDatabaseConnectionFactory
{
    private readonly DbOptions _dbOptions = dbOptions.Value;

    public IDbConnection GetConnection()
    {
        // use a connection builder  for postgres to create a connection string
        var builder = new NpgsqlConnectionStringBuilder
        {
            Database = _dbOptions.Database,
            Host = _dbOptions.Host,
            Password = _dbOptions.Password,
            Port = _dbOptions.Port,
            Username = _dbOptions.Username
        };
        var connection = new NpgsqlConnection(builder.ToString());
        connection.Open();
        return connection;


    }

    public async Task<IDbConnection> GetConnectionAsync()
    {
        // use a connection builder  for postgres to create a connection string
        var builder = new NpgsqlConnectionStringBuilder
        {
            Database = _dbOptions.Database,
            Host = _dbOptions.Host,
            Password = _dbOptions.Password,
            Port = _dbOptions.Port,
            Username = _dbOptions.Username,
            Pooling = true,
            MinPoolSize = 1,
            MaxPoolSize = 10
        };
        var connection = new NpgsqlConnection(builder.ToString());
        await connection.OpenAsync();
        return connection;
    }
}
