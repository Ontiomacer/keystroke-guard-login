
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

interface FraudDetectionRequest {
  model: string
  prompt: {
    transaction_id: string
    amount: number
    timestamp: string
    location: string
    merchant: string
    device_type: string
    gps_coordinates: { lat: number; lng: number }
    user_profile: {
      customer_age: number
      customer_location: string
      credit_limit: number
      average_monthly_spending: number
    }
    flags: {
      unusual_time?: boolean
      rooted_device?: boolean
      location_mismatch?: boolean
      high_amount?: boolean
      unusual_location?: boolean
    }
  }
}

interface FraudDetectionResponse {
  result: "FRAUD" | "NOT_FRAUD"
  reason: string
  confidence_score: number
  location_coordinates: {
    lat: number
    lon: number
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      phoneNumber, 
      locationData, 
      deviceData, 
      transactionAmount = 5000,
      userProfile = {},
      merchant = "General"
    } = await req.json()

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

    // Step 2: Prepare fraud detection request
    const fraudRequest = createFraudDetectionRequest(
      twilioData, 
      locationData, 
      deviceData, 
      transactionAmount,
      userProfile,
      merchant
    )
    console.log('Fraud detection request:', fraudRequest)

    // Step 3: Call Hugging Face Inference API for fraud detection
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/ModSpecialization/mistral-7b-bnb-4bit-synthetic-creditcard-fraud-detection',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fraudRequest)
      }
    )

    let riskScore = 0.5 // Default medium risk
    let riskLevel = 'medium'
    let confidence = 0.7
    let reason = 'Standard risk assessment completed'

    if (hfResponse.ok) {
      const hfData: FraudDetectionResponse = await hfResponse.json()
      console.log('Hugging Face response:', hfData)
      
      // Process fraud detection response
      if (hfData.result === 'FRAUD') {
        riskScore = hfData.confidence_score
        riskLevel = riskScore > 0.8 ? 'high' : 'medium'
        reason = hfData.reason
        confidence = hfData.confidence_score
      } else {
        riskScore = 1 - hfData.confidence_score
        riskLevel = riskScore < 0.3 ? 'low' : 'medium'
        reason = `Not fraud detected: ${hfData.reason}`
        confidence = hfData.confidence_score
      }
    } else {
      console.error('Hugging Face API failed:', hfResponse.status, await hfResponse.text())
      
      // Fallback to rule-based risk assessment
      const fallbackResult = calculateFallbackRisk(fraudRequest.prompt)
      riskScore = fallbackResult.score
      reason = fallbackResult.reason
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

    // Step 4: Return comprehensive risk assessment
    const result = {
      risk: {
        score: Math.round(riskScore * 100) / 100,
        level: riskLevel,
        confidence: Math.round(confidence * 100) / 100,
        reason: reason,
        factors: generateRiskFactors(fraudRequest.prompt, twilioData),
        phoneVerification: {
          valid: twilioData.valid,
          carrier: twilioData.carrier?.name || 'Unknown',
          isVoIP: twilioData.carrier?.type === 'voip',
          isPorted: twilioData.porting?.ported || false
        },
        transaction: {
          amount: transactionAmount,
          merchant: merchant,
          location: fraudRequest.prompt.location,
          coordinates: fraudRequest.prompt.gps_coordinates
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

function createFraudDetectionRequest(
  twilioData: TwilioLookupResponse,
  locationData?: any,
  deviceData?: any,
  transactionAmount: number = 5000,
  userProfile: any = {},
  merchant: string = "General"
): FraudDetectionRequest {
  const currentTime = new Date()
  const currentHour = currentTime.getHours()
  
  // Generate transaction location (use provided location or default to user location)
  const transactionLocation = locationData?.city || userProfile.customer_location || "Mumbai, India"
  const userLocation = userProfile.customer_location || "Mumbai, India"
  
  // Generate GPS coordinates (mock data for demo)
  const coordinates = getLocationCoordinates(transactionLocation)
  
  return {
    model: "fraud-mistral",
    prompt: {
      transaction_id: `TX${Math.floor(Math.random() * 100000)}`,
      amount: transactionAmount,
      timestamp: currentTime.toISOString(),
      location: transactionLocation,
      merchant: merchant,
      device_type: getDeviceType(deviceData),
      gps_coordinates: coordinates,
      user_profile: {
        customer_age: userProfile.customer_age || 35,
        customer_location: userLocation,
        credit_limit: userProfile.credit_limit || 50000,
        average_monthly_spending: userProfile.average_monthly_spending || 15000
      },
      flags: {
        unusual_time: currentHour < 6 || currentHour > 22,
        rooted_device: deviceData?.rooted || false,
        location_mismatch: transactionLocation !== userLocation,
        high_amount: transactionAmount > (userProfile.credit_limit || 50000) * 0.8,
        unusual_location: locationData?.suspicious || false
      }
    }
  }
}

function getDeviceType(deviceData?: any): string {
  if (deviceData?.rooted) return "Rooted Android"
  if (deviceData?.jailbroken) return "Jailbroken iOS"
  if (deviceData?.platform) return deviceData.platform
  return "Standard Mobile"
}

function getLocationCoordinates(location: string): { lat: number; lng: number } {
  // Mock coordinates for common Indian cities
  const coordinates: Record<string, { lat: number; lng: number }> = {
    "Mumbai, India": { lat: 19.0760, lng: 72.8777 },
    "Delhi, India": { lat: 28.6139, lng: 77.2090 },
    "Bangalore, India": { lat: 12.9716, lng: 77.5946 },
    "Hyderabad, India": { lat: 17.3850, lng: 78.4867 },
    "Chennai, India": { lat: 13.0827, lng: 80.2707 },
    "Kolkata, India": { lat: 22.5726, lng: 88.3639 },
    "Pune, India": { lat: 18.5204, lng: 73.8567 },
    "Patna, India": { lat: 25.5941, lng: 85.1376 }
  }
  
  return coordinates[location] || { lat: 19.0760, lng: 72.8777 } // Default to Mumbai
}

function calculateFallbackRisk(prompt: any): { score: number; reason: string } {
  let risk = 0.3 // Base risk
  const reasons: string[] = []

  // Amount-based risk
  if (prompt.flags.high_amount) {
    risk += 0.3
    reasons.push(`High amount (${prompt.amount}) exceeds typical spending`)
  }

  // Location-based risk
  if (prompt.flags.location_mismatch) {
    risk += 0.2
    reasons.push(`Transaction location (${prompt.location}) differs from user location (${prompt.user_profile.customer_location})`)
  }

  // Time-based risk
  if (prompt.flags.unusual_time) {
    risk += 0.1
    reasons.push('Transaction at unusual time')
  }

  // Device-based risk
  if (prompt.flags.rooted_device) {
    risk += 0.2
    reasons.push('Rooted/jailbroken device detected')
  }

  const finalRisk = Math.min(risk, 1.0)
  const reason = reasons.length > 0 ? reasons.join('; ') : 'Standard risk factors evaluated'

  return { score: finalRisk, reason }
}

function generateRiskFactors(prompt: any, twilioData: TwilioLookupResponse): string[] {
  const factors: string[] = []

  // Transaction amount factors
  if (prompt.flags.high_amount) {
    factors.push(`High transaction amount: ₹${prompt.amount.toLocaleString()} (${Math.round((prompt.amount/prompt.user_profile.credit_limit)*100)}% of credit limit)`)
  }

  // Location factors
  if (prompt.flags.location_mismatch) {
    factors.push(`Location mismatch: Transaction in ${prompt.location}, user registered in ${prompt.user_profile.customer_location}`)
  }

  if (prompt.flags.unusual_location) {
    factors.push('Unusual transaction location detected')
  }

  // Time factors
  if (prompt.flags.unusual_time) {
    factors.push(`Unusual transaction time: ${new Date(prompt.timestamp).toLocaleTimeString()}`)
  }

  // Device factors
  if (prompt.flags.rooted_device) {
    factors.push(`Compromised device: ${prompt.device_type}`)
  }

  // Phone factors
  if (twilioData.carrier?.type === 'voip') {
    factors.push('VoIP phone number detected')
  }

  if (twilioData.porting?.ported) {
    factors.push('Recently ported phone number')
  }

  if (!twilioData.valid) {
    factors.push('Invalid phone number format')
  }

  // Merchant factors
  if (prompt.merchant === 'Jewelry' || prompt.merchant === 'Electronics') {
    factors.push(`High-risk merchant category: ${prompt.merchant}`)
  }

  return factors
}
