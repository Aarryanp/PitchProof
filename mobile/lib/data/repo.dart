// Reads and writes the app's data in Supabase. Row-level security means a
// signed-in student only ever sees and changes their own rows.
// When there is nothing real yet, screens get sample data (marked sample).

import 'package:supabase_flutter/supabase_flutter.dart';
import 'models.dart';
import 'pitch_rules.dart';
import 'sample_data.dart';

SupabaseClient get _db => Supabase.instance.client;

/// False when the app was built without the Supabase address and key
/// (then it only shows sample data).
bool hasBackend = false;

/// The signed-in user's id, or null.
String? get userId => hasBackend ? _db.auth.currentUser?.id : null;
String? get userEmail => hasBackend ? _db.auth.currentUser?.email : null;

class Repo {
  static Future<Student?> myStudent() async {
    final id = userId;
    if (id == null) return null;
    final row = await _db.from('students').select().eq('id', id).maybeSingle();
    return row == null ? null : Student.fromJson(row);
  }

  static Future<({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile})> leads() async {
    final id = userId;
    if (id == null) return (leads: const Loaded(sampleLeads, sample: true), signedIn: false, hasProfile: false);
    final results = await Future.wait([
      _db.from('companies').select('id, name, sector, city, website').eq('claimed_by', id),
      _db.from('audits').select('id, company_id, findings, passed_gate, skip_reason').eq('student_id', id),
      _db.from('pitches').select('id, company_id, status').eq('student_id', id),
      _db.from('students').select('id').eq('id', id),
    ]);
    final companies = results[0], audits = results[1], pitches = results[2];
    final hasProfile = results[3].isNotEmpty;
    if (companies.isEmpty) return (leads: const Loaded(<Lead>[]), signedIn: true, hasProfile: hasProfile);
    final leads = companies.map((c) {
      final audit = audits.where((a) => a['company_id'] == c['id']).firstOrNull;
      final pitch = pitches.where((p) => p['company_id'] == c['id']).firstOrNull;
      final findings = ((audit?['findings'] as List?) ?? const []).map((f) => Finding.fromJson(Map<String, dynamic>.from(f))).toList();
      final top = findings.where((f) => f.hard).firstOrNull ?? findings.firstOrNull;
      var stage = Stage.found;
      if (pitch != null) {
        stage = stageForStatus('${pitch['status']}');
      } else if (audit != null && audit['passed_gate'] != true) {
        stage = Stage.skipped;
      } else if (audit != null) {
        stage = Stage.audited;
      }
      return Lead(
        key: '${c['id']}',
        companyName: '${c['name']}',
        sector: c['sector'] as String?,
        city: c['city'] as String?,
        website: c['website'] as String?,
        stage: stage,
        pitchId: pitch?['id'] as String?,
        topProblem: top?.evidence,
        skipReason: (audit?['skip_reason'] as String?) ?? (pitch?['status'] == 'declined' ? 'Said no' : null),
      );
    }).toList();
    return (leads: Loaded(leads), signedIn: true, hasProfile: hasProfile);
  }

  static Future<Loaded<Pitch?>> pitch(String id) async {
    if (id.startsWith('sample-')) return Loaded(samplePitch(id), sample: true);
    final r = await _db
        .from('pitches')
        .select('id, status, pitch_type, page_slug, fix_url, email_subject, email_body, personal_line, companies(name, website, sector, city), contacts(name, role, email, source), audits(findings)')
        .eq('id', id)
        .maybeSingle();
    if (r == null) return const Loaded(null);
    final co = Map<String, dynamic>.from(r['companies'] ?? {});
    final ct = r['contacts'] == null ? null : Map<String, dynamic>.from(r['contacts']);
    final au = r['audits'] == null ? null : Map<String, dynamic>.from(r['audits']);
    return Loaded(Pitch(
      id: '${r['id']}',
      status: '${r['status']}',
      audit: r['pitch_type'] == 'audit',
      pageSlug: r['page_slug'] as String?,
      fixUrl: r['fix_url'] as String?,
      subject: (r['email_subject'] as String?) ?? '',
      body: (r['email_body'] as String?) ?? '',
      personalLine: (r['personal_line'] as String?) ?? '',
      companyName: '${co['name'] ?? ''}',
      website: co['website'] as String?,
      sector: co['sector'] as String?,
      city: co['city'] as String?,
      contact: ct == null ? null : Contact(name: ct['name'], role: ct['role'], email: ct['email'], source: ct['source']),
      findings: ((au?['findings'] as List?) ?? const []).map((f) => Finding.fromJson(Map<String, dynamic>.from(f))).toList(),
    ));
  }

