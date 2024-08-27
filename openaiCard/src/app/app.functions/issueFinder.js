const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");
// const issues = require("./issues.js");

dotenv.config();

const issues = [
  {
    type: "Apartment Info",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Detailed information about the apartment, including features, included services, building rules, and any other relevant information for tenants.",
  },
  {
    type: "City Info",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Information about the city where the apartment is located, including recommendations of places of interest, local services, public transportation, and any other useful information for tenants.",
  },
  {
    type: "Check-In Info",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Information provided to tenants about the check-in process, including required documentation, procedures, and any assistance needed to ensure a smooth entry into the apartment.",
  },
  {
    type: "Check-out Info",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Information provided to tenants about the check-out process, including steps to follow, the condition of the apartment to be returned, and details about the return of the security deposit.",
  },
  {
    type: "Building Access",
    tier: "Tier 1",
    severity: "Critical",
    priority: "High",
    description:
      "Issues or inquiries related to building access, including obtaining keys, access cards, or the functionality of entry and exit systems.",
  },
  {
    type: "Blinds / Curtains",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Issues or requests related to the installation, repair, or replacement of blinds or curtains in the apartment to ensure privacy and light control.",
  },
  {
    type: "Car Lift",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Issues or requests related to the vehicle lift in the building, ensuring its proper operation and accessibility for tenants.",
  },
  {
    type: "Cleaning Service Questions",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Low",
    description:
      "Questions or inquiries about the cleaning services offered, including details about the scope of service, frequency, products used, and any other aspect related to the cleaning of the apartment.",
  },
  {
    type: "Break-in/Robbery",
    tier: "Tier 1",
    severity: "Critical",
    priority: "High",
    description:
      "Reporting a burglary or attempted burglary in the apartment or building, requiring immediate intervention from the security team and possible repairs or security enhancements.",
  },
  {
    type: "Baby Crib",
    tier: "Tier 1",
    severity: "Minor",
    priority: "High",
    description:
      "Request for the provision and setup of a crib in the apartment, ensuring it meets safety and comfort standards for babies.",
  },
  {
    type: "Cabinet/Wardrobe",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Requests or issues related to the installation, repair, or replacement of cabinets and wardrobes in the apartment to ensure adequate storage.",
  },
  {
    type: "Cleaning Requests",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Requests related to apartment cleaning, including complementary cleaning services, deep cleaning, and any other needs for maintaining hygiene and order of the space.",
  },
  {
    type: "Cancellation Requests",
    tier: "Tier 1",
    severity: "Critical",
    priority: "High",
    description:
      "Requests to cancel the lease agreement before the scheduled end date, managing the cancellation terms and possible penalties as per the contract.",
  },
  {
    type: "Booking Extension",
    tier: "Tier 1",
    severity: "Critical",
    priority: "High",
    description:
      "Requests to extend the duration of the apartment rental, managing additional dates, and adjusting payment terms as necessary.",
  },
  {
    type: "Cleaning Reschedule",
    tier: "Tier 1",
    severity: "Minor",
    priority: "High",
    description:
      "Requests to reschedule previously agreed cleaning services, adjusting the schedules to fit tenants' needs and availability.",
  },
  {
    type: "Check-in Email",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Email sent to new tenants prior to their arrival with details about the check-in process, including schedules, procedures, and any other relevant information for a smooth arrival.",
  },
  {
    type: "Contract Question",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Low",
    description:
      "Inquiries related to the terms and conditions of the lease agreement, including clauses, renewal options, termination conditions, and any other contractual details.",
  },
  {
    type: "Design Feedback",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Feedback from tenants regarding the interior design and aesthetics of the apartment, including suggestions for improvements or modifications.",
  },
  {
    type: "Payment Link",
    tier: "Tier 1",
    severity: "Major",
    priority: "High",
    description:
      "Providing tenants with a secure payment link to process rent payments or other charges associated with their stay.",
  },
  {
    type: "Service Feedback",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Feedback from tenants about the quality and satisfaction with the services provided, including housekeeping, maintenance, and customer support.",
  },
  {
    type: "Confirmation of current rental",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Providing tenants with official documentation or confirmation regarding their current rental status, including lease details and payment records.",
  },
  {
    type: "Early Check-In",
    tier: "Tier 1",
    severity: "Minor",
    priority: "High",
    description:
      "Requests to check into the apartment before the standard check-in time, requiring coordination and availability adjustments.",
  },
  {
    type: "Extra Keys",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Low",
    description:
      "Requests for additional keys for the apartment, ensuring proper authorization and security measures are followed.",
  },
  {
    type: "Extra Linen & Towels",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Low",
    description:
      "Requests for additional linens and towels, ensuring they are provided promptly and meet quality standards.",
  },
  {
    type: "Home Items & Essentials Delivery",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Delivery requests for essential home items, including kitchenware like pan, plates, cutlery, coffe machines, etc., toiletries, and other necessities to ensure the apartment is fully equipped.",
  },
  {
    type: "Home Items & Essentials Location",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Information about the location and availability of essential items within the apartment, ensuring tenants can easily find what they need.",
  },
  {
    type: "Light Bulb",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Requests or issues related to the replacement of light bulbs in the apartment to ensure proper lighting and functionality.",
  },
  {
    type: "Mattress Comfort",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Concerns or feedback regarding the comfort of the mattress provided, including requests for replacement or adjustments to improve sleep quality.",
  },
  {
    type: "Mattress Size",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Concerns or inquiries about the size of the mattress in the apartment, including requests for size changes or adjustments.",
  },
  {
    type: "Mold",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Reports of mold presence in the apartment, requiring immediate inspection and remediation to ensure tenant health and safety.",
  },
  {
    type: "New Booking",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Inquiries or requests related to making a new booking for an apartment, including availability, pricing, and booking procedures.",
  },
  {
    type: "Plants",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Requests or issues related to the maintenance and care of plants provided in the apartment, including watering and health.",
  },
  {
    type: "Plants Missing",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Reports of missing plants that were supposed to be provided in the apartment, requiring replacement or compensation.",
  },
  {
    type: "Pricing Questions",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Inquiries about the pricing structure, rent amounts, and any additional charges associated with the apartment.",
  },
  {
    type: "Refresh Cleaning Request",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Requests for an additional or refresher cleaning service to maintain the cleanliness and hygiene of the apartment.",
  },
  {
    type: "Security Deposit Questions",
    tier: "Tier 1",
    severity: "Minor",
    priority: "Medium",
    description:
      "Inquiries about the security deposit, including how it is calculated, terms for return, and any deductions made.",
  },
  {
    type: "Wi-Fi Details",
    tier: "Tier 1",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Information about the Wi-Fi network, including login credentials, coverage, and troubleshooting tips.",
  },
  {
    type: "Sales Request",
    tier: "Tier 1",
    severity: "Minor",
    priority: "High",
    description:
      "Requests related to the sale of apartments or additional services offered by the real estate company, including promotional offers.",
  },
  {
    type: "Extra Service Charge",
    tier: "Tier 1",
    severity: "Major",
    priority: "Medium",
    description:
      "Inquiries or disputes regarding additional service charges that may have been applied to the tenant's account.",
  },
  {
    type: "Landlord Rebilling",
    tier: "Tier 1",
    severity: "Major",
    priority: "Medium",
    description:
      "Issues related to rebilling by the landlord, including discrepancies in charges and clarifications needed.",
  },
  {
    type: "Payment Method Change",
    tier: "Tier 1",
    severity: "Critical",
    priority: "High",
    description:
      "Requests to change the payment method used for rent or other charges, ensuring secure and efficient processing.",
  },
  {
    type: "Confirmation of good standing- BERLIN",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Requests for a letter or document confirming the tenant's good standing and rental history in Berlin properties.",
  },
  {
    type: "Home Essentials Quality",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Concerns or feedback about the quality of home essentials provided, such as bedding, kitchenware, or toiletries.",
  },
  {
    type: "No water presssure",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Reports of low or no water pressure in the apartment, requiring immediate attention to restore normal water flow.",
  },
  {
    type: "Security Deposit Deduction",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Inquiries or disputes regarding deductions made from the security deposit, including justifications and amounts.",
  },
  {
    type: "Security Deposit Full Refund",
    tier: "Tier 2",
    severity: "Minor",
    priority: "High",
    description:
      "Requests for the full return of the security deposit after the end of the lease term, subject to property conditions.",
  },
  {
    type: "Bad Smell",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Complaints about unpleasant odors in the apartment, requiring investigation and resolution to ensure tenant comfort.",
  },
  {
    type: "Billing Details (Change for B2B)",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Requests to change billing details for business-to-business (B2B) transactions, including invoicing and payment information.",
  },
  {
    type: "Broken Bed",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Reports of a broken or damaged bed, requiring repair or replacement to maintain tenant comfort and safety.",
  },
  {
    type: "Broken Sofa",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Reports of a broken or damaged sofa, requiring repair or replacement to maintain tenant comfort and living standards.",
  },
  {
    type: "Cleaning Complaints",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Complaints about the quality or thoroughness of the cleaning service provided, requiring review and corrective action.",
  },
  {
    type: "Common Areas Complaints",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Complaints about the condition or maintenance of common areas in the building, such as hallways, lobbies, or shared facilities.",
  },
  {
    type: "Confirmation of good standing",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Requests for a letter or document confirming the tenant's good standing and rental history in general properties.",
  },
  {
    type: "Dead Plants",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Reports of dead plants in the apartment, requiring replacement or removal to maintain aesthetic standards.",
  },
  {
    type: "Dirty Carpet",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "High",
    description:
      "Complaints about a dirty carpet in the apartment, requiring professional cleaning to maintain cleanliness.",
  },
  {
    type: "Dirty Mattress",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "High",
    description:
      "Reports of a dirty mattress, necessitating cleaning or replacement to ensure hygiene and comfort.",
  },
  {
    type: "Dirty Sofa",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "High",
    description:
      "Complaints about a dirty sofa, requiring thorough cleaning to uphold cleanliness standards.",
  },
  {
    type: "Dishwasher",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Issues or malfunctions with the dishwasher, needing repair or maintenance to restore functionality.",
  },
  {
    type: "Doorbell/Intercom",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Problems with the doorbell or intercom system, requiring repair to ensure proper communication and access.",
  },
  {
    type: "Drains",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Reports of blocked or slow drains in the apartment, needing immediate attention to prevent further issues.",
  },
  {
    type: "Dryer",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Issues or malfunctions with the dryer, requiring repair or maintenance to ensure proper operation.",
  },
  {
    type: "Electricity",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Problems with the electrical system, including outages or faults, needing urgent attention to restore power.",
  },
  {
    type: "Elevator Complaints",
    tier: "Tier 2",
    severity: "Minor",
    priority: "High",
    description:
      "Complaints about elevator functionality or maintenance, requiring prompt resolution to ensure convenience.",
  },
  {
    type: "Extractor hood",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Issues or malfunctions with the extractor hood, needing repair or maintenance to ensure proper ventilation.",
  },
  {
    type: "Faulty Ukio Installation",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Issues with Ukio-installed fixtures or appliances, requiring inspection and correction to ensure functionality.",
  },
  {
    type: "Fridge/Freezer",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Problems with the fridge or freezer, including malfunctions or inefficiency, needing repair or maintenance.",
  },
  {
    type: "Furniture Damaged",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Reports of damaged furniture, requiring repair or replacement to maintain living standards and comfort.",
  },
  {
    type: "Furniture Missing",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Complaints about missing furniture items, needing replacement to ensure the apartment is fully equipped.",
  },
  {
    type: "Home Essentials Missing",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Low",
    description:
      "Reports of missing home essentials, such as kitchenware or toiletries, needing prompt provision to tenants.",
  },
  {
    type: "Humidity",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Complaints about excessive humidity in the apartment, requiring solutions to control moisture levels.",
  },
  {
    type: "Initial Condition of apartment",
    tier: "Tier 2",
    severity: "Minor",
    priority: "High",
    description:
      "Concerns regarding the initial state of the apartment upon move-in, requiring attention to meet standards.",
  },
  {
    type: "Kitchen Stove",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Issues or malfunctions with the kitchen stove, needing repair or maintenance to ensure proper usage.",
  },
  {
    type: "Microwave",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Problems with the microwave, including malfunctions or inefficiency, requiring repair or replacement.",
  },
  {
    type: "Minor miscellaneous Repairs",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Various minor repair needs around the apartment, requiring timely attention to maintain functionality.",
  },
  {
    type: "No hot water",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Complaints about the absence of hot water, needing urgent attention to restore proper water heating.",
  },
  {
    type: "No water",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Reports of no water supply in the apartment, requiring immediate resolution to restore water access.",
  },
  {
    type: "Oven",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Issues or malfunctions with the oven, needing repair or maintenance to ensure proper cooking facilities.",
  },
  {
    type: "Pests",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Reports of pest infestations, requiring prompt pest control measures to maintain a hygienic environment.",
  },
  {
    type: "Plumbing Complaints",
    tier: "Tier 2",
    severity: "Minor",
    priority: "High",
    description:
      "General plumbing issues, including leaks or blockages, needing professional repair to restore function.",
  },
  {
    type: "Power Outage",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Reports of power outages in the apartment, requiring immediate attention to restore electricity supply.",
  },
  {
    type: "Shower/Bathtub",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Problems with the shower or bathtub, requiring repair or maintenance to ensure proper use.",
  },
  {
    type: "Sink",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Issues with the sink, including blockages or leaks, needing repair to maintain functionality.",
  },
  {
    type: "Toilet",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Problems with the toilet, including blockages or malfunctions, requiring repair to restore proper function.",
  },
  {
    type: "TV Malfunction",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Low",
    description:
      "Issues with the TV, including technical malfunctions, requiring repair or replacement to restore service.",
  },
  {
    type: "Wall Hanger",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Low",
    description:
      "Problems with wall hangers, including installation or damage, needing repair to ensure they are secure.",
  },
  {
    type: "Washing Machine",
    tier: "Tier 2",
    severity: "Cosmetic",
    priority: "Medium",
    description:
      "Problems with the washing machine, including malfunctions or inefficiency, requiring repair or replacement.",
  },
  {
    type: "Water Boiler",
    tier: "Tier 2",
    severity: "Major",
    priority: "High",
    description:
      "Issues with the water boiler, including malfunctions or inefficiency, requiring repair to ensure hot water supply.",
  },
  {
    type: "Windows",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Problems with windows, including broken glass or difficulty opening/closing, needing repair or replacement.",
  },
  {
    type: "Broken TV",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Low",
    description:
      "Complaints about a broken TV, requiring repair or replacement to restore entertainment service.",
  },
  {
    type: "A/C Malfunction",
    tier: "Tier 2",
    severity: "Major",
    priority: "Medium",
    description:
      "Issues with the air conditioning system, requiring repair to ensure proper cooling and comfort.",
  },
  {
    type: "Construction Works",
    tier: "Tier 2",
    severity: "Major",
    priority: "Medium",
    description:
      "Complaints about noise or disruption due to construction works nearby, requiring communication or mitigation.",
  },
  {
    type: "Doors",
    tier: "Tier 2",
    severity: "Major",
    priority: "Medium",
    description:
      "Issues with doors, including difficulty opening/closing or damage, needing repair or replacement.",
  },
  {
    type: "Electronic Lock Malfunction",
    tier: "Tier 2",
    severity: "Critical",
    priority: "High",
    description:
      "Problems with electronic locks, requiring immediate repair to ensure secure access to the apartment.",
  },
  {
    type: "Fire",
    tier: "Tier 2",
    severity: "Critical",
    priority: "High",
    description:
      "Reports of fire incidents, requiring immediate attention and appropriate safety measures.",
  },
  {
    type: "Heating",
    tier: "Tier 2",
    severity: "Major",
    priority: "Medium",
    description:
      "Issues with the heating system, requiring repair to ensure proper warmth and comfort.",
  },
  {
    type: "Internet Malfunction",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Medium",
    description:
      "Complaints about internet connectivity issues, needing technical support to restore proper service.",
  },
  {
    type: "Leakage",
    tier: "Tier 2",
    severity: "Critical",
    priority: "High",
    description:
      "Reports of water leakage, requiring immediate repair to prevent damage and restore functionality.",
  },
  {
    type: "Locked Out",
    tier: "Tier 2",
    severity: "Critical",
    priority: "High",
    description:
      "Situations where tenants are locked out of their apartments, needing urgent assistance to regain access.",
  },
  {
    type: "Broken TV",
    tier: "Tier 2",
    severity: "Minor",
    priority: "Low",
    description:
      "Complaints about a broken TV, requiring repair or replacement to restore entertainment service.",
  },
  {
    type: "Lost Keys/Forgot Keys",
    tier: "Tier 2",
    severity: "Critical",
    priority: "High",
    description:
      "Instances of lost or forgotten keys, requiring replacement or assistance to regain access.",
  },
  {
    type: "Radiators",
    tier: "Tier 2",
    severity: "Major",
    priority: "Medium",
    description:
      "Problems with radiators, including malfunctions or inefficiency, needing repair to ensure proper heating.",
  },
  {
    type: "Refunds & Compensations",
    tier: "Tier 2",
    severity: "Critical",
    priority: "High",
    description:
      "Requests for refunds or compensations due to unsatisfactory service or issues experienced.",
  },
  {
    type: "Noise",
    tier: "Tier 3",
    severity: "Minor",
    priority: "Medium",
    description:
      "Complaints about noise disturbances, requiring action to mitigate and maintain a quiet environment.",
  },
  {
    type: "Security Deposit Return - Full Return Approval",
    tier: "Tier 3",
    severity: "Critical",
    priority: "High",
    description:
      "Requests for the full return of the security deposit, requiring approval and processing.",
  },
  {
    type: "Bad Conduct from Neighbors",
    tier: "Tier 3",
    severity: "Major",
    priority: "High",
    description:
      "Complaints about inappropriate or disruptive behavior from neighbors, needing mediation or resolution.",
  },
  {
    type: "Apartment Change",
    tier: "Tier 3",
    severity: "Critical",
    priority: "High",
    description:
      "Requests to change apartments, requiring evaluation and processing based on availability and circumstances.",
  },
  {
    type: "Early Departure",
    tier: "Tier 3",
    severity: "Critical",
    priority: "High",
    description:
      "Requests for early departure from the lease, requiring discussion and agreement on terms and conditions.",
  },
];

