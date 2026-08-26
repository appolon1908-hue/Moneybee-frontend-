export interface ResourcePage {
  title: string
  description: string
  sections: Array<{ heading: string; body: string }>
}

export const resourcePages: Record<string, ResourcePage> = {
  "how-it-works": {
    title: "How MoneyBee works",
    description: "One secure request, a complete application, responsible review, and clear next steps.",
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
    sections: [
      { heading: "Business history", body: "Time in business, revenue consistency, industry, and operating location may affect eligibility." },
      { heading: "Financial evidence", body: "Bank activity, existing obligations, requested amount, and use of funds may be reviewed." },
      { heading: "No guarantee", body: "Submitting a request does not guarantee approval, terms, or funding." },
    ],
  },
  "required-documents": {
    title: "Documents commonly requested",
    description: "The exact document list is generated for your application and may change during review.",
    sections: [
      { heading: "Business records", body: "Formation documents, EIN evidence, licenses, and proof of address may be requested." },
      { heading: "Financial records", body: "Recent bank statements, processing statements, tax records, or debt schedules may be requested." },
      { heading: "Owner records", body: "Identity and ownership evidence may be requested through the secure borrower portal." },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    description: "Practical answers about applications, timing, security, and support.",
    sections: [
      { heading: "Does applying guarantee approval?", body: "No. Approval and terms depend on eligibility, verification, available programs, and lender review." },
      { heading: "Where should documents be uploaded?", body: "Only through the secure borrower portal when the document capability is available." },
      { heading: "Can a lender fund directly from the portal?", body: "No. Portal decisions do not bypass MoneyBee controls or automatically move funds." },
    ],
  },
  security: {
    title: "Security at MoneyBee",
    description: "MoneyBee uses centralized identity, tenant-scoped authorization, audit records, and controlled integration delivery.",
    sections: [
      { heading: "Secure identity", body: "Email and Google sign-in are handled through the canonical Keycloak authority using Authorization Code with PKCE." },
      { heading: "Controlled data access", body: "Backend permissions, memberships, tenant scope, and resource ownership remain authoritative." },
      { heading: "Responsible integrations", body: "External deliveries use durable queues, authentication, replay protection, and evidence." },
    ],
  },
  privacy: {
    title: "Privacy notice",
    description: "This page is prepared for legal review and must be replaced with the approved jurisdiction-specific notice before production launch.",
    sections: [
      { heading: "Information collected", body: "MoneyBee may collect contact, business, financial, ownership, application, device, and consent evidence." },
      { heading: "How information is used", body: "Information may be used to operate the platform, assess requests, prevent fraud, support users, and satisfy legal obligations." },
      { heading: "Your choices", body: "Contact MoneyBee to exercise available privacy rights or manage communications preferences." },
    ],
  },
  terms: {
    title: "Terms of use",
    description: "Draft terms for legal review. Production publication requires approved final text.",
    sections: [
      { heading: "Platform role", body: "MoneyBee provides a controlled business-funding application and operations platform." },
      { heading: "No guarantee", body: "Use of the platform does not guarantee approval, an offer, or funding." },
      { heading: "Accurate information", body: "Users must provide accurate information and protect their account access." },
    ],
  },
  "consents-and-disclosures": {
    title: "Consents and disclosures",
    description: "Review the current version of each consent before submitting a request.",
    sections: [
      { heading: "Electronic communications", body: "You may consent to receive application and account information electronically." },
      { heading: "Authorization to contact", body: "You may authorize MoneyBee to contact you about the specific request you submit." },
      { heading: "Versioned evidence", body: "MoneyBee records the consent type, document version, content hash, acceptance time, and request evidence." },
    ],
  },
  accessibility: {
    title: "Accessibility",
    description: "MoneyBee is working toward accessible forms, navigation, status messages, keyboard operation, and readable content.",
    sections: [
      { heading: "Need assistance?", body: "Use the contact or support form to request an accessible alternative or report a barrier." },
    ],
  },
  complaints: {
    title: "Complaints and concerns",
    description: "Submit a concern through the contact form and select Complaints as the topic.",
    sections: [
      { heading: "What to include", body: "Provide your reference number, a clear description, relevant dates, and the resolution you are requesting." },
      { heading: "Do not include secrets", body: "Do not place passwords, full account credentials, or unnecessary sensitive information in a public form." },
    ],
  },
}
