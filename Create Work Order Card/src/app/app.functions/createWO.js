const hubspot = require('@hubspot/api-client');

// Función de delay mejorada con timeout máximo
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Función mejorada para verificar la existencia de la work order
const verifyWorkOrder = async (hubspotClient, workOrderId) => {
    try {
        const response = await hubspotClient.crm.objects.basicApi.getById(
            '2-134296003',
            workOrderId,
            ['hs_object_id', 'hs_createdate', 'work_order_name']
        );
        console.log('Verificación de work order:', {
            workOrderId,
            responseId: response.id,
            properties: response.properties
        });
        return response && response.id === workOrderId;
    } catch (error) {
        console.error(`Error verificando work order ${workOrderId}:`, error);
        return false;
    }
};

// Función mejorada para crear la asociación
const createAssociation = async (hubspotClient, workOrderId, ticketId) => {
    console.log('Iniciando asociación:', { workOrderId, ticketId });

    try {
        // Crear asociación usando el endpoint default que sabemos que funciona
        const response = await hubspotClient.apiRequest({
            method: 'PUT',
            path: `/crm/v4/objects/2-134296003/${workOrderId}/associations/default/0-5/${ticketId}`,
        });

        // Verificar la asociación
        const verificationResponse = await hubspotClient.apiRequest({
            method: 'GET',
            path: `/crm/v3/objects/tickets/${ticketId}/associations/2-134296003`,
        });

        console.log('Asociación verificada:', {
            response: response,
            verification: verificationResponse
        });

        return {
            status: "SUCCESS",
            message: "Work order asociada exitosamente al ticket",
            data: {
                workOrderId,
                ticketId,
                associationResponse: response,
                verificationResponse
            }
        };

    } catch (error) {
        console.error('Error en la asociación:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        throw new Error(`Error al asociar work order: ${error.message}`);
    }
};

// Actualizar la función principal para usar el nuevo método de asociación
const createAndAssociateWorkOrder = async (properties, hubspotClient) => {
    try {
        // Extraer y validar propiedades con logging
        const {
            hs_object_id,
            description,
            apartment_name,
            booking_id,
            city,
            issue_type,
            work_order_name,
            work_order_requester,
            reservation_id,
            ticketId,
            troubleshooting_message
        } = properties;

        console.log('Parámetros recibidos:', {
            hasTicketId: !!ticketId,
            ticketId,
            work_order_name,
            issue_type
        });

        // Validar campos requeridos
        if (!work_order_name || !description || !issue_type) {
            return {
                status: 'ERROR',
                error: 'Faltan campos requeridos: nombre, descripción o tipo de issue'
            };
        }

        // 1. Crear la work order
        let workOrderResponse;
        try {
            workOrderResponse = await hubspotClient.crm.objects.basicApi.create(
                '2-134296003',
                {
                    properties: {
                        hs_object_id,
                        description,
                        apartment_name,
                        booking_id,
                        city,
                        issue_type,
                        work_order_name,
                        work_order_requester,
                        reservation_id,
                        troubleshooting_message
                    }
                }
            );

            console.log('Work order creada:', {
                id: workOrderResponse.properties.hs_object_id,
                properties: workOrderResponse.properties
            });

        } catch (createError) {
            console.error('Error al crear work order:', createError);
            return {
                status: 'ERROR',
                error: `Error al crear work order: ${createError.message}`
            };
        }

        // 2. Intentar crear la asociación si tenemos ticketId
        if (ticketId && workOrderResponse.properties.hs_object_id) {
            try {
                console.log('Intentando crear asociación entre:', {
                    workOrderId: workOrderResponse.properties.hs_object_id,
                    ticketId: ticketId
                });

                const associationResult = await createAssociation(
                    hubspotClient,
                    workOrderResponse.properties.hs_object_id,
                    ticketId
                );

                console.log('Asociación creada exitosamente');
                return {
                    status: 'SUCCESS',
                    response: {
                        ...workOrderResponse,
                        association: associationResult
                    },
                    message: 'Work order creada y asociada exitosamente'
                };
            } catch (associationError) {
                console.error('Error al crear asociación:', associationError);
                return {
                    status: 'WARNING',
                    response: workOrderResponse,
                    warning: 'Work order creada pero falló la asociación',
                    error: associationError.message
                };
            }
        } else {
            console.log('No se intentó crear asociación:', {
                hasTicketId: !!ticketId,
                hasWorkOrderId: !!workOrderResponse.hs_object_id
            });
        }

        return {
            status: 'SUCCESS',
            response: workOrderResponse
        };

    } catch (error) {
        console.error('Error general:', error);
        return {
            status: 'ERROR',
            error: error.message || 'Error desconocido'
        };
    }
};

exports.main = async (context = {}) => {
    try {
        if (!process.env.PRIVATE_APP_ACCESS_TOKEN) {
            throw new Error('Falta el token de acceso');
        }

        const hubspotClient = new hubspot.Client({
            accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN
        });

        return await createAndAssociateWorkOrder(context.parameters, hubspotClient);

    } catch (error) {
        console.error('Error general:', error);
        return {
            status: 'ERROR',
            error: error.message || 'Error desconocido'
        };
    }
};
