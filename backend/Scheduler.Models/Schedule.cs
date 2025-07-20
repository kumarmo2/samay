namespace Scheduler.Models;

public class Schedule
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string SrcPath { get; set; } = null!;

    public string DestPath { get; set; } = null!;
    // NOTE: because `nullable` is enabled, in the default constructor we are not providing any 
    // value to the "non-nullable" properties. so the compiler will give warnings/error for it.
    // so either we need use `required` modifier or `null!` to fix.

    public required string CronExpression { get; set; }
    public bool Enabled { get; set; }
}

public class BackupRun
{
    public int Id { get; set; }

    public int ScheduleId { get; set; }

    public int BackupRunType { get; set; }

    public int Status { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int? ExitCode { get; set; }

    public string? Logs { get; set; }
}

