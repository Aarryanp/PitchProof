// Email rules from the blueprint (section 6). The same rules as
// lib/pitch-rules.ts on the website, so both apps judge an email the same way.

const bannedPhrases = [
  'i hope this email finds you well',
  'esteemed organization',
  'elevate',
  'leverage',
  'seamless',
  'i came across your company',
];

const minWords = 60;
const maxWords = 130; // room for a short, proper introduction

class RuleCheck {
  const RuleCheck(this.label, this.ok, [this.detail]);
  final String label;
  final bool ok;
  final String? detail;
}

int countWords(String text) => text.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;

List<RuleCheck> checkEmail(String body) {
  final lower = body.toLowerCase();
  final words = countWords(body);
  final found = bannedPhrases.where(lower.contains).toList();
  final links = RegExp(r'https?://\S+|\[link\]', caseSensitive: false).allMatches(body).length;
  final optOut = RegExp(r"\bno\b|not interested|won't write again|unsubscribe", caseSensitive: false).hasMatch(body);
  final fancy = RegExp(r'(^|\n)\s*[-*•]\s|\*\*|[\u{1F300}-\u{1FAFF}]', unicode: true).hasMatch(body);
  return [
    RuleCheck('$minWords–$maxWords words', words >= minWords && words <= maxWords, '$words words'),
    RuleCheck('No banned phrases', found.isEmpty, found.isEmpty ? null : 'Found: ${found.join(', ')}'),
    RuleCheck('At most one link', links <= 1, '$links found'), // none for slow sites
    RuleCheck('Easy way to say no', optOut),
    RuleCheck('Plain text (no bullets, bold or emojis)', !fancy),
  ];
}

bool emailPasses(String body) => checkEmail(body).every((c) => c.ok);
