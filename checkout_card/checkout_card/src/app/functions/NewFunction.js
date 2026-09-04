const axios = require('axios');

exports.main = async (context) => {
  const { parameters } = context;
  const { objectId, propertyName, value } = parameters;

  const accessToken = process.env.PRIVATE_APP_ACCESS_TOKEN;

  try {
    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/deals/${objectId}`,
      {
        properties: {
          [propertyName]: value
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Serverless function called. Property updated successfully.");
    return { success: true, data: response.data };
  } catch (error) {
    console.log("Error updating property: " + error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};