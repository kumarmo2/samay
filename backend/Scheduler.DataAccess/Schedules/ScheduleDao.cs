using Scheduler.Models;
using Dapper;
using Scheduler.Dtos;

namespace Scheduler.DataAccess.Schedules;


public class SchedulerDao(IDatabaseConnectionFactory dbConnectionFactory) : IScheduleDao
{
    private readonly IDatabaseConnectionFactory _dbConnectionFactory = dbConnectionFactory;

    public async Task<int> Create(Schedule schedule)
    {
        var query = "insert into scheduler.schedules (srcpath, destpath, cronexpression) values (@srcPath, @destPath, @cronExpression) returning id";
        using var conn = dbConnectionFactory.GetConnection();
        return await conn.ExecuteScalarAsync<int>(query, schedule);
    }

    public async Task Delete(int id)
    {
        var query = "delete from scheduler.schedules where id = @id";
        using var conn = dbConnectionFactory.GetConnection();
        await conn.ExecuteAsync(query, new { id });
    }

    public async Task<Schedule?> Get(int id)
    {
        var query = "select * from scheduler.schedules where id = @id";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return await conn.QuerySingleOrDefaultAsync<Schedule>(query, new { id });
    }

    public async Task<Schedule?> GetForSourceAndDest(string srcPath, string destPath)
    {
        var query = "select * from scheduler.schedules where srcpath = @srcPath and destpath = @destPath";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return await conn.QueryFirstOrDefaultAsync<Schedule>(query, new { srcPath, destPath });
    }

    public async Task<List<Schedule>> List()
    {
        var query = "select * from scheduler.schedules order by id";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return [.. await conn.QueryAsync<Schedule>(query)];
    }


    public async Task<List<ScheduleDashoardItem>> GetDashboardList()
    {
        var query = @"
            with cte as (
                    select scheduleid, completedat, starttime, exitcode, rank() over (partition by scheduleid order by starttime desc) as rank
                    from scheduler.backupruns
            )
            select s.*, c.completedat as lastcompletedat, c.starttime as laststarttime, c.exitcode as exitcode
            from scheduler.schedules s left join cte c on s.id = c.scheduleid and c.rank = 1
            order by id";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return [.. await conn.QueryAsync<ScheduleDashoardItem>(query)];
    }

    public async Task<BackupRun?> GetAnyNotCompletedRun(int scheduleId)
    {
        var query = @"
            select id, scheduleid, completedat from scheduler.backupruns where scheduleid = @scheduleId and completedat is null
            order by starttime desc
            limit 1
            ";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        return await conn.QueryFirstOrDefaultAsync<BackupRun>(query, new { scheduleId });
    }

    public async Task Update(Schedule schedule)
    {
        var query = "update scheduler.schedules set name = @name, srcpath = @srcPath, destpath = @destPath, cronexpression = @cronExpression where id = @id";
        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        await conn.ExecuteAsync(query, schedule);
    }

    public async Task PartialUpdate(int id, BackupSchedulePartialUpdateRequest request)
    {
        var parameters = new DynamicParameters();
        parameters.Add("id", id);

        var columns = new List<string>();
        if (request.Enabled != null)
        {
            columns.Add("enabled");
            parameters.Add("enabled", request.Enabled);
        }

        var query = $"update scheduler.schedules set\n";
        var setColumns = new List<string>();
        foreach (var column in columns)
        {
            setColumns.Add($" {column} = @{column}");
        }
        query += string.Join(",\n", setColumns);
        query += "\nwhere id = @id";


        using var conn = await _dbConnectionFactory.GetConnectionAsync();
        await conn.ExecuteAsync(query, parameters);
    }
}
