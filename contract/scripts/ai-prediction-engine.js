/**
 * Chainlink Functions script for AI-powered prediction market analysis
 * Integrates with multiple AI/ML services for market predictions
 * Based on patterns from prediction-game and includes advanced ML models
 */

const marketId = args[0]
const timeHorizon = Number(args[1]) // Prediction time horizon in hours

// Validate inputs
if (!marketId || marketId === "") {
  throw Error("Invalid marketId provided")
}
if (!timeHorizon || timeHorizon <= 0) {
  throw Error("Invalid timeHorizon provided. Must be positive number of hours")
}

// API Keys validation
if (!secrets.openaiApiKey || secrets.openaiApiKey === "") {
  throw Error("OPENAI_API_KEY not set. Required for AI predictions")
}

// ML/AI service configurations
const aiServices = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    headers: {
      "Authorization": `Bearer ${secrets.openaiApiKey}`,
      "Content-Type": "application/json"
    }
  },
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com",
    headers: {
      "Content-Type": "application/json"
    }
  },
  // News sentiment analysis
  newsapi: {
    baseUrl: "https://newsapi.org/v2",
    headers: {
      "X-API-Key": secrets.newsApiKey || ""
    }
  }
}

/**
 * Fetch historical market data for ML analysis
 */
const fetchHistoricalData = async (marketId) => {
  try {
    const response = await Functions.makeHttpRequest({
      url: `${aiServices.polymarket.baseUrl}/markets/${marketId}/history`,
      headers: aiServices.polymarket.headers
    })
    
    if (response.status !== 200) {
      console.log(`Historical data not available for ${marketId}`)
      return []
    }
    
    return response.data.prices || []
  } catch (error) {
    console.log(`Historical data fetch failed: ${error.message}`)
    return []
  }
}

/**
 * Fetch market metadata for context
 */
const fetchMarketContext = async (marketId) => {
  try {
    const response = await Functions.makeHttpRequest({
      url: `${aiServices.polymarket.baseUrl}/markets/${marketId}`,
      headers: aiServices.polymarket.headers
    })
    
    if (response.status !== 200) {
      throw new Error(`Market context fetch failed: ${response.status}`)
    }
    
    const data = response.data
    return {
      question: data.question,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      endDate: data.end_date_iso,
      outcomes: data.outcomes || ["Yes", "No"]
    }
  } catch (error) {
    throw new Error(`Market context error: ${error.message}`)
  }
}

/**
 * Fetch relevant news for sentiment analysis
 */
const fetchRelevantNews = async (marketContext) => {
  if (!secrets.newsApiKey) {
    console.log("News API key not available, skipping sentiment analysis")
    return []
  }
  
  try {
    // Extract keywords from market question for news search
    const keywords = extractKeywords(marketContext.question)
    const query = keywords.join(" OR ")
    
    const response = await Functions.makeHttpRequest({
      url: `${aiServices.newsapi.baseUrl}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10`,
      headers: aiServices.newsapi.headers
    })
    
    if (response.status !== 200) {
      console.log(`News fetch failed: ${response.status}`)
      return []
    }
    
    return response.data.articles || []
  } catch (error) {
    console.log(`News fetch error: ${error.message}`)
    return []
  }
}

/**
 * Extract keywords from market question
 */
const extractKeywords = (question) => {
  // Simple keyword extraction - remove common words
  const stopWords = ["will", "the", "be", "is", "in", "to", "of", "and", "or", "by", "on", "at", "for", "with", "a", "an"]
  const words = question.toLowerCase().split(/\s+/)
  return words.filter(word => 
    word.length > 3 && 
    !stopWords.includes(word) &&
    /^[a-zA-Z]+$/.test(word)
  ).slice(0, 5) // Take top 5 keywords
}

/**
 * Analyze sentiment of news articles
 */
const analyzeSentiment = async (articles) => {
  if (articles.length === 0) {
    return { sentiment: 0.5, confidence: 0.1 } // Neutral with low confidence
  }
  
  try {
    // Prepare news text for sentiment analysis
    const newsText = articles.map(article => 
      `${article.title}. ${article.description || ""}`
    ).join(" ").slice(0, 3000) // Limit to 3000 chars for API
    
    const prompt = `Analyze the sentiment of the following news content regarding a prediction market. Return a JSON object with sentiment (0-1 scale where 0=very negative, 0.5=neutral, 1=very positive) and confidence (0-1 scale):

News: ${newsText}

Response format: {"sentiment": 0.65, "confidence": 0.8}`

    const response = await Functions.makeHttpRequest({
      url: `${aiServices.openai.baseUrl}/chat/completions`,
      method: "POST",
      headers: aiServices.openai.headers,
      data: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      }
    })
    
    if (response.status !== 200) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }
    
    const result = JSON.parse(response.data.choices[0].message.content)
    return {
      sentiment: Math.max(0, Math.min(1, result.sentiment)),
      confidence: Math.max(0, Math.min(1, result.confidence))
    }
  } catch (error) {
    console.log(`Sentiment analysis failed: ${error.message}`)
    return { sentiment: 0.5, confidence: 0.1 }
  }
}

/**
 * Generate AI prediction using GPT
 */
