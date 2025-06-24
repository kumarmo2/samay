using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Scheduler.DataAccess.Schedules;
using Scheduler.Dtos;

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
        var schedules = await _scheduleDao.List();
        Console.WriteLine($"number of schedules: {schedules.Count}");

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
