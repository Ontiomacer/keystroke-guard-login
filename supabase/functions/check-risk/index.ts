
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwilioLookupResponse {
  phoneNumber: string
  valid: boolean
  carrier?: {
    name: string
    type: 'mobile' | 'landline' | 'voip'
  }
  porting?: {
    ported: boolean
    port_date?: string
  }
}

interface HuggingFaceRequest {
  inputs: {
    phone_type: string
    carrier_risk: number
    is_ported: number
    location_mismatch: number
    device_anomaly: number
    transaction_amount?: number
    time_of_day: number
  }
}

interface HuggingFaceResponse {
  label: string
  score: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, locationData, deviceData, transactionAmount } = await req.json()

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing risk check for phone:', phoneNumber)

    // Step 1: Call Twilio Lookup API
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const huggingFaceToken = Deno.env.get('HUGGING_FACE_TOKEN')

    if (!twilioAccountSid || !twilioAuthToken || !huggingFaceToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required API credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Twilio Lookup API call
    const twilioResponse = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}?Fields=carrier,porting`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`
        }
      }
    )

    let twilioData: TwilioLookupResponse
    if (twilioResponse.ok) {
      const rawData = await twilioResponse.json()
      twilioData = {
        phoneNumber: rawData.phone_number,
        valid: rawData.valid,
        carrier: rawData.carrier,
        porting: rawData.porting
      }
    } else {
      console.error('Twilio lookup failed:', twilioResponse.status)
      // Use mock data for demo purposes
      twilioData = {
        phoneNumber,
        valid: true,
        carrier: { name: 'Unknown', type: 'mobile' },
        porting: { ported: false }
      }
    }

    console.log('Twilio lookup result:', twilioData)

    // Step 2: Extract features for ML model
    const features = extractFeatures(twilioData, locationData, deviceData, transactionAmount)
    console.log('Extracted features:', features)

    // Step 3: Call Hugging Face Inference API
    const hfRequest: HuggingFaceRequest = {
      inputs: features
    }

    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/ModSpecialization/mistral-7b-bnb-4bit-synthetic-creditcard-fraud-detection',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hfRequest)
      }
    )

    let riskScore = 0.5 // Default medium risk
    let riskLevel = 'medium'
    let confidence = 0.7

    if (hfResponse.ok) {
      const hfData: HuggingFaceResponse[] = await hfResponse.json()
      console.log('Hugging Face response:', hfData)
      
      // Process HF response - assuming it returns classification scores
      if (Array.isArray(hfData) && hfData.length > 0) {
        const fraudResult = hfData.find(result => 
          result.label?.toLowerCase().includes('fraud') || 
          result.label?.toLowerCase().includes('high_risk')
        )
        
        if (fraudResult) {
          riskScore = fraudResult.score
          confidence = Math.max(0.6, fraudResult.score)
        } else if (hfData[0]) {
          // Use first result if no fraud label found
          riskScore = hfData[0].score
          confidence = Math.max(0.6, hfData[0].score)
        }
      }
    } else {
      console.error('Hugging Face API failed:', hfResponse.status, await hfResponse.text())
      
      // Fallback to rule-based risk assessment
      riskScore = calculateFallbackRisk(features)
      confidence = 0.5
    }

    // Determine risk level
    if (riskScore > 0.7) {
      riskLevel = 'high'
    } else if (riskScore > 0.4) {
      riskLevel = 'medium'  
    } else {
      riskLevel = 'low'
    }

    // Step 4: Return risk assessment
    const result = {
      risk: {
        score: Math.round(riskScore * 100) / 100,
        level: riskLevel,
        confidence: Math.round(confidence * 100) / 100,
        factors: generateRiskFactors(features, twilioData),
        phoneVerification: {
          valid: twilioData.valid,
          carrier: twilioData.carrier?.name || 'Unknown',
          isVoIP: twilioData.carrier?.type === 'voip',
          isPorted: twilioData.porting?.ported || false
        }
      }
    }

    console.log('Final risk assessment:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in check-risk function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        risk: {
          score: 0.5,
          level: 'medium',
          confidence: 0.3,
          factors: ['Unable to complete risk assessment']
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function extractFeatures(
  twilioData: TwilioLookupResponse, 
  locationData?: any, 
  deviceData?: any, 
  transactionAmount?: number
) {
  const currentHour = new Date().getHours()
  
  // Carrier risk mapping
  const carrierRiskMap: Record<string, number> = {
    'Unknown': 0.8,
    'VoIP': 0.9,
    'Jio': 0.1,
    'Airtel': 0.15,
    'Vodafone': 0.2,
    'BSNL': 0.25
  }

  const carrierName = twilioData.carrier?.name || 'Unknown'
  const carrierRisk = carrierRiskMap[carrierName] || 0.5

  return {
    phone_type: twilioData.carrier?.type || 'mobile',
    carrier_risk: carrierRisk,
    is_ported: twilioData.porting?.ported ? 1 : 0,
    location_mismatch: locationData?.suspicious ? 1 : 0,
    device_anomaly: deviceData?.suspicious ? 1 : 0,
    transaction_amount: transactionAmount || 0,
    time_of_day: currentHour
  }
}

function calculateFallbackRisk(features: any): number {
  let risk = 0.3 // Base risk

  // Phone-based risk factors
  if (features.phone_type === 'voip') risk += 0.3
  if (features.is_ported === 1) risk += 0.2
  if (features.carrier_risk > 0.5) risk += 0.2

  // Location and device factors
  if (features.location_mismatch === 1) risk += 0.2
  if (features.device_anomaly === 1) risk += 0.2

  // Time-based factors (higher risk during unusual hours)
  if (features.time_of_day < 6 || features.time_of_day > 22) risk += 0.1

  return Math.min(risk, 1.0)
}

function generateRiskFactors(features: any, twilioData: TwilioLookupResponse): string[] {
  const factors: string[] = []

  if (features.phone_type === 'voip') {
    factors.push('VoIP number detected')
  }

  if (features.is_ported === 1) {
    factors.push('Recently ported number')
  }

  if (features.carrier_risk > 0.5) {
    factors.push('Unknown or high-risk carrier')
  }

  if (features.location_mismatch === 1) {
    factors.push('Location anomaly detected')
  }

  if (features.device_anomaly === 1) {
    factors.push('Suspicious device detected')
  }

  if (features.time_of_day < 6 || features.time_of_day > 22) {
    factors.push('Unusual time of activity')
  }

  if (!twilioData.valid) {
    factors.push('Invalid phone number format')
  }

  return factors
}
