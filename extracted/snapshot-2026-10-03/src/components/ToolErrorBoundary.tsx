import React from 'react';

interface Props {
  children: React.ReactNode;
  lang?: 'fa' | 'en';
  toolName?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ToolErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error || 'Unknown runtime error'),
    };
  }

  componentDidCatch(error: unknown) {
    console.error('Tool runtime failure:', error);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isFa = this.props.lang === 'fa';
    return (
      <div className="apple-card p-6 border border-[#ff453a]/30 bg-[#ff453a]/[0.06]" dir={isFa ? 'rtl' : 'ltr'}>
        <div className="text-sm font-semibold text-white mb-2">
          {isFa ? 'این ابزار با خطای اجرایی متوقف شد' : 'This tool stopped because of a runtime error'}
        </div>
        <div className="text-xs text-white/50 leading-relaxed">
          {this.props.toolName || 'Tool'}: {this.state.message || (isFa ? 'خطای ناشناخته' : 'Unknown error')}
        </div>
        <div className="text-[10px] text-white/30 mt-3 font-mono">
          {isFa ? 'بقیهٔ داشبورد باید همچنان فعال بماند.' : 'The rest of the dashboard remains available.'}
        </div>
      </div>
    );
  }
}

export default ToolErrorBoundary;
