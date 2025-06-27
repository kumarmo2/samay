# Use the official .NET 8 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy csproj and restore as distinct layers
COPY *.sln ./

COPY  Scheduler.Api/*.csproj ./Scheduler.Api/
COPY  Scheduler.DataAccess/*.csproj ./Scheduler.DataAccess/
COPY  Scheduler.Dtos/*.csproj ./Scheduler.Dtos/
COPY  Scheduler.Models/*.csproj ./Scheduler.Models/

RUN dotnet restore

# Copy everything else and build
COPY . ./
WORKDIR /src/Scheduler.Api

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

