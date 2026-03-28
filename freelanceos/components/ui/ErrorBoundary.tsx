"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
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
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 16px",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--danger-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "22px",
              }}
            >
              !
            </div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 8px",
              }}
            >
              Une erreur est survenue
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.message ||
                "Quelque chose s\u2019est mal pass\u00e9. Veuillez r\u00e9essayer."}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: "var(--blue-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              R&eacute;essayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
