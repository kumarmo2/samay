using System.Text.Json;
using System.Text.Json.Serialization;
using Scheduler.DataAccess;
using Scheduler.DataAccess.Schedules;
using Kumarmo2.Rabbitmq;
using Microsoft.Extensions.Options;

namespace Schedule.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var services = builder.Services;
        services.AddControllers();
        services.AddLogging();
        services.AddDatabaseConnection(builder.Configuration);
        services.AddRabbitMq(builder.Configuration);
        services.Configure<QueueConfig>(builder.Configuration.GetSection(QueueConfig.ConfigKey));


        services.AddSingleton<IScheduleDao, SchedulerDao>();
        services.AddSingleton<IBackupRunDao, BackupRunDao>();

        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.SerializerOptions.IgnoreReadOnlyProperties = true;
        });

        EnsureQueues(services);


        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.MapControllers();

        app.Run();
    }

    private static void EnsureQueues(IServiceCollection services)
    {
        var sp = services.BuildServiceProvider();
        var queueConfig = sp.GetService<IOptions<QueueConfig>>();
        var rabbitMqManager = sp.GetService<IRabbitMqManager>();

        rabbitMqManager?.EnsureQueuesAsync(queueConfig?.Value?.Queues ?? Enumerable.Empty<QueueOptions>()).Wait();
    }
}


