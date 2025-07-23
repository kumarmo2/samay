using System.Text.Json.Serialization;
using Scheduler.Models;
namespace Scheduler.Dtos;


public class BackupScheduleRequest
{
    public string SrcPath { get; set; } = string.Empty;
    public string DestPath { get; set; } = string.Empty;
    public string CronExpression { get; set; } = string.Empty;
}

public class BackupSchedulePartialUpdateRequest
{
    public bool? Enabled { get; set; }
}


public class ScheduleDashoardItem : Schedule
{
    public DateTime? LastCompletedAt { get; set; }
    public DateTime? LastStartTime { get; set; }
    public int? ExitCode { get; set; }
    public int? LatestRunId { get; set; }
}

public class AdhocBackupRunEvent
{
    [JsonPropertyName("runId")]
    public int RunId { get; set; }
}


