using Kumarmo2.Rabbitmq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Scheduler.Api.Utils;
using Scheduler.DataAccess.Schedules;
using Scheduler.Dtos;
using Scheduler.Models;
using sm = Scheduler.Models;

namespace Scheduler.Api.Controllers;


public class BackupController(IScheduleDao scheduleDao,
        ILogger<BackupController> logger,
        IRabbitMqManager rabbitMqManager,
        IBackupRunDao backupRunDao) : BaseApiController
{
    private readonly IScheduleDao _scheduleDao = scheduleDao;
    private readonly ILogger<BackupController> _logger = logger;
    private readonly IRabbitMqManager _rabbitMqManager = rabbitMqManager;
    private readonly IBackupRunDao _backupRunDao = backupRunDao;

    [HttpPost]
    public async Task<IActionResult> CreateBackupSchedule([FromBody] BackupScheduleRequest? request)
    {
        if (request == null)
        {
            return BadRequest("Request cannot be null.");
        }
        Console.WriteLine($"request.srcpath: {request.SrcPath}, request.destpath: {request.DestPath}");
        Console.WriteLine($"request.cronExpression: {request.CronExpression}");
        var schedules = await _scheduleDao.List();
        Console.WriteLine($"number of schedules: {schedules.Count}");

        // TODO: do proper validation for cron expression.
        if (request.CronExpression.Length == 0)
        {
            return Ok(new ApiResult<object, string>("Cron expression cannot be empty."));
        }

        var srcExists = Directory.Exists(request.SrcPath);
        if (!srcExists)
        {
            return Ok(new ApiResult<object, string>("Source path does not exist."));
        }
        var destExists = Directory.Exists(request.DestPath);
        if (!destExists)
        {
            return Ok(new ApiResult<object, string>("Destination path does not exist."));
        }
        if (request.SrcPath == request.DestPath)
        {
            return Ok(new ApiResult<object, string>("Source and destination paths cannot be same."));
        }
        Console.WriteLine($"srcExists: {srcExists}, destExists: {destExists}");
        var schedule = await _scheduleDao.GetForSourceAndDest(request.SrcPath, request.DestPath);
        if (schedule != null && schedule.Id > 0)
        {
            return Ok(new ApiResult<object, string>("Schedule already exists."));
        }

        var newSchedule = new sm.Schedule()
        {
            SrcPath = request.SrcPath,
            DestPath = request.DestPath,
            CronExpression = request.CronExpression
        };
        var id = await _scheduleDao.Create(newSchedule);
        if (id <= 0)
        {
            return Ok(new ApiResult<object, string>("Internal server error"));
        }
        return Ok(new ApiResult<int, string>(id));
    }

    [HttpGet("schedules")]
    public async Task<IActionResult> GetBackupSchedules()
    {
        var schedules = await _scheduleDao.GetDashboardList() ?? Enumerable.Empty<ScheduleDashoardItem>();
        return Ok(new ApiResult<IEnumerable<ScheduleDashoardItem>, string>(schedules));
    }


    [HttpGet("schedules/{id}")]
    public async Task<IActionResult> GetSchedule(int id)
    {
        var schedule = await _scheduleDao.Get(id);
        return Ok(new ApiResult<sm.Schedule, string>(schedule));
    }

    [HttpPost("schedules/{id}/run")]
    public async Task<IActionResult> RunNow(int id)
    {
        if (id < 1)
        {
            return BadRequest(new ApiResult<object, string>("Invalid id"));
        }
        var scheduleTask = _scheduleDao.Get(id);
        var backupRun = _scheduleDao.GetAnyNotCompletedRun(id);

        await Task.WhenAll(scheduleTask, backupRun);
        if (scheduleTask.Result is null)
        {
            return BadRequest(new ApiResult<object, string>("Schedule does not exist"));
        }
        if (backupRun.Result is not null)
        {
            return Ok(new ApiResult<object, string>("Backup run is pending"));
        }

        var run = new BackupRun
        {
            BackupRunType = Constants.AdhocBackupRunTypeId,
            ScheduleId = id,
            Status = Constants.SubmittedBackupRunStatus,
        };

        var backupRunId = await _backupRunDao.Create(run);
        if (backupRunId <= 0)
        {
            return Ok(new ApiResult<object, string>("Internal server error"));
        }

        var dashboardItem = new ScheduleDashoardItem
        {
            Id = id,
            CronExpression = scheduleTask.Result.CronExpression,
            DestPath = scheduleTask.Result.DestPath,
            Enabled = scheduleTask.Result.Enabled,
            Name = scheduleTask.Result.Name,
            SrcPath = scheduleTask.Result.SrcPath,
            LastStartTime = run.StartTime,
            LastCompletedAt = null,
            ExitCode = null,
        };
        // TODO: send message to rabbitmq

        return Ok(new ApiResult<ScheduleDashoardItem, string>(dashboardItem));
    }

    [HttpPut("schedules/{id}/update")]
    public async Task<IActionResult> PartialUpdate(int id, [FromBody] BackupSchedulePartialUpdateRequest request)
    {
        if (request == null)
        {
            return BadRequest(new ApiResult<object, string>("Request cannot be null"));
        }
        var isAnythingChanged = false;
        if (request.Enabled != null)
        {
            isAnythingChanged = true;
        }

        if (!isAnythingChanged)
        {
            return Ok(new ApiResult<object, string>("Nothing to update"));
        }

        var schedule = await _scheduleDao.Get(id);
        if (schedule == null || schedule.Id != id)
        {
            return Ok(new ApiResult<object, string>("Schedule does not exist"));
        }

        await _scheduleDao.PartialUpdate(id, request);
        return Ok(new ApiResult<string, object>("updated"));
    }

    [HttpPut("schedules/{id}")]
    public async Task<IActionResult> Edit(int id, [FromBody] BackupScheduleRequest request)
    {
        if (request == null)
        {
            return BadRequest(new ApiResult<object, string>("Request cannot be null"));
        }
        if (id <= 0)
        {
            return BadRequest(new ApiResult<object, string>("Invalid id"));
        }
        var schedule = await _scheduleDao.Get(id);
        if (schedule == null)
        {
            return BadRequest(new ApiResult<object, string>("Schedule does not exist"));
        }
        schedule.CronExpression = request.CronExpression;
        schedule.SrcPath = request.SrcPath;
        schedule.DestPath = request.DestPath;
        await _scheduleDao.Update(schedule);
        return Ok(new ApiResult<string, object>("updated"));
    }

    [HttpDelete("schedules/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await _scheduleDao.Get(id);
        if (schedule == null)
        {
            return BadRequest(new ApiResult<object, string>("Schedule does not exist"));
        }
        await _scheduleDao.Delete(id);
        return Ok(new ApiResult<string, object>("deleted"));
    }
}
