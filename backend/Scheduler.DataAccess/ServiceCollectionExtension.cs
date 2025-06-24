using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Scheduler.DataAccess;

public static class ServiceCollectionExtension
{
    public static IServiceCollection AddDatabaseConnection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IDatabaseConnectionFactory, DatabaseConnectionFactory>();
        services.Configure<DbOptions>(configuration.GetSection(DbOptions.Key));
        return services;
    }
}
