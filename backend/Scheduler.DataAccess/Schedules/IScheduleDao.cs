using Scheduler.Models;

namespace Scheduler.DataAccess.Schedules;

public interface IScheduleDao
{
    Task<List<Schedule>> List();
    Task<Schedule?> GetForSourceAndDest(string srcPath, string destPath);
    Task<int> Create(Schedule schedule);
}
