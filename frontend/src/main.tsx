import { StrictMode, Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './index.css'
import App from './App.tsx'

dayjs.locale('zh-cn')

// 全局 Error Boundary — 把错误显示到 DOM 上，避免静默白屏
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; info: string }> {
  state = { error: null as Error | null, info: '' };
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info: info.componentStack || '' });
    console.error('[ErrorBoundary]', error, info);
  }
  componentDidMount() {
    window.addEventListener('error', (e) => {
      this.setState((s) => s.error ? s : { error: new Error(e.message), info: e.filename + ':' + e.lineno });
    });
    window.addEventListener('unhandledrejection', (e) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
      this.setState((s) => s.error ? s : { error: new Error(msg), info: 'unhandledrejection' });
    });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: '#c00' }}>
          <h1>⚠️ 运行时错误</h1>
          <pre style={{ background: '#fee', padding: 16, overflow: 'auto' }}>
            <b>{this.state.error.name}:</b> {this.state.error.message}
            {'\n\n'}
            {this.state.info}
            {'\n\nStack:\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)