exports.main = async (context = {}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  const client = axios.create({
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const { text } = context.parameters;
  console.log("Text received:", text);

  const issuesJson = JSON.stringify(issues);
  const prompt = `Given the text: "${text}", identify the issue type from this JSON array: ${issuesJson}. Don't elavorate the response, just return the value from the json file.`;

  const params = {
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant specialized in customer care processes and you are very concise in your responses just answering with the value from the type of issue. forget about severity, priority and tier and respond only with the type value, don't use verbose. don´t use double quotes or single quotes in the answer",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-3.5-turbo-0125",
    max_tokens: 50,
    temperature: 0,
  };

  try {
    const response = await client.post(
      "https://api.openai.com/v1/chat/completions",
      params,
    );
    const message = response.data.choices[0].message.content;
    console.log("Response:", message);

    return {
      result: message,
    };
  } catch (err) {
    console.error(
      "Error fetching chat completion:",
      err.response ? err.response.data : err.message,
    );
    return { error: "Error fetching chat completion" };
  }
};

// const apiKey = process.env.OPENAI_API_KEY;

// const text = `I lost apartment keys and need you to give me new ones`;
// const issuesJson = JSON.stringify(issues);
// const issuePrompt = `Given the text: "${text}", identify the issue type from this JSON array: ${issuesJson}. Don't elavorate the response, just return the value from the json file.`;

// const client = axios.create({
//   headers: {
//     Authorization: `Bearer ${apiKey}`,
//     "Content-Type": "application/json",
//   },
// });

// const issueParams = {
//   messages: [
//     {
//       role: "system",
//       content:
//         "You are a helpful assistant specialized in customer care processes and you are very concise in your responses just answering with the value from the type key of the given json file.",
//     },
//     {
//       role: "user",
//       content: issuePrompt,
//     },
//   ],
//   model: "gpt-3.5-turbo-0125",
//   max_tokens: 5,
//   temperature: 0,
// };

// client
//   .post("https://api.openai.com/v1/chat/completions", issueParams)
//   .then((result) => {
//     const issue = result.data.choices[0].message.content;
//     console.log(issue);
//     return issue;
//   })
//   .catch((err) => {
//     console.log(err.response ? err.response.data : err.message);
//   });
