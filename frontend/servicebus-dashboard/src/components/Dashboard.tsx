import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { serviceBusService } from '../services/serviceBusService';
import { ServiceBusMetrics } from '../types/servicebus';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ServiceBusMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await serviceBusService.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Service Bus metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Service Bus Monitor
      </Typography>

      <Grid container spacing={3}>
        {/* Queues Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Queues
            </Typography>
            <Grid container spacing={2}>
              {metrics?.queues.map((queue) => (
                <Grid item xs={12} sm={6} md={4} key={queue.name}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{queue.name}</Typography>
                      <Typography>Messages: {queue.messageCount}</Typography>
                      <Typography>Dead Letter: {queue.deadLetterCount}</Typography>
                      <Typography>Status: {queue.status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Messages Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
            Messages
            </Typography>
            <Grid container spacing={6}>
              {metrics?.messages.map((message) => (
                <Grid item xs={12} sm={6} md={4} key={message.applicationProperties['Diagnostic-Id']}>
                  <Card>
                    <CardContent>
                      <Typography>Id: {message.messageId}</Typography>
                      <Typography>Dead Letter: {message.body.toString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Topics Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Topics
            </Typography>
            <Grid container spacing={2}>
              {metrics?.topics.map((topic) => (
                <Grid item xs={12} sm={6} md={4} key={topic.name}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{topic.name}</Typography>
                      <Typography>Subscriptions: {topic.subscriptionCount}</Typography>
                      <Typography>Status: {topic.status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Subscriptions Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Subscriptions
            </Typography>
            <Grid container spacing={2}>
              {metrics?.subscriptions.map((sub) => (
                <Grid item xs={12} sm={6} md={4} key={`${sub.topicName}-${sub.name}`}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{sub.name}</Typography>
                      <Typography>Topic: {sub.topicName}</Typography>
                      <Typography>Messages: {sub.messageCount}</Typography>
                      <Typography>Dead Letter: {sub.deadLetterCount}</Typography>
                      <Typography>Status: {sub.status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={2} display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={fetchMetrics}>
          Refresh
        </Button>
      </Box>
    </Container>
  );
}; 