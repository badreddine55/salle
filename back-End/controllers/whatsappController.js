const asyncHandler = require('express-async-handler');
const axios = require('axios');
const winston = require('winston');
const { isValidPhoneNumber } = require('libphonenumber-js');
const FormData = require('form-data');
const Formateur = require('../models/Formateur');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

console.log('Loading whatsappController.js');

const sendWhatsAppMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.info(`Sending WhatsApp message for ID: ${id}`);

  if (!id) {
    logger.error('Formateur ID is missing');
    return res.status(400).json({ success: false, message: 'Formateur ID is required' });
  }

  // Fetch formateur details
  let formateur;
  try {
    formateur = await Formateur.findById(id);
    if (!formateur) {
      logger.error('Formateur not found', { id });
      return res.status(404).json({ success: false, message: 'Formateur not found' });
    }
  } catch (error) {
    logger.error('Error fetching formateur', { id, error: error.message });
    return res.status(500).json({ success: false, message: `Error fetching formateur: ${error.message}` });
  }

  let { phoneNumber, name: formateurName } = formateur;

  if (!phoneNumber) {
    logger.error('Phone number missing for formateur', { id, formateurName });
    return res.status(400).json({ success: false, message: `Phone number missing for ${formateurName}` });
  }

  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+212${phoneNumber.replace(/^0/, '')}`;
    try {
      await Formateur.findByIdAndUpdate(id, { phoneNumber }, { new: true });
      logger.info('Updated phone number with country code', { id, phoneNumber, formateurName });
    } catch (error) {
      logger.error('Error updating phone number', { id, phoneNumber, error: error.message });
    }
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    logger.error('Invalid phone number format', { phoneNumber, formateurName });
    return res.status(400).json({ success: false, message: `Invalid phone number format for ${formateurName}: ${phoneNumber}` });
  }

  const apiUrl = process.env.APP_URL || 'https://backendemploi.b1.ma';
  logger.info('API URL for requests', { apiUrl });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.error('Authorization token missing', { id, formateurName });
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  let pdfResponse;
  try {
    pdfResponse = await axios.get(`${apiUrl}/api/schedules/formateurs/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    const contentType = pdfResponse.headers['content-type'];
    if (!contentType || !contentType.includes('application/pdf')) {
      const responseDataStr = Buffer.from(pdfResponse.data).toString('utf8').substring(0, 100);
      logger.error('Invalid PDF Content-Type', {
        id,
        formateurName,
        contentType,
        responseData: responseDataStr,
        status: pdfResponse.status,
        headers: pdfResponse.headers,
      });
      return res.status(500).json({
        success: false,
        message: `Invalid PDF response for ${formateurName}: Content-Type is ${contentType}`,
      });
    }

    if (!(pdfResponse.data instanceof Buffer)) {
      pdfResponse.data = Buffer.from(pdfResponse.data);
    }
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data ? Buffer.from(error.response.data).toString('utf8').substring(0, 100) : null,
      headers: error.response?.headers,
    };
    logger.error('Error fetching PDF', { id, formateurName, error: errorDetails });
    return res.status(error.response?.status || 500).json({
      success: false,
      message: `Error fetching PDF for ${formateurName}: ${errorDetails.message}`,
    });
  }

  // Upload PDF
  const formData = new FormData();
  try {
    formData.append('file', pdfResponse.data, `formateur-schedule-${id}.pdf`);
    logger.info('FormData prepared', { filename: `formateur-schedule-${id}.pdf`, size: pdfResponse.data.length });
  } catch (error) {
    logger.error('Error appending PDF to FormData', { id, formateurName, error: error.message });
    return res.status(500).json({ success: false, message: `Error preparing PDF for ${formateurName}: ${error.message}` });
  }

  let pdfUrl;
  try {
    const uploadResponse = await axios.post(`${apiUrl}/api/upload-pdf`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
    });
    pdfUrl = uploadResponse.data.url;
    logger.info('PDF uploaded successfully', { id, formateurName, pdfUrl });
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    logger.error('Error uploading PDF', {
      id,
      formateurName,
      error: {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      },
    });
    if (errorMessage.includes('Unexpected field')) {
      return res.status(400).json({
        success: false,
        message: `Field name mismatch in PDF upload for ${formateurName}. Expected 'file', received 'pdf'.`,
      });
    }
    return res.status(error.response?.status || 500).json({
      success: false,
      message: `Error uploading PDF for ${formateurName}: ${errorMessage}`,
    });
  }

  try {
    new URL(pdfUrl);
    // Verify PDF URL accessibility
    await axios.head(pdfUrl);
    logger.info('PDF URL is accessible', { pdfUrl });
  } catch (error) {
    logger.error('Invalid or inaccessible PDF URL', { pdfUrl, formateurName, error: error.message });
    return res.status(400).json({ success: false, message: `Invalid or inaccessible PDF URL for ${formateurName}: ${error.message}` });
  }

  // Send WhatsApp message
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  logger.info('WhatsApp Phone Number ID', { whatsappPhoneNumberId: whatsappPhoneNumberId ? 'Loaded' : 'Not loaded' });
  if (!whatsappPhoneNumberId) {
    logger.error('WhatsApp phone number ID not configured');
    return res.status(500).json({ success: false, message: 'WhatsApp phone number ID not configured' });
  }
  const whatsappApiUrl = `https://graph.facebook.com/v22.0/${whatsappPhoneNumberId}/messages`;

  const whatsappToken = process.env.WHATSAPP_TOKEN;
  logger.info('WhatsApp Token', { whatsappToken: whatsappToken ? 'Loaded' : 'Not loaded' });
  if (!whatsappToken) {
    logger.error('WhatsApp token not configured');
    return res.status(500).json({ success: false, message: 'WhatsApp token not configured' });
  }

  const formattedDate = "May 20, 2025"; // Use Postman date for testing
  logger.info('Formatted date for WhatsApp payload', { formattedDate });

  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber.replace(/^\+/, ''),
    type: 'template',
    template: {
      name: 'emplis_temps_group',
      language: { code: 'fr_MA' },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: {
                link: 'https://int.b1.ma/formateur-profile-682598624a84e981bb966eaa%20(1).pdf', // Use Postman URL
                filename: 'emplis_temps_group',
              },
            },
          ],
        },
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: formattedDate,
            },
            {
              type: 'text',
              text: 'DEVWOFS', // Use Postman name for testing
            },
            {
              type: 'text',
              text: 'Here is your updated schedule',
            },
          ],
        },
      ],
    },
  };

  try {
    logger.info('WhatsApp API request', { url: whatsappApiUrl, payload });
    const response = await axios.post(whatsappApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
    });
    logger.info('WhatsApp message sent successfully', { id, formateurName, response: response.data });

    // Check message status
    const messageId = response.data.messages[0].id;
    try {
      const statusResponse = await axios.get(`https://graph.facebook.com/v22.0/${messageId}`, {
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
        },
      });
      logger.info('WhatsApp message status', { id, formateurName, status: statusResponse.data });
    } catch (statusError) {
      logger.error('Error checking WhatsApp message status', { id, formateurName, error: statusError.message });
    }

    res.status(200).json({
      success: true,
      message: `WhatsApp message sent to ${formateurName}`,
      data: response.data,
    });
  } catch (error) {
    logger.error('Error sending WhatsApp message', {
      id,
      formateurName,
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      },
    });
    return res.status(error.response?.status || 500).json({
      success: false,
      message: `Error sending WhatsApp message to ${formateurName}: ${error.message}`,
    });
  }
});

module.exports = {
  sendWhatsAppMessage,
};