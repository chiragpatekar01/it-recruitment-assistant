# IT Recruitment Assistant

An AI-assisted workspace for IT recruiters. It turns job descriptions into structured hiring requirements and sourcing strings, screens resumes against them with a transparent match score, and tracks candidates through the hiring pipeline.

**Operating principle:** the AI assists the recruiter; the recruiter makes the final decision.

## Features

| Area | What it does | Workflow stage |
|---|---|---|
| **Jobs** | Paste a JD and Claude extracts mandatory and preferred skills, experience, budget, notice period, domain and work mode. Everything is editable in the **Edit** tab. | 1 · JD analysis |
| **Sourcing** | Boolean search strings (primary, alternatives, Google X-ray), job titles, technology combinations and a sourcing strategy, ready to copy into LinkedIn or Naukri. | 2 · Sourcing |
| **Screen resume** | Upload a PDF, DOCX or TXT resume or paste the text. Each JD skill is graded as *hands-on*, *listed only*, *related tech* or *not evidenced*, with evidence from the resume. | 3 · Screening |
| **Match score** | A fixed, weighted score calculated in the page, not by the AI, with a line-by-line explanation. Recruiters can correct any grade and the score updates. | 4 · Matching |
| **Screening questions** | 8–12 questions per job and per candidate, with good-answer indicators and follow-ups. | 5 · Initial screening |
| **Technical questions** | A question bank for the technical round: 3 levels (basic, intermediate, advanced) per must-have skill, 1 per nice-to-have skill, and role-based scenarios. Each lists what a good answer mentions and red flags, so non-technical recruiters can judge answers. Add, delete, filter and copy questions. | 5–6 · Technical round |
| **Candidates** | Pipeline table with stage filters, search, source filter, sorting, a score-comparison view and a full evaluation panel per candidate. | 6 · Evaluation |
| **Messages** | Drafts for outreach, interview scheduling, confirmation, feedback, follow-up, offer and rejection. Nothing is sent from the app. | 7 · Communication |
| **Dashboard** | Funnel, conversion ratios (only when there is data) and a copyable status report. | 8 · Reporting |

## Match score model

| Parameter | Weight |
|---|---:|
| Mandatory technical skills | 40 |
| Relevant experience | 25 |
| Project / domain experience | 15 |
| Preferred technical skills | 10 |
| Education / certifications | 5 |
| Role and location requirements | 5 |

Evidence rule: hands-on = full marks, listed only or related technology = half, not evidenced = 0. Information the resume doesn't state is scored as half or zero and flagged for verification.

Bands: **85–100** strong · **70–84** good · **55–69** partial · **below 55** low.

The score is a preliminary JD alignment measure. It does not predict job performance and is not a hiring decision.

## Responsible use

- Never invents experience or qualifications; missing information shows as "Not Mentioned".
- Never treats technologies as equivalent just because they share a category (for example, .NET Framework is not ASP.NET Core, and AWS is not Azure).
- Ignores age, gender, photos, religion, caste and other personal or demographic details. None of them are used in scoring.
- Stores only the extracted screening profile, not the full resume.
- Flags possible resume inconsistencies for human verification instead of judging them.

## Running it

The app is a single self-contained file, `index.html`, written in plain HTML, CSS and JavaScript with no build step.

- **Full version (AI analysis and saved data):** runs as a published Claude artifact on claude.ai. There, the page uses Claude for JD and resume analysis and keeps jobs and candidates in the artifact's shared store.
- **Standalone (open `index.html` in a browser):** the interface loads in "Local only" mode. You can create jobs manually, add candidates manually, adjust evidence, see scores and use message templates, but there is no AI analysis and nothing is saved after you close the tab.

PDF and DOCX reading loads [pdf.js](https://mozilla.github.io/pdf.js/) and [mammoth.js](https://github.com/mwilliamson/mammoth.js) from cdnjs on demand.

## Test data

`test-data/` contains a **fictional** Java Spring Boot job description and three **fictional** resumes designed to test different outcomes: a strong fit, an older-stack profile with missing skills and a long notice period, and a mixed profile with a planted date overlap for the inconsistency check. None of them describe real people or companies.

## Project structure

```
index.html      The complete app
test-data/      Fictional JD and resumes for testing
README.md
```
