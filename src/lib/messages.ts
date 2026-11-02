import type { Candidate, Job } from "./types";
import { NM } from "./types";
import { align } from "./scoring";

export const MSG_TYPES = [
  ["outreach", "Initial outreach"], ["intro", "Job opportunity introduction"], ["resume", "Resume request"],
  ["screening", "Screening call invitation"], ["schedule", "Interview scheduling"], ["confirm", "Interview confirmation"],
  ["feedback", "Interview feedback"], ["followup", "Follow-up"], ["offer", "Offer communication"], ["rejection", "Rejection"],
] as const;
export type MsgType = (typeof MSG_TYPES)[number][0];

export function draftMessage(type: MsgType, c: Candidate | null, j: Job | null, recruiter: string, orgName: string): string {
  const d = j?.details ?? {};
  const first = c ? c.name.replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "[Candidate name]" : "[Candidate name]";
  const role = j?.title || "[Role]";
  const loc = d.location && d.location !== NM ? d.location : "[Location]";
  const mode = d.workMode && d.workMode !== NM ? d.workMode : "[Work mode]";
  const rec = recruiter || "[Your name]";
  const org = orgName || "[Organization name]";
  const sig = `Best regards,\n${rec}\n${org} | [Phone]`;
  const handsOn = c ? align(c.profile.mandatory, d.mandatory).filter((s) => s.level === "hands-on").slice(0, 3).map((s) => s.skill).join(", ") : "";
  const top = handsOn || (d.mandatory ?? []).slice(0, 3).join(", ") || "[key skills]";
  const req = (d.mandatory ?? []).slice(0, 6).map((s) => `• ${s}`).join("\n") || "• [Key requirement]";
  const exp = d.minYears != null ? `${d.minYears}${d.maxYears != null ? "–" + d.maxYears : "+"} years` : "[Experience]";

  const T: Record<MsgType, [string, string]> = {
    outreach: [`${role} opportunity – ${loc}`, `Hi ${first},\n\nI'm ${rec} from ${org}. I came across your profile, and your experience with ${top} looks relevant to a ${role} role we are hiring for (${loc}, ${mode}).\n\nWould you be open to a short conversation about it? If so, please share a convenient time.\n\n${sig}`],
    intro: [`${role} – role overview`, `Hi ${first},\n\nThank you for your interest. Here is a short overview of the role:\n\nRole: ${role}\nLocation: ${loc} (${mode})\nExperience: ${exp}\n\nKey skills:\n${req}\n\nIf this matches what you are looking for, I'd be glad to take it forward. Compensation and other terms will be discussed and confirmed during the process.\n\n${sig}`],
    resume: [`Updated resume – ${role}`, `Hi ${first},\n\nThank you for your time. To take your profile forward for the ${role} role, could you please share:\n\n• Your updated resume\n• Current location and openness to ${mode} work in ${loc}\n• Notice period\n• Current and expected CTC\n\n${sig}`],
    screening: [`${role} – screening call`, `Hi ${first},\n\nI'd like to schedule a 20-minute screening call to discuss the ${role} role and your experience.\n\nCould you share two or three slots that suit you over the next two working days?\n\n${sig}`],
    schedule: [`Interview scheduling – ${role}`, `Hi ${first},\n\nThank you for the screening conversation. The next step is a technical interview for the ${role} role.\n\nPlease let me know which of these slots works for you:\n• [Date] at [Time]\n• [Date] at [Time]\n• [Date] at [Time]\n\nThe interview will be [video call / in person] and will last about [duration].\n\n${sig}`],
    confirm: [`Interview confirmed – ${role}`, `Hi ${first},\n\nThis confirms your interview for the ${role} role:\n\nDate: [Date]\nTime: [Time] IST\nMode: [Video link / Office address]\nPanel: [Interviewer name(s)]\nDuration: [Duration]\n\nPlease keep a copy of your resume handy and join a few minutes early. Let me know if anything changes.\n\n${sig}`],
    feedback: [`Interview update – ${role}`, `Hi ${first},\n\nThank you for attending the interview for the ${role} role. The panel has shared their feedback:\n\n[Summary of feedback]\n\nNext step: [Next step / timeline].\n\nPlease feel free to reach out if you have any questions.\n\n${sig}`],
    followup: [`Following up – ${role}`, `Hi ${first},\n\nI'm following up on my earlier message about the ${role} role in ${loc}. Please let me know if you'd like to explore it, or if now isn't the right time. Either way, I'd appreciate a quick reply.\n\n${sig}`],
    offer: [`Offer – ${role}`, `Hi ${first},\n\nI'm pleased to let you know that the client would like to extend an offer for the ${role} role.\n\nThe formal offer letter, with confirmed compensation, joining date and terms, will be shared by [client / HR] on [date]. Please review it carefully and let me know if you have any questions.\n\nCongratulations, and thank you for your time throughout the process.\n\n${sig}`],
    rejection: [`Update on your application – ${role}`, `Hi ${first},\n\nThank you for your time and interest in the ${role} role. After careful consideration, we won't be moving forward with your application for this position.\n\nWe appreciate the effort you put into the process and would like to keep your profile in mind for future roles that match your experience.\n\nWishing you the very best.\n\n${sig}`],
  };
  const [subject, body] = T[type] ?? T.outreach;
  return `Subject: ${subject}\n\n${body}`;
}
