using Scheduler.DataAccess.Schedules;
using Scheduler.Models;
using NCrontab;

namespace Scheduler.Worker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IScheduleDao _scheduleDao;

    public Worker(ILogger<Worker> logger, IScheduleDao scheduleDao)
    {
        _logger = logger;
        _scheduleDao = scheduleDao;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            }
            var now = DateTime.Now;
            var schedules = await _scheduleDao.List() ?? [];
            _logger.LogInformation($"count of schedules: {schedules.Count}");

            foreach (var schedule in schedules)
            {
                var crontabSchedule = CrontabSchedule.Parse(schedule.CronExpression);
                var previous = crontabSchedule.GetNextOccurrence(now.AddMinutes(-2)); // TODO: i need to do testing for when i add support 
                // for the "every" in cron expression. eg: "every minute" , "every hour" etc
                if (previous.Year != now.Year)
                {
                    continue;
                }
                if (previous.Month != now.Month)
                {
                    continue;
                }
                if (previous.Day != now.Day)
                {
                    continue;
                }
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
