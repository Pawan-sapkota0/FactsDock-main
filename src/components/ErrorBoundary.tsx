/**
 * Error Boundary for Feature Isolation
 *
 * Prevents failures in one feature from cascading to others.
 * If weather fails, weather fails silently - content continues.
 * If images fail, show placeholder - rest of page loads.
 *
 * PRINCIPLE: Failures are LOCAL, not GLOBAL
 */

import React, { ReactNode, ReactElement } from "react";
import logger from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactElement;
  onError?: (error: Error) => void;
  featureName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary Component
 * Catches errors in child components and renders fallback
 *
 * Usage:
 * <FeatureErrorBoundary featureName="weather">
 *   <WeatherWidget />
 * </FeatureErrorBoundary>
 *
 * If WeatherWidget errors, only weather fails, rest of app continues
 */
export class FeatureErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const featureName = this.props.featureName || "feature";
    logger.error(
      `[FeatureErrorBoundary] Error in ${featureName}:`,
      error,
      errorInfo,
    );

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      // Default fallback
      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {this.props.featureName || "Feature"} encountered an error
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-1">
            {this.state.error.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for async operations
 * Handles promise rejections in a contained way
 *
 * Usage:
 * <AsyncBoundary
 *   promise={fetchSomeData()}
 *   fallback={<Loader2 className="animate-spin" />}
 *   onError={() => showError()}
 * >
 *   <DataDisplay />
 * </AsyncBoundary>
 */
interface AsyncBoundaryProps {
  promise?: Promise<unknown>;
  fallback?: ReactElement;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  featureName?: string;
  timeout?: number;
}

interface AsyncBoundaryState {
  isLoading: boolean;
  hasError: boolean;
  error: Error | null;
}

export class AsyncBoundary extends React.Component<
  AsyncBoundaryProps & { children: ReactNode },
  AsyncBoundaryState
> {
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(props: AsyncBoundaryProps & { children: ReactNode }) {
    super(props);
    this.state = { isLoading: !!props.promise, hasError: false, error: null };
  }

  componentDidMount() {
    if (this.props.promise) {
      this.executePromise(this.props.promise);
    }
  }

  componentDidUpdate(prevProps: AsyncBoundaryProps & { children: ReactNode }) {
    if (this.props.promise !== prevProps.promise && this.props.promise) {
      this.executePromise(this.props.promise);
    }
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private executePromise = async (promise: Promise<unknown>) => {
    const featureName = this.props.featureName || "operation";

    try {
      this.setState({ isLoading: true, hasError: false, error: null });

      // Create timeout
      const timeoutPromise = new Promise((_, reject) => {
        this.timeoutId = setTimeout(() => {
          reject(
            new Error(
              `${featureName} timed out after ${this.props.timeout || 10000}ms`,
            ),
          );
        }, this.props.timeout || 10000);
      });

      // Race between promise and timeout
      await Promise.race([promise, timeoutPromise]);

      if (this.timeoutId) clearTimeout(this.timeoutId);

      this.setState({ isLoading: false });
      if (this.props.onSuccess) {
        this.props.onSuccess();
      }
    } catch (error) {
      if (this.timeoutId) clearTimeout(this.timeoutId);

      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`[AsyncBoundary] ${featureName} failed:`, err);

      this.setState({ isLoading: false, hasError: true, error: err });

      if (this.props.onError) {
        this.props.onError(err);
      }
    }
  };

  render() {
    const { isLoading, hasError, error } = this.state;

    if (isLoading) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )
      );
    }

    if (hasError) {
      return (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            {this.props.featureName || "Feature"} failed to load
          </p>
          <p className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">
            {error?.message || "Unknown error"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional component wrapper for feature isolation
 * Use when you prefer functional component style
 *
 * Usage:
 * <IsolatedFeature name="weather" onError={handleError}>
 *   <WeatherWidget />
 * </IsolatedFeature>
 */
export const IsolatedFeature: React.FC<{
  name: string;
  children: ReactNode;
  onError?: (error: Error) => void;
  fallback?: ReactElement;
}> = ({ name, children, onError, fallback }) => {
  return (
    <FeatureErrorBoundary
      featureName={name}
      onError={onError}
      fallback={(error) =>
        fallback || (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500">{name} service unavailable</p>
          </div>
        )
      }
    >
      {children}
    </FeatureErrorBoundary>
  );
};
