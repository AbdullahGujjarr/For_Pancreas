import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Share, ArrowLeft, MessageCircle, X, Send } from 'lucide-react';
import { Chart } from '../components/results/Chart';
import HeatmapViewer from '../components/results/HeatmapViewer';
import { generatePdfReport } from '../services/pdfService';
import { chatbotRespond } from '../services/chatbotService';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Fetch results from location state or redirect if none
  const { results, imageUrl } = location.state || {};
  
  if (!results) {
    // Redirect to upload page if no results
    React.useEffect(() => {
      navigate('/upload');
    }, [navigate]);
    return null;
  }

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your PancreScan AI assistant. I can answer questions about your results, pancreatic conditions, or how to use this system. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when messages change
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Get highest probability disease
  const highestProbDisease = Object.entries(results.probabilities)
    .reduce((max, [disease, probability]) => 
      (probability as number) > (max[1] as number) ? [disease, probability] : max, 
      ['', 0]
    );

  // Format disease names for display
  const formatDiseaseName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle PDF generation
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePdfReport(results, imageUrl);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle sending a chat message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      text: message,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setMessage('');
    
    // Get bot response
    try {
      const response = await chatbotRespond(message, results);
      
      setChatMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: 'bot',
          timestamp: new Date(),
        }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      setChatMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I'm having trouble processing your question. Please try again.",
          sender: 'bot',
          timestamp: new Date(),
        }
      ]);
    }
  };

  // FAQ questions for the chatbot
  const faqQuestions = [
    "What is Pancreatic Cancer?",
    "What does this result mean?",
    "How accurate is the AI?",
    "Can I trust this report for medical consultation?",
  ];

  // Handle clicking on FAQ question
  const handleFaqClick = (question: string) => {
    setMessage(question);
    // Don't immediately send to allow user to edit
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button 
          onClick={() => navigate('/upload')}
          className="flex items-center text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Upload another image
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-gray-600 mt-2">
            AI-powered analysis of your pancreatic scan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image and heatmap section */}
          <div className="lg:col-span-1">
            <div className="card text-center mb-6">
              <h2 className="font-semibold text-xl mb-4">Scan Image</h2>
              
              {imageUrl ? (
                <div className="relative">
                  <HeatmapViewer 
                    originalImage={imageUrl} 
                    showHeatmap={showHeatmap} 
                    heatmapData={results.heatmapData}
                  />
                  
                  <div className="mt-4">
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                        showHeatmap 
                          ? 'bg-gray-200 text-gray-800' 
                          : 'bg-primary text-white'
                      }`}
                    >
                      {showHeatmap ? 'Hide Heatmap' : 'Show Abnormality Heatmap'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                  <p className="text-gray-500 text-lg">DICOM Image Processed</p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-xl mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="w-full flex items-center justify-center btn btn-primary"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="loader mr-2"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF Report
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowChatbot(true)}
                  className="w-full flex items-center justify-center btn btn-outline"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask About Results
                </button>
              </div>
            </div>
          </div>

          {/* Results section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary card */}
            <div className="card bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-xl">Analysis Summary</h2>
                <span className="text-xs text-gray-500">
                  ID: {results.analysisId} | {new Date().toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
                <p className="text-blue-800">
                  <span className="font-medium">Primary finding:</span> The scan shows highest probability ({(highestProbDisease[1] as number * 100).toFixed(1)}%) 
                  for <span className="font-medium">{formatDiseaseName(highestProbDisease[0] as string)}</span>.
                  {(highestProbDisease[1] as number) > 0.7 && 
                    " This is a significant finding that should be reviewed by a healthcare professional."}
                  {(highestProbDisease[1] as number) > 0.4 && (highestProbDisease[1] as number) <= 0.7 && 
                    " This finding suggests moderate likelihood and should be evaluated further."}
                  {(highestProbDisease[1] as number) <= 0.4 && 
                    " This finding shows a low likelihood but should still be discussed with your doctor."}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">Disease Probability Analysis</h3>
                <Chart data={results.probabilities} />
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3">Detected Conditions</h3>
                <div className="space-y-3">
                  {Object.entries(results.probabilities).map(([disease, probability]) => (
                    <div 
                      key={disease} 
                      className={`p-3 rounded-lg border ${
                        (probability as number) > 0.5 
                          ? 'bg-red-50 border-red-200' 
                          : (probability as number) > 0.25 
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{formatDiseaseName(disease)}</span>
                        <span className={`font-semibold ${
                          (probability as number) > 0.5 
                            ? 'text-red-600' 
                            : (probability as number) > 0.25 
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}>
                          {((probability as number) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (probability as number) > 0.5 
                              ? 'bg-red-500' 
                              : (probability as number) > 0.25 
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${(probability as number) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Medical explanation */}
            <div className="card">
              <h2 className="font-semibold text-xl mb-4">Medical Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">
                    {formatDiseaseName(highestProbDisease[0] as string)}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {results.explanations[highestProbDisease[0] as string]}
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-800 mb-1">Important Note</h3>
                  <p className="text-gray-600 text-sm">
                    This analysis is provided as a screening tool and should not replace professional medical advice.
                    Please consult with a healthcare provider to discuss these results and determine appropriate next steps.
                    Early detection and proper medical evaluation are important for pancreatic conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot modal */}
      {showChatbot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Chatbot header */}
            <div className="p-4 border-b flex justify-between items-center bg-primary text-white rounded-t-xl">
              <h3 className="font-semibold">PancreScan AI Assistant</h3>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FAQ suggestions */}
            <div className="p-3 bg-gray-50 border-b overflow-x-auto">
              <div className="flex space-x-2">
                {faqQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleFaqClick(question)}
                    className="flex-shrink-0 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-100"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${
                    msg.sender === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : 'mr-auto bg-gray-200 text-gray-800'
                  } max-w-[80%] rounded-lg p-3`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 text-right mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Message input */}
            <div className="p-3 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about pancreatic conditions..."
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary/90"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                I can only answer questions related to pancreas, pancreatic diseases, or how to use this system.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;