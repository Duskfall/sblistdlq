# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["backend/ServiceBusMonitor.Api/ServiceBusMonitor.Api.csproj", "./"]
RUN dotnet restore
COPY ["backend/ServiceBusMonitor.Api/", "./"]
RUN dotnet build "ServiceBusMonitor.Api.csproj" -c Release -o /app/build
RUN dotnet publish "ServiceBusMonitor.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ServiceBusMonitor.Api.dll"]
