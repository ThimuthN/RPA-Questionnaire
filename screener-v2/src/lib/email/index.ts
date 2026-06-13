export { sendEmail, sendEmailSafe, type SendEmailInput, type SendEmailResult, type EmailTemplate } from "./send";
export { generateIcsEvent, type IcsEventInput } from "./ics";
export { getOrgName, getAppUrl, getFromAddress } from "./client";

export { applicationReceivedEmail } from "./templates/application-received";
export { interviewInviteEmail } from "./templates/interview-invite";
export { stageAdvanceEmail } from "./templates/stage-advance";
export { rejectionEmail } from "./templates/rejection";
export { offerSentEmail } from "./templates/offer-sent";
export { screenerInviteEmail } from "./templates/screener-invite";
export { adHocEmail } from "./templates/ad-hoc";
