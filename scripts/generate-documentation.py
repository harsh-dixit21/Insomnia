"""Generate the public product guide. Requires reportlab; no runtime app dependency."""
from pathlib import Path
from html import escape
import shutil
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/insomnia-documentation.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
INK = colors.HexColor('#202936')
MUTED = colors.HexColor('#5c6676')
ACCENT = colors.HexColor('#304761')
PAPER = colors.HexColor('#f1f3f5')
styles = {
 'title': ParagraphStyle('Title',fontName='Helvetica-Bold',fontSize=29,leading=33,textColor=INK,spaceAfter=17),
 'h2': ParagraphStyle('Heading',fontName='Helvetica-Bold',fontSize=13,leading=17,textColor=ACCENT,spaceBefore=13,spaceAfter=7),
 'body': ParagraphStyle('Body',fontName='Helvetica',fontSize=9.5,leading=14,textColor=INK,spaceAfter=8),
 'small': ParagraphStyle('Small',fontName='Helvetica',fontSize=8,leading=11,textColor=MUTED,spaceAfter=6),
 'cell': ParagraphStyle('Cell',fontName='Helvetica',fontSize=8.2,leading=11.5,textColor=INK),
 'th': ParagraphStyle('TableHeading',fontName='Helvetica-Bold',fontSize=8.2,leading=11.5,textColor=colors.white),
 'code': ParagraphStyle('Code',fontName='Courier',fontSize=8.5,leading=13,textColor=ACCENT,backColor=PAPER,borderPadding=8,spaceBefore=5,spaceAfter=14),
 'cover': ParagraphStyle('Cover',fontName='Helvetica-Bold',fontSize=58,leading=65,textColor=colors.white,spaceAfter=18),
 'coverSub': ParagraphStyle('CoverSub',fontName='Helvetica',fontSize=23,leading=29,textColor=colors.HexColor('#d5dbe6'),spaceAfter=24),
 'coverBody': ParagraphStyle('CoverBody',fontName='Helvetica',fontSize=11,leading=17,textColor=colors.HexColor('#c0c8d4'),spaceAfter=14),
}
story=[]
def p(text,style='body'): return Paragraph(text,styles[style])
def add(text,style='body'): story.append(p(text,style))
def heading(title,subtitle):
 add(title,'title');add(subtitle,'small');story.append(Spacer(1,6))
def section(title,text): story.append(KeepTogether([p(title,'h2'),p(text)]))
def table(headers,rows,widths):
 data=[[p(escape(str(v)),'th') for v in headers]]+[[p(escape(str(v)),'cell') for v in row] for row in rows]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ACCENT),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),5 if headers[1]=='Responsibility' else 8),('BOTTOMPADDING',(0,0),(-1,-1),5 if headers[1]=='Responsibility' else 8),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PAPER]),('LINEBELOW',(0,0),(-1,0),.5,ACCENT)]))
 story.append(t);story.append(Spacer(1,9))
def tool(name,inputs,logic,output,limit):
 story.append(KeepTogether([p(name,'h2'),p(f'<b>Inputs:</b> {inputs}<br/><b>Core logic:</b> {logic}<br/><b>Output:</b> {output}<br/><b>Boundary:</b> {limit}')]))
def page(): story.append(PageBreak())
def link(url,label): return f'<link href="{escape(url,quote=True)}" color="#304761"><u>{escape(label)}</u></link>'

