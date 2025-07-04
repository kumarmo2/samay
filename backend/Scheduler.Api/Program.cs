using System.Text.Json;
using System.Text.Json.Serialization;
using Scheduler.DataAccess;
using Scheduler.DataAccess.Schedules;

namespace Schedule.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var services = builder.Services;
        services.AddControllers();
        services.AddDatabaseConnection(builder.Configuration);


        services.AddSingleton<IScheduleDao, SchedulerDao>();

        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.SerializerOptions.IgnoreReadOnlyProperties = true;
        });

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.MapControllers();

        app.Run();
    }
}
