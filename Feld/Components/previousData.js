import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import moment from 'moment';
import axios from 'axios';

const API_URL = 'https://harith-xts3l.ondigitalocean.app/getdata';

const PreviousData = ({ navigation }) => {
  const [last7DaysData, setLast7DaysData] = useState([]);

  useEffect(() => {
    const fetchPreviousData = async () => {
      try {
        const response = await axios.get(API_URL);
        const allData = response.data;

        // Get today + 6 previous days (total 7)
        const last7Days = Array.from({ length: 7 }, (_, i) =>
          moment().subtract(i, 'days').format('YYYY-MM-DD')
        ).reverse();

        const result = last7Days.map((date) => {
          const dayData = allData[date] || {};
          const steps = dayData.steps || 0;
          const fallEvents = dayData.fall_events || {};
          const fallCount = Object.keys(fallEvents).length;

          return { date, steps, fallCount };
        });

        setLast7DaysData(result);
      } catch (error) {
        console.error('❌ Failed to fetch previous data:', error);
        setLast7DaysData([]);
      }
    };

    fetchPreviousData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📆 Last 7 Days Summary</Text>

      {last7DaysData.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.date}>📅 {item.date}</Text>
          <Text style={styles.dataText}>👣 Steps: {item.steps}</Text>
          <Text style={styles.dataText}>⚠️ Falls: {item.fallCount}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  date: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  dataText: {
    fontSize: 16,
    color: '#333',
  },
});

export default PreviousData;
