
using Microsoft.AspNetCore.Mvc;
using Scheduler.Dtos;

namespace Scheduler.Api.Controllers;

public class FilesController : BaseApiController
{

    [HttpGet("")]
    public IActionResult GetFiles(string path = "/")
    {
        if (string.IsNullOrEmpty(path))
        {
            // TODO: return json error.
            return BadRequest("Path cannot be empty or null.");
        }
        if (!Directory.Exists(path))
        {
            return NotFound("Directory does not exist.");
        }

        IEnumerable<string> directories = Directory.GetDirectories(path);

        // TODO: write unit test for excluding hidden directories.
        directories = directories.Where(dirPath =>
        {
            var pathSlice = dirPath.AsSpan();
            var lastSlashIndex = pathSlice.LastIndexOf('/');
            if (lastSlashIndex == pathSlice.Length - 1)
            {
                pathSlice = pathSlice[..^1];
            }

            lastSlashIndex = pathSlice.LastIndexOf('/');

            var folderName = pathSlice[(lastSlashIndex + 1)..];
            return !folderName.StartsWith(".");
        });
        ApiResult<IEnumerable<string>, object> result = new(directories);

        return Ok(result);
    }
}
