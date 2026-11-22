// Shapes of the data the screens show. They match the tables in
// supabase/schema.sql (the same database the website uses).

enum Stage { found, audited, needsApproval, sent, opened, replied, skipped }

/// The stages in the order a lead moves through them, with their names.
const stageOrder = [Stage.found, Stage.audited, Stage.needsApproval, Stage.sent, Stage.opened, Stage.replied, Stage.skipped];

String stageName(Stage s) => switch (s) {
      Stage.found => 'Found',
      Stage.audited => 'Audited',
      Stage.needsApproval => 'Needs approval',
      Stage.sent => 'Sent',
      Stage.opened => 'Page opened',
      Stage.replied => 'Replied',
      Stage.skipped => 'Skipped',
    };

String stageHint(Stage s) => switch (s) {
      Stage.found => 'The agent found these. Website checks come next.',
      Stage.audited => 'Checked. Waiting for a fix and an email draft.',
      Stage.needsApproval => 'Email ready. Nothing is sent until you approve.',
      Stage.sent => 'Email sent. Waiting for them to open your page.',
      Stage.opened => 'They opened the page made for them.',
      Stage.replied => 'They wrote back.',
      Stage.skipped => 'Not pitched, with the reason.',
    };

Stage stageForStatus(String status) => switch (status) {
      'draft' || 'approved' => Stage.needsApproval,
      'skipped' || 'declined' => Stage.skipped,
      'sent' => Stage.sent,
      'opened' => Stage.opened,
      'replied' => Stage.replied,
      _ => Stage.found,
    };

class Lead {
  const Lead({required this.key, required this.companyName, this.sector, this.city, this.website, required this.stage, this.pitchId, this.topProblem, this.skipReason});
  final String key;
  final String companyName;
  final String? sector;
  final String? city;
  final String? website;
  final Stage stage;
  final String? pitchId;
  final String? topProblem;
  final String? skipReason;
}

/// One problem the audit found. [hard] means the evidence is a number or a
/// clear yes/no fact from a tool (the quality gate needs at least one).
class Finding {
  const Finding({required this.problem, required this.evidence, required this.source, required this.hard});
  final String problem;
  final String evidence;
  final String source;
  final bool hard;
  factory Finding.fromJson(Map<String, dynamic> j) =>
      Finding(problem: '${j['problem'] ?? ''}', evidence: '${j['evidence'] ?? ''}', source: '${j['source'] ?? ''}', hard: j['hard'] == true);
}

class Contact {
  const Contact({this.name, this.role, this.email, this.source});
  final String? name;
  final String? role;
  final String? email;
  final String? source;
}

class Pitch {
  const Pitch({
    required this.id,
    required this.status,
    required this.audit,
    this.pageSlug,
    this.fixUrl,
    required this.subject,
    required this.body,
    required this.personalLine,
    required this.companyName,
    this.website,
    this.sector,
    this.city,
    this.contact,
    required this.findings,
  });
  final String id;
  final String status;
  final bool audit; // audit pitch (true) or generic pitch (false)
  final String? pageSlug;
  final String? fixUrl;
  final String subject;
  final String body;
  final String personalLine;
  final String companyName;
  final String? website;
  final String? sector;
  final String? city;
  final Contact? contact;
  final List<Finding> findings;
}

class Student {
  Student({
    this.name = '',
    this.bio,
    this.yearOrGrad,
    this.goal,
    List<String>? skills,
    this.city,
    List<String>? voiceSamples,
    this.dailyLimit = 15,
  })  : skills = skills ?? [],
        voiceSamples = voiceSamples ?? [];
  String name;
  String? bio;
  String? yearOrGrad;
  String? goal; // internship, freelance or job
  List<String> skills; // web, design
  String? city;
  List<String> voiceSamples;
  int dailyLimit;

  factory Student.fromJson(Map<String, dynamic> j) => Student(
        name: '${j['name'] ?? ''}',
        bio: j['bio'] as String?,
        yearOrGrad: j['year_or_grad'] as String?,
        goal: j['goal'] as String?,
        skills: List<String>.from(j['skill_types'] ?? const []),
        city: j['city'] as String?,
        voiceSamples: List<String>.from(j['voice_samples'] ?? const []),
        dailyLimit: (j['daily_limit'] as int?) ?? 15,
      );
}

class Project {
  Project({this.title = '', this.skillTag = 'web', this.oneLine = '', this.link = ''});
  String title;
  String skillTag;
  String oneLine;
  String link;
}

/// How far a sent pitch got, best first.
enum Outcome { positive, replied, opened, sent }

String outcomeName(Outcome o) => switch (o) {
      Outcome.positive => 'Positive reply',
      Outcome.replied => 'Replied',
      Outcome.opened => 'Opened your page',
      Outcome.sent => 'Sent',
    };

/// One company you emailed, and how far it got.
class SentPitch {
  const SentPitch({required this.pitchId, required this.companyName, this.sector, this.city, required this.outcome});
  final String pitchId;
  final String companyName;
  final String? sector;
  final String? city;
  final Outcome outcome;
}

/// Everything you emailed. The four numbers come from this list, so they
/// always match the companies shown.
class Results {
  const Results(this.pitches);
  final List<SentPitch> pitches;
  int get sent => pitches.length;
  int get opened => pitches.where((p) => p.outcome != Outcome.sent).length;
  int get replied => pitches.where((p) => p.outcome == Outcome.replied || p.outcome == Outcome.positive).length;
  int get positive => pitches.where((p) => p.outcome == Outcome.positive).length;

  /// Best first: positive replies, other replies, opened, then just sent.
  List<SentPitch> get ordered => [...pitches]..sort((a, b) => a.outcome.index.compareTo(b.outcome.index));
}

/// A screen's data plus whether it is made-up sample data.
class Loaded<T> {
  const Loaded(this.value, {this.sample = false});
  final T value;
  final bool sample;
}

/// The services a student can offer. Each one is a skill pack: its own
/// website checks, fix and email style. Web and design come first; SEO and
/// chatbots reuse the same website scan.
const skillOptions = [
  (key: 'web', name: 'Web development', hint: 'Fix slow or broken sites, build new pages'),
  (key: 'design', name: 'Design', hint: 'Logos, colours, layouts, social posts'),
  (key: 'seo', name: 'SEO and marketing', hint: 'Help businesses show up on Google'),
  (key: 'chatbot', name: 'AI chatbots', hint: 'A bot that answers customer questions'),
];

String skillName(String key) => skillOptions.where((s) => s.key == key).firstOrNull?.name ?? key;

/// Types of business to pick from in a search, in two groups. "Other"
/// opens a text box. The web server maps each label to a Crustdata search
/// (lib/business-types.ts), so keep the two lists the same.
const businessGroups = [
  (name: 'Tech and online', types: ['Tech startups', 'IT services and software agencies', 'SaaS and software products', 'E-commerce and D2C brands', 'Edtech', 'Fintech', 'Marketing and design agencies']),
  (
    name: 'Local businesses',
    types: ['Clinics and hospitals', 'Dental clinics', 'Cafes and restaurants', 'Salons and spas', 'Gyms and fitness', 'Coaching institutes', 'Schools', 'Real estate', 'CA and accounting firms', 'Law firms', 'Hotels', 'Travel agencies', 'Architects and interior designers', 'Event planners', 'Retail shops'],
  ),
];