# 1 / Cover
story.append(Spacer(1,68));add('INSOMNIA','cover');add('Clarity before<br/>commitment.','coverSub')
add('Product documentation &amp; backend readiness','coverBody')
add('An account-based workspace that turns IOMETE buying and migration questions into requirements, sourced guidance, test plans and decision-ready evidence.','coverBody')
story.append(Spacer(1,32))
metric=Table([[p('<font size="25" color="white"><b>9</b></font><br/><font color="#c0c8d4">server tool engines</font>'),p('<font size="25" color="white"><b>25</b></font><br/><font color="#c0c8d4">workspace routes</font>'),p('<font size="25" color="white"><b>63</b></font><br/><font color="#c0c8d4">passing automated tests</font>')]],colWidths=[165]*3)
metric.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#1d2735')),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#3e4b5c')),('TOPPADDING',(0,0),(-1,-1),20),('BOTTOMPADDING',(0,0),(-1,-1),20)]));story.append(metric)
story.append(Spacer(1,32));add('Edition 1.1 / November 1, 2026','coverBody')
add('Current status: evaluation workflows, shared workspaces, recovery, OIDC SSO and local integrations have a working backend. Live IOMETE and Tavily connectors require credentials; public deployment requires a host.','coverBody')
add('Independent IOMETE-track project. This guide does not claim an independently proven market ranking.','coverBody')
page()

# 2 / Product argument
heading('Why Insomnia exists','PRODUCT PURPOSE / pages 3-4 tools / page 5 workflow / page 6 backend / pages 7-8 operations and readiness / page 9 integrations / page 10 references')
add('A data platform can sound compelling while leaving the buying decision unresolved. Buyers still need to know which workloads fit, what the infrastructure needs, what the costs mean, and what evidence will justify a pilot or purchase. Insomnia organizes that work around one company evaluation.')
section('The job it completes','Define a workload, document the buyer\'s success criteria, map needs to official product information, assign tests, import observations, and export a brief that separates documented facts from assumptions and unknowns.')
table(['Design strength','Practical value'],[
 ('Connected company context','Tools use the selected evaluation and save their outputs with its requirements and source links.'),
 ('Traceable rules and calculations','Cost totals, prerequisite checks and benchmark gates are explicit rather than unexplained scores.'),
 ('Evidence discipline','Unsupported security claims stay unknown. A capability description is not treated as customer assurance.'),
 ('Report-level benchmark gates','Critical reports, correctness, concurrency and missing samples remain visible even when aggregate results look good.'),
 ('Real persistence and accounts','Server-side validation, SQLite storage, authenticated sessions and account isolation support work across visits.'),
 ('Reviewable handoff','Markdown briefs, saved tool snapshots, JSON backups and audit records make the evaluation easier to inspect.')
],[158,337])
section('What makes it a strong choice','Insomnia combines the six buying-journey ideas from the track brief with workload, deployment and migration review. Its strongest differentiator is a complete, traceable evaluation workflow. These are design strengths supported by implementation; usability, commercial impact and superiority over competing tools have not been independently benchmarked.')
section('Who it serves','Buyers define success; sales engineers structure demonstrations and pilots; security leads identify assurance gaps. The perspective selector changes the interface context. It does not grant security permissions. Team access is separately enforced as owner, editor or viewer.')
page()

# 3 / Tools 1
heading('Understand, qualify, estimate','FEATURE GUIDE / every tool is executed and saved through the authenticated backend')
tool('01  Product guide','A question and stakeholder role.','Matches the question to a curated official-documentation snapshot and selects role-specific follow-up questions.','A source-linked explanation, relevant topics and the next questions to ask.','This is deterministic retrieval, not live web research or a connected language model. Unsupported topics are reported.')
tool('02  Use-case finder','Needs such as customer-controlled infrastructure, analytics, Oracle modernization, open tables and governance.','Applies visible, equal-weight rules; surfaces transactional-point-lookup concerns and a fully managed SaaS mismatch.','A shortlist of evaluation use cases, constraints and a proposed next step.','The result is a screening aid, not a certification that a particular workload will fit.')
tool('03  Deployment readiness','Environment, Kubernetes, storage, PostgreSQL, ingress, CPU/RAM and an operating owner.','Compares supplied values with documented installation floors; marks missing values unknown and checks offline delivery for air-gapped setups.','A prerequisite gap list with explicit confirmation and production-sizing questions.','It does not inspect a cluster. Version-specific requirements and platform exceptions require confirmation.')
tool('04  Business case','USD license inputs, current cost, infrastructure, operations, services, migration, overlap and time horizon.','Calculates recurring and transition costs, applies the Enterprise list-estimate minimum or entered quote, and derives savings and simplified payback.','A line-by-line, exportable cost case showing the supplied assumptions.','No taxes, inflation, discount rates, workload capacity or productivity gains are inferred. Pricing is a dated snapshot, not a quote.')
section('How outputs stay reviewable','Each successful run captures inputs, result sections, source topics and a server timestamp. Results can be revisited, exported individually, or included in the company brief. Rerun after changing the evaluation or measurements; a saved output is a historical snapshot.')
page()

