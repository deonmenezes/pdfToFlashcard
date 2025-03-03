import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Define request and response types
interface RequestBody {
  fileContent: string;
  fileName: string;
  fileType: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface MatchingQuestion {
  id: number;
  question: string;
  leftItems: string[];
  rightItems: string[];
  correctMatches: number[];
}

interface TrueFalseQuestion {
  id: number;
  question: string;
  isTrue: boolean;
}

interface ResponseBody {
  flashcards: Flashcard[];
  mcqs: MCQ[];
  matchingQuestions: MatchingQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
}

// Initialize the Gemini API with environment variable
const API_KEY = "AIzaSyCcQKQMSx-J7W-sAWoGwYa1obKA1SNycb0";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RequestBody = await request.json();
    const { fileContent, fileName, fileType } = body;

    // Log API request for debugging
    console.log(`Processing file: ${fileName}, type: ${fileType}`);
    
    // Validate input
    if (!fileContent) {
      console.error('Missing file content');
      return NextResponse.json({ error: 'File content is required' }, { status: 400 });
    }

    // Create a model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Extract text based on file type
    let textContent = '';
    
    try {
      // Decode base64 content if needed
      let fileBuffer;
      
      if (fileContent.startsWith('data:') && fileContent.includes('base64,')) {
        const base64Data = fileContent.split('base64,')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if (/^[A-Za-z0-9+/=]+$/.test(fileContent.substring(0, 100))) {
        fileBuffer = Buffer.from(fileContent, 'base64');
      } else {
        // Plain text
        textContent = fileContent;
        fileBuffer = Buffer.from(fileContent);
      }
      
      // Process by file type
      const fileExt = fileName.toLowerCase().split('.').pop();
      
      if (fileType === 'pdf' || fileExt === 'pdf') {
        // Dynamically import pdf-parse to avoid startup errors
        const pdfParse = (await import('pdf-parse')).default;
        // Handle PDF files
        const pdfData = await pdfParse(fileBuffer);
        textContent = pdfData.text;
        console.log('PDF extraction successful, length:', textContent.length);
      } 
      else if (fileType === 'word' || fileExt === 'docx' || fileExt === 'doc') {
        // Handle Word documents
        if (fileExt === 'docx') {
          // For DOCX files
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          textContent = result.value;
        } else {
          // For DOC files (older format)
          // For DOC files we might need a different approach
          // This is a simplified fallback
          textContent = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\r\n]/g, '');
        }
        console.log('Word document extraction successful, length:', textContent.length);
      } 
      else if (fileType === 'powerpoint' || fileExt === 'pptx' || fileExt === 'ppt') {
        // PowerPoint is more complex, we'll extract what we can
        // For PowerPoint, text extraction is limited without additional libraries
        // This is a simplified approach
        textContent = "PowerPoint content extraction is limited. Please convert to PDF for better results.";
        
        // Try to extract some text if possible
        const textParts = fileBuffer.toString('utf-8').match(/[A-Za-z0-9\s.,;:'"\-_!@#$%^&*()]+/g);
        if (textParts && textParts.length > 0) {
          textContent = textParts.join(' ');
        }
      } 
      else if (fileType === 'spreadsheet' || fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
        // Handle Excel and CSV files
        if (fileExt === 'csv') {
          // For CSV, convert to string
          textContent = fileBuffer.toString('utf-8');
        } else {
          // For Excel files
          const workbook = XLSX.read(fileBuffer);
          
          // Get all sheet names
          const sheetNames = workbook.SheetNames;
          
          // Combine content from all sheets
          textContent = sheetNames.map(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
          }).join('\n\n');
        }
        console.log('Spreadsheet extraction successful, length:', textContent.length);
      } 
      else {
        // Default: try to extract as text
        textContent = fileBuffer.toString('utf-8');
      }

      // If we didn't get any text, provide a message
      if (!textContent || textContent.trim().length === 0) {
        textContent = `Unable to extract text content from ${fileName}. The file may be empty, corrupted, or in an unsupported format.`;
      }
      
    } catch (error) {
      // Fix: Type guard for the extraction error
      console.error('Error extracting file content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error occurred';
      return NextResponse.json(
        { error: `Failed to extract content from ${fileName}. Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Truncate content if too long (Gemini has token limits)
    const MAX_CONTENT_LENGTH = 12000;
    const truncatedContent = textContent.slice(0, MAX_CONTENT_LENGTH);
    const isTruncated = textContent.length > MAX_CONTENT_LENGTH;

    // Create a prompt for Gemini
    const prompt = `
    You are an educational content creator. Based on the following document content, generate educational quiz questions in JSON format.
    
    File name: ${fileName}
    File type: ${fileType}
    
    Document content: 
    ${truncatedContent} ${isTruncated ? '(content truncated for length)' : ''}
    
    Create the following types of questions based on the document content:
    
    1. 5 Flashcards (question and answer pairs)
    2. 5 Multiple Choice Questions with 4 options each
    3. 2 Matching Questions (with at least 4 pairs to match)
    4. 5 True/False Questions
    
    The questions should cover the main concepts and important information from the document. Make them educational and helpful for someone studying this material.
    dont ask them questions like "name of the document " or anything about the document only generate questions with the information in the file

    Return your response in the following JSON format exactly. Do not include any explanations or markdown formatting, just the raw JSON:
    
    {
      "flashcards": [
        { "question": "...", "answer": "..." },
        ...
      ],
      "mcqs": [
        { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0 },
        ...
      ],
      "matchingQuestions": [
        { 
          "id": 1, 
          "question": "...", 
          "leftItems": ["...", "...", "...", "..."], 
          "rightItems": ["...", "...", "...", "..."], 
          "correctMatches": [0, 1, 2, 3] 
        },
        ...
      ],
      "trueFalseQuestions": [
        { "id": 1, "question": "...", "isTrue": true },
        ...
      ]
    }
    
    Note: For multiple choice questions, "correctAnswer" is the zero-based index of the correct option.
    For matching questions, "correctMatches" is an array where each index corresponds to a leftItem, and the value is the index of the matching rightItem.
    `;

    try {
      console.log('Sending request to Gemini API...');
      console.log('Text content sample:', truncatedContent.substring(0, 200) + '...');
      
      // Generate content with Gemini
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        safetySettings,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      console.log('Received response from Gemini API');
      
      const response = result.response;
      const text = response.text();

      // For debugging
      console.log('Raw Gemini response beginning:', text.substring(0, 200) + '...');

      // Improved JSON extraction
      let parsedResponse: ResponseBody;
      
      try {
        // Try direct JSON parsing first
        parsedResponse = JSON.parse(text);
        console.log('JSON parsed successfully');
      } catch (directParseError) {
        console.warn('Direct JSON parsing failed, attempting to extract JSON with regex');
        // If direct parsing fails, try to extract JSON with regex
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("Failed to extract JSON from response:", text);
          throw new Error('Failed to extract JSON from Gemini response');
        }
        
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log('JSON extracted and parsed successfully with regex');
        } catch (jsonError) {
          console.error("Error parsing extracted JSON:", jsonError);
          throw new Error('Failed to parse JSON from Gemini response');
        }
      }
      
      // Validate the response structure
      const validateArray = (arr: any[], name: string) => {
        if (!arr || !Array.isArray(arr)) {
          console.error(`Invalid response structure: ${name} is missing or not an array`);
          return false;
        }
        return true;
      };
      
      // Check if all expected arrays exist
      const isValid = 
        validateArray(parsedResponse.flashcards, 'flashcards') &&
        validateArray(parsedResponse.mcqs, 'mcqs') &&
        validateArray(parsedResponse.matchingQuestions, 'matchingQuestions') &&
        validateArray(parsedResponse.trueFalseQuestions, 'trueFalseQuestions');
      
      if (!isValid) {
        // Provide fallback data if structure is invalid
        console.warn('Response structure is invalid, using fallback data');
        parsedResponse = {
          flashcards: parsedResponse.flashcards || [
            { question: "What does this document cover?", answer: "Content from the uploaded file" }
          ],
          mcqs: parsedResponse.mcqs || [
            { 
              question: "What is contained in this document?", 
              options: ["File content", "Random data", "Empty data", "Unknown"], 
              correctAnswer: 0 
            }
          ],
          matchingQuestions: parsedResponse.matchingQuestions || [
            {
              id: 1,
              question: "Match items from the document:",
              leftItems: ["Item 1", "Item 2", "Item 3", "Item 4"],
              rightItems: ["Description 1", "Description 2", "Description 3", "Description 4"],
              correctMatches: [0, 1, 2, 3]
            }
          ],
          trueFalseQuestions: parsedResponse.trueFalseQuestions || [
            { id: 1, question: "This is content from the uploaded file.", isTrue: true }
          ]
        };
      }
      
      // Return the parsed JSON response
      console.log('Sending successful response to client');
      return NextResponse.json(parsedResponse, { status: 200 });
      
    } catch (error) {
      // Fix: Type guard for Gemini API error
      console.error("Gemini API error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown Gemini API error occurred';
      return NextResponse.json(
        { error: 'Failed to generate questions with Gemini API', details: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}