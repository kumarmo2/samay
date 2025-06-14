
using Microsoft.AspNetCore.Mvc;

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

        var directories = Directory.GetDirectories(path);

        return Ok(directories);
    }
}
