namespace Scheduler.DataAccess.Schedules;

using Scheduler.Models;

public interface IBackupRunDao
{
    Task<int> Create(BackupRun backupRun);
}
