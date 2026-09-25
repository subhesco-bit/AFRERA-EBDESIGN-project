const { ModuleLifecycle } = require('../core/moduleLifecycle');

describe('Module lifecycle',()=>{
  it('follows the normal discovered-to-executing path',()=>{const l=new ModuleLifecycle('M900');l.transition('loaded');l.transition('initialized');l.transition('ready');l.transition('executing');l.transition('ready');expect(l.state).toBe('ready');expect(l.history).toHaveLength(6);});
  it('rejects invalid jumps',()=>{const l=new ModuleLifecycle('M900');expect(()=>l.transition('ready')).toThrow('invalid lifecycle transition');});
  it('supports degraded recovery',()=>{const l=new ModuleLifecycle('M900');l.transition('loaded');l.transition('initialized');l.transition('degraded',{reason:'db unavailable'});l.transition('ready',{reason:'db restored'});expect(l.state).toBe('ready');});
  it('makes shutdown terminal',()=>{const l=new ModuleLifecycle('M900');l.shutdown();expect(l.state).toBe('shutdown');expect(()=>l.transition('loaded')).toThrow();});
  it('records errors with evidence',()=>{const l=new ModuleLifecycle('M900');l.transition('loaded');l.fail(Object.assign(new Error('init failed'),{code:'INIT'}),['trace:1']);const s=l.snapshot();expect(s.state).toBe('error');expect(s.history.at(-1).metadata.code).toBe('INIT');expect(s.history.at(-1).evidence).toContain('trace:1');});
});
