using Scheduler.DataAccess.Schedules;
using Scheduler.Models;
using NCrontab;

namespace Scheduler.Worker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IScheduleDao _scheduleDao;
    private readonly IBackupService _backupService;

    public Worker(ILogger<Worker> logger, IScheduleDao scheduleDao, IBackupService backupService)
    {
        _logger = logger;
        _scheduleDao = scheduleDao;
        _backupService = backupService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            }
            var schedules = await _scheduleDao.List() ?? [];
            // TODO: fix logging. use templated logging
            _logger.LogInformation($"count of schedules: {schedules.Count}");

            foreach (var schedule in schedules)
            {
                var crontabSchedule = CrontabSchedule.Parse(schedule.CronExpression);
                var previous = crontabSchedule.GetNextOccurrence(now.AddSeconds(-70)); // TODO: i need to do testing for when i add support 
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
                if (previous.Hour != now.Hour)
                {
                    continue;
                }
                if (previous.Minute != now.Minute)
                {
                    continue;
                }
                _logger.LogInformation("will execute schedule: {cronExpression}", schedule.CronExpression);
                _ = _backupService.Submit(schedule);
            }
            await Task.Delay(60000, stoppingToken);
        }
    }
}
