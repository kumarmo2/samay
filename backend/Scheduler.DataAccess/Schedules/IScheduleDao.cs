using Scheduler.Models;

namespace Scheduler.DataAccess.Schedules;

public interface IScheduleDao
{
    Task<List<Schedule>> List();
    Task<Schedule?> GetForSourceAndDest(string srcPath, string destPath);
    Task<Schedule?> Get(int id);
    Task Update(Schedule schedule);
    Task Delete(int id);
    Task<int> Create(Schedule schedule);
}
