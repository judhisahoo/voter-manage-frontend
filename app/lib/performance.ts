export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint?: number;
}

export function trackPageMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const perfData = window.performance.timing;
  const navStart = perfData.navigationStart;

  const metrics: PerformanceMetrics = {
    pageLoadTime: perfData.loadEventEnd - navStart,
    timeToInteractive: perfData.domContentLoadedEventEnd - navStart,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance Metrics:', metrics);
  }

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_load', {
      page_load_time: metrics.pageLoadTime,
      time_to_interactive: metrics.timeToInteractive,
    });
  }

  return metrics;
}

export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance Metrics:', metrics);
  }
}