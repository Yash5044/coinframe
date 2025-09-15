# CoinFrame

**Privacy-First AI-Powered Expense Tracker for Mobile Devices**

## TLDR

CoinFrame is a lightweight React Native app that runs a quantized LLM (phi-4-mini-instruct) locally on Android devices to automatically extract and categorize expense data from SMS messages. The app processes messages in real-time, stores results locally, and provides month-wise expense aggregation and visualization - all without sending data to external servers.

## Overview

CoinFrame leverages on-device AI to transform SMS-based transaction notifications into structured expense data. By running inference locally on edge devices, the app ensures complete privacy while providing instant expense categorization and tracking.

### Key Features

- **Real-time SMS Processing**: Automatically captures and processes incoming transaction SMS messages
- **AI-Powered Data Extraction**: Extracts structured expense data using on-device LLM inference
- **Local Storage & Privacy**: All data processing and storage happens locally on the device
- **Expense Aggregation**: Month-wise expense tracking with multiple aggregation metrics
- **Lightweight Architecture**: Optimized for mobile devices with minimal resource usage

## Core Functionality

### Data Extraction Capabilities

The AI model extracts the following information from SMS messages:

| Field | Description | Example |
|-------|-------------|---------|
| **Expense Amount** | Transaction value | ₹1,250.00 |
| **Mode of Payment** | Payment method used | UPI, Card, Net Banking |
| **Bank Details** | Bank information | HDFC Bank, SBI |
| **Account Details** | Account identifiers, Card Details | Account ending in 1234 |
| **Category** | Expense type | Food, Transport, Shopping |
| **Vendor** | Merchant/service provider | Swiggy, Uber, Amazon |

### Workflow

1. **SMS Interception**: App monitors incoming SMS messages
2. **AI Processing**: On-device model processes message content
3. **Data Extraction**: Structured expense data is extracted
4. **Local Storage**: Results stored in device's local database
5. **Aggregation**: Data aggregated for visualization and reporting

## Technical Architecture

### AI Model Stack

- **Base Model**: Microsoft phi-4-mini-instruct (3.8B parameters)
- **Optimization**: ONNX format with 4-bit quantization via Microsoft Olive
- **Memory Usage**: ~1-1.5 GB RAM on Android devices
- **Inference**: Local on-device processing

### Mobile Application

- **Framework**: React Native
- **Platform**: Android (primary), iOS (future)
- **Storage**: JSON files on local (for MVP, can move to local SQLite Db in future)
- **UI**: Native mobile components

### Data Pipeline

```
SMS Message → AI Model → Structured Data → Local Storage → Aggregation → Visualization
```

## Current Status: Planning Phase

### Technical Stack (some of these might need a proof of concept before finalizing)

- phi-4-mini-instruct model (3.8B params)
- ONNX model conversion and 4-bit quantization
- React Native framework
- Local storage architecture
- Core data extraction fields
- Month-wise aggregation features

### System Prompt Strategy

- **MVP**: Static system prompt for expense extraction
- **Future**: Dynamic prompts based on user preferences and advanced fine-tuning

## Future Scopes

### Model Optimization
- **Smaller Models**: Integration of Meta's MobileLLM (350M parameters)
- **Advanced Fine-tuning**: LoRA (Low-Rank Adaptation) and QLoRA techniques
- **Dynamic Prompting**: User-specific prompt optimization

### Visualization Features
- Advanced expense analytics
- Spending pattern recognition
- Budget tracking and alerts
- Custom category management

## Privacy & Security

- **Local Processing**: All AI inference happens on-device
- **No Data Upload**: SMS content never leaves the device
- **Offline Functionality**: Complete functionality without internet connection
- **User Control**: Full control over data storage and deletion

**Note**: This project is currently in active development planning. Technical specifications and implementation details may evolve based on proof-of-concept results and performance testing.