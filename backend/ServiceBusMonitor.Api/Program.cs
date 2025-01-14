using Azure.Messaging.ServiceBus;
using Microsoft.Azure.Amqp.Framing;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Service Bus Monitor API", Version = "v1" });
});
builder.Services.AddCors();

// Add ServiceBusClient
builder.Services.AddSingleton(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetValue<string>("ServiceBus:ConnectionString") ??
        "Endpoint=sb://servicebus-emulator:5672;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;";
    
    var options = new ServiceBusClientOptions
    {
        TransportType = ServiceBusTransportType.AmqpTcp,
        RetryOptions = new ServiceBusRetryOptions
        {
            MaxRetries = 3,
            Delay = TimeSpan.FromSeconds(1),
            MaxDelay = TimeSpan.FromSeconds(3),
            Mode = ServiceBusRetryMode.Fixed
        }
    };
    
    return new ServiceBusClient(connectionString, options);
});

var app = builder.Build();

// Configure middleware in correct order
app.UseRouting();
app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c => 
    {
        c.RouteTemplate = "swagger/{documentName}/swagger.json";
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Service Bus Monitor API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseEndpoints(endpoints =>
{
    // Test endpoint to verify API is working
    endpoints.MapGet("/", () => "Service Bus Monitor API is running");

    // Metrics endpoint
    endpoints.MapGet("/api/metrics", async (ServiceBusClient serviceBusClient) =>
    {
        try
        {
            // Get queue info using receiver
            var queues = new List<object>();
            var queueReceiver = serviceBusClient.CreateReceiver("test-queue");
            ServiceBusSender sender = serviceBusClient.CreateSender("test-queue");

            ServiceBusMessage message = new ServiceBusMessage("Your DLQ Message");
            await sender.SendMessageAsync(message);
            var receivedMessage = await queueReceiver.ReceiveMessageAsync();
            await queueReceiver.DeadLetterMessageAsync(receivedMessage);

            ServiceBusReceiver dlqReceiver = serviceBusClient.CreateReceiver("test-queue", new ServiceBusReceiverOptions
            {
                SubQueue = SubQueue.DeadLetter,
                ReceiveMode = ServiceBusReceiveMode.PeekLock
            });
            var messages = await dlqReceiver.ReceiveMessagesAsync(1);

            await queueReceiver.DisposeAsync();

            queues.Add(new
            {
                name = "test-queue",
                messageCount = receivedMessage != null ? 1 : 0,
                deadLetterCount = 0,
                status = "Active"
            });

            // Get topic info
            var topics = new List<object>();
            topics.Add(new
            {
                name = "test-topic",
                subscriptionCount = 1,
                status = "Active"
            });

            // Get subscription info using receiver
            var subscriptions = new List<object>();
            var subReceiver = serviceBusClient.CreateReceiver("test-topic", "test-subscription");
            var subPeekMessage = await subReceiver.PeekMessageAsync();
            await subReceiver.DisposeAsync();

            subscriptions.Add(new
            {
                name = "test-subscription",
                topicName = "test-topic",
                messageCount = subPeekMessage != null ? 1 : 0,
                deadLetterCount = 0,
                status = "Active"
            });

            return Results.Ok(new
            {
                queues,
                topics,
                subscriptions,
                messages
            });
        }
        catch (Exception ex)
        {
            return Results.BadRequest($"Error: {ex.Message}");
        }
    });

    // Test message endpoint
    endpoints.MapPost("/api/test/{queueName}", async (string queueName, ServiceBusClient serviceBusClient) =>
    {
        var sender = serviceBusClient.CreateSender(queueName);
        var message = new ServiceBusMessage("Test message")
        {
            MessageId = Guid.NewGuid().ToString()
        };
        
        try
        {
            await sender.SendMessageAsync(message);
            // Force message to dead letter by abandoning it multiple times
            var receiver = serviceBusClient.CreateReceiver(queueName);
            var receivedMessage = await receiver.ReceiveMessageAsync();
            await receiver.DeadLetterMessageAsync(receivedMessage);
            var wait = new System.TimeSpan(0, 0, 2);
            var     DeadLetterQueuePath = "test-queue" + "/$DeadLetterQueue";


            ServiceBusReceiver dlqReceiver = serviceBusClient.CreateReceiver("test-queue", new ServiceBusReceiverOptions
            {
                SubQueue = SubQueue.DeadLetter,
                ReceiveMode = ServiceBusReceiveMode.PeekLock
            });
            var messages = await dlqReceiver.ReceiveMessagesAsync(10, wait);
            await receiver.DisposeAsync();
            await sender.DisposeAsync();
            
            return Results.Ok("Test message sent and abandoned");
        }
        catch (Exception ex)
        {
            return Results.BadRequest($"Error: {ex.Message}");
        }
    });
});

app.Run(); 