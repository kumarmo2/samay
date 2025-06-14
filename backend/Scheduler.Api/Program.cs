namespace Schedule.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var services = builder.Services;
        services.AddControllers();
        var app = builder.Build();

        app.MapControllers();

        app.Run();
    }
}
