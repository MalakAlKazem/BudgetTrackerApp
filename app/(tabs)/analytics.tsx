"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, TouchableOpacity } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { type Transaction, useTransactions } from "../../context/TransactionContext"

const screenWidth = Dimensions.get("window").width
const { width, height } = Dimensions.get("window")

// Update getCategoryColor function with more distinct colors
const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    '1': '#FF6B6B', // Food - Red
    '2': '#4ECDC4', // Transport - Teal
    '3': '#FFD93D', // Shopping - Yellow
    '4': '#95E1D3', // Entertainment - Mint
    '5': '#FF8B94', // Bills - Pink
    '6': '#6C5CE7', // Health - Purple
    '7': '#A8E6CF', // Education - Light Green
    '8': '#FFB6B9', // Other - Light Pink
  };
  return colorMap[category] || '#4D9F8D';
};

// Add getCategoryName function
const getCategoryName = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    '1': 'Food',
    '2': 'Transport',
    '3': 'Shopping',
    '4': 'Entertainment',
    '5': 'Bills',
    '6': 'Health',
    '7': 'Education',
    '8': 'Other',
  };
  return categoryMap[category] || 'Other';
};

// Add categoryNameToIdMap
const categoryNameToIdMap: { [key: string]: string } = {
  'Food': '1',
  'Transport': '2',
  'Shopping': '3',
  'Entertainment': '4',
  'Bills': '5',
  'Health': '6',
  'Education': '7',
  'Other': '8',
};

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(77, 159, 141, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(47, 79, 79, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#4D9F8D",
  },
  propsForBackgroundLines: {
    strokeDasharray: "", // solid lines
    stroke: "#E5E5E5",
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 12,
    fontWeight: "500",
  },
  yAxisLabel: "$",
  yAxisSuffix: "",
  formatYLabel: (yLabel: string) => `$${yLabel}`,
  count: 5, // Number of horizontal lines
  formatXLabel: (value: string) => value,
}

