const axios = require('axios');

exports.main = async (context) => {
    const { parameters } = context;
    const { objectId } = parameters;

    const accessToken = process.env.PRIVATE_APP_ACCESS_TOKEN;

    try {
        const response = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/deals/${objectId}?associations=companies`,
            // {
            //     properties: {
            //         [propertyName]: value
            //     }
            // },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const schoolRecordIds = response.data.associations.companies.results
            .filter(association => association.type === "school")
            .map(association => association.id);

        // console.log(schoolRecordIds)

        const schoolIds = [];

        try {
            for (const schoolId of schoolRecordIds) {
                const response = await axios.get(
                    `https://api.hubapi.com/crm/v3/objects/companies/${schoolId}?properties=lwclient_id,name,school_domain`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const lwclientId = response.data.properties.lwclient_id;
                const schoolName = response.data.properties.name;
                const schoolUrl = response.data.properties.school_domain;
                if (lwclientId) {
                    schoolIds.push({
                        name: schoolName,
                        lwclient_id: lwclientId,
                        url: schoolUrl
                    });
                }
            }

            // console.log("School IDs:", schoolIds.map(school => school.name));

        } catch (error) {
            console.log("Error retrieving schools:", error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }

        console.log("Serverless function called. School IDs fetched successfully.",
            // schoolIds
        );
        return { success: true, data: schoolIds };
    } catch (error) {
        console.log("Error fetching school IDs: " + error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};