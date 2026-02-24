import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.error('[ErrorBoundary] 显示错误UI:', this.state.error);
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-96 rounded-xl bg-red-900/80 border-2 border-red-500 p-6 z-50">
          <h3 className="text-xl font-bold text-red-200 mb-3">❌ 渲染错误</h3>
          <p className="text-sm text-red-300 mb-4 font-mono bg-black/50 p-2 rounded">
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => {
              console.log('[ErrorBoundary] 重试按钮被点击');
              this.setState({ hasError: false, error: null });
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold mb-4"
          >
            重试渲染
          </button>
          <details className="mt-4 w-full text-xs text-red-200">
            <summary className="cursor-pointer font-semibold mb-2">查看错误详情</summary>
            <pre className="mt-2 p-3 bg-black/70 rounded overflow-auto max-h-60 text-red-300 font-mono text-[10px]">
              {this.state.error?.stack || '无堆栈信息'}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
