export interface WidgetConfig {
  projectId: string;
  apiUrl?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export class IdeaRelayWidget {
  private config: WidgetConfig;
  private container: HTMLElement | null = null;
  private isOpen: boolean = false;

  constructor(config: WidgetConfig) {
    if (!config.projectId) {
      throw new Error('[IdeaRelay] projectId is required to initialize widget');
    }
    this.config = {
      apiUrl: 'http://localhost:8000/api/v1',
      position: 'bottom-right',
      primaryColor: '#4f46e5',
      theme: 'auto',
      ...config,
    };
  }

  public init(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('idearelay-widget-root')) return;

    this.container = document.createElement('div');
    this.container.id = 'idearelay-widget-root';
    this.container.setAttribute('data-project-id', this.config.projectId);
    document.body.appendChild(this.container);
  }

  public open(): void {
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public getState() {
    return {
      isOpen: this.isOpen,
      projectId: this.config.projectId,
      position: this.config.position,
    };
  }

  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

// Global initialization helper for script tags
declare global {
  interface Window {
    IdeaRelay?: {
      init: (config: WidgetConfig) => IdeaRelayWidget;
    };
  }
}

if (typeof window !== 'undefined') {
  window.IdeaRelay = {
    init: (config: WidgetConfig) => {
      const widget = new IdeaRelayWidget(config);
      widget.init();
      return widget;
    },
  };
}

export default IdeaRelayWidget;
