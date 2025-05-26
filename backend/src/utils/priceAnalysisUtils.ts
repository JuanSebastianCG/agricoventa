/**
 * Calculate moving average for price data
 * @param prices - Array of price values
 * @param window - Window size for moving average
 * @returns Array of moving averages
 */
export function calculateMovingAverage(prices: number[], window: number): number[] {
  if (prices.length < window) return []

  const movingAverages: number[] = []

  for (let i = window - 1; i < prices.length; i++) {
    const sum = prices.slice(i - window + 1, i + 1).reduce((acc, price) => acc + price, 0)
    movingAverages.push(Math.round((sum / window) * 100) / 100)
  }

  return movingAverages
}

/**
 * Calculate price volatility (standard deviation)
 * @param prices - Array of price values
 * @returns Price volatility
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length

  return Math.round(Math.sqrt(variance) * 100) / 100
}

/**
 * Calculate price trend (linear regression slope)
 * @param prices - Array of price values
 * @param dates - Array of corresponding dates
 * @returns Trend slope and correlation coefficient
 */
export function calculatePriceTrend(
  prices: number[],
  dates: Date[],
): {
  slope: number
  correlation: number
  trend: "increasing" | "decreasing" | "stable"
} {
  if (prices.length < 2 || prices.length !== dates.length) {
    return { slope: 0, correlation: 0, trend: "stable" }
  }

  // Convert dates to numeric values (days since first date)
  const firstDate = dates[0].getTime()
  const x = dates.map((date) => (date.getTime() - firstDate) / (1000 * 60 * 60 * 24))
  const y = prices

  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  const sumYY = y.reduce((sum, val) => sum + val * val, 0)

  // Calculate slope (linear regression)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

  // Calculate correlation coefficient
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  const correlation = denominator === 0 ? 0 : numerator / denominator

  // Determine trend direction
  let trend: "increasing" | "decreasing" | "stable"
  if (Math.abs(slope) < 0.01) {
    trend = "stable"
  } else if (slope > 0) {
    trend = "increasing"
  } else {
    trend = "decreasing"
  }

  return {
    slope: Math.round(slope * 1000) / 1000,
    correlation: Math.round(correlation * 1000) / 1000,
    trend,
  }
}

/**
 * Detect price anomalies using z-score
 * @param prices - Array of price values
 * @param threshold - Z-score threshold for anomaly detection (default: 2)
 * @returns Array of anomaly indices
 */
export function detectPriceAnomalies(prices: number[], threshold = 2): number[] {
  if (prices.length < 3) return []

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const stdDev = calculateVolatility(prices)

  if (stdDev === 0) return []

  const anomalies: number[] = []

  prices.forEach((price, index) => {
    const zScore = Math.abs((price - mean) / stdDev)
    if (zScore > threshold) {
      anomalies.push(index)
    }
  })

  return anomalies
}

/**
 * Calculate seasonal indices for monthly data
 * @param monthlyData - Array of objects with month and price data
 * @returns Seasonal indices for each month
 */
export function calculateSeasonalIndices(monthlyData: { month: number; prices: number[] }[]): {
  month: number
  seasonalIndex: number
  interpretation: "high" | "normal" | "low"
}[] {
  // Calculate overall average
  const allPrices = monthlyData.flatMap((data) => data.prices)
  const overallAverage = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length

  return monthlyData.map((data) => {
    const monthAverage = data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length
    const seasonalIndex = Math.round((monthAverage / overallAverage) * 1000) / 1000

    let interpretation: "high" | "normal" | "low"
    if (seasonalIndex > 1.1) {
      interpretation = "high"
    } else if (seasonalIndex < 0.9) {
      interpretation = "low"
    } else {
      interpretation = "normal"
    }

    return {
      month: data.month,
      seasonalIndex,
      interpretation,
    }
  })
}

/**
 * Calculate price elasticity between two products
 * @param product1Prices - Prices of first product
 * @param product2Prices - Prices of second product
 * @returns Cross-price elasticity
 */
export function calculateCrossPriceElasticity(product1Prices: number[], product2Prices: number[]): number {
  if (product1Prices.length !== product2Prices.length || product1Prices.length < 2) {
    return 0
  }

  // Calculate percentage changes
  const product1Changes: number[] = []
  const product2Changes: number[] = []

  for (let i = 1; i < product1Prices.length; i++) {
    const change1 = (product1Prices[i] - product1Prices[i - 1]) / product1Prices[i - 1]
    const change2 = (product2Prices[i] - product2Prices[i - 1]) / product2Prices[i - 1]

    if (!isNaN(change1) && !isNaN(change2) && product1Prices[i - 1] !== 0 && product2Prices[i - 1] !== 0) {
      product1Changes.push(change1)
      product2Changes.push(change2)
    }
  }

  if (product1Changes.length === 0) return 0

  // Calculate correlation between price changes
  const n = product1Changes.length
  const sum1 = product1Changes.reduce((sum, val) => sum + val, 0)
  const sum2 = product2Changes.reduce((sum, val) => sum + val, 0)
  const sum12 = product1Changes.reduce((sum, val, i) => sum + val * product2Changes[i], 0)
  const sum11 = product1Changes.reduce((sum, val) => sum + val * val, 0)
  const sum22 = product2Changes.reduce((sum, val) => sum + val * val, 0)

  const numerator = n * sum12 - sum1 * sum2
  const denominator = Math.sqrt((n * sum11 - sum1 * sum1) * (n * sum22 - sum2 * sum2))

  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000
}

/**
 * Generate price forecast using simple exponential smoothing
 * @param prices - Historical price data
 * @param alpha - Smoothing parameter (0-1)
 * @param periods - Number of periods to forecast
 * @returns Forecasted prices
 */
export function generatePriceForecast(prices: number[], alpha = 0.3, periods = 3): number[] {
  if (prices.length === 0) return []

  // Initialize with first price
  let smoothedValue = prices[0]
  const forecasts: number[] = []

  // Calculate smoothed values for historical data
  for (let i = 1; i < prices.length; i++) {
    smoothedValue = alpha * prices[i] + (1 - alpha) * smoothedValue
  }

  // Generate forecasts
  for (let i = 0; i < periods; i++) {
    forecasts.push(Math.round(smoothedValue * 100) / 100)
  }

  return forecasts
}

/**
 * Calculate market concentration index (HHI) for price data across markets
 * @param marketData - Array of market data with prices
 * @returns Herfindahl-Hirschman Index
 */
export function calculateMarketConcentration(marketData: { market: string; averagePrice: number; volume: number }[]): {
  hhi: number
  interpretation: "highly_concentrated" | "moderately_concentrated" | "competitive"
} {
  const totalVolume = marketData.reduce((sum, data) => sum + data.volume, 0)

  if (totalVolume === 0) {
    return { hhi: 0, interpretation: "competitive" }
  }

  // Calculate market shares and HHI
  const hhi = marketData.reduce((sum, data) => {
    const marketShare = data.volume / totalVolume
    return sum + Math.pow(marketShare * 100, 2)
  }, 0)

  let interpretation: "highly_concentrated" | "moderately_concentrated" | "competitive"
  if (hhi > 2500) {
    interpretation = "highly_concentrated"
  } else if (hhi > 1500) {
    interpretation = "moderately_concentrated"
  } else {
    interpretation = "competitive"
  }

  return {
    hhi: Math.round(hhi),
    interpretation,
  }
}
