const hubspot = require('@hubspot/api-client');
const dotenv = require('dotenv');
const path = require('path');

// Actualizar la ruta al archivo .env para que apunte al directorio correcto
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('Intentando cargar .env desde:', envPath);

const testAssociation = async () => {
    // Verificar que tenemos el token antes de continuar
    if (!process.env.PRIVATE_APP_ACCESS_TOKEN) {
        throw new Error('No se encontró el token de acceso en las variables de entorno');
    }

    console.log('Token encontrado:', process.env.PRIVATE_APP_ACCESS_TOKEN.substring(0, 5) + '...');

    const hubspotClient = new hubspot.Client({
        accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN
    });

    try {
        const ticketId = '82955030737';
        const workOrderId = '93161073898';

        // Verificar la conexión antes de continuar
        const authTest = await hubspotClient.apiRequest({
            method: 'GET',
            path: '/crm/v3/properties/tickets'
        });

        console.log('Conexión verificada:', !!authTest);

        // Primero verificamos que los objetos existen
        const [workOrder, ticket] = await Promise.all([
            hubspotClient.crm.objects.basicApi.getById('2-134296003', workOrderId),
            hubspotClient.crm.objects.basicApi.getById('0-5', ticketId)
        ]);

        console.log('Objetos verificados:', {
            workOrder: workOrder?.id,
            ticket: ticket?.id
        });

        // Crear asociación usando el endpoint default
        const response = await hubspotClient.apiRequest({
            method: 'PUT',
            path: `/crm/v4/objects/2-134296003/${workOrderId}/associations/default/0-5/${ticketId}`,
        });

        console.log('Respuesta de asociación:', JSON.stringify(response, null, 2));

        // Verificar la asociación usando el endpoint específico para tickets
        const verificationResponse = await hubspotClient.apiRequest({
            method: 'GET',
            path: `/crm/v3/objects/tickets/${ticketId}/associations/2-134296003`,
        });

        console.log('Verificación directa:', JSON.stringify(verificationResponse, null, 2));

        // Verificar usando GraphQL
        const graphqlResponse = await hubspotClient.apiRequest({
            method: 'POST',
            path: '/collector/graphql',
            body: {
                query: `
                    query ($ticketId: String!) {
                        CRM {
                            ticket(uniqueIdentifier: "hs_object_id", uniqueIdentifierValue: $ticketId) {
                                associations {
                                    p_workorders_collection__ticket_to_workorders {
                                        items {
                                            hs_object_id
                                            work_order_name
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    ticketId: ticketId
                }
            }
        });

        console.log('Verificación GraphQL:', JSON.stringify(graphqlResponse?.data, null, 2));

    } catch (error) {
        console.error('Error detallado:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            token: process.env.PRIVATE_APP_ACCESS_TOKEN ? 'Token presente' : 'Token no encontrado'
        });
    }
};

// Ejecutar la prueba
testAssociation()
    .then(() => console.log('Prueba completada'))
    .catch(error => console.error('Error en la prueba:', error));