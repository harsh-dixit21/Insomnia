import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('ProofPlan could not render:', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <main style={{ maxWidth: '38rem', margin: '15vh auto', padding: '2rem' }} role="alert">
        <h1 style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>Let’s try that again.</h1>
        <p>ProofPlan could not open this experience. Reload the page to retry.</p>
        <button className="primary" onClick={() => window.location.reload()}>Reload ProofPlan</button>
        <p>If the problem continues, run <code>npm run dev</code> and open the Local URL printed in your terminal. The browser console contains the error details.</p>
      </main>;
    }
    return this.props.children;
  }
}
