using System.Data;
using System.Data.Common;

namespace Scheduler.DataAccess;

public interface IDatabaseConnectionFactory
{
    IDbConnection GetConnection();
    Task<IDbConnection> GetConnectionAsync();
}
