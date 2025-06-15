using System.Text.Json;
using System.Text.Json.Serialization;

namespace Schedule.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var services = builder.Services;
        services.AddControllers();

        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.SerializerOptions.IgnoreReadOnlyProperties = true;
        });

        var app = builder.Build();

        app.MapControllers();

        app.Run();
    }
}