const generateAIPrediction = async (marketContext, historicalData, sentimentData) => {
  try {
    // Prepare historical data summary
    const historyText = historicalData.length > 0 
      ? `Recent price history: ${historicalData.slice(-10).map(p => p.price).join(", ")}`
      : "No historical data available"
    
    const prompt = `As an expert prediction market analyst, analyze this market and provide a prediction:

Market Question: ${marketContext.question}
Description: ${marketContext.description}
Category: ${marketContext.category}
Time Horizon: ${timeHorizon} hours
${historyText}
News Sentiment: ${sentimentData.sentiment.toFixed(2)} (confidence: ${sentimentData.confidence.toFixed(2)})

Provide a detailed analysis with:
1. Probability estimate (0-1)
2. Confidence level (0-1)
3. Key factors influencing the prediction
4. Risk assessment

Return as JSON: {
  "probability": 0.65,
  "confidence": 0.75,
  "factors": ["factor1", "factor2"],
  "risk_level": 0.4,
  "reasoning": "detailed analysis"
}`

    const response = await Functions.makeHttpRequest({
      url: `${aiServices.openai.baseUrl}/chat/completions`,
      method: "POST",
      headers: aiServices.openai.headers,
      data: {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert prediction market analyst with deep knowledge of market dynamics, statistics, and risk assessment. Always provide quantitative predictions with confidence intervals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.2
      }
    })
    
    if (response.status !== 200) {
      throw new Error(`OpenAI prediction API error: ${response.status}`)
    }
    
    const result = JSON.parse(response.data.choices[0].message.content)
    
    // Validate and sanitize the prediction
    return {
      probability: Math.max(0.01, Math.min(0.99, result.probability)),
      confidence: Math.max(0.1, Math.min(1.0, result.confidence)),
      factors: result.factors || [],
      riskLevel: Math.max(0, Math.min(1, result.risk_level)),
      reasoning: result.reasoning || "AI analysis completed"
    }
  } catch (error) {
    throw new Error(`AI prediction failed: ${error.message}`)
  }
}

/**
 * Apply technical analysis to historical data
 */
const technicalAnalysis = (historicalData) => {
  if (historicalData.length < 5) {
    return {
      trend: 0.5,
      volatility: 0.3,
      momentum: 0.5
    }
  }
  
  const prices = historicalData.map(d => d.price)
  const recent = prices.slice(-5)
  const earlier = prices.slice(-10, -5)
  
  // Simple trend analysis
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const earlierAvg = earlier.length > 0 
    ? earlier.reduce((a, b) => a + b, 0) / earlier.length 
    : recentAvg
  
  const trend = recentAvg > earlierAvg ? 0.6 : 0.4
  
  // Volatility calculation (standard deviation)
  const mean = recentAvg
  const variance = recent.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / recent.length
  const volatility = Math.sqrt(variance)
  
  // Momentum (rate of change)
  const momentum = recent.length >= 2 
    ? (recent[recent.length - 1] - recent[0]) / recent[0]
    : 0
  
  return {
    trend: Math.max(0, Math.min(1, trend)),
    volatility: Math.max(0, Math.min(1, volatility * 2)), // Scale volatility
    momentum: Math.max(0, Math.min(1, (momentum + 1) / 2)) // Normalize momentum
  }
}

/**
 * Combine multiple prediction sources
 */
const combinePredictions = (aiPrediction, technicalAnalysis, sentimentData) => {
  // Weighted combination of different signals
  const weights = {
    ai: 0.5,          // AI analysis gets highest weight
    technical: 0.3,   // Technical analysis
    sentiment: 0.2    // News sentiment
  }
  
  const combinedProbability = 
    (aiPrediction.probability * weights.ai) +
    (technicalAnalysis.trend * weights.technical) +
    (sentimentData.sentiment * weights.sentiment)
  
  // Combined confidence considers all sources
  const combinedConfidence = Math.min(
    aiPrediction.confidence,
    1 - technicalAnalysis.volatility, // Lower volatility = higher confidence
    sentimentData.confidence
  )
  
  return {
    predictedPrice: combinedProbability,
    confidence: combinedConfidence,
    timeHorizon: timeHorizon,
    components: {
      ai: aiPrediction.probability,
      technical: technicalAnalysis.trend,
      sentiment: sentimentData.sentiment,
      volatility: technicalAnalysis.volatility,
      momentum: technicalAnalysis.momentum
    },
    risk: {
      level: aiPrediction.riskLevel,
      factors: aiPrediction.factors
    },
    metadata: {
      timestamp: Math.floor(Date.now() / 1000),
      reasoning: aiPrediction.reasoning
    }
  }
}

/**
 * Main prediction engine execution
 */
const runPredictionEngine = async () => {
  try {
    // Fetch all required data
    console.log("Fetching market context...")
    const marketContext = await fetchMarketContext(marketId)
    
    console.log("Fetching historical data...")
    const historicalData = await fetchHistoricalData(marketId)
    
    console.log("Fetching relevant news...")
    const newsArticles = await fetchRelevantNews(marketContext)
    
    console.log("Analyzing sentiment...")
    const sentimentData = await analyzeSentiment(newsArticles)
    
    console.log("Performing technical analysis...")
    const techAnalysis = technicalAnalysis(historicalData)
    
    console.log("Generating AI prediction...")
    const aiPrediction = await generateAIPrediction(marketContext, historicalData, sentimentData)
    
    console.log("Combining predictions...")
    const finalPrediction = combinePredictions(aiPrediction, techAnalysis, sentimentData)
    
    // Convert to wei format for smart contract
    const predictedPriceWei = Math.floor(finalPrediction.predictedPrice * 1e18)
    const confidenceWei = Math.floor(finalPrediction.confidence * 1e18)
    const timeHorizonWei = timeHorizon
    
    // Return encoded data for the smart contract
    // Format: (uint256 predictedPrice, uint256 confidence, uint256 timeHorizon)
    return Functions.encodeUint256(predictedPriceWei) + 
           Functions.encodeUint256(confidenceWei).slice(2) + 
           Functions.encodeUint256(timeHorizonWei).slice(2)
           
  } catch (error) {
    throw new Error(`Prediction engine failed: ${error.message}`)
  }
}

// Execute the prediction engine
return runPredictionEngine() 