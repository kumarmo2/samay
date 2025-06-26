using Scheduler.Worker;
using Scheduler.DataAccess;
using Scheduler.DataAccess.Schedules;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<Worker>();
var services = builder.Services;

services.AddDatabaseConnection(builder.Configuration);
services.AddSingleton<IScheduleDao, SchedulerDao>();

// services.AddSingleton<IBackupService, BackupService>();


var sp = services.BuildServiceProvider();
var bs = new BackupService(sp.GetRequiredService<ILogger<BackupService>>(), 2);
services.AddSingleton<IBackupService>(bs);


var host = builder.Build();
host.Run();
