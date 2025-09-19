import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Platform } from 'react-native';

class ModelService {
  constructor() {
    this.isModelLoaded = false;
    this.modelVersion = '1.0.0';
    this.session = null;
    this.modelPath = Platform.OS === 'web' 
      ? 'models/onnx-models/t5-sms-encoder.onnx'
      : './models/onnx-models/t5-sms-encoder.onnx';
  }

  async loadModel() {
    try {
      console.log('Loading T5 ONNX expense classification model...');
      
      if (Platform.OS === 'web') {
        // For web platform, use fallback simulation due to ONNX web limitations
        console.log('Web platform detected - using fallback classification');
        this.isModelLoaded = true;
        return { success: true, version: this.modelVersion, mode: 'fallback' };
      }
      
      // Load the actual ONNX model for native platforms
      try {
        this.session = await InferenceSession.create(this.modelPath);
        this.isModelLoaded = true;
        console.log('T5 ONNX model loaded successfully');
        return { success: true, version: this.modelVersion, mode: 'onnx' };
      } catch (modelError) {
        console.warn('ONNX model not found, using fallback classification:', modelError.message);
        this.isModelLoaded = true;
        return { success: true, version: this.modelVersion, mode: 'fallback' };
      }
    } catch (error) {
      console.error('Error loading model:', error);
      return { success: false, error: error.message };
    }
  }

  async classifyExpense(smsText) {
    try {
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      // Use actual ONNX model if available, otherwise fallback to mock
      if (this.session && Platform.OS !== 'web') {
        const result = await this.runONNXInference(smsText);
        return {
          success: true,
          classification: result
        };
      } else {
        // Fallback to mock classification for web or when model not available
        const result = this.mockClassification(smsText);
        return {
          success: true,
          classification: result
        };
      }
    } catch (error) {
      console.error('Error classifying expense:', error);
      return {
        success: false,
        error: error.message,
        classification: null
      };
    }
  }

  async runONNXInference(smsText) {
    try {
      // Preprocess input text for T5 model
      const inputText = `classify sms: ${smsText}`;
      
      // For actual T5 model, you would need to:
      // 1. Tokenize the input text using T5 tokenizer
      // 2. Convert tokens to tensor format
      // 3. Run inference through the model
      // 4. Decode the output to JSON format
      
      // Placeholder for actual ONNX inference
      // This would be replaced with proper tokenization and model inference
      const inputIds = this.tokenizeForT5(inputText);
      const inputTensor = new Tensor('int64', inputIds, [1, inputIds.length]);
      
      const feeds = { 'input_ids': inputTensor };
      const results = await this.session.run(feeds);
      
      // Decode the model output to JSON format
      const decodedResult = this.decodeT5Output(results);
      return decodedResult;
      
    } catch (error) {
      console.warn('ONNX inference failed, using fallback:', error);
      return this.mockClassification(smsText);
    }
  }

  tokenizeForT5(text) {
    // Placeholder tokenization - in real implementation, you would use
    // the actual T5 tokenizer from your training pipeline
    // For now, return a simple token array
    const tokens = text.split(' ').map((word, index) => index + 100);
    return new Int32Array(tokens.slice(0, 512)); // Max length 512
  }

  decodeT5Output(results) {
    // Placeholder decoding - in real implementation, you would decode
    // the T5 model output tokens back to JSON string and parse it
    // For now, return mock classification
    try {
      // This would decode the actual model output
      // const outputTokens = results.output.data;
      // const decodedText = this.detokenize(outputTokens);
      // return JSON.parse(decodedText);
      
      // Fallback to mock for now
      return this.mockClassification('Mock input');
    } catch (error) {
      console.error('Error decoding T5 output:', error);
      return this.mockClassification('Error fallback');
    }
  }

