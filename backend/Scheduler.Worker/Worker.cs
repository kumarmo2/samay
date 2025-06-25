using Scheduler.DataAccess.Schedules;
using Scheduler.Models;

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
            var schedules = await _scheduleDao.List() ?? [];
            _logger.LogInformation($"count of schedules: {schedules.Count}");
            await Task.Delay(1000, stoppingToken);
        }
    }
}
