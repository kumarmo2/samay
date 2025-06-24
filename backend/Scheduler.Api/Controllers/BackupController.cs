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




        // if (request.SrcPath == request.DestPath)
        // {
        //     throw new Exception("srcpath and destpath cannot be same");
        // }
        // var psi = new ProcessStartInfo
        // {
        //     FileName = "rsync",
        //     ArgumentList = { "-rPavh", request.SrcPath, request.DestPath },
        //     RedirectStandardOutput = false,
        //     RedirectStandardError = true,
        //     UseShellExecute = false,
        //     CreateNoWindow = true
        // };
        // var process = Process.Start(psi);
        // if (process is null)
        // {
        //     return Ok(new ApiResult<object, string>("Failed to start the backup process."));
        // }
        // await process.WaitForExitAsync();
        // if (process.ExitCode != 0)
        // {
        //     Console.WriteLine($"backup error: {process.StandardError}");
        //     return new ObjectResult(new ApiResult<object, string>("Internal server error"))
        //     {
        //         StatusCode = 500
        //     };
        // }
        return Ok(new ApiResult<object, string>(new { }));
    }
}
