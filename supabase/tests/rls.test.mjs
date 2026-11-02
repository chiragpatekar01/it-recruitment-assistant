// Row Level Security tests for supabase/migrations/0001_init.sql.
// Runs the migration on an EMPTY throwaway PostgreSQL database with a minimal stand-in
// for Supabase's auth schema, then checks tenant isolation and role rules.
//   DATABASE_URL=postgres://postgres:pw@localhost:5432/postgres node supabase/tests/rls.test.mjs
// Needs: npm i -D pg
import pg from "pg";
import fs from "fs";

if (!process.env.DATABASE_URL) { console.error("Set DATABASE_URL to an EMPTY throwaway Postgres database (never production)."); process.exit(1); }
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const q = (s, p) => c.query(s, p);
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? "PASS " : "FAIL ") + name); };
const expectErr = async (name, fn, re) => { try { await fn(); ok(name + " (no error!)", false); } catch (e) { ok(name, !re || re.test(e.message)); if (re && !re.test(e.message)) console.log("   got:", e.message); } };

// --- Minimal Supabase-like environment ---
await q(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
await q(fs.readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"));
ok("migration applies cleanly", true);

const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b", C = "00000000-0000-0000-0000-00000000000c";
await q(`insert into auth.users (id, email, raw_user_meta_data) values ($1,'a@x.com','{"full_name":"Asha"}'),($2,'b@x.com','{}'),($3,'c@x.com','{}')`, [A, B, C]);
ok("signup trigger creates profiles", (await q("select count(*)::int n from profiles")).rows[0].n === 3);

const as = async (uid, fn) => { await q("begin"); await q("set local role authenticated"); await q(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]); try { return await fn(); } finally { await q("commit"); } };
const asTry = async (uid, fn) => { await q("begin"); await q("set local role authenticated"); await q(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]); try { const r = await fn(); await q("commit"); return r; } catch (e) { await q("rollback"); throw e; } };

const orgA = await as(A, async () => (await q("select create_organization('Acme Talent') id")).rows[0].id);
const orgC = await as(C, async () => (await q("select create_organization('Other Co') id")).rows[0].id);
ok("owner membership + billing row created", (await q("select role from memberships where org_id=$1 and user_id=$2", [orgA, A])).rows[0]?.role === "owner" && (await q("select plan from org_billing where org_id=$1", [orgA])).rows[0]?.plan === "trial");

const jobA = await as(A, async () => (await q("insert into jobs (org_id, title) values ($1,'Java Dev') returning id", [orgA])).rows[0].id);
ok("owner can create a job", !!jobA);
ok("other tenant sees no jobs of org A", await as(C, async () => (await q("select count(*)::int n from jobs where org_id=$1", [orgA])).rows[0].n === 0));
ok("other tenant sees no org A row", await as(C, async () => (await q("select count(*)::int n from organizations")).rows[0].n === 1));
await expectErr("other tenant cannot insert a job into org A", () => asTry(C, () => q("insert into jobs (org_id, title) values ($1,'x')", [orgA])), /row-level security/);
await expectErr("other tenant cannot attach a candidate to org A's job", () => asTry(C, () => q("insert into candidates (org_id, job_id, name) values ($1,$2,'X')", [orgC, jobA])), /row-level security/);
const candA = await as(A, async () => (await q("insert into candidates (org_id, job_id, name) values ($1,$2,'Cand') returning id, org_id", [orgC, jobA])).rows[0]);
ok("candidate org is forced to the job's org", candA.org_id === orgA);

await expectErr("owner cannot change own billing plan", () => asTry(A, async () => { const r = await q("update org_billing set plan='growth' where org_id=$1", [orgA]); if (r.rowCount === 0) throw new Error("row-level security: no rows"); }), /row-level security/);
await expectErr("members cannot call increment_usage", () => asTry(A, () => q("select increment_usage($1,'2026-11','resume')", [orgA])), /permission denied/);
await q("select increment_usage($1,'2026-11','resume')", [orgA]);
ok("server (postgres) can increment usage", (await q("select resume_screens from usage_counters where org_id=$1", [orgA])).rows[0].resume_screens === 1);

// invitations
const tok = await as(A, async () => (await q("insert into invitations (org_id, email, role, invited_by) values ($1,'B@x.com','viewer',$2) returning token", [orgA, A])).rows[0].token);
await expectErr("wrong user cannot accept someone else's invitation", () => asTry(C, () => q("select accept_invitation($1)", [tok])), /different email/);
await q("begin"); await q("set local role anon");
ok("anon can preview an invitation by token", (await q("select * from invitation_preview($1)", [tok])).rows[0]?.org_name === "Acme Talent"); await q("commit");
await as(B, () => q("select accept_invitation($1)", [tok]));
ok("invited user joins with the invited role", (await q("select role from memberships where org_id=$1 and user_id=$2", [orgA, B])).rows[0]?.role === "viewer");
await expectErr("invitation cannot be reused", () => asTry(B, () => q("select accept_invitation($1)", [tok])), /invalid or has expired/);
ok("viewer can read jobs", await as(B, async () => (await q("select count(*)::int n from jobs")).rows[0].n === 1));
await expectErr("viewer cannot create jobs", () => asTry(B, () => q("insert into jobs (org_id, title) values ($1,'x')", [orgA])), /row-level security/);
ok("viewer update of a job changes nothing", await as(B, async () => (await q("update jobs set title='hacked' where id=$1", [jobA])).rowCount === 0));
ok("viewer cannot promote themselves", await as(B, async () => (await q("update memberships set role='owner' where user_id=$1 and org_id=$2", [B, orgA])).rowCount === 0));
ok("viewer can see teammate profile", await as(B, async () => (await q("select count(*)::int n from profiles where id=$1", [A])).rows[0].n === 1));
ok("users can't see profiles outside their workspaces", await as(C, async () => (await q("select count(*)::int n from profiles where id=$1", [A])).rows[0].n === 0));
await expectErr("last owner cannot leave", () => asTry(A, () => q("delete from memberships where org_id=$1 and user_id=$2", [orgA, A])), /at least one owner/);
await as(A, () => q("update memberships set role='admin' where org_id=$1 and user_id=$2", [orgA, B]));
await expectErr("admin cannot demote the owner", () => asTry(B, () => q("update memberships set role='viewer' where org_id=$1 and user_id=$2", [orgA, A])), /Only owners|at least one owner/);
ok("audit log written for join", (await q("select count(*)::int n from audit_log where org_id=$1 and action='member.joined'", [orgA])).rows[0].n === 1);
await as(A, () => q("delete from organizations where id=$1", [orgA]));
ok("owner can delete the workspace (cascade passes owner guard)", (await q("select count(*)::int n from memberships where org_id=$1", [orgA])).rows[0].n === 0 && (await q("select count(*)::int n from candidates")).rows[0].n === 0);
await q("delete from auth.users where id=$1", [C]);
ok("deleting a user account cascades cleanly", (await q("select count(*)::int n from memberships where user_id=$1", [C])).rows[0].n === 0);

console.log(`\n${pass} passed, ${fail} failed`);
await c.end();
process.exit(fail ? 1 : 0);
