const languageService = require('./indiaLanguageService');
const { SCHEDULED, NORTHEAST } = require('../../config/indiaLanguageRegistry');

describe('India language service', () => {
  test('contains all 22 scheduled languages', () => {
    expect(SCHEDULED).toHaveLength(22);
    expect(SCHEDULED.map(language => language.code)).toEqual(expect.arrayContaining([
      'as', 'bn', 'brx', 'doi', 'gu', 'hi', 'kn', 'ks', 'kok', 'mai', 'ml',
      'mni', 'mr', 'ne', 'or', 'pa', 'sa', 'sat', 'sd', 'ta', 'te', 'ur'
    ]));
  });

  test('contains the priority Northeast catalogue', () => {
    expect(NORTHEAST.map(language => language.code)).toEqual(expect.arrayContaining([
      'kha', 'mizo', 'grt', 'trp', 'nag'
    ]));
  });

  test('resolves an unsupported preference safely to English', () => {
    const resolved = languageService.resolvePreference('not-a-language');
    expect(resolved.code).toBe('en');
    expect(resolved.uiLocale).toBe('en-IN');
  });

  test('keeps language and voice session identity together', () => {
    const session = languageService.normaliseVoiceSession({ language: 'as' });
    expect(session.language).toBe('as');
    expect(session.locale).toBe('as-IN');
    expect(session.speechLocale).toBe('as-IN');
    expect(session.voiceEnabled).toBe(true);
  });

  test('catalogue exposes capability metadata', () => {
    const catalogue = languageService.getCatalogue();
    const assamese = catalogue.find(language => language.code === 'as');
    expect(assamese.capabilities).toMatchObject({
      ui: true,
      text: true,
      nlp: true,
      speechRecognition: 'provider-verified',
      textToSpeech: 'provider-verified'
    });
  });
});