  mockClassification(smsText) {
    const text = smsText.toLowerCase();
    
    // Extract amount using regex
    const amountRegex = /(?:rs\.?|inr|rupees?)\s*([0-9,]+\.?[0-9]*)/i;
    const amountMatch = smsText.match(amountRegex);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    // Determine if it's an expense
    const expenseKeywords = ['spent', 'debited', 'withdrawn', 'paid', 'purchase'];
    const isExpense = expenseKeywords.some(keyword => text.includes(keyword));

    if (!isExpense) {
      return {
        IsExpense: "No",
        Amount: amount,
        Mode: "",
        Bank: "",
        Account: "",
        Category: "",
        Receiver: ""
      };
    }

    // Determine payment mode
    let mode = "Cash";
    if (text.includes('credit card') || text.includes('cc')) {
      mode = "Credit Card";
    } else if (text.includes('debit card') || text.includes('dc')) {
      mode = "Debit Card";
    } else if (text.includes('upi') || text.includes('online') || text.includes('wallet')) {
      mode = "Online";
    } else if (text.includes('atm')) {
      mode = "Cash";
    }

    // Extract bank name
    let bank = "";
    const bankKeywords = {
      'icici': 'ICICI',
      'hdfc': 'HDFC', 
      'sbi': 'SBI',
      'axis': 'Axis',
      'kotak': 'Kotak',
      'paytm': 'Paytm',
      'phonepe': 'PhonePe',
      'gpay': 'GPay'
    };
    
    Object.keys(bankKeywords).forEach(key => {
      if (text.includes(key)) {
        bank = bankKeywords[key];
      }
    });

    // Extract account/card number
    const accountRegex = /(?:xx|x{2,})([0-9]{4})/i;
    const accountMatch = smsText.match(accountRegex);
    const account = accountMatch ? `XX${accountMatch[1]}` : "";

    // Determine category based on merchant/context
    let category = "Others";
    const categoryKeywords = {
      'Shopping': ['amazon', 'flipkart', 'myntra', 'reliance', 'mall', 'store'],
      'Food': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'coffee'],
      'Transport': ['uber', 'ola', 'petrol', 'fuel', 'metro', 'bus'],
      'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'games'],
      'Healthcare': ['hospital', 'pharmacy', 'medical', 'doctor'],
      'Utilities': ['electricity', 'water', 'gas', 'broadband', 'mobile'],
      'Cash': ['atm', 'cash withdrawal']
    };

    Object.keys(categoryKeywords).forEach(cat => {
      categoryKeywords[cat].forEach(keyword => {
        if (text.includes(keyword)) {
          category = cat;
        }
      });
    });

    // Extract receiver/merchant name
    let receiver = "";
    const receiverKeywords = [
      'amazon', 'flipkart', 'swiggy', 'zomato', 'uber', 'ola', 
      'reliance', 'netflix', 'paytm', 'phonepe'
    ];
    
    receiverKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        receiver = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    });

    // If no specific receiver found, try to extract from context
    if (!receiver && text.includes(' at ')) {
      const atIndex = text.indexOf(' at ');
      const afterAt = smsText.substring(atIndex + 4).split(' ')[0];
      if (afterAt && afterAt.length > 2) {
        receiver = afterAt;
      }
    }

    return {
      IsExpense: "Yes",
      Amount: amount,
      Mode: mode,
      Bank: bank,
      Account: account,
      Category: category,
      Receiver: receiver
    };
  }

  async batchClassify(smsMessages) {
    try {
      const results = [];
      
      for (const message of smsMessages) {
        const classification = await this.classifyExpense(message.body);
        
        if (classification.success) {
          results.push({
            messageId: message.id,
            smsText: message.body,
            date: message.date,
            sender: message.sender,
            classification: classification.classification
          });
        }
      }
      
      return {
        success: true,
        results: results,
        processed: results.length,
        total: smsMessages.length
      };
    } catch (error) {
      console.error('Error in batch classification:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  getModelInfo() {
    return {
      version: this.modelVersion,
      isLoaded: this.isModelLoaded,
      modelType: 'T5 Efficient Tiny NL32',
      modelPath: this.modelPath,
      hasONNXRuntime: this.session !== null,
      supportedCategories: [
        'Shopping', 'Food', 'Transport', 'Entertainment', 
        'Healthcare', 'Utilities', 'Cash', 'Others'
      ],
      supportedModes: ['Credit Card', 'Debit Card', 'Online', 'Cash']
    };
  }
}

export default new ModelService();