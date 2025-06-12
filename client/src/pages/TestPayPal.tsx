import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PayPalButton from "@/components/PayPalButton";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function TestPayPal() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testPayPalSetup = async () => {
    addTestResult("Testing PayPal setup endpoint...");
    try {
      const response = await fetch('/setup');
      const data = await response.json();
      if (data.clientToken) {
        addTestResult("✅ PayPal setup successful - Client token received");
      } else {
        addTestResult("❌ PayPal setup failed - No client token");
      }
    } catch (error) {
      addTestResult(`❌ PayPal setup error: ${error}`);
    }
  };

  const testOrderCreation = async () => {
    addTestResult("Testing PayPal order creation...");
    try {
      const response = await fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: "20.00",
          currency: "USD",
          intent: "CAPTURE"
        })
      });
      const data = await response.json();
      if (data.id) {
        addTestResult(`✅ Order created successfully - ID: ${data.id}`);
      } else {
        addTestResult("❌ Order creation failed");
      }
    } catch (error) {
      addTestResult(`❌ Order creation error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PayPal Integration Test
          </h1>
          <p className="text-gray-600">
            Test the PayPal integration components and API endpoints
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>API Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testPayPalSetup}
                className="w-full"
                variant="outline"
              >
                Test PayPal Setup
              </Button>
              
              <Button 
                onClick={testOrderCreation}
                className="w-full"
                variant="outline"
              >
                Test Order Creation
              </Button>

              <div className="pt-4">
                <h3 className="font-medium mb-2">Live PayPal Button Test</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This uses the actual PayPal sandbox environment
                </p>
                <PayPalButton 
                  amount="20.00"
                  currency="USD"
                  intent="CAPTURE"
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 italic">
                    Run tests to see results here
                  </p>
                ) : (
                  testResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-2 rounded text-sm ${
                        result.includes('✅') 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : result.includes('❌')
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {result}
                    </div>
                  ))
                )}
              </div>
              
              {testResults.length > 0 && (
                <Button 
                  onClick={() => setTestResults([])}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Clear Results
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Testing Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>API Tests:</strong> Click the buttons above to test PayPal server endpoints
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Live Button Test:</strong> Click the PayPal button to test the full payment flow
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Sandbox Environment:</strong> All payments are simulated - no real money is charged
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Test Accounts:</strong> Use PayPal's test buyer accounts or test credit cards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}