# 4 / Tools 2
heading('Prepare, test, decide','FEATURE GUIDE / no unexecuted test is presented as a measured success')
tool('05  Call preparation','Evaluation context, stakeholder, duration, supplied company facts and the desired decision.','Builds a timed agenda, role-specific questions and a list of unresolved tests.','A practical preparation brief tied to the buyer\'s evaluation.','The separate Integrations page provides local fictional profiles or configured Tavily research. Review cited pages and transfer relevant evidence into call preparation.')
tool('06  Demo planner','Industry, primary concern and demo duration.','Selects an industry-specific synthetic schema, scenario and roles; adds focus-specific checkpoints and timed stages.','A runbook for banking, manufacturing, retail or healthcare.','The runbook does not execute a demo or claim customer outcomes.')
tool('07  Security questionnaire','Questions entered as lines or imported from a one-column CSV.','Conservatively matches public capability topics; flags compound questions and unsupported assurance requests; calculates the unknown rate.','Review drafts with sources, unknowns and reasons for further investigation.','It does not certify compliance or infer customer-specific encryption, recovery, contractual or audit assurances.')
tool('08  Benchmark review','Report inventory, imported measurements, required concurrency and minimum sample count.','Computes nearest-rank p95 per report; checks sample coverage, concurrency and correctness; highlights critical report failures.','A report-level pass, failure or insufficient-evidence assessment.','Imported measurements are user-provided. Integrations can run SELECT queries through a configured IOMETE driver; local sandbox timings are not cluster benchmarks. Query results are not automatically accepted as correctness evidence.')
tool('09  Migration review','SQL, critical report targets, and CDC/reconciliation confirmations.','Scans SQL for selected Oracle-to-Spark review flags after removing comments and quoted literals; surfaces migration gates.','A review checklist for syntax, correctness, concurrency, source permissions and cutover.','It is a heuristic reviewer, not a SQL compiler, automatic translator or performance predictor.')
page()

# 5 / End to end
heading('Use Insomnia, end to end','USER GUIDE / the new account starts empty; sample data is optional')
for title,body in [
 ('1. Create an account or sign in','Use the Insomnia server account form. Passwords must be 12-128 characters. No IOMETE account or external API key is required for the current toolset.'),
 ('2. Create an evaluation','Enter the company, workload name, platform, owner, target date and success criteria. The backend creates linked proposed acceptance tests with unknown results.'),
 ('3. Build the workload inventory','Add reports manually or import a CSV. Baselines and targets are buyer-provided seconds. Identify business-critical reports and agree the concurrency target.'),
 ('4. Run the relevant tools','Select the company evaluation and supply its facts. Run guidance, fit, deployment, cost, call, demo or security tools. Inputs and outputs are saved after server acknowledgment.'),
 ('5. Record and review evidence','Assign test owners and criteria. Import actual measurements for existing report names, run benchmark review, and record observations. The app does not silently mark acceptance tests passed.'),
 ('6. Export the decision brief','Download company plans or tool reports as Markdown. Inspect saved snapshots, server audit and deadline blockers. Use a JSON backup before replacing or clearing data.')]:section(title,body)
