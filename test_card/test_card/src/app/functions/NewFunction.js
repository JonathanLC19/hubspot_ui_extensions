const axios = require('axios');

exports.main = async (context) => {
    const { parameters, crm } = context;
    const { dealname, pipeline, dealstage } = parameters;

    // Validate input
    if (!dealname || !pipeline || !dealstage) {
        return {
            statusCode: 400,
            body: {
                success: false,
                error: 'Missing required parameters: dealname, pipeline, dealstage'
            }
        };
    }

    try {
        // Get token to make API requests on behalf of your app
        const accessToken = process.env.PRIVATE_APP_ACCESS_TOKEN;

        // Get deal in HubSpot
        const response = await axios.get(
            'https://api.hubapi.com/crm/v3/objects/deals',
            {
                properties: {
                    dealname,
                    pipeline,
                    dealstage
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Deal retrieved successfully', response.data.id);

        return {
            statusCode: 200,
            body: {
                success: true,
                dealId: response.data.id,
                message: 'Deal retrieved successfully'
            }
        };
    } catch (error) {
        console.error('Error retrieving deal.');

        const { response } = error;
        return {
            statusCode: (response && response.status) ? response.status : 500,
            body: {
                success: false,
                error: (response && response.data) ? response.data.message : 'Unknown error occurred'
            }
        };
    }
};