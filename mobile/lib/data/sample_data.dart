// Made-up businesses (".example" websites) so every screen can be seen
// before the agent fills the database. Screens label this as "Sample data".

import 'models.dart';

Student sampleStudent() => Student(
      name: 'Aarryan',
      bio: 'CS student in Nagpur. I build fast, simple websites for small businesses.',
      yearOrGrad: '3rd year',
      goal: 'freelance',
      skills: ['web', 'design'],
      city: 'Nagpur',
      voiceSamples: [
        'Hey, saw your message. I can take a look tonight and send you something by tomorrow.',
        "Thanks for the chat today. I've put the changes we talked about in the link below.",
      ],
    );

List<Project> sampleProjects() => [
      Project(title: 'Bakery website', skillTag: 'web', oneLine: 'Menu and WhatsApp ordering for a local bakery, loads in under 2 seconds.'),
      Project(title: 'Coaching class landing page', skillTag: 'web', oneLine: 'One-page site with a batch enquiry form.'),
      Project(title: 'Clinic logo refresh', skillTag: 'design', oneLine: 'New logo and colours for a small dental clinic.'),
    ];

const sampleLeads = [
  Lead(key: 's1', companyName: 'Sunrise Dental Care', sector: 'Dental clinic', city: 'Nagpur', website: 'sunrisedental.example', stage: Stage.needsApproval, pitchId: 'sample-1', topProblem: 'Takes 9.1 s to open on a phone'),
  Lead(key: 's2', companyName: 'Green Leaf Physiotherapy', sector: 'Physiotherapy', city: 'Nagpur', website: 'greenleafphysio.example', stage: Stage.needsApproval, pitchId: 'sample-2', topProblem: 'No HTTPS, browsers show "Not secure"'),
  Lead(key: 's3', companyName: 'City Skin Clinic', sector: 'Dermatology', city: 'Nagpur', website: 'cityskin.example', stage: Stage.sent, pitchId: 'sample-3', topProblem: 'No phone or WhatsApp link'),
  Lead(key: 's4', companyName: 'Shree Eye Hospital', sector: 'Eye hospital', city: 'Nagpur', website: 'shreeeye.example', stage: Stage.opened, pitchId: 'sample-4', topProblem: 'Mobile score 31/100'),
  Lead(key: 's5', companyName: 'Little Steps Child Clinic', sector: 'Paediatrics', city: 'Nagpur', website: 'littlesteps.example', stage: Stage.replied, pitchId: 'sample-5', topProblem: 'Copyright says 2019'),
  Lead(key: 's6', companyName: 'Care Plus Diagnostics', sector: 'Diagnostics', city: 'Nagpur', website: 'careplus.example', stage: Stage.found),
  Lead(key: 's7', companyName: 'Orange City Ortho Centre', sector: 'Orthopaedics', city: 'Nagpur', website: 'orangecityortho.example', stage: Stage.found),
  Lead(key: 's8', companyName: 'Healwell Homeopathy', sector: 'Homeopathy', city: 'Nagpur', website: 'healwell.example', stage: Stage.audited, topProblem: 'Fails the mobile-friendly check'),
  Lead(key: 's9', companyName: 'Metro Heart Institute', sector: 'Cardiology', city: 'Nagpur', website: 'metroheart.example', stage: Stage.skipped, skipReason: 'Site is fast and secure; no hard-evidence problem'),
  Lead(key: 's10', companyName: "Lotus Women's Clinic", sector: 'Gynaecology', city: 'Nagpur', website: 'lotusclinic.example', stage: Stage.skipped, skipReason: 'No contact email found'),
];

const _body = '''Hi Dr. Kale,

I'm Aarryan, a CS student in Nagpur. Your clinic's website takes about 9 seconds to open on a phone, and there's no WhatsApp button for booking.

I made a faster version so you can see the difference: https://pitchproof.example/p/sunrise-dental-care

If it's useful, I'd be happy to finish it properly. Could we talk for 10 minutes this week? If not, just reply "no" and I won't write again.

Aarryan''';

const _findings = [
  Finding(problem: 'Slow on mobile', evidence: 'Mobile performance score 28/100; page takes 9.1 s to load', source: 'PageSpeed Insights', hard: true),
  Finding(problem: 'Hard to contact', evidence: 'No contact form, phone link or WhatsApp link on the home page', source: 'Website read', hard: true),
  Finding(problem: 'Dated look', evidence: 'Small grey text on a busy photo background; menu has 11 items', source: 'Screenshot review', hard: false),
];

Pitch? samplePitch(String id) {
  final lead = sampleLeads.where((l) => l.pitchId == id).firstOrNull;
  if (lead == null) return null;
  final first = id == 'sample-1';
  final status = switch (lead.stage) {
    Stage.needsApproval => 'draft',
    Stage.opened => 'opened',
    Stage.replied => 'replied',
    _ => 'sent',
  };
  return Pitch(
    id: id,
    status: status,
    audit: true,
    pageSlug: 'sample',
    subject: "your clinic's website on phones",
    body: first ? _body : _body.replaceFirst('Dr. Kale', 'there'),
    personalLine: '',
    companyName: lead.companyName,
    website: lead.website,
    sector: lead.sector,
    city: lead.city,
    contact: first
        ? const Contact(name: 'Dr. Meera Kale', role: 'Founder', email: 'hello@sunrisedental.example', source: 'Contact page')
        : Contact(email: 'hello@${lead.website}', source: 'Contact page'),
    findings: first ? _findings : [Finding(problem: lead.topProblem ?? '', evidence: lead.topProblem ?? '', source: 'PageSpeed Insights', hard: true)],
  );
}

const sampleResults = Results([
  SentPitch(pitchId: 'sample-5', companyName: 'Little Steps Child Clinic', sector: 'Paediatrics', city: 'Nagpur', outcome: Outcome.positive),
  SentPitch(pitchId: 'sample-4', companyName: 'Shree Eye Hospital', sector: 'Eye hospital', city: 'Nagpur', outcome: Outcome.opened),
  SentPitch(pitchId: 'sample-3', companyName: 'City Skin Clinic', sector: 'Dermatology', city: 'Nagpur', outcome: Outcome.sent),
]);
