export interface ResourcePage {
  title: string
  description: string
  keywords: string[]
  sections: Array<{ heading: string; body: string }>
}

export const resourcePages: Record<string, ResourcePage> = {
  "how-it-works": {
    title: "How MoneyBee works",
    description: "One secure request, a complete application, responsible review, and clear next steps.",
    keywords: ["how MoneyBee works", "business funding process", "small business loan process"],
    sections: [
      { heading: "1. Start securely", body: "Submit a funding request or create your MoneyBee account." },
      { heading: "2. Complete your file", body: "Provide business, ownership, financial, and document information through the borrower portal." },
      { heading: "3. Review options", body: "MoneyBee presents available options only after the required review and provider controls are satisfied." },
      { heading: "4. Choose deliberately", body: "Review the product, cost, payment schedule, conditions, and disclosures before accepting an offer." },
    ],
  },
  eligibility: {
    title: "Business funding eligibility",
    description: "Eligibility varies by product, lender, business profile, jurisdiction, and verification results.",
    keywords: ["business loan eligibility", "business financing requirements", "funding qualifications"],
    sections: [
      { heading: "Business history", body: "Time in business, revenue consistency, industry, and operating location may affect eligibility." },
      { heading: "Financial evidence", body: "Bank activity, existing obligations, requested amount, and use of funds may be reviewed." },
      { heading: "No guarantee", body: "Submitting a request does not guarantee approval, terms, or funding." },
    ],
  },
  "required-documents": {
    title: "Documents commonly requested",
    description: "The exact document list is generated for your application and may change during review.",
    keywords: ["business loan documents", "funding document checklist", "loan application documents"],
    sections: [
      { heading: "Business records", body: "Formation documents, EIN evidence, licenses, and proof of address may be requested." },
      { heading: "Financial records", body: "Recent bank statements, processing statements, tax records, or debt schedules may be requested." },
      { heading: "Owner records", body: "Identity and ownership evidence may be requested through the secure borrower portal." },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    description: "Practical answers about applications, timing, security, and support.",
    keywords: ["MoneyBee FAQ", "business funding questions", "small business loan FAQ"],
    sections: [
      { heading: "Does applying guarantee approval?", body: "No. Approval and terms depend on eligibility, verification, available programs, and lender review." },
      { heading: "Where should documents be uploaded?", body: "Only through the secure borrower portal when the document capability is available." },
      { heading: "Can a lender fund directly from the portal?", body: "No. Portal decisions do not bypass MoneyBee controls or automatically move funds." },
    ],
  },
  security: {
    title: "Security at MoneyBee",
    description: "MoneyBee uses centralized identity, tenant-scoped authorization, audit records, and controlled integration delivery.",
    keywords: ["MoneyBee security", "secure business loan application", "business financing privacy"],
    sections: [
      { heading: "Secure identity", body: "Email and Google sign-in are handled through the canonical Keycloak authority using Authorization Code with PKCE." },
      { heading: "Controlled data access", body: "Backend permissions, memberships, tenant scope, and resource ownership remain authoritative." },
      { heading: "Responsible integrations", body: "External deliveries use durable queues, authentication, replay protection, and evidence." },
    ],
  },
  privacy: {
    title: "Privacy notice",
    description: "How MoneyBee describes collection, use, cookies, advertising disclosures, and privacy choices.",
    keywords: ["MoneyBee privacy", "privacy notice", "business funding privacy policy"],
    sections: [
      { heading: "Information collected", body: "MoneyBee may collect contact, business, financial, ownership, application, device, and consent evidence." },
      { heading: "How information is used", body: "Information may be used to operate the platform, assess requests, prevent fraud, support users, and satisfy legal obligations." },
      { heading: "Cookies and advertising", body: "MoneyBee may use cookies, local storage, pixels, or similar technologies for essential site operation, measurement, fraud prevention, and advertising where permitted by law and user choice." },
      { heading: "Third-party advertising", body: "Google and other third-party vendors may use cookies, web beacons, IP addresses, device data, and prior visits to help serve or measure ads when enabled and legally permitted." },
      { heading: "Your choices", body: "Use Privacy Choices or contact MoneyBee to exercise available privacy rights, manage communications preferences, or request information about data use." },
    ],
  },
  terms: {
    title: "Terms of use",
    description: "Core terms for using MoneyBee public pages, forms, and secure portals.",
    keywords: ["MoneyBee terms", "business funding terms", "website terms of use"],
    sections: [
      { heading: "Platform role", body: "MoneyBee provides a controlled business-funding application and operations platform." },
      { heading: "No guarantee", body: "Use of the platform does not guarantee approval, an offer, or funding." },
      { heading: "Accurate information", body: "Users must provide accurate information and protect their account access." },
    ],
  },
  "consents-and-disclosures": {
    title: "Consents and disclosures",
    description: "Review the current version of each consent before submitting a request.",
    keywords: ["business loan consent", "electronic communications consent", "funding disclosures"],
    sections: [
      { heading: "Electronic communications", body: "You may consent to receive application and account information electronically." },
      { heading: "Authorization to contact", body: "You may authorize MoneyBee to contact you about the specific request you submit." },
      { heading: "Versioned evidence", body: "MoneyBee records the consent type, document version, content hash, acceptance time, and request evidence." },
    ],
  },
  accessibility: {
    title: "Accessibility",
    description: "MoneyBee is working toward accessible forms, navigation, status messages, keyboard operation, and readable content.",
    keywords: ["MoneyBee accessibility", "accessible business funding", "accessibility support"],
    sections: [
      { heading: "Need assistance?", body: "Use the contact or support form to request an accessible alternative or report a barrier." },
    ],
  },
  complaints: {
    title: "Complaints and concerns",
    description: "Submit a concern through the contact form and select Complaints as the topic.",
    keywords: ["MoneyBee complaints", "business funding support", "loan complaint"],
    sections: [
      { heading: "What to include", body: "Provide your reference number, a clear description, relevant dates, and the resolution you are requesting." },
      { heading: "Do not include secrets", body: "Do not place passwords, full account credentials, or unnecessary sensitive information in a public form." },
    ],
  },
  "cookie-notice": {
    title: "Cookie notice",
    description: "How MoneyBee uses essential storage, analytics, advertising cookies, and consent choices.",
    keywords: ["MoneyBee cookies", "cookie notice", "advertising cookies"],
    sections: [
      { heading: "Essential storage", body: "MoneyBee uses essential browser storage for security, form progress, session routing, idempotency, and user preferences." },
      { heading: "Analytics and advertising", body: "Measurement and advertising technologies may be used only when configured and permitted by applicable law and user choices." },
      { heading: "Google advertising disclosures", body: "Google and partner vendors may use cookies or similar identifiers to serve, limit, and measure ads based on visits to this and other sites when ads are enabled." },
      { heading: "Manage choices", body: "Use your browser controls, Google ad settings, and MoneyBee Privacy Choices to manage available cookie and advertising preferences." },
    ],
  },
  "advertising-disclosure": {
    title: "Advertising disclosure",
    description: "MoneyBee advertising, funding-content, and Google systems disclosure.",
    keywords: ["MoneyBee advertising disclosure", "Google ads disclosure", "business loan advertising"],
    sections: [
      { heading: "No guaranteed approval", body: "Advertising and landing pages are informational and do not guarantee approval, product availability, rates, terms, or funding." },
      { heading: "Eligibility applies", body: "Funding options depend on business profile, lender requirements, verification, consent, provider availability, and jurisdiction." },
      { heading: "Ad personalization", body: "If advertising is enabled, Google and other vendors may personalize or measure ads according to consent, privacy law, and publisher policy requirements." },
      { heading: "Clear navigation", body: "MoneyBee pages must remain easy to navigate, avoid deceptive redirects, and keep contact forms clear about what action is being requested." },
    ],
  },
  "privacy-choices": {
    title: "Privacy choices",
    description: "Manage communication, cookie, advertising, and data-rights requests with MoneyBee.",
    keywords: ["privacy choices", "opt out", "consumer privacy rights"],
    sections: [
      { heading: "Communication choices", body: "You may request changes to email, phone, or contact preferences through the contact or support form." },
      { heading: "Cookie choices", body: "You may use browser controls to remove or block cookies. Some essential security or form features may not work without required storage." },
      { heading: "Advertising choices", body: "You may use Google ad settings and available regional opt-out tools to manage personalized advertising choices." },
      { heading: "Data requests", body: "Use the contact form to request access, correction, deletion, or other privacy rights where available under applicable law." },
    ],
  },
  about: {
    title: "About MoneyBeeLoans",
    description: "MoneyBee helps business owners submit secure funding requests and track review steps clearly.",
    keywords: ["about MoneyBee", "MoneyBeeLoans", "business funding platform"],
    sections: [
      { heading: "What MoneyBee does", body: "MoneyBee provides public intake, secure borrower workflows, lender review tools, and administrative operations for business-funding requests." },
      { heading: "How decisions work", body: "Applications are reviewed through controlled backend logic, requirements, provider readiness, and lender or operational workflows." },
      { heading: "How to start", body: "Begin with a funding request, then continue through the secure borrower portal when your next action is ready." },
    ],
  },
}
