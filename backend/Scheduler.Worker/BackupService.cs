namespace Scheduler.Worker;

using System.Diagnostics;
using System.Threading.Channels;
using Scheduler.Models;

public class BackupService : IBackupService
{
    private readonly ILogger<BackupService> _logger;
    private readonly Channel<Func<Task>> _channel;
    private readonly int _parallelism;
    public BackupService(ILogger<BackupService> logger, int parallelism = 2)
    {
        _parallelism = parallelism;
        _logger = logger;
        _channel = Channel.CreateUnbounded<Func<Task>>();
        _parallelism = parallelism;
    }

    public void Start()
    {
        _logger.LogInformation("BackupService.Start");
        for (int i = 0; i < _parallelism; i++)
        {

            Task.Run(async () =>
                    {

                        await foreach (var item in _channel.Reader.ReadAllAsync())
                        {
                            _logger.LogInformation("BackupService.Start.loop {i}: ", i);
                            var action = await _channel.Reader.ReadAsync();
                            _logger.LogInformation("BackupService.Start.loop {i}: picked action", i);
                            await Task.Delay(1000);
                            await action();
                        }


                        // while (true)
                        // {
                        //     _logger.LogInformation("BackupService.Start.loop {i}: ", i);
                        //     var action = await _channel.Reader.ReadAsync();
                        //     _logger.LogInformation("BackupService.Start.loop {i}: picked action", i);
                        //     await Task.Delay(1000);
                        //     await action();
                        // }
                    });
        }
        // Task.WaitAll(tasks);
    }

    public async Task Submit(Schedule schedule)
    {
        _logger.LogInformation("BackupService.Submit");
        await _channel.Writer.WriteAsync(async () => await RunSchedule(schedule));
        _logger.LogInformation("BackupService.Submit.done");
    }



    private async Task RunSchedule(Schedule schedule)
    {
        // TODO: let the worker fail if in the start only rsync is not found in path.
        _logger.LogInformation("Running backup: {schedule.SrcPath} -> {schedule.DestPath}", schedule.SrcPath, schedule.DestPath);
        var psi = new ProcessStartInfo
        {
            FileName = "rsync",
            ArgumentList = { "-rPavh", schedule.SrcPath, schedule.DestPath },
            RedirectStandardOutput = false,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        var process = Process.Start(psi);

        if (process is null)
        {
            _logger.LogError("Failed to start the backup process.");
            return;
        }

        await process.WaitForExitAsync();
        if (process.ExitCode != 0)
        {
            _logger.LogError("backup error: {error}", process.StandardError.ReadToEnd());
            return;
        }
        _logger.LogInformation("backup success: {schedule.SrcPath} -> {schedule.DestPath}", schedule.SrcPath, schedule.DestPath);
    }
}
