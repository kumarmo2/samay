namespace Scheduler.Dtos;


public class BackupScheduleRequest
{
    public string SrcPath { get; set; } = string.Empty;
    public string DestPath { get; set; } = string.Empty;
    public string CronExpression { get; set; } = string.Empty;
}