add('CSV headers','h2');add('Workload inventory:<br/>report,baseline,target,critical<br/><br/>Benchmark observations:<br/>report,seconds,concurrency,correct<br/><br/>Security questionnaire:<br/>question','code')
add('CSV values must meet the relevant validation rules. Use true/false for critical and correct fields; quote cells containing commas. Templates can be downloaded from the matching screen. No example measurement is inserted as a real result.','small')
page()

# 6 / Backend
heading('A working backend','TECHNICAL GUIDE / Node.js + SQLite / one origin for UI and API')
add('Browser form -> authenticated JSON API -> validation and tool engine -> SQLite transaction -> new revision and audit event -> confirmed UI state. The frontend does not mark a write saved or clear a submitted form before server confirmation.')
table(['API area','Responsibility'],[
 ('GET /api/health','Reports available engines and integration capability status.'),
 ('POST /api/auth/signup, /login, /logout','Creates accounts, verifies passwords, establishes sessions and revokes logout sessions.'),
 ('GET /api/session, /workspace','Resolves the signed-in account and reads its saved workspace and revision.'),
 ('PUT /api/workspace','Validates evaluation, requirement, workload, test, settings and deletion changes; enforces revisions and immutable tool outputs.'),
 ('POST /api/tools/run','Executes all nine tool engines against saved account data and persists authoritative results.'),
 ('POST /api/import','Parses workload, measurement and security-question CSV on the server.'),
 ('POST /api/workspace/restore, /reset','Validates backups, marks imported snapshots and handles explicit sample or empty resets.'),
 ('GET /api/export','Creates company briefs, saved report downloads and workspace JSON backups from persisted records.'),
 ('GET /api/insights, /audit','Computes dashboard metrics and reads selected-workspace audit history.'),
 ('POST /api/auth/forgot, /reset','Delivers a one-time 30-minute link and revokes sessions on reset.'),
 ('/api/auth/sso/*; /api/team/*','Signed OIDC code flow with PKCE, workspace invitations, switching and permissions.'),
 ('/api/integrations/*; /api/operations','SQL, research and assistant runs with provenance; operational readiness checks.')
],[186,309])
section('Data integrity and concurrency','Each account owns a personal workspace and can join shared workspaces through email-bound invitations. Saves compare the client revision with the current database revision, then commit data and an audit entry in a transaction. Stale revisions are rejected, the latest data is reloaded, and the user can review and retry. Ordinary client edits cannot create or rewrite generated tool results.')
section('Account and session controls','Accounts use salted scrypt password hashes, opaque HTTP-only session cookies, SameSite=Strict, CSRF and origin checks, and authentication rate limiting. Logout revokes the server session. The database persists across server restarts and is excluded from Git.')
page()

# 7 / Operations
heading('Run, save, recover','OPERATIONS / current implementation is a single-server application')
add('Development','h2');add('Node.js 24.11 or later<br/>npm ci<br/>npm run dev','code')
add('Open the printed URL, normally http://127.0.0.1:5181/. The account screen is /portal/#auth. Use the full-stack server, not Live Server or a standalone Vite page.')
add('Production serving','h2');add('npm run build<br/>npm start','code')
add('The production server serves the built frontend and the same authenticated API. The default listener is local-only. Remote hosting needs HTTPS, secure cookies, a configured public origin, a durable database volume and deployment operations.')
table(['Concern','Current behavior'],[
 ('Persistent storage','.data/insomnia.sqlite. Database and environment files are private and ignored by Git.'),
 ('Backup and restore','JSON contains workspace records, not account passwords or sessions. Restored report snapshots are explicitly marked imported.'),
 ('Previous browser data','Use Settings to import previous browser data. For an old app on another port, export its JSON there and restore it into the server account.'),
 ('Conflict or connection failure','Inputs remain available. Retry connection or reload the latest revision before deliberately resubmitting a change.'),
 ('Limits','Requests: 5 MB. Saved workspace: 4 MB. CSV and row limits are enforced. Snapshots retain the latest 2,000 events; database audit is separate.'),
 ('Account scope','Personal and invited workspaces are separate. Owners manage access, editors save changes, and viewers read. The perspective selector grants no access.')
],[133,362])
add('Configuration is described in .env.example and BACKEND.md. A workspace JSON export is not a full database backup. Use a suitable SQLite backup procedure or stop the server before copying database files. Node\'s bundled SQLite API currently emits an experimental-feature notice.','small')
page()

