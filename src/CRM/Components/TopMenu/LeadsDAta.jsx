// leadsData.js
// Initial data
const initialLeadsData = [
  {
    id: 1,
    business: "Tech Solutions Inc.",
    contact: "John Doe",
    designation: "CEO",
    mobile: "9876543210",
    email: "john@techsolutions.com",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    source: "Website",
    stage: "Discussion",
    potential: "500000",
    since: "2023-05-15",
    assignedTo: "Sarah Smith",
    product: "CRM Software",
    gstin: "22ABCDE1234F1Z5",
    website: "www.techsolutions.com",
    lastTalk: "2023-06-10",
    nextTalk: "2023-06-20",
    transferredOn: "2023-05-20",
    requirements: "Enterprise solution for 500 users",
    notes: "Interested in demo"
  }
];

// Load data from localStorage or use initial data
let leadsData = JSON.parse(localStorage.getItem('leadsData')) || initialLeadsData;

export const addNewLead = (newLead) => {
    const formattedLead = {
        id: leadsData.length + 1,
        business: newLead.business,
        contact: `${newLead.prefix} ${newLead.firstName} ${newLead.lastName}`,
        designation: newLead.designation,
        mobile: newLead.mobile,
        email: newLead.email,
        city: newLead.city,
        state: newLead.state,
        country: newLead.country,
        source: newLead.source,
        stage: newLead.stage || 'New',
        potential: newLead.potential,
        since: newLead.since,
        assignedTo: newLead.assignedTo,
        product: newLead.product,
        gstin: newLead.gstin,
        website: newLead.website,
        lastTalk: new Date().toISOString().split('T')[0],
        nextTalk: '',
        transferredOn: new Date().toISOString().split('T')[0],
        requirements: newLead.requirement,
        notes: newLead.notes
    };
    
    leadsData = [...leadsData, formattedLead];
    // Save to localStorage
    localStorage.setItem('leadsData', JSON.stringify(leadsData));
    return formattedLead;
};

export const getAllLeads = () => {
    // Always return the current state from localStorage
    return JSON.parse(localStorage.getItem('leadsData')) || leadsData;
};

export default leadsData;