export default function StatisticsScreen() {
  const { transactions, totalIncome, totalExpenses, balance } = useTransactions()
  const [timeframe, setTimeframe] = useState("month") // 'month', 'week', 'year'

  // Calculate data for charts based on timeframe
  const { timeLabels, expenseData, incomeData, categoryData } = processTransactionData(transactions, timeframe)

  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header background */}
      <View style={styles.headerBackground}>
        <View style={styles.backgroundContainer}>
          <Image source={require("@/assets/Rectangle.png")} style={styles.backgroundImage} resizeMode="cover" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>📊 Analytics</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Filter Buttons */}
        <View style={styles.filters}>
          <TouchableOpacity onPress={() => setTimeframe("week")}>
            <Text style={timeframe === "week" ? styles.activeFilter : styles.filter}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTimeframe("month")}>
            <Text style={timeframe === "month" ? styles.activeFilter : styles.filter}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTimeframe("year")}>
            <Text style={timeframe === "year" ? styles.activeFilter : styles.filter}>Year</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryValue}>${totalIncome.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>${totalExpenses.toFixed(2)}</Text>
          </View>
        </View>

        {/* Line Chart - Spending Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Overview</Text>
          {expenseData.length > 0 && expenseData.some(val => val > 0) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <LineChart
                data={{
                  labels: timeLabels,
                  datasets: [
                    {
                      data: expenseData.length > 0 ? expenseData : [0],
                      color: (opacity = 1) => `rgba(77, 159, 141, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={screenWidth * 1.8} // Increased width for scrolling
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withDots={true}
                withShadow={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
              />
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No expense data available for this period</Text>
          )}
        </View>

        {/* Bar Chart - Income */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Income Overview</Text>
          {incomeData.length > 0 && incomeData.some(val => val > 0) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <BarChart
                data={{
                  labels: timeLabels,
                  datasets: [
                    {
                      data: incomeData.length > 0 ? incomeData : [0],
                    },
                  ],
                }}
                width={screenWidth * 1.8} // Increased width for scrolling
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero={true}
                showValuesOnTopOfBars={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No income data available for this period</Text>
          )}
        </View>

        {/* Pie Chart - Expenses by Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expenses by Category</Text>
          {categoryData.length > 0 ? (
            <>
              <PieChart
                data={categoryData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={false}
                center={[(screenWidth - 64) / 4, 0]}
              />
              <View style={styles.legendContainer}>
                {categoryData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.name}: ${item.value.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No category data available for this period</Text>
          )}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <View key={t.id} style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                  <Text style={styles.transactionIcon}>{t.type === "expense" ? "💸" : "💰"}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionName}>{t.name}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(t.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  {t.category && <Text style={styles.transactionCategory}>{t.category}</Text>}
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={[styles.transactionAmount, t.type === "income" ? styles.incomeText : styles.expenseText]}>
                    {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.transactionStatus, t.isPaid ? styles.paidStatus : styles.unpaidStatus]}>
                    {t.isPaid ? "Paid" : "Pending"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent transactions</Text>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

// Process transaction data for charts based on timeframe
function processTransactionData(transactions: Transaction[], timeframe: string) {
  const now = new Date()
  const startDate = new Date()
  
  // Initialize with default values
  let bucketSize = 1
  let bucketCount = 7
  let bucketLabels: string[] = []

  // Set timeframe parameters
  switch (timeframe) {
    case "week":
      startDate.setDate(now.getDate() - 7)
      bucketSize = 1 // 1 day
      bucketCount = 7
      // Generate labels for each day
      bucketLabels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        return date.toLocaleDateString("en-US", { weekday: "short" })
      })
      break
    case "month":
      // Set to first day of current month
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      bucketSize = 7 // 7 days
      bucketCount = 4
      // Generate labels for each week
      bucketLabels = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(startDate)
        weekStart.setDate(weekStart.getDate() + (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      })
      break
    case "year":
      // Set to first day of current year
      startDate.setMonth(0)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      bucketSize = 30 // 30 days
      bucketCount = 12
      // Generate labels for each month
      bucketLabels = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        return date.toLocaleDateString("en-US", { month: "short" })
      })
      break
  }

  // Initialize buckets with the correct size
  const expenseBuckets = Array(bucketCount).fill(0)
  const incomeBuckets = Array(bucketCount).fill(0)
  const categoryData: { [key: string]: number } = {}

  // Process transactions
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date)
    if (transactionDate >= startDate && transactionDate <= now) {
      let bucketIndex: number
      
      if (timeframe === "month") {
        // For month view, calculate which week the transaction falls into
        const dayOfMonth = transactionDate.getDate()
        bucketIndex = Math.floor((dayOfMonth - 1) / 7)
      } else if (timeframe === "year") {
        // For year view, use the month as the bucket index
        bucketIndex = transactionDate.getMonth()
      } else {
        // For week view, use the existing calculation
        const daysDiff = Math.floor((transactionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        bucketIndex = Math.floor(daysDiff / bucketSize)
      }

      if (bucketIndex >= 0 && bucketIndex < bucketCount) {
        if (transaction.type === "expense") {
          expenseBuckets[bucketIndex] += transaction.amount
          // Track category data - use category ID as key
          const categoryName = transaction.category?.toString() || 'Other'
          const categoryId = categoryNameToIdMap[categoryName] || '8' // Get ID, default to '8' (Other)
          categoryData[categoryId] = (categoryData[categoryId] || 0) + transaction.amount
          
          // Debug log to see the raw category name and the ID used
          console.log(`Processing expense transaction ID: ${transaction.id}, Category Name: ${categoryName}, Mapped Category ID: ${categoryId}`)
        } else if (transaction.type === "income") {
          incomeBuckets[bucketIndex] += transaction.amount
        }
      }
    }
  })

  // Convert category data to array and sort by amount
  const categoryChartData = Object.entries(categoryData)
    .filter(([_, amount]) => amount > 0) // Only include categories with expenses
    .map(([categoryId, amount]) => ({
      name: getCategoryName(categoryId), // Use categoryId here
      value: amount,
      color: getCategoryColor(categoryId), // Use categoryId here
      legendFontColor: '#2F4F4F',
      legendFontSize: 12
    }))
    .sort((a, b) => b.value - a.value)

  // Debug log to check category data
  console.log('Category Data (with IDs as keys):', categoryData)
  console.log('Category Chart Data:', categoryChartData)

  return {
    timeLabels: bucketLabels,
    expenseData: expenseBuckets,
    incomeData: incomeBuckets,
    categoryData: categoryChartData
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerBackground: {
    position: "relative",
    height: 200,
    marginBottom: 20,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height * 0.35,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTextContainer: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    marginTop: -90,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  filter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    color: "#343A40",
    fontWeight: "500",
  },
  activeFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#4D9F8D",
    color: "#fff",
    borderRadius: 20,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incomeCard: {
    backgroundColor: "#DFF2ED",
  },
  expenseCard: {
    backgroundColor: "#FEF5EB",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#2F4F4F",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#343A40",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#343A40",
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  noDataText: {
    textAlign: "center",
    paddingVertical: 30,
    color: "#999",
    fontStyle: "italic",
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 15,
    paddingHorizontal: 10,
    paddingBottom: 10, // Added padding at the bottom
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
    minWidth: '45%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#2F4F4F',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#343A40",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 1,
  },
  transactionCategory: {
    fontSize: 11,
    color: "#4D9F8D",
    fontWeight: "500",
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: "500",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paidStatus: {
    backgroundColor: "#E8F5E8",
    color: "#34C759",
  },
  unpaidStatus: {
    backgroundColor: "#FFF2F2",
    color: "#FF3B30",
  },
  incomeText: {
    color: "#34C759",
  },
  expenseText: {
    color: "#FF3B30",
  },
})