# 8 / Readiness
heading('What is done. What is next.','IMPLEMENTATION STATUS / assessed against the current repository')
table(['Status','Scope'],[
 ('Implemented and tested','All nine tool engines execute through authenticated backend endpoints.'),
 ('Implemented and tested','Account creation, password sign-in, session logout, per-account storage, revisions and server validation.'),
 ('Implemented and tested','CSV imports, persisted outputs, exports, settings, custom tests, metadata edits, resets, backups and server audit.'),
 ('Implemented and tested','Dashboard counts, weekly activity, completion and deadline blockers use persisted records and server calculations.'),
 ('Browser verification','Registration, session recovery, SQL calculations, local profiles and assistant flows reviewed in the browser. Independent accessibility and broad device coverage remain separate.'),
 ('Implemented; credentials required','Official IOMETE SQLAlchemy connector, bounded SELECT execution and persisted query results. No live cluster is available. Local SQL runs on synthetic SQLite data.'),
 ('Local and configurable','Ollama model inference, sourced retrieval, fictional company profiles and a Tavily connector. Live Tavily research requires a key; documentation refresh is manual.'),
 ('Implemented and tested','Shared workspaces, email-bound invitations, owner/editor/viewer permissions, OIDC SSO and one-time password recovery. Local mail uses private outbox files; SMTP is configurable. Signup email verification is separate.'),
 ('Required before broad production use','Deployment monitoring, restore drills, load testing, independent security review, operational ownership and multi-server strategy if needed.')
],[151,344])
section('Verification evidence','The current production frontend build passes. The test suite reports 63 passing tests, including HTTP calls to all nine engines, account isolation, CSRF, persistence after restart, stale revision rejection, CSV validation, exports and logout. Server-render checks exercise 25 routes with populated and empty workspaces. Production-mode smoke checks also verify built assets, API guards, private files, restart persistence and database backup/restore. These checks do not replace an independent security or load review.')
section('Is the backend done?','The backend is implemented for the current evaluation-workspace scope. It is not accurate to call every possible integration or production concern complete. Local service workflows are available without paid providers. External verification still needs an IOMETE cluster, research credentials, a real mail domain and a public deployment target. A local fixture is never presented as live external evidence.')
page()

# Integration setup
heading('Local first. Live when configured.','SERVICE SETUP / no paid account needed for local workflows')
section('Language model','Install Ollama and run ollama pull qwen2.5:1.5b. Set OLLAMA_MODEL=qwen2.5:1.5b in the ignored .env. The local model creates review drafts with supplied evidence. Without a model, the assistant uses labeled local retrieval. A cold start can take up to a minute.')
section('SQL execution','Development uses a bounded, isolated SQLite sandbox with synthetic sales and customers tables. For live IOMETE, install requirements-iomete.txt and set IOMETE_SQLALCHEMY_URL from your compute connection details. Use a SELECT-only principal. No query timing is silently imported as verified benchmark evidence.')
section('Company research','Local profiles cover Northstar Bank, Meridian Manufacturing, Harbor Analytics and Cedar Insurance. They are fictional practice data. Set TAVILY_API_KEY for real web search; the app retains links and excerpts rather than inventing company facts.')
section('Recovery and invitations','Development emails are private JSON messages under .data/mail; they are not sent externally. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM for real delivery. Reset tokens are hashed, expire in 30 minutes, work once and revoke existing sessions. Invitations are email-bound and expire in 48 hours.')
section('Single sign-on','Development starts a loopback OIDC provider. Generated credentials are in .data/local-sso.json. For an enterprise provider, configure OIDC_ISSUER, OIDC_CLIENT_ID and OIDC_CLIENT_SECRET. Register /api/auth/sso/callback at the public origin. Existing accounts must sign in first before linking SSO; matching email alone cannot take over an account.')
section('Deployment and recovery','Run npm run check:production for an isolated production-mode and restore drill. Run npm run backup for a verified SQLite backup. Docker and Compose definitions are included. Public rollout still requires a durable host, HTTPS, secure cookies, external service configuration and operational ownership. Disable local services and the local identity provider in production.')
page()

