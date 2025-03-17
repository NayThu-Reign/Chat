const cron = require("node-cron");
const axios = require("axios");
const User = require("../models/User");

// Function to call the external API
async function fetchExternalApi() {
    try {
        const response = await axios.get("https://portal.trustlinkmm.com/api/getAllEmployees");

        console.log("Response", response);

        // if (response.status !== 200) {
        //     throw new Error(`API request failed with status: ${response.status}`);
        // }

        const data = response.data.staffs;
        console.log("External API Data:", data);

        // Process the data and update users in your database
        for (const user of data) {
            await User.upsert({
                username: user.userfullname,
                user_code: user.employeeId,
                email: user.emailaddress,
                department_name: user.departmentName,
                position: user.position,
                
            });
        }

        console.log("User table updated successfully.");
    } catch (error) {
        console.error("Error fetching external API:", error.message);
    }
}

cron.schedule("22 18 * * 3", () => {
    console.log("Running weekly API call...");
    fetchExternalApi();
});

module.exports = { fetchExternalApi };

