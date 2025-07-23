namespace Scheduler.DataAccess.Schedules;

using Dapper;
using Scheduler.Models;


public class BackupRunDao(IDatabaseConnectionFactory dbConnectionFactory) : IBackupRunDao
{
    private readonly IDatabaseConnectionFactory _dbConnectionFactory = dbConnectionFactory;

    public async Task<int> Create(BackupRun backupRun)
    {
        var query = @"insert into scheduler.backupruns
            (backupruntype, scheduleid, status, starttime, completedat, exitcode, logs)
            values (@backupRunType, @scheduleId, @status, @startTime, @completedAt, @exitCode, @logs) returning id";
        using var conn = _dbConnectionFactory.GetConnection();
        return await conn.ExecuteScalarAsync<int>(query, new
        {
            backupRunType = backupRun.BackupRunType,
            scheduleId = backupRun.ScheduleId,
            status = backupRun.Status,
            startTime = backupRun.StartTime,
            completedAt = backupRun.CompletedAt,
            exitCode = backupRun.ExitCode,
            logs = backupRun.Logs,
        });
    }
}
