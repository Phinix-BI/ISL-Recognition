import {textTranslate , speechToText , imgToText} from './fileServicesHandler.js';

export async function chatServicesHandler(userId, message, mediaUrl, selectedService) {
    if (!userId || (!message && !mediaUrl?.url) || !selectedService) {
        throw new Error('Please provide all required fields');
    }

    // Error: either message or mediaUrl must be provided
    if (!message && !mediaUrl.url) {
        throw new Error('Please upload an image, video, or audio to get service');
    }

    let result;
    let result_type;

    const textServices = ['textTranslate', 'textToIsl', 'textToSpeech'];
    const imageServices = ['imgToIsl'];
    const audioServices = ['speechToText', 'speechToIsl'];
    const videoServices = ['IslVideoToText', 'IslVideoToVoice'];

    // Handle text services
    if (message) {
        if (!textServices.includes(selectedService)) {
            throw new Error('Unsupported text service');
        }

        switch (selectedService) {
            case 'textTranslate':
                result = await textTranslate(message);
                result_type = 'text';
                break;
            case 'textToIsl':
                result = await textToIsl(message);
                result_type = 'video';
                console.log('textToIsl service is not available');
                break;
            case 'textToSpeech':
                // result = await textToSpeech(message);
                // result_type = 'audio';
                console.log('textToSpeech service is not available');
                break;
        }
    }

    // Handle media services
    if (mediaUrl?.url) {
        const { url, type: urlType } = mediaUrl;

        switch (urlType) {
            case 'image':
                if (!imageServices.includes(selectedService)) {
                    throw new Error('Unsupported image service');
                }

                if (selectedService === 'imgToIsl') {
                    result = await imgToIsl(url);
                    result_type = 'text';
                    console.log('imgToIsl service is not available');
                }
                break;

            case 'audio':
                if (!audioServices.includes(selectedService)) {
                    throw new Error('Unsupported audio service');
                }

                if (selectedService === 'speechToText') {
                    result = await speechToText(url);
                    result_type = 'text';

                } else if (selectedService === 'speechToIsl') {
                    // result = await speechToIsl(url);
                    // result_type = 'video';
                    console.log('speechToIsl service is not available');
                }
                break;

            case 'video':
                if (!videoServices.includes(selectedService)) {
                    throw new Error('Unsupported video service');
                }

                if (selectedService === 'IslVideoToText') {
                    // result = await IslVideoToText(url);
                    // result_type = 'text';
                    console.log('ISLVideoToText service is not available');
                } else if (selectedService === 'IslVideoToVoice') {
                    // result = await IslVideoToVoice(url);
                    // result_type = 'audio';
                    console.log('IslVideoToVoice service is not available');
                }
                break;

            default:
                throw new Error('Unsupported media type');
        }
    }

    return {result, result_type};
}

const textToIsl = async (text) => {
    // Implement text to ISL conversion
    try {
      const response = await textTranslate(text);
      // Here, i can add the logic to pass it to the AI model if needed
      return response; // Return the response from textTranslate or AI model
    } catch (error) {
      console.error('Error during text to ISL conversion:', error);
      throw error;
    }
  };
  
  const imgToIsl = async (url) => {
    try {
      // Step 1: Convert image to text
      const response = await imgToText(url);
  
      // Extract the text from the response
      const extractedText = response['Image to text success'].replace(/\n/g, ' ');
      console.log('Extracted Text:', extractedText);
  
      // Step 2: Use the textToIsl function to process the extracted text
      const islResponse = await textToIsl(extractedText);
      console.log('ISL Response:', islResponse);
  
      // Return the final ISL response
      return islResponse;
    } catch (error) {
      console.error('Error during image to ISL conversion:', error);
      throw error; // Re-throw the error to handle it upstream if needed
    }
  };


  