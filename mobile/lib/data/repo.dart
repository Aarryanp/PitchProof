// Reads and writes the app's data in Supabase. Row-level security means a
// signed-in student only ever sees and changes their own rows.
// When there is nothing real yet, screens get sample data (marked sample).

import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
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

typedef Rows = List<Map<String, dynamic>>;

/// A small copy, on the phone, of the last rows each screen loaded. A
/// screen shows it straight away when it opens, then swaps in fresh data
/// from Supabase. Kept per user, and wiped on sign out. Not offline sync:
/// changes still need the internet.
class Cache {
  static SharedPreferences? _prefs;
  static Future<void> init() async {
    try {
      _prefs = await SharedPreferences.getInstance();
    } catch (_) {}
  }

  static String _key(String name) => 'cache.$userId.$name';

  static List<Rows>? read(String name) {
    if (userId == null) return null;
    try {
      final raw = _prefs?.getString(_key(name));
      if (raw == null) return null;
      return [for (final list in jsonDecode(raw) as List) [for (final row in list as List) Map<String, dynamic>.from(row as Map)]];
    } catch (_) {
      return null;
    }
  }

  static void write(String name, List<Rows> rows) {
    if (userId == null) return;
    _prefs?.setString(_key(name), jsonEncode(rows));
  }

  static Future<void> clear() async {
    for (final k in _prefs?.getKeys().where((k) => k.startsWith('cache.')).toList() ?? const <String>[]) {
      await _prefs?.remove(k);
    }
  }
}

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
    Cache.write('leads', results);
    return _buildLeads(results);
  }

  /// The leads saved on the phone last time, or null.
  static ({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile})? cachedLeads() {
    final rows = Cache.read('leads');
    return rows == null || rows.length != 4 ? null : _buildLeads(rows);
  }

  static ({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile}) _buildLeads(List<Rows> results) {
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
    Cache.write('results', r);
    return _buildResults(r);
  }

  static Loaded<Results>? cachedResults() {
    final rows = Cache.read('results');
    return rows == null || rows.length != 3 ? null : _buildResults(rows);
  }

  static Loaded<Results> _buildResults(List<Rows> r) {
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
    final r = await Future.wait([
      _db.from('students').select().eq('id', id),
      _db.from('portfolio_items').select('title, skill_tag, link, one_line').eq('student_id', id).order('created_at'),
    ]);
    Cache.write('profile', r);
    return _buildProfile(r);
  }

  static Loaded<(Student, List<Project>)>? cachedProfile() {
    final rows = Cache.read('profile');
    return rows == null || rows.length != 2 ? null : _buildProfile(rows);
  }

  static Loaded<(Student, List<Project>)> _buildProfile(List<Rows> r) {
    final items = r[1];
    return Loaded((
      r[0].isEmpty ? Student() : Student.fromJson(r[0].first),
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

}

/// The Next.js server's address, from the build command
/// (--dart-define-from-file=env.json, key API_URL). The agent steps run there.
const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'https://pitch-proof.vercel.app');

/// One business the agent picked for a search.
class AgentLead {
  AgentLead({required this.id, required this.name, this.website});
  final String id;
  final String name;
  final String? website;
  /// Filled in once the agent has checked it: skipped, audited or needs_approval.
  String? stage;
  String? note;
  String? topProblem;
  bool get done => stage != null;
}

/// Calls the agent steps on the server. The server checks the student's
/// sign-in token, so it only ever works on that student's own leads.
class Agent {
  static Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    final token = hasBackend ? _db.auth.currentSession?.accessToken : null;
    if (token == null) throw Exception('Sign in to run a search.');
    final http.Response res;
    try {
      res = await http
          .post(Uri.parse('$apiUrl$path'), headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}, body: jsonEncode(body))
          .timeout(const Duration(seconds: 200));
    } catch (_) {
      throw Exception("Couldn't reach the Pitchproof server. Check your internet and try again.");
    }
    Map<String, dynamic> json;
    try {
      json = Map<String, dynamic>.from(jsonDecode(res.body) as Map);
    } catch (_) {
      throw Exception('The server gave an unexpected answer (${res.statusCode}).');
    }
    if (res.statusCode >= 400) throw Exception('${json['error'] ?? 'Something went wrong (${res.statusCode}).'}');
    return json;
  }

  /// Step 1: saves the search and picks businesses for it.
  static Future<({String searchId, List<AgentLead> leads, String note})> start({required String skill, required String sector, required String city, required int count}) async {
    if (userId == null) throw Exception('Sign in to run a search.');
    final r = await _post('/api/agent/search', {'skill': skill, 'sector': sector.trim(), 'city': city.trim(), 'count': count});
    final leads = [
      for (final l in (r['leads'] as List? ?? const []))
        AgentLead(id: '${l['id']}', name: '${l['name']}', website: l['website'] as String?),
    ];
    return (searchId: '${r['searchId']}', leads: leads, note: '${r['note'] ?? ''}');
  }

  /// Steps 2–8 for one business: check the site, quality gate, draft email.
  static Future<void> check(String searchId, String skill, AgentLead lead) async {
    try {
      final r = await _post('/api/agent/company', {'searchId': searchId, 'companyId': lead.id, 'skill': skill});
      lead.stage = '${r['stage']}';
      lead.note = r['note'] as String?;
      lead.topProblem = r['topProblem'] as String?;
    } catch (e) {
      lead.stage = 'error';
      lead.note = '$e'.replaceFirst('Exception: ', '');
    }
  }
}
