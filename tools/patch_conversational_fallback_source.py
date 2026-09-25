from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\legacy\conversationalAIService.js')
t=p.read_text(encoding='utf-8')
old="""    return {
      content: response,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      requires_action: determineIfActionRequired(intentResult.intent),
    };"""
new="""    return {
      content: response,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      source: 'fallback',
      requires_action: determineIfActionRequired(intentResult.intent),
    };"""
if old not in t: raise RuntimeError('fallback return block missing')
p.write_text(t.replace(old,new,1),encoding='utf-8')
print('conversational fallback source restored')