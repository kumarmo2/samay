using Scheduler.Models;
using Dapper;

namespace Scheduler.DataAccess.Schedules;


public class SchedulerDao(IDatabaseConnectionFactory dbConnectionFactory) : IScheduleDao
{
    private readonly IDatabaseConnectionFactory _dbConnectionFactory = dbConnectionFactory;

    public Task<int> Create(Schedule schedule)
    {
        var query = "insert into scheduler.schedules (srcpath, destpath, cronexpression) values (@srcPath, @destPath, @cronExpression) returning id";
        using var conn = dbConnectionFactory.GetConnection();
        return conn.QuerySingleAsync<int>(query, schedule);
    }

    public async Task<Schedule> GetForSourceAndDest(string srcPath, string destPath)
    {
        var query = "select * from scheduler.schedules where srcpath = @srcPath and destpath = @destPath";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return await conn.QueryFirstAsync<Schedule>(query, new { srcPath, destPath });
    }

    public async Task<List<Schedule>> List()
    {
        var query = "select * from scheduler.schedules";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return [.. await conn.QueryAsync<Schedule>(query)];
    }
}
