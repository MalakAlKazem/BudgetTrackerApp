import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import {
  LineChart,
  BarChart,
  ProgressChart,
} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const { width, height } = Dimensions.get('window');

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(1, 102, 94, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#01a9ac',
  },
};

export default function StatisticsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header background */}
      <View style={styles.headerBackground}>
       <View style={styles.backgroundContainer}>
                 <Image
                   source={require('@/assets/Rectangle.png')}
                   style={styles.backgroundImage}
                   resizeMode="cover"
                 />
               </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Statistics Overview</Text>
          <Text style={styles.userName}>Enjelin Morgeana</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Filter Buttons */}
        <View style={styles.filters}>
          <Text style={styles.activeFilter}>Month</Text>
          <Text style={styles.filter}>Week</Text>
          <Text style={styles.filter}>Year</Text>
        </View>

        {/* Line Chart - Spending Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Overview</Text>
          <LineChart
            data={{
              labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              datasets: [{ data: [900, 1100, 12230, 1000, 1300, 1200] }],
            }}
            width={screenWidth - 64}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Bar Chart - Income */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Income</Text>
          <BarChart
            data={{
              labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
              datasets: [{ data: [400, 450, 600, 750, 850, 900] }],
            }}
            width={screenWidth - 64}
            height={200}
            yAxisLabel="$"
            yAxisSuffix=''
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Progress Chart - Expenses */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expenses Category</Text>
          <ProgressChart
            data={{ data: [0.4, 0.6, 0.8] }}
            width={screenWidth - 64}
            height={180}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Line Chart - Budget */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget</Text>
          <LineChart
            data={{
              labels: ['Dec', 'Feb', 'Apr', 'May'],
              datasets: [{ data: [500, 400, 600, 800] }],
            }}
            width={screenWidth - 64}
            height={180}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Top Spending Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Spending</Text>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingText}>☕ Starbucks - $150.00</Text>
          </View>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingText}>💸 Transfer - $85.00</Text>
          </View>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingText}>🎥 YouTube - $11.99</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    position: 'relative',
    height: 200,
    marginBottom: 20,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height * 0.35,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTextContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    marginTop: -90
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  filter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    color: '#343A40',
    fontWeight: '500',
  },
  activeFilter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#01665e',
    color: '#fff',
    borderRadius: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#343A40',
  },
  chart: {
    borderRadius: 12,
  },
  spendingItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  spendingText: {
    fontSize: 16,
    color: '#343A40',
  },
});
