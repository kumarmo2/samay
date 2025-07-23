# Use the official .NET 8 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /samay/backend

# COPY libs/dotnet-libs/ ./
# Copy csproj and restore as distinct layers
COPY backend/*.sln ./

COPY  backend/Scheduler.Api/*.csproj ./Scheduler.Api/
COPY  backend/Scheduler.DataAccess/*.csproj ./Scheduler.DataAccess/
COPY  backend/Scheduler.Dtos/*.csproj ./Scheduler.Dtos/
COPY  backend/Scheduler.Models/*.csproj ./Scheduler.Models/
COPY libs/dotnet-libs/Kumarmo2.Rabbitmq/*.csproj /samay/libs/dotnet-libs/Kumarmo2.Rabbitmq/

RUN dotnet restore

# Copy everything else and build
COPY backend/ ./
COPY libs/dotnet-libs/Kumarmo2.Rabbitmq /samay/libs/dotnet-libs/Kumarmo2.Rabbitmq
WORKDIR /samay/backend/Scheduler.Api

RUN dotnet publish -c Release -o /app/publish

# Use the official .NET 8 runtime image for the final container
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
# Expose port (adjust if your app listens on a different port)
EXPOSE 8080

# Run the application
ENTRYPOINT ["dotnet", "Scheduler.Api.dll"]

