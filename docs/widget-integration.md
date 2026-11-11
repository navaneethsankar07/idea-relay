# IdeaRelay Feedback Widget Integration Guide

The IdeaRelay feedback widget (`@idearelay/widget`) is an embeddable script that customer applications can integrate to collect user suggestions, bug reports, and feature requests.

## Script Tag Embed (CDN / Self-Hosted)

Include the widget bundle before the closing `</body>` tag of your application:

```html
<script src="https://cdn.idearelay.io/widget/widget.umd.js"></script>
<script>
  window.IdeaRelay.init({
    projectId: "your-project-id",
    position: "bottom-right",
    primaryColor: "#4f46e5",
    theme: "auto"
  });
</script>
```

## Programmatic NPM Integration

```typescript
import { IdeaRelayWidget } from '@idearelay/widget';

const widget = new IdeaRelayWidget({
  projectId: 'proj_abc123',
  apiUrl: 'https://api.idearelay.io/api/v1',
  position: 'bottom-right'
});

widget.init();
```
