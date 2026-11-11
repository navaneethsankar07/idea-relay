import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IdeaRelayWidget } from './index';

describe('IdeaRelayWidget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('throws an error if projectId is missing', () => {
    // @ts-expect-error testing missing property
    expect(() => new IdeaRelayWidget({})).toThrow(
      '[IdeaRelay] projectId is required to initialize widget'
    );
  });

  it('initializes and attaches widget container to document body', () => {
    const widget = new IdeaRelayWidget({ projectId: 'proj-123' });
    widget.init();

    const el = document.getElementById('idearelay-widget-root');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('data-project-id')).toBe('proj-123');

    widget.destroy();
    expect(document.getElementById('idearelay-widget-root')).toBeNull();
  });

  it('toggles open/close state correctly', () => {
    const widget = new IdeaRelayWidget({ projectId: 'proj-test' });
    expect(widget.getState().isOpen).toBe(false);

    widget.open();
    expect(widget.getState().isOpen).toBe(true);

    widget.close();
    expect(widget.getState().isOpen).toBe(false);
  });
});
