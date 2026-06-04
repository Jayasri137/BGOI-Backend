const axios = require('axios');

async function testCRMIntegration() {
    console.log("--- STARTING CRM INTEGRATION DIAGNOSTIC ---");
    const testPayload = {
        name: "Test Student",
        email: "bluestoneteststudent@gmail.com",
        phone: "9999999999",
        message: "Preferred Level: Postgraduate\nCounselling Mode: Virtual Counselling\nFunding: Scholarship\nPreferred Intake: Sept 2026",
        domain: "Overseas",
        category: "Website Enquiry",
        interested_in: "Study in Canada"
    };

    const url = 'https://bluestoneinternationalpreschool.com/bgoi_portal/api/contact';
    console.log(`Sending POST request to: ${url}...`);

    try {
        const response = await axios.post(url, testPayload);
        console.log("Status Code:", response.status);
        console.log("Response Body:", response.data);
        if (response.data && response.data.success) {
            console.log("✅ SUCCESS: Central CRM Portal accepted and saved the lead!");
        } else {
            console.log("❌ FAILED: CRM Portal responded with unexpected body:", response.data);
        }
    } catch (error) {
        console.error("❌ ERROR: Failed to communicate with central CRM Portal.");
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testCRMIntegration();
