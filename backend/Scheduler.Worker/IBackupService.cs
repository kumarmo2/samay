namespace Scheduler.Worker;

using Scheduler.Models;

public interface IBackupService
{
    Task Submit(Schedule schedule);
    void Start();
}
