"use client"

import { useState } from "react"
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, TouchableOpacity } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { type Transaction, useTransactions } from "@/app/context/TransactionContext"

const screenWidth = Dimensions.get("window").width
const { width, height } = Dimensions.get("window")

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
    r: "5",
    strokeWidth: "2",
    stroke: "#4D9F8D",
  },
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
          <Text style={styles.headerTitle}>📊 Statistics</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Filter Buttons */}
        <View style={styles.filters}>
          <TouchableOpacity onPress={() => setTimeframe("month")}>
            <Text style={timeframe === "month" ? styles.activeFilter : styles.filter}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTimeframe("week")}>
            <Text style={timeframe === "week" ? styles.activeFilter : styles.filter}>Week</Text>
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
          {expenseData.length > 0 ? (
            <LineChart
              data={{
                labels: timeLabels,
                datasets: [
                  {
                    data: expenseData,
                    color: (opacity = 1) => `rgba(77, 159, 141, ${opacity})`,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No expense data available</Text>
          )}
        </View>

        {/* Bar Chart - Income */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Income</Text>
          {incomeData.length > 0 ? (
            <BarChart
              data={{
                labels: timeLabels,
                datasets: [
                  {
                    data: incomeData,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={200}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero
            />
          ) : (
            <Text style={styles.noDataText}>No income data available</Text>
          )}
        </View>

        {/* Pie Chart - Expenses by Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expenses by Category</Text>
          {categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No category data available</Text>
          )}
          <View style={styles.legendContainer}>
            {categoryData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Spending Section */}
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
                    })}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, t.type === "income" ? styles.incomeText : styles.expenseText]}>
                  {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                </Text>
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
  // Default return structure
  const result = {
    timeLabels: [] as string[],
    expenseData: [] as number[],
    incomeData: [] as number[],
    categoryData: [] as Array<{ name: string; value: number; color: string }>,
  }

  if (!transactions || transactions.length === 0) {
    return result
  }

  // Generate time labels and data based on timeframe
  const now = new Date()
  const dataBuckets: Record<string, { expenses: number; income: number }> = {}
  const categoryBuckets: Record<string, number> = {}

  // Set up time buckets based on timeframe
  if (timeframe === "week") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const label = date.toLocaleDateString("en-US", { weekday: "short" })
      dataBuckets[label] = { expenses: 0, income: 0 }
    }
  } else if (timeframe === "month") {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(now.getDate() - (i * 7 + 6))
      const label = `Week ${4 - i}`
      dataBuckets[label] = { expenses: 0, income: 0 }
    }
  } else if (timeframe === "year") {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(now.getMonth() - i)
      const label = date.toLocaleDateString("en-US", { month: "short" })
      dataBuckets[label] = { expenses: 0, income: 0 }
    }
  }

  // Process transactions into the appropriate buckets
  transactions.forEach((t) => {
    let bucket = ""
    const txDate = new Date(t.date)

    if (timeframe === "week") {
      // Get day of week
      bucket = txDate.toLocaleDateString("en-US", { weekday: "short" })
    } else if (timeframe === "month") {
      // Calculate which week this falls into
      const daysDiff = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 3600 * 24))
      const weekNum = Math.floor(daysDiff / 7) + 1
      if (weekNum <= 4) {
        bucket = `Week ${weekNum}`
      }
    } else if (timeframe === "year") {
      // Get month
      bucket = txDate.toLocaleDateString("en-US", { month: "short" })
    }

    // Only process transactions that fall within our timeframe
    if (bucket && dataBuckets[bucket]) {
      if (t.type === "expense") {
        dataBuckets[bucket].expenses += t.amount

        // Also track categories
        const category = t.category || "Other"
        categoryBuckets[category] = (categoryBuckets[category] || 0) + t.amount
      } else if (t.type === "income") {
        dataBuckets[bucket].income += t.amount
      }
    }
  })

  // Convert buckets to arrays for charts
  const timeLabels = Object.keys(dataBuckets)
  const expenseData = timeLabels.map((label) => dataBuckets[label].expenses)
  const incomeData = timeLabels.map((label) => dataBuckets[label].income)

  // Generate color palette for categories
  const colorPalette = [
    "#4D9F8D",
    "#FF9500",
    "#5856D6",
    "#FF2D55",
    "#34C759",
    "#007AFF",
    "#AF52DE",
    "#FF3B30",
    "#FFD60A",
    "#5AC8FA",
  ]

  // Convert categories to pie chart format
  const categoryData = Object.keys(categoryBuckets).map((category, index) => ({
    name: category,
    value: categoryBuckets[category],
    color: colorPalette[index % colorPalette.length],
  }))

  return {
    timeLabels,
    expenseData,
    incomeData,
    categoryData,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    color: "#343A40",
    fontWeight: "500",
  },
  activeFilter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
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
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  incomeText: {
    color: "#34C759",
  },
  expenseText: {
    color: "#FF3B30",
  },
})
