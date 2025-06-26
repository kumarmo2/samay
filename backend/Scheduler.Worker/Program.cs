using Scheduler.Worker;
using Scheduler.DataAccess;
using Scheduler.DataAccess.Schedules;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<Worker>();
var services = builder.Services;

services.AddDatabaseConnection(builder.Configuration);
services.AddSingleton<IScheduleDao, SchedulerDao>();

services.AddSingleton<IBackupService, BackupService>();


var sp = services.BuildServiceProvider();
sp.GetService<IBackupService>()?.Start();


var host = builder.Build();
host.Run();
