# PAGE-020: /ai/copilot

**Phase:** 5.1 (Critical Pages)  
**Component:** CopilotChatPage  
**Priority:** P0 - Critical  
**Status:** Specification (Specification Complete  

## Page Specification

### Route
```
/ai/copilot
```

### Purpose
AI copilot chat interface page for intelligent agricultural assistance, providing real-time AI-powered advisory and decision support.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import ChatInterface from '../components/AI/ChatInterface';
import ChatInput from '../components/AI/ChatInput';
import ChatHistory from '../components/AI/ChatHistory';
import ContextPanel from '../components/AI/ContextPanel';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);
const [typing, setTyping] = useState(false);
const [sessionId, setSessionId] = useState(null);
const [context, setContext] = useState(null);
const chatEndRef = useRef(null);
const { user } = useAuthStore();
```

### Page Sections

#### 1. Chat Header
- AI copilot branding
- Session context indicator
- New chat button
- History button
- Settings button

#### 2. Chat Interface
- Message display area with user/AI bubbles
- Typing indicator
- Auto-scroll to latest message
- Message timestamps
- Copy message button

#### 3. Chat Input
- Text input with character count
- Attachment upload button
- Voice input button
- Send button
- Quick suggestions/chips

#### 4. Context Panel (collapsible)
- Current session context
- Related modules reference
- Active context indicators
- Context editing option

#### 5. Chat History Sidebar (collapsible)
- Previous sessions list
- Session summaries
- Search through history
- Delete session option

#### 6. AI Response Display
- Structured data display for recommendations
- Action buttons for AI suggestions
- Confidence scores
- Related resources links
- Source references

### API Integration
```jsx
const sendMessage = async (message, contextData) => {
  setTyping(true);
  const userMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  };
  
  setMessages(prev => [...prev, userMessage]);
  
  try {
    const response = await api.post('/api/v1/ai/copilot/chat', {
      message,
      context: { ...context, ...contextData },
      session_id: sessionId
    });
    
    const aiMessage = {
      role: 'assistant',
      content: response.data.response,
      structured_data: response.data.structured_data,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setContext(response.data.context);
    setSessionId(response.data.session_id);
  } catch (err) {
    console.error('AI chat failed:', err);
    const errorMessage = {
      role: 'assistant',
      content: 'I apologize, but I\'m having trouble connecting right now. Please try again.',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setTyping(false);
  }
};

useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

### Layout Requirements
- **Header**: Branding, context, history toggle
- **Main Content**: Chat interface + input
- **Sidebar**: Context panel + history
- **Footer**: Tips, help, support
- **Responsive**: Full-width chat on mobile, side-by-side on desktop

### Styling
- Chat interface with bubble design
- User/AI message differentiation
- Typing indicator animation
- Context panel with indicators
- History sidebar with search
- Mobile-optimized chat input

### Accessibility
- Semantic chat structure
- ARIA labels for chat elements
- Keyboard navigation for chat messages
- Screen reader compatibility
- Message copy announcement
- Typing announcement

### Error Handling
- API error display with retry option
- Network error handling
- Context loss handling
- Session expiration handling
- Fallback to cached responses

### Success Behavior
- Real-time message updates
- Typing indicator display
- Context panel updates
- History persistence
- Quick action button interactions

### Special Features
- **Voice Input**: Voice-to-text for messages
- **Attachment Upload: Document/image upload for context
- **Quick Suggestions**: One-click common queries
- **Context Persistence**: Session context maintained
- **Export Chat**: Download chat history
- **Model Selection**: Choose AI model variant

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/CopilotChatPage.jsx`
- [ ] Design layout with chat interface and sidebars
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for chat and context
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/CopilotChatPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*