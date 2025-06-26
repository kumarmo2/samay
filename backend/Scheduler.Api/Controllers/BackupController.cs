using Microsoft.AspNetCore.Mvc;
using Scheduler.DataAccess.Schedules;
using Scheduler.Dtos;
using sm = Scheduler.Models;

namespace Scheduler.Api.Controllers;


public class BackupController(IScheduleDao scheduleDao) : BaseApiController
{
    private readonly IScheduleDao _scheduleDao = scheduleDao;

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

        Console.WriteLine($"schedule: will create the schedule");
        var id = await _scheduleDao.Create(newSchedule);
        Console.WriteLine($"schedule: created the schedule with id: {id}");
        if (id <= 0)
        {
            return Ok(new ApiResult<object, string>("Internal server error"));
        }
        return Ok(new ApiResult<int, string>(id));
    }

    [HttpGet("schedules")]
    public async Task<IActionResult> GetBackupSchedules()
    {
        var schedules = await _scheduleDao.List() ?? Enumerable.Empty<sm.Schedule>();
        return Ok(new ApiResult<IEnumerable<sm.Schedule>, string>(schedules));
    }
}
