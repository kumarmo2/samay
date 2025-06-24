using System.Collections.Generic;
using Scheduler.Models;

namespace Scheduler.DataAccess.Schedules;


public class SchedulerDao(IDatabaseConnectionFactory dbConnectionFactory)
{
    private readonly IDatabaseConnectionFactory _dbConnectionFactory = dbConnectionFactory;


    //     public async Task<IEnumerable<Scheduler.Models.>> Get();
    //     {
    //         throw new NotImplementedException();
    // }
}
