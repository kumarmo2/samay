using Scheduler.Models;

namespace Scheduler.DataAccess.Schedules;

public interface IScheduleDao
{
    Task<List<Schedule>> List();

}