# 9 / Sources
heading('Sources and next steps','REFERENCE / official product facts are separate from Insomnia implementation claims')
add('IOMETE source snapshot reviewed November 1, 2026. Features, pricing, entitlements and requirements may change; validate current terms and the applicable product version before a customer decision.')
refs=[
 ('IOMETE deployment options','https://iomete.com/product/deployment'),
 ('On-premises installation requirements','https://iomete.com/resources/deployment/on-prem/install'),
 ('Technical architecture','https://iomete.com/resources/blog/iomete-core-components-technical-architecture'),
 ('Oracle-to-Spark migration experience','https://iomete.com/resources/blog/oracle-to-spark-migration'),
 ('Pricing and commercial plan details','https://iomete.com/pricing'),
 ('Software license and operating responsibility','https://iomete.com/policies/software-license-agreement'),
 ('Insomnia source repository','https://github.com/harsh-dixit21/Insomnia'),
]
for title,url in refs:section(title,link(url,url))
section('Repository documentation','README.md covers setup and the feature guide. BACKEND.md documents endpoints and server behavior. tests/ contains the algorithm and HTTP integration checks; scripts/check-screens.mjs performs component render checks.')
section('A useful standard for "best"','The strongest case for Insomnia is not a superlative. It is the ability to take a real buyer requirement through a repeatable workflow, show the calculation or source behind the result, and admit what still needs proof. Validate that advantage with actual buyers and sales engineers using preparation time, missed requirements, source coverage and handoff usability.')
section('Start with one measurable decision','Create an evaluation, name the critical workload, define the acceptance target and owner, then record the evidence. Expand the workspace as new requirements emerge. A complete, honest evaluation is the product\'s purpose.')

def first(canvas,doc):
 canvas.setFillColor(colors.HexColor('#101722'));canvas.rect(0,0,*A4,fill=1,stroke=0)
 canvas.setStrokeColor(colors.HexColor('#465163'));canvas.line(50,70,A4[0]-50,70)
 canvas.setFillColor(colors.HexColor('#aab5c4'));canvas.setFont('Helvetica',8);canvas.drawString(50,51,'INSOMNIA / PRODUCT & TECHNICAL GUIDE');canvas.drawRightString(A4[0]-50,51,'01 NOV 2026')
def later(canvas,doc):
 canvas.setFillColor(INK);canvas.setFont('Helvetica-Bold',9);canvas.drawString(50,A4[1]-31,'INSOMNIA')
 canvas.setFillColor(MUTED);canvas.setFont('Helvetica',8);canvas.drawRightString(A4[0]-50,A4[1]-31,'PRODUCT & TECHNICAL GUIDE')
 canvas.setStrokeColor(colors.HexColor('#d9dfe6'));canvas.line(50,40,A4[0]-50,40)
 canvas.drawString(50,26,'Edition 1.1 / November 1, 2026');canvas.drawRightString(A4[0]-50,26,f'{doc.page} / 10')
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=50,leftMargin=50,topMargin=55,bottomMargin=54,title='Insomnia - Product Documentation and Backend Readiness',author='Insomnia',subject='Features, workflows, backend architecture, verification and remaining work')
doc.build(story,onFirstPage=first,onLaterPages=later)
public=ROOT/'public/docs/insomnia-documentation.pdf';public.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(OUT,public)
print(OUT)
