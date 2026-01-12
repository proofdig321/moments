export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Unami Foundation Moments API',
    version: '1.0.0'
  };
}