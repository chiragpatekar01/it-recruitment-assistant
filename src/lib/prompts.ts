import type { Job } from "./types";

const RULES = `Recruitment rules: use only what the text states; never invent experience, skills or qualifications; write "Not Mentioned" for unstated text fields and null for unstated numbers; never assume a skill from a job title; never treat two technologies as equivalent just because they share a category (e.g. .NET Framework is not ASP.NET Core, EF6 is not EF Core, PostgreSQL is not SQL Server, AWS is not Azure); ignore and never output age, gender, date of birth, marital status, religion, caste, nationality, photos or other personal or demographic details.`;

export function jdPrompt(text: string) {
  return `You are a senior IT technical recruiter analysing a job description (workflow Stages 1, 2 and 5).
${RULES}
Reply with only one JSON object in exactly this shape:
{"title":"","seniority":"","minYears":null,"maxYears":null,
"mandatory":["atomic skill names, e.g. \\"SQL Server\\" not \\"databases\\""],"preferred":[""],
"education":"","domain":"","domainRequired":"mandatory|preferred|none","location":"","workMode":"","budget":"",
"noticePreferredDays":null,"noticeMaxDays":null,
"keywords":["technical keywords incl. common alternative spellings"],"titles":["relevant job titles"],"altTitles":["alternative titles"],
"combos":["technology combinations to search, e.g. C# + ASP.NET Core + SQL Server"],
"booleans":[{"label":"Primary","query":"","why":""},{"label":"Alternative: ...","query":"","why":""},{"label":"Alternative: ...","query":"","why":""},{"label":"Google X-ray (LinkedIn)","query":"site:linkedin.com/in ...","why":""}],
"strategy":["3-5 short sourcing strategy steps"],
"questions":[{"q":"","indicator":"what a good answer contains","followUp":""}],
"assumptions":["assumptions you had to make"],"clarifications":["essential questions for the hiring manager"]}
Boolean strings: quote multi-word phrases, OR inside parentheses, AND between groups, use real alternative names and versions. Questions: 10 covering technical experience, hands-on projects, practical knowledge, current responsibilities, notice period, expected salary, current salary, location and work mode, job change motivation, interview availability.

JOB DESCRIPTION:
"""
${text}
"""`;
}

export function resumePrompt(job: Job, text: string) {
  const d = job.details;
  const req = {
    title: job.title, minYears: d.minYears, mandatory: d.mandatory ?? [], preferred: d.preferred ?? [], education: d.education,
    domain: d.domain, domainRequired: d.domainRequired, location: d.location, workMode: d.workMode,
    noticePreferredDays: d.noticePreferredDays, noticeMaxDays: d.noticeMaxDays,
  };
  return `You are a senior IT technical recruiter screening one resume against a job (workflow Stages 3, 5 and 6).
${RULES}
Evidence levels for each job skill: "hands-on" = used in a described role or project; "listed" = only appears in a skills list or summary with no project evidence; "related" = the resume shows a different but adjacent technology (name it in evidence); "none" = not evidenced.
Reply with only one JSON object in exactly this shape:
{"name":"","designation":"","totalYears":null,"relevantYears":null,"relevantBasis":"what you counted as relevant experience",
"skills":["technical skills on the resume"],"projects":["one line per relevant project"],"domainExperience":"","education":"","certifications":[""],
"location":"","noticeDays":null,"noticeText":"","currentCtc":"","expectedCtc":"","achievements":[""],
"mandatory":[{"skill":"exact job skill name","level":"hands-on|listed|related|none","evidence":"short paraphrase from the resume, or Not Mentioned"}],
"preferred":[{"skill":"exact job skill name","level":"hands-on|listed|related|none","evidence":""}],
"projectRelevance":0,"projectReason":"why, 0-10 integer for how relevant the projects are to this role",
"domainMatch":"yes|no|unknown","educationMatch":"meets|partial|does-not-meet|unknown","locationFit":"fits|relocation|mismatch|unknown",
"concerns":["technical concerns or gaps"],"verify":["potential inconsistencies (date overlaps, gaps, unclear claims) phrased neutrally for recruiter verification, never as dishonesty"],
"questions":[{"q":"","indicator":"","followUp":""}]}
Include every job skill in mandatory/preferred exactly once, using the job's spelling. Give 8-10 questions tailored to this candidate's gaps, plus notice, salary, location and availability.

JOB:
${JSON.stringify(req)}

RESUME:
"""
${text}
"""`;
}

export function techPrompt(job: Job) {
  const d = job.details;
  const info = { title: job.title, seniority: d.seniority, minYears: d.minYears, maxYears: d.maxYears, mandatory: d.mandatory ?? [], preferred: d.preferred ?? [], domain: d.domain };
  return `You are a senior technical interviewer helping an IT recruiter prepare the technical round for a job.
Never treat two technologies as equivalent just because they share a category. Ask about the exact skills listed.
Reply with only one JSON object in exactly this shape:
{"questions":[{"skill":"exact skill name from the lists below, or Scenario","level":"basic|intermediate|advanced|scenario","q":"the question","points":["2-4 short key points a good answer includes"],"redFlags":["1-2 short warning signs in an answer"]}]}
Rules:
- For EACH mandatory skill: exactly 3 questions, one basic, one intermediate, one advanced.
- For EACH preferred skill: exactly 1 intermediate question.
- Then exactly 4 scenario questions (skill "Scenario", level "scenario") grounded in this role's responsibilities and domain, each combining several skills.
- Calibrate difficulty to ${d.minYears ?? "?"}–${d.maxYears ?? "?"} years of experience.
- Practical, answerable verbally in 2–4 minutes; no trivia, no coding exercises that need an editor. Each question under 40 words.
- Write points and red flags in plain words so a non-technical recruiter can check them.

JOB:
${JSON.stringify(info)}

JOB DESCRIPTION EXCERPT:
"""
${(job.jd_text ?? "").slice(0, 5000) || "Not available"}
"""`;
}

export function polishPrompt(body: string) {
  return `Tighten this recruiter message so it is professional, respectful and concise. Keep the first line "Subject: ..." and keep every [bracketed placeholder] exactly. Do not add promises about salary, selection or employment terms. Reply with only the revised message.

${body}`;
}