  /// Saves edits to a draft email.
  static Future<void> saveDraft(String id, String subject, String body, String personal) => _db
      .from('pitches')
      .update({'email_subject': subject, 'email_body': body, 'personal_line': personal.isEmpty ? null : personal})
      .eq('id', id)
      .eq('status', 'draft');

  /// Approves a draft. This does not send anything: sending through Gmail
  /// is a later step, and it only picks up pitches the student approved.
  static Future<void> approve(String id, String subject, String body, String personal) async {
    if (!emailPasses(body)) throw Exception('Fix the email checks first.');
    await _db.from('pitches').update({
      'email_subject': subject,
      'email_body': body,
      'personal_line': personal.isEmpty ? null : personal,
      'status': 'approved',
      'approved_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', id).eq('status', 'draft');
  }

  static Future<void> skip(String id) => _db.from('pitches').update({'status': 'skipped'}).eq('id', id).eq('status', 'draft');

  static Future<Loaded<Results>> results() async {
    final id = userId;
    if (id == null) return const Loaded(sampleResults, sample: true);
    final r = await Future.wait([
      _db.from('pitches').select('id, status, companies(name, sector, city)').eq('student_id', id).inFilter('status', ['sent', 'opened', 'replied', 'declined']),
      _db.from('page_views').select('pitch_id'),
      _db.from('messages').select('pitch_id, reply_label').eq('kind', 'reply'),
    ]);
    final opened = r[1].map((v) => v['pitch_id']).toSet();
    final replies = {for (final m in r[2]) m['pitch_id']: m['reply_label']};
    final list = r[0].map((p) {
      final co = Map<String, dynamic>.from(p['companies'] ?? {});
      final reply = replies[p['id']];
      final status = '${p['status']}';
      final outcome = reply == 'positive'
          ? Outcome.positive
          : (replies.containsKey(p['id']) || status == 'replied' || status == 'declined')
              ? Outcome.replied
              : (opened.contains(p['id']) || status == 'opened')
                  ? Outcome.opened
                  : Outcome.sent;
      return SentPitch(pitchId: '${p['id']}', companyName: '${co['name'] ?? ''}', sector: co['sector'] as String?, city: co['city'] as String?, outcome: outcome);
    }).toList();
    return Loaded(Results(list));
  }

  static Future<Loaded<(Student, List<Project>)>> profile() async {
    final id = userId;
    if (id == null) return Loaded((sampleStudent(), sampleProjects()), sample: true);
    final s = await myStudent();
    final items = await _db.from('portfolio_items').select('title, skill_tag, link, one_line').eq('student_id', id).order('created_at');
    return Loaded((
      s ?? Student(),
      items.map((i) => Project(title: '${i['title'] ?? ''}', skillTag: '${i['skill_tag'] ?? 'web'}', oneLine: '${i['one_line'] ?? ''}', link: '${i['link'] ?? ''}')).toList(),
    ));
  }

  /// Saves the profile and replaces the list of past projects.
  static Future<void> saveProfile(Student s, List<Project> projects) async {
    final id = userId;
    if (id == null) throw Exception('Sign in first.');
    await _db.from('students').upsert({
      'id': id,
      'name': s.name.trim(),
      'bio': s.bio?.trim(),
      'year_or_grad': s.yearOrGrad?.trim(),
      'goal': s.goal,
      'skill_types': s.skills,
      'city': s.city?.trim(),
      'voice_samples': s.voiceSamples.where((v) => v.trim().isNotEmpty).toList(),
    });
    await _db.from('portfolio_items').delete().eq('student_id', id);
    final rows = projects.where((p) => p.title.trim().isNotEmpty).map((p) => {
          'student_id': id,
          'title': p.title.trim(),
          'skill_tag': p.skillTag,
          'one_line': p.oneLine.trim().isEmpty ? null : p.oneLine.trim(),
          'link': p.link.trim().isEmpty ? null : p.link.trim(),
        });
    if (rows.isNotEmpty) await _db.from('portfolio_items').insert(rows.toList());
  }

  /// Saves a search. Running the agent on it is added with the agent steps.
  static Future<void> saveSearch({required String skill, required String sector, required String city, required int count}) async {
    final id = userId;
    if (id == null) throw Exception('Sign in to run a search.');
    if (await myStudent() == null) throw Exception('Save your profile first, so the agent knows what you offer.');
    await _db.from('searches').insert({'student_id': id, 'skill_type': skill, 'sector': sector.trim().isEmpty ? null : sector.trim(), 'city': city.trim().isEmpty ? null : city.trim(), 'count': count});
  }
}
