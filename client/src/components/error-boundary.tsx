// client/src/components/error-boundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * @class ErrorBoundary
 * @extends {Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * @description React Error Boundary component to catch JavaScript errors anywhere in its child component tree,
 * log those errors, and display a fallback UI instead of crashing the entire application.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * @static getDerivedStateFromError
   * @param {Error} error
   * @returns {ErrorBoundaryState}
   * @description This lifecycle method is called after an error has been thrown by a descendant component.
   * It receives the error that was thrown as a parameter and should return a value to update state.
   * This allows the next render to show the fallback UI.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null };
  }

  /**
   * @method componentDidCatch
   * @param {Error} error
   * @param {ErrorInfo} errorInfo
   * @description This lifecycle method is called after an error has been thrown by a descendant component.
   * It receives two parameters:
   * - error: The error that was thrown.
   * - errorInfo: An object with a componentStack key containing information about which component
   * threw the error.
   * This method is used for logging errors.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error caught by Error Boundary:", error, errorInfo);
    // Set errorInfo in state to display details in development/debugging
    this.setState({ errorInfo });
  }

  /**
   * @method resetError
   * @description Resets the error boundary state, attempting to re-render the children.
   * This is useful for "Try Again" buttons.
   */
  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong!</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                We apologize for the inconvenience. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show error details only in development for debugging, or based on a flag */}
              {this.state.error && (
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md text-sm text-red-700 dark:text-red-300 text-left overflow-auto max-h-48">
                  <p className="font-semibold">Error Message:</p>
                  <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="font-semibold mt-2">Component Stack:</p>
                      <pre className="text-xs whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              )}
              <Button onClick={this.resetError}>Try again</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;