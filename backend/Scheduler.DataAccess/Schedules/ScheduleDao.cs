using Scheduler.Models;
using Dapper;

namespace Scheduler.DataAccess.Schedules;


public class SchedulerDao(IDatabaseConnectionFactory dbConnectionFactory) : IScheduleDao
{
    private readonly IDatabaseConnectionFactory _dbConnectionFactory = dbConnectionFactory;

    public async Task<List<Schedule>> List()
    {
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        var query = "select * from scheduler.schedules";
        return [.. await conn.QueryAsync<Schedule>(query)];
    